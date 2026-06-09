// AuditLens — run evaluator calibration against the human golden set.
//
// Computes how well the Gemini evaluator agrees with human EU AI Act auditors.
// Reproducible offline (uses recorded llm_scores in the golden file), so it runs
// with no credentials. Writes evals/calibration.json for the dashboard + Devpost.
//
//   node scripts/calibrate.js
//
// To refresh the recorded llm_scores, run the live evaluator over these traces and
// paste its per-article scores back into evals/golden-labels.json.

import { readFile, writeFile } from "node:fs/promises";
import { calibrate } from "../src/calibration.js";
import { EU_AI_ACT_CHECKS } from "../src/criteria.js";

const KAPPA_TARGET = Number(process.env.KAPPA_TARGET ?? 0.6); // ≥0.61 = substantial agreement

function pct(x) { return `${(x * 100).toFixed(1)}%`; }

async function loadLabelled() {
  // Prefer REAL evaluator scores (scored.json from a live `npm run score`); fall back
  // to the synthetic llm_scores in golden-labels.json so calibrate runs with no creds.
  try {
    const scored = JSON.parse(await readFile(new URL("../evals/scored.json", import.meta.url)));
    if (scored.mode === "live") return { labelled: scored.labelled, source: `scored.json (LIVE ${scored.model || ""})` };
  } catch { /* no scored.json yet */ }
  const gold = JSON.parse(await readFile(new URL("../evals/golden-labels.json", import.meta.url)));
  return { labelled: gold.labelled, source: "golden-labels.json (offline synthetic llm_scores)" };
}

async function main() {
  const { labelled, source } = await loadLabelled();
  const report = calibrate(labelled, EU_AI_ACT_CHECKS);

  console.log(`\nAuditLens — evaluator calibration (LLM judge vs human auditors)`);
  console.log(`  source: ${source}\n`);
  console.log(`  Traces: ${report.traces}  ·  Score pairs: ${report.pairs}\n`);
  console.log(`  ${"Article".padEnd(34)} acc     κ(kappa)  MAE   TP/FP/FN`);
  for (const [id, a] of Object.entries(report.per_article)) {
    console.log(`  ${id.padEnd(34)} ${pct(a.accuracy).padStart(6)}  ${a.kappa.toFixed(2).padStart(6)}   ${a.mae.toFixed(3)}  ${a.TP}/${a.FP}/${a.FN}`);
  }
  const o = report.overall;
  console.log(`\n  OVERALL  accuracy ${pct(o.accuracy)}  ·  precision ${pct(o.precision)}  ·  recall ${pct(o.recall)}  ·  F1 ${pct(o.f1)}`);
  console.log(`  Cohen's κ = ${o.kappa.toFixed(3)}  (${o.kappa_label} agreement)  ·  MAE ${o.mae.toFixed(3)}`);

  const out = { ran_at: new Date().toISOString(), kappa_target: KAPPA_TARGET, ...report };
  await writeFile(new URL("../evals/calibration.json", import.meta.url), JSON.stringify(out, null, 2));

  const passed = o.kappa >= KAPPA_TARGET;
  console.log(`\n  ${passed ? "✅ PASS" : "❌ FAIL"} — κ target ${KAPPA_TARGET}  (report → evals/calibration.json)\n`);
  process.exit(passed ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(2); });
