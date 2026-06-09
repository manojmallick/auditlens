// AuditLens hosted backend — Express. Evaluate traces + approval-gated annotations.
//
// Env: locally loaded via `node --env-file-if-exists=.env` (see package.json scripts) so
// vars are set BEFORE any module reads them. On Cloud Run there is no .env — the real
// environment variables set at deploy time are used directly.

import express from "express";
import { readFile } from "node:fs/promises";
import { evaluate, executeProposed, cacheStats, startLiveCalibration, liveCalibrationLabelled } from "./agent.js";
import { getTraces, pingPhoenix, pingPhoenixMcp, phoenixTransport } from "./phoenix.js";
import { calibrate } from "./calibration.js";
import { EU_AI_ACT_CHECKS } from "./criteria.js";

const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(express.static("public"));

// --- Health: proves the required stack is wired ---
app.get("/health", async (_req, res) => {
  // Probe both surfaces honestly: REST reachability always, and a REAL MCP handshake
  // when the MCP path is enabled. partner_mcp_connected means an actual MCP connect.
  const [rest, mcp] = await Promise.all([pingPhoenix(), pingPhoenixMcp()]);
  res.json({
    status: "ok",
    service: "auditlens",
    version: "2.0.0",
    model: process.env.GEMINI_MODEL || "gemini-3",
    partner: "arize-phoenix",
    partner_transport: phoenixTransport(),     // "mcp" | "rest" | "mock"
    partner_connected: rest,                    // REST reachability
    partner_mcp_connected: mcp,                 // genuine MCP handshake (false unless USE_PHOENIX_MCP=true)
    agents: ["TraceCollector", "ComplianceEvaluator"],
    regulations: ["EU AI Act Art.50", "Art.9", "Art.14", "Art.50(2)", "Art.53"],
    features: ["eu_ai_act_scoring", "experiment_loop", "evaluator_calibration"],
    stack: { gemini: process.env.GEMINI_MODEL || "gemini-2.5-flash", agent_builder: "agent-builder/agent.json", phoenix_mcp: "@arizeai/phoenix-mcp" },
    ...cacheStats(),
    timestamp: new Date().toISOString(),
  });
});

// --- Evaluator calibration: how well the Gemini judge agrees with human auditors.
//     This is what makes the compliance SCORE itself defensible (eval the evals). ---
app.get("/api/calibration", async (_req, res) => {
  try {
    startLiveCalibration(); // kick off real-Gemini re-scoring of the golden set (once)
    const live = liveCalibrationLabelled();
    const gold = JSON.parse(await readFile(new URL("../evals/golden-labels.json", import.meta.url)));
    const labelled = live || gold.labelled; // live once ready, else offline fallback
    res.json({ ...calibrate(labelled, EU_AI_ACT_CHECKS), mode: live ? "live" : "offline" });
  } catch (e) { res.status(500).json({ error: String(e.message || e) }); }
});

// --- Rubric metadata: article ids, labels, thresholds (single source of truth for UI) ---
app.get("/api/criteria", (_req, res) => {
  res.json(
    Object.fromEntries(
      Object.entries(EU_AI_ACT_CHECKS).map(([id, c]) => [
        id,
        { article: c.article, label: c.label, requirement: c.requirement, threshold: c.threshold },
      ])
    )
  );
});

// --- List recent traces for the dashboard (beat 1) ---
app.get("/api/traces", async (_req, res) => {
  try { res.json(await getTraces({ limit: 25 })); }
  catch (e) { res.status(500).json({ error: String(e.message || e) }); }
});

// --- Beat 1→2: evaluate a trace (read-only steps 1-4). `fresh:true` bypasses cache. ---
app.post("/api/evaluate", async (req, res) => {
  const { traceId, fresh } = req.body || {};
  try { res.json(await evaluate(traceId, { fresh: !!fresh })); }
  catch (e) { res.status(500).json({ error: String(e.message || e) }); }
});

// --- Beat 3→4: human approved → write annotations + dataset ---
app.post("/api/execute", async (req, res) => {
  const { approved, payload } = req.body || {};
  if (!approved) return res.status(403).json({ error: "human approval required" });
  try { res.json(await executeProposed(payload)); }
  catch (e) { res.status(500).json({ error: String(e.message || e) }); }
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`AuditLens listening on :${port}`);
  prewarm();
});

// Warm the evaluation cache in the background so the first dashboard load is instant.
// Best-effort: bounded concurrency, errors swallowed. Disable with PREWARM=false.
async function prewarm() {
  if (process.env.MOCK === "true" || process.env.PREWARM === "false") return;
  try {
    const traces = await getTraces({ limit: 8 });
    let i = 0;
    const worker = async () => { while (i < traces.length) { const t = traces[i++]; await evaluate(t.trace_id).catch(() => {}); } };
    await Promise.all([worker(), worker()]); // 2-wide (gentle on Gemini 3 Flash RPM)
    console.log(`AuditLens prewarmed ${cacheStats().cached_evaluations} evaluations`);
    startLiveCalibration(); // background: real-Gemini κ over the golden set
  } catch (e) { console.log("prewarm skipped:", String(e.message || e)); }
}
