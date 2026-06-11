# AuditLens — Demo Video Script & Recording Guide

A ~**2:20** screen-recording you can shoot in one take. Hackathon rules: **under 3 minutes, public,
uploaded to YouTube or Vimeo.** Target 2:00–2:30 — judges reward tight.

- **Live app:** https://auditlens-908307939543.europe-west1.run.app
- **One-take backbone:** the self-driving **Judge Tour** (`…/?tour=auto`) advances on its own while
  you narrate. Or drive it manually with the shot list below (more control — recommended).

---

## Before you hit record (2-minute prep)
- [ ] **Warm the app**: open the live URL once and let it load (the eval cache prewarms → instant).
- [ ] Open a **second tab** with a terminal ready to run the health check (Beat 6), or pre-open
      `…/health` in a browser tab.
- [ ] Browser at **1440–1600px**, hide the **bookmarks bar**, close other tabs, enable Do-Not-Disturb.
- [ ] Zoom the page so text is readable on a phone (⌘+ once or twice).
- [ ] Pick a recorder: **QuickTime** (macOS `⌘⇧5` → Record Selected Portion) or **Loom** (1080p).
- [ ] Do one silent dry-run of the clicks so the live evaluation is cached before the real take.

---

## The script (timecodes · what to do · what to say)

> Voiceover ≈ 350 words at a calm pace. Bold = on-screen action.

### 0:00–0:15 — Hook *(on the Dashboard)*
**Open the live URL; dashboard is already loaded (red/amber gauges).**
> "The EU AI Act is now in force — every company running LLMs in Europe has to prove transparency,
> human oversight, and risk controls. Today that's a quarterly, three-day manual review. **AuditLens
> turns it into a daily, automated audit.**"

### 0:15–0:35 — What it is *(slowly move cursor across the gauges + table)*
**Hover the global gauge, then the five article gauges, then the Compliance-by-Article table.**
> "AuditLens pulls real production traces from **Arize Phoenix** and scores each one against the EU AI
> Act with **Gemini**. Here's the live compliance posture — a global score and a breakdown across
> Articles 50, 9, 14 and 53. Right now this system is **at risk**: multiple articles in violation."

### 0:35–0:52 — The differentiator *(scroll to the Calibration card)*
**Scroll down to "Evaluator Calibration"; point at the κ value + the "● LIVE Gemini" badge.**
> "And we don't just trust the AI judge — **we measure it.** This is live calibration: Cohen's kappa
> against human auditor labels, currently **'substantial' agreement.** We treat the judge like any
> model — measure it, then improve it."

### 0:52–1:28 — The agent + the human gate *(the core — go slow here)*
**Click "Traces" → click the "pension into Bitcoin" trace. Let the detail render.**
> "Let's open a trace. A bot told a user to move their whole pension into Bitcoin — with no AI
> disclosure. Watch the **agent pipeline**: it collects the trace from Phoenix over **MCP**, then
> scores it on a **Vertex AI Agent Engine** agent."

**Point at the red Compliance Scores, then the "Suggested Fix".**
> "Gemini flags Article 50 and 14, and drafts the exact prompt fix. But here's the key —"

**Point at the Approval Bar at the bottom.**
> "— it's **read-only until a human approves.** The agent *proposes* the write; nothing touches
> Phoenix until I approve."

**Click "Approve & Write ▸"; the toast confirms.**
> "I approve — and now the annotation and the violations dataset are written back, over MCP."

### 1:28–1:45 — The loop *(click "Experiments")*
**Click "Experiments"; show Prompt A vs Prompt B.**
> "Those violations become a dataset for a prompt **A/B experiment** — the system audits itself and
> improves itself. That's the loop."

### 1:45–2:05 — Required-tech proof *(switch to the terminal / health tab)*
**Run `curl <url>/health` (or show the pre-opened /health tab). Highlight the three fields.**
> "Everything you saw runs for real. One health check proves it: **Gemini**, **Google Cloud Agent
> Builder** on Vertex AI Agent Engine, and the **Arize Phoenix MCP server** — all invoked at runtime.
> Deployed on **Cloud Run.**"

### 2:05–2:20 — Close *(back to the Dashboard)*
**Return to the dashboard; optionally click "Judge Tour".**
> "AuditLens — **the compliance layer for AI agents.** It's live; try it yourself, or take the
> built-in Judge Tour. Thanks for watching."

---

## Lower-thirds / on-screen captions (optional, high-impact)
Drop these as text overlays at the matching beats:
- 0:15 — `Arize Phoenix → Gemini → EU AI Act score`
- 0:40 — `We measure our own judge · Cohen's κ ≈ 0.65 (substantial)`
- 1:10 — `Human-in-the-loop · nothing is written without approval`
- 1:50 — `curl /health → all 3 required techs, at runtime`

---

## Recording & export
- **Resolution:** 1080p (1920×1080). Record the browser window, not the whole desktop.
- **Audio:** record voiceover live, or record silent then add narration in the editor. Keep it clean
  — no background noise.
- **Cursor:** move deliberately; pause ~1s on each thing you mention.
- **Length:** trim dead air to land at **2:00–2:30**. Hard cap is 3:00.
- **Export:** MP4, H.264.

## Upload checklist
- [ ] Upload to **YouTube** (or Vimeo) and set visibility to **Public** (not Unlisted/Private).
- [ ] Title: `AuditLens — EU AI Act Compliance Agent (Gemini + Agent Builder + Arize Phoenix MCP)`
- [ ] Description: paste the elevator pitch + the live URL + the repo URL.
- [ ] Copy the video URL into the Devpost **Submit** step.

## Don't do this (common video mistakes)
- ❌ Don't leave it Private/Unlisted — judges must be able to open it.
- ❌ Don't go over 3:00 — they may stop watching or mark it non-compliant.
- ❌ Don't narrate a dead/loading screen — warm the cache first so everything is instant.
- ❌ Don't skip the `/health` proof — it's your strongest answer to "is the required tech really used?"

---

## YouTube title + description (copy-paste)

**Title** (≤100 chars — pick one)
```
AuditLens — EU AI Act Compliance Agent | Gemini + Agent Builder + Arize Phoenix MCP
```
*Alt:* `AuditLens: an AI agent that audits LLMs for EU AI Act compliance (Gemini + Arize Phoenix)`

**Description**
```
AuditLens turns EU AI Act compliance from a quarterly, 3-day manual review into a daily, automated audit.

It pulls real production LLM traces from Arize Phoenix, scores each against the EU AI Act (Art.50/9/14/53) with Gemini running on a Vertex AI Agent Engine agent, and — with human approval — writes the verdict back to Phoenix over the Model Context Protocol. It even measures its own judge live with Cohen's κ ("eval the evals").

Built for the Google Cloud Rapid Agent Hackathon — Arize track.

🌐 Live demo: https://auditlens-908307939543.europe-west1.run.app
💻 Code (MIT): https://github.com/manojmallick/auditlens

⏱ Chapters
0:00 The EU AI Act problem
0:15 The live compliance dashboard
0:35 We measure our own judge (live calibration, Cohen's κ)
0:52 The agent + the human-in-the-loop approval gate
1:28 The self-improvement loop (prompt A/B)
1:45 All three required techs at runtime (curl /health)
2:05 Try it yourself

🛠 Built with
Gemini · Google Cloud Agent Builder (Vertex AI Agent Engine + ADK) · Arize Phoenix via the Phoenix MCP server · Cloud Run · Cloud Build · Secret Manager · Vertex AI · Node.js / Express

#GoogleCloud #Gemini #AIAgents #EUAIAct #AICompliance #Arize #Phoenix #MCP #VertexAI #Hackathon
```
*Set visibility to **Public**. Adjust the chapter timestamps to match your final cut (keep 0:00 first).*

---

### Fast path (≈90s, minimal effort)
If you're short on time: open **`…/?tour=auto`**, hit record, and read this over the auto-advancing
tour: *"AuditLens audits production LLM traces against the EU AI Act with Gemini, on Google Cloud
Agent Builder, reading and writing through the Arize Phoenix MCP server. It scores each trace, flags
violations, drafts the fix — and a human approves before anything is written. It even measures its own
judge with live Cohen's kappa. All three required technologies run at runtime, deployed on Cloud Run.
That's AuditLens — the compliance layer for AI agents."*
