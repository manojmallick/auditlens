// AuditLens — evaluator calibration ("eval the evals").
//
// The reliability hole in any LLM-as-judge system: how do you know the judge is
// right? You validate its scores against HUMAN expert labels. This module computes
// the standard agreement metrics between AuditLens's Gemini evaluator and a human
// labelled golden set, per EU AI Act article and overall:
//   • confusion at threshold (TP/TN/FP/FN, accuracy, precision, recall, F1)
//   • Cohen's kappa (agreement beyond chance — the headline reliability number)
//   • MAE (how far the LLM's continuous score is from the human's)
//
// Positive class = VIOLATION (score < threshold) — that's what we care about catching.

/** Confusion matrix of LLM-vs-human violation calls at a threshold. */
export function confusionAtThreshold(pairs) {
  // pairs: [{ human, llm, threshold }]
  const cm = { TP: 0, TN: 0, FP: 0, FN: 0 };
  for (const { human, llm, threshold } of pairs) {
    const hv = human < threshold; // human says violation
    const lv = llm < threshold;   // llm says violation
    if (hv && lv) cm.TP++;
    else if (!hv && !lv) cm.TN++;
    else if (!hv && lv) cm.FP++;
    else cm.FN++;
  }
  const n = cm.TP + cm.TN + cm.FP + cm.FN || 1;
  const accuracy = (cm.TP + cm.TN) / n;
  const precision = cm.TP / (cm.TP + cm.FP || 1);
  const recall = cm.TP / (cm.TP + cm.FN || 1);
  const f1 = (2 * precision * recall) / (precision + recall || 1);
  return { ...cm, n, accuracy, precision, recall, f1 };
}

/** Cohen's kappa from a confusion matrix (agreement corrected for chance). */
export function cohensKappa(cm) {
  const n = cm.TP + cm.TN + cm.FP + cm.FN || 1;
  const po = (cm.TP + cm.TN) / n;
  const pYes = ((cm.TP + cm.FP) / n) * ((cm.TP + cm.FN) / n);
  const pNo = ((cm.FN + cm.TN) / n) * ((cm.FP + cm.TN) / n);
  const pe = pYes + pNo;
  return pe === 1 ? 1 : (po - pe) / (1 - pe);
}

/** Mean absolute error between LLM and human continuous scores. */
export function mae(pairs) {
  if (!pairs.length) return 0;
  return pairs.reduce((a, p) => a + Math.abs(p.llm - p.human), 0) / pairs.length;
}

function kappaLabel(k) {
  if (k >= 0.81) return "almost perfect";
  if (k >= 0.61) return "substantial";
  if (k >= 0.41) return "moderate";
  if (k >= 0.21) return "fair";
  return "slight";
}

/**
 * Full calibration over a labelled golden set.
 * @param {object[]} labelled  [{ trace_id, human_scores:{art:0..1}, llm_scores:{art:0..1} }]
 * @param {object}   checks    EU_AI_ACT_CHECKS (for per-article thresholds)
 */
export function calibrate(labelled, checks) {
  const perArticle = {};
  const allPairs = [];
  for (const id of Object.keys(checks)) {
    const threshold = checks[id].threshold;
    const pairs = labelled
      .filter((t) => t.human_scores?.[id] != null && t.llm_scores?.[id] != null)
      .map((t) => ({ human: t.human_scores[id], llm: t.llm_scores[id], threshold }));
    if (!pairs.length) continue;
    const cm = confusionAtThreshold(pairs);
    perArticle[id] = { ...cm, kappa: cohensKappa(cm), mae: mae(pairs) };
    allPairs.push(...pairs);
  }
  const overallCm = confusionAtThreshold(allPairs);
  const overallKappa = cohensKappa(overallCm);
  return {
    traces: labelled.length,
    pairs: allPairs.length,
    overall: { ...overallCm, kappa: overallKappa, kappa_label: kappaLabel(overallKappa), mae: mae(allPairs) },
    per_article: perArticle,
  };
}
