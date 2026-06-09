// AuditLens — produce REAL evaluator scores over the human-labelled golden set.
//
// Runs the SAME Gemini evaluator (agent.scoreTrace) the live agent uses, over each
// golden trace's input/output, and writes evals/scored.json. Then `npm run calibrate`
// compares those real LLM scores to the human labels → a trustworthy Cohen's κ.
//
//   gcloud auth application-default login        # once
//   node scripts/score.js                        # LIVE: real Gemini scores
//   MOCK=true node scripts/score.js              # offline pipeline check (canned)
//
// calibrate.js only trusts scored.json when mode==="live", so a MOCK run never
// pollutes the demo number.

import { readFile, writeFile } from "node:fs/promises";
import { scoreTrace } from "../src/agent.js";

const MOCK = process.env.MOCK === "true";

async function main() {
  const gold = JSON.parse(await readFile(new URL("../evals/golden-labels.json", import.meta.url)));
  const labelled = [];
  for (const t of gold.labelled) {
    const { scores } = await scoreTrace({ input: t.input, output: t.output });
    labelled.push({ trace_id: t.trace_id, human_scores: t.human_scores, llm_scores: scores });
    console.log(`  scored ${t.trace_id}  (${Object.keys(scores || {}).length} articles)`);
  }
  const out = { mode: MOCK ? "mock" : "live", scored_at: new Date().toISOString(), model: process.env.GEMINI_MODEL || "gemini-3", labelled };
  await writeFile(new URL("../evals/scored.json", import.meta.url), JSON.stringify(out, null, 2));
  console.log(`\n  Wrote evals/scored.json (mode=${out.mode}, ${labelled.length} traces). Now run: npm run calibrate\n`);
}
main().catch((e) => { console.error(e); process.exit(1); });
