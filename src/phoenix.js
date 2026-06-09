// Arize Phoenix integration — the partner capability.
//
// Two runtime paths to the SAME Phoenix:
//   • USE_PHOENIX_MCP=true → reads + the dataset write go through the partner MCP server
//     (@arizeai/phoenix-mcp), the exact integration the judged Agent Builder agent uses
//     (agent-builder/agent.json). This is the required-tech path. See src/phoenix-mcp.js.
//   • otherwise → the Phoenix REST API (zero-dependency fallback so the demo always runs).
// When MCP is enabled, a failure transparently falls back to REST so the demo never dies.
// Phoenix API surfaces vary by version — adjust paths to your deployment if needed.

import { mcpGetSpans, mcpAddDatasetExamples, mcpPing } from "./phoenix-mcp.js";

const BASE = process.env.PHOENIX_BASE_URL || "https://app.phoenix.arize.com";
const KEY = process.env.PHOENIX_API_KEY;
const PROJECT = process.env.PHOENIX_PROJECT || "default";
const USE_MCP = process.env.USE_PHOENIX_MCP === "true";

async function px(path, init = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });
  if (!res.ok) throw new Error(`Phoenix ${res.status} ${path}: ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

// --- READS (run automatically) ---
/** Recent traces for the project. Returns [{ trace_id, input, output, attributes }].
 *  Uses the partner MCP server when USE_PHOENIX_MCP=true; falls back to REST on error. */
export async function getTraces({ limit = 25 } = {}) {
  if (process.env.MOCK === "true") {
    const { MOCK_TRACES } = await import("./mock-data.js");
    return MOCK_TRACES.slice(0, limit).map(({ trace_id, input, output, model, application }) => ({
      trace_id, input, output, model, application,
    }));
  }
  // A single user turn produces many spans (chain/retriever/llm/…). Fetch a generous
  // window, then collapse to ONE representative span per trace.
  const span_limit = Math.max(limit * 12, 60);
  if (USE_MCP) {
    try { return collapseSpans(await mcpGetSpans({ limit: span_limit }), limit); }
    catch (e) { console.log("Phoenix MCP read failed, falling back to REST:", String(e.message || e)); }
  }
  const d = await px(`/v1/projects/${encodeURIComponent(PROJECT)}/spans?limit=${span_limit}`);
  return collapseSpans(d.data || d.spans || d || [], limit);
}

/** Collapse many spans to ONE representative span per trace — preferring the root
 *  (parent_id == null) span, which carries the real user query + final answer. */
function collapseSpans(spans, limit) {
  const byTrace = new Map();
  for (const s of spans) {
    const trace_id = s.context?.trace_id || s.trace_id;
    const input = s.attributes?.["input.value"] ?? s.input ?? "";
    const output = s.attributes?.["output.value"] ?? s.output ?? "";
    if (!trace_id || !input || !output) continue;
    const isRoot = (s.parent_id ?? null) === null;
    const cleanInput = !input.trimStart().startsWith("{"); // skip JSON query-bundle sub-spans
    const cand = {
      trace_id,
      span_id: s.context?.span_id || s.span_id || s.id,
      input, output,
      model: s.attributes?.["llm.model_name"] ?? s.model,
      application: s.attributes?.["application.name"] ?? s.name,
      _rank: (isRoot ? 2 : 0) + (cleanInput ? 1 : 0),
    };
    const prev = byTrace.get(trace_id);
    if (!prev || cand._rank > prev._rank) byTrace.set(trace_id, cand);
  }
  return [...byTrace.values()].slice(0, limit).map(({ _rank, ...t }) => t);
}

export const getTrace = async (traceId) => (await getTraces({ limit: 200 })).find((t) => t.trace_id === traceId);

// --- WRITES (consequential — gated on human approval in server.js /execute) ---
/** Write the compliance evaluation back onto the trace as an annotation. */
export const createAnnotation = (traceId, name, payload) =>
  px(`/v1/span_annotations`, {
    method: "POST",
    body: JSON.stringify({ data: [{ span_id: traceId, name, annotator_kind: "LLM", result: payload }] }),
  });

/** Collect failing examples into a dataset (for the experiment loop).
 *  MCP path: the partner `add-dataset-examples` tool. REST path (Phoenix 17.x):
 *  POST /v1/datasets/upload with parallel inputs/outputs/metadata arrays. */
export const createDataset = (name, examples) => {
  if (USE_MCP) {
    return mcpAddDatasetExamples(name, examples)
      .catch((e) => { console.log("Phoenix MCP dataset write failed, falling back to REST:", String(e.message || e)); return restCreateDataset(name, examples); });
  }
  return restCreateDataset(name, examples);
};

const restCreateDataset = (name, examples) =>
  px(`/v1/datasets/upload`, {
    method: "POST",
    body: JSON.stringify({
      action: "create",
      name,
      inputs: examples.map((e) => ({ input: e.input })),
      outputs: examples.map((e) => ({ output: e.output })),
      metadata: examples.map((e) => ({ trace_id: e.trace_id, span_id: e.span_id, scores: e.scores })),
    }),
  });

/** REST reachability ping (always available). */
export async function pingPhoenix() {
  if (process.env.MOCK === "true") return true;
  try { await px(`/v1/projects/${encodeURIComponent(PROJECT)}/spans?limit=1`); return true; } catch { return false; }
}

/** True MCP-server reachability — an actual MCP handshake + tool list, only when the
 *  MCP path is enabled. This is what `/health.partner_mcp_connected` should reflect. */
export async function pingPhoenixMcp() {
  if (process.env.MOCK === "true") return true;
  if (!USE_MCP) return false;
  try { return await mcpPing(); } catch { return false; }
}

export const phoenixTransport = () => (process.env.MOCK === "true" ? "mock" : USE_MCP ? "mcp" : "rest");
