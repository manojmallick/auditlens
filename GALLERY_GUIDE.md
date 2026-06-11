# AuditLens — Project Gallery Guide

A ready-to-upload set of screenshots for the hackathon submission's image gallery, plus how to
re-take or customise them. All images are in [`gallery/`](gallery/), captured at 2× (retina) from
the **live** app.

## Recommended upload order + captions

Upload in this order (first image = the gallery cover). Paste the caption verbatim.

| # | File | Caption to use |
|---|---|---|
| 1 | `01-dashboard.png` | **EU AI Act compliance dashboard** — live global score, per-article gauges (Art.50/9/14/53), and a compliance-by-article table, scored by Gemini from real Arize Phoenix traces. |
| 2 | `09-architecture.png` | **Architecture** — one Cloud Run service drives two agents (collect → score → approve → write), using Vertex AI Agent Engine + the Phoenix MCP server, all at runtime. |
| 3 | `04-approval-gate.png` | **Human-in-the-loop approval gate** — the agent scores a violating trace, drafts the fix, and *proposes* writing back; nothing is written to Phoenix until a human approves. |
| 4 | `02-calibration.png` | **“Eval the evals”** — the Gemini judge is validated live against human labels: Cohen's κ ≈ 0.65 (substantial). We measure the judge, then improve it. |
| 5 | `08-health-proof.png` | **Required tech, invoked at runtime** — one `curl /health` shows Gemini + Google Cloud Agent Builder (Agent Engine) + Arize Phoenix MCP all live. |
| 6 | `03-trace-analysis.png` | **Trace analysis** — agent pipeline, the offending model response (“critical drift”), per-article scores vs thresholds, and the auto-drafted prompt fix. |
| 7 | `05-experiments.png` | **Improvement loop** — collected violations become a Phoenix dataset for a prompt A/B experiment (Prompt A vs the optimised Prompt B). |
| 8 | `06-judge-tour.png` | **Judge Tour** — a built-in, self-driving walkthrough (`?tour=auto`) that spotlights and operates the whole flow hands-free. |
| 9 | `07-mobile.png` | **Responsive** — the dashboard on mobile (collapsible nav, reflowed gauges). |

> Most platforms show 3–8 gallery images. If you must trim, keep **1, 2, 3, 4, 5** (dashboard,
> architecture, approval gate, calibration, health-proof) — they cover product, design, the
> human-in-the-loop story, the differentiator, and the required-tech proof.

## Alt text (accessibility / SEO)
Reuse the caption text as alt text. Keep it factual and keyword-rich (EU AI Act, Gemini, Agent
Engine, Phoenix MCP, Cloud Run).

## How these were generated
Driven headlessly against the live URL with Puppeteer:
```bash
npm install --no-save puppeteer-core
node capture.mjs                       # → gallery/*.png  (uses the deployed URL)
BASE=http://localhost:8088 node capture.mjs   # capture from a local dev server instead
```
`capture.mjs` navigates the real app, evaluates a violating trace, opens the approval gate,
switches to Experiments, drives the Judge Tour, sets a mobile viewport, and renders the
`/health` proof card. Edit the steps there to add/replace shots.

## Re-taking by hand (if you prefer)
1. Open the live app full-screen on a **1440–1600px** window (retina display = crisper).
2. Hide browser chrome / bookmarks bar for clean edges. Use the OS screenshot tool
   (macOS `⌘⇧4` then space to grab a window, or `⌘⇧5`).
3. Shots to grab: **dashboard** (top), click **Traces → a violating trace** (scores + approval
   bar), **Experiments**, and a **Judge Tour** step. For the required-tech proof, screenshot a
   terminal running `curl <url>/health | jq`.
4. Keep a consistent aspect ratio; ~16:10 reads well in galleries.

## Tips for a winning gallery
- **Lead with the product, not the logo** — image 1 should be the working dashboard.
- **Include the proof shot** (`08-health-proof.png`) — judges are told the #1 mistake is required
  tech not actually used; this image preempts that doubt.
- **Show the human gate** (`04`) — it's your differentiator and the “agent, not chatbot” evidence.
- Keep captions short, concrete, and consistent in voice.

*Regenerate any time after a UI change: `node capture.mjs`.*
