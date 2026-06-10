# AuditLens — 3-Minute Demo Runbook

**Live app:** https://auditlens-908307939543.europe-west1.run.app
**Stack (Google Cloud Rapid Agent Hackathon — Arize bucket):** **Gemini 3** (gemini-3-flash-preview) · Arize Phoenix · Cloud Run
**One-liner:** *Phoenix traces every LLM call → AuditLens scores each one against the EU AI Act with Gemini 3 → and, with your approval, writes the verdict back to Phoenix and collects violations into a dataset for a prompt-improvement experiment.*

---

## 🚀 Easiest path: the Judge Tour (hands-free)
Click **Judge Tour** (top-right) — an in-app guided walkthrough spotlights each part and **drives the app for you**: Dashboard → per-article gauges → calibration → opens a real trace → runs a **live Gemini evaluation** → the **approval gate** → the experiment loop. Navigate with **Next ›**, arrow keys, or **Esc** to exit.
- `?tour=1` — auto-starts the tour on load (judge link).
- `?tour=auto` — **hands-free auto-advancing loop** (~70s, loops). Use this to **screen-record the backup video** in one take.

## Before you present (30s checklist)
- [ ] Open the live URL; the dashboard is **instant** (evaluations are cached + prewarmed on the server).
- [ ] Top-bar badges read **"Phoenix Connected"** (green) and **"Gemini 3"**.
- [ ] Global Compliance gauge is **red/amber** (the demo project is full of violations).
- [ ] Calibration card shows a **● LIVE Gemini** badge (κ is computed on real Gemini runs).
- [ ] If data ever looks too clean, re-seed: `npm run seed`, then refresh.

## 🎥 90-second backup video — shot list + voiceover (record `?tour=auto`)
Record the screen with `…/?tour=auto` (QuickTime ⌘⌥5 / Loom). The tour drives itself; read this over it:
1. **(0–10s) Hook** — "Every company running LLMs in the EU now has to prove EU AI Act compliance. Today that's a quarterly 3-day manual review. AuditLens makes it a daily, automated audit."
2. **(10–30s) Dashboard** — "Gemini 3 scores every production trace from Arize Phoenix against five EU AI Act articles — transparency, risk, human oversight, synthetic-content marking, GPAI. Here the system is at risk: multiple articles in violation."
3. **(30–45s) Calibration** — "And we don't trust the AI judge blindly — we measure it. Cohen's κ live against human auditor labels. That's eval-the-evals."
4. **(45–65s) Trace + approval** — "Open a trace: a bot pushed pension-into-crypto with no AI disclosure. Gemini flags Art.50 and Art.14 and drafts the fix. But it can't write on its own — a human approves before anything is written back to Phoenix."
5. **(65–80s) Loop + close** — "Approved violations become a Phoenix dataset for a prompt A/B experiment. The agent audits itself and improves itself — Gemini 3 + Phoenix + Cloud Run."

---

## The 3-minute script

### Beat 0 — The problem (20s)
> "The EU AI Act is now in force. Every company running LLMs in production has to prove transparency, human oversight, and synthetic-content marking — today that's a quarterly, 3-day manual review. AuditLens turns it into a daily 8-minute automated audit."

### Beat 1 — Dashboard: the compliance posture (40s)
Point at the screen:
- **Global Compliance Score** gauge — aggregated across every audited trace.
- The **five per-article gauges** — Art. 50(1) disclosure, Art. 9 risk, Art. 14 oversight, Art. 50(2) synthetic marking, Art. 53 GPAI. *These are the FINAL EU AI Act 2024/1689 article numbers, not the 2021 draft.*
- **Compliance by Article** table — pass/fail counts per article, live.
- **Evaluator Calibration** card (κ ≈ 0.83, "almost perfect") — *"This is the part nobody else does: we validate the AI judge against human auditors, so the score itself is defensible."*

### Beat 2 — Trace Analysis: catch a real violation (50s)
Click **Traces** → click *"Should I move my whole pension into Bitcoin…"*.
- The **Agent Pipeline** swimlane shows the two agents: TraceCollector (Phoenix) → ComplianceEvaluator (Gemini).
- **User Query / Model Response** — the bot gave unhedged financial advice with no AI disclosure.
- **Compliance Scores** — watch Art. 50 and Art. 14 light up red against their thresholds.
- **Suggested Fix** — Gemini drafts the exact prompt guardrail that would fix the worst article.
> "Everything so far was read-only. Now the agent wants to act."

### Beat 3 — The approval gate (30s) ⭐ the money shot
- The **ApprovalBar** has slid up: *"Agent proposes: annotate N violations + add to dataset — tools: phoenix.create_annotation · phoenix.create_dataset."*
- > "A compliance agent that writes on its own is a liability. Consequential writes are gated on a human."
- Click **Approve & Write ▸** → toast confirms the annotation + dataset were written **back to Phoenix**.

### Beat 4 — Close the loop (20s)
Click **Experiments**.
- Prompt A (current) vs Prompt B (Gemini's fix) on the worst article, with the projected lift.
- > "The violations we just collected become the dataset for an A/B experiment in Agent Builder + Phoenix MCP. The system audits itself and improves itself — that's the loop."

---

## Required-tech architecture — what's live vs the judged agent (say this verbatim)
> "Every required technology is called at runtime — not just named. The compliance scoring step calls a **Google Cloud Agent Builder** agent: a **Vertex AI Agent Engine** deployment built with the **ADK** (`agent-engine/deploy.py`), invoked over its REST endpoint by `src/agent-engine.js`. That agent runs **Gemini** on Vertex. And the trace data flows through the **Arize Phoenix MCP server** (`@arizeai/phoenix-mcp`), which the app spawns and calls (`get-spans`, `add-dataset-examples`) at runtime. Writes are gated behind human approval. `curl /health` shows `agent_builder_runtime:true`, `partner_transport:"mcp"`, and the Agent Engine resource name — all three, live."

The `/health` endpoint proves it from a real MCP handshake:
```bash
curl <url>/health   # → partner_transport:"mcp", partner_mcp_connected:true,
                    #   stack:{ gemini:"gemini-3-flash-preview", agent_builder:"agent-builder/agent.json", phoenix_mcp:"@arizeai/phoenix-mcp" }
```
**Required boxes — all three invoked at runtime (verify in one curl):**
```bash
curl <url>/health
# agent_builder_runtime:true, agent_builder_connected:true   → Vertex AI Agent Engine (ADK)
# partner_transport:"mcp", partner_mcp_connected:true         → Arize Phoenix MCP server
# model:"gemini-3-flash-preview"                              → Gemini
```
✅ **Google Cloud Agent Builder** — scoring is routed to a deployed **Vertex AI Agent Engine** agent (`agent-engine/deploy.py`), called at runtime by `src/agent-engine.js`. ✅ **Gemini** — runs inside that agent (Vertex) and on the direct fallback (Gemini 3). ✅ **Arize Phoenix** — reads + dataset write over the **Phoenix MCP server**. No competing AI/cloud.

## Proof points to drop in Q&A
- **It's real, not mocked:** `curl <url>/health` → `partner_mcp_connected: true`, `model: gemini-3-flash-preview`. Traces come from a real Phoenix project; scoring is a real Gemini 3 call.
- **Right regulation:** final EU AI Act Reg. (EU) 2024/1689 — Art.50 (transparency), Art.9, Art.14, Art.53 (GPAI). A wrong article number is the one unforgivable bug; these are correct.
- **Defensible judge:** Cohen's κ vs a human-labelled golden set (`npm run calibrate`).
- **Deployed on Google Cloud:** Cloud Run (europe-west1), Phoenix key in Secret Manager, Vertex via the runtime service account.

## Backups if the network is flaky
- **MOCK mode** runs the entire UI + approval flow with curated violation data and zero credentials:
  `MOCK=true PORT=8088 npm run dev` → http://localhost:8088
- Switch the live data story between `auditlens-demo` (violations) and `demo_llama_index` (benign real traffic) via `PHOENIX_PROJECT`.

## Re-seed the demo data
```bash
# repopulate the auditlens-demo Phoenix project with the 6 scripted violation traces
PHOENIX_BASE_URL=... PHOENIX_API_KEY=... python3 seed_demo.py
```
