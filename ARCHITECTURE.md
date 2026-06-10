# AuditLens — Architecture

![AuditLens architecture](architecture.png)

AuditLens is a **multi-step compliance agent**, not a chatbot. It continuously audits the LLM
traces a company already produces, scores each against the **EU AI Act (Reg. (EU) 2024/1689)**
with Gemini, and — **only with human approval** — writes the verdict back to Arize Phoenix and
collects violations into a dataset for a prompt-improvement experiment.

All three required technologies are **invoked at runtime** (not just named):

| Requirement | How it's used at runtime | Proof |
|---|---|---|
| **Gemini** | Scores each trace against the rubric (Gemini 3 on the direct path; Gemini 2.5 inside the Agent Engine agent) | `/health.model` |
| **Google Cloud Agent Builder** | A deployed **Vertex AI Agent Engine** agent (built with the **ADK**) is called per scoring request | `/health.agent_builder_runtime:true` + `agent_builder_connected:true` |
| **Arize Phoenix (MCP)** | The app spawns `@arizeai/phoenix-mcp` and calls `get-spans` / `add-dataset-examples` over the Model Context Protocol | `/health.partner_transport:"mcp"` + `partner_mcp_connected:true` |

## The agent loop (5 steps)

```
Browser (SPA dashboard + Judge Tour)
   │  HTTPS
   ▼
☁️ Cloud Run — AuditLens (Express + static SPA)
   │
   ├─ 1. TraceCollector  ──get-spans──►  Arize Phoenix  (via Phoenix MCP server)
   │
   ├─ 2. ComplianceEvaluator ──score──►  Vertex AI Agent Engine (ADK + Gemini)
   │        rolls up Art.50/9/14/53 violations, drafts a prompt fix       │ fallback
   │                                                                       └─► Gemini 3 (direct)
   │
   ├─ 3. PROPOSE annotate + dataset  ───►  ⏸ ApprovalBar  (read-only until a human approves)
   │
   └─ 4. on approve ──add-dataset-examples / annotation──►  Arize Phoenix  (via Phoenix MCP)
            violations dataset feeds a prompt A/B experiment (the loop)

Evaluator Calibration (continuous): re-score a human-labelled golden set with the SAME
evaluator → Cohen's κ vs human labels (≈0.65, "substantial").
```

## Components

| File | Role |
|---|---|
| [`public/index.html`](public/index.html) | Single-file SPA — dashboard, trace analysis, experiments, the approval bar, and the self-driving **Judge Tour** (`?tour=auto`). |
| [`src/server.js`](src/server.js) | Express API + static host. Endpoints: `/health`, `/api/criteria`, `/api/traces`, `/api/evaluate`, `/api/execute`, `/api/calibration`. Background **prewarm** + cache. |
| [`src/agent.js`](src/agent.js) | The agent loop: `evaluate()` (collect→score→roll up→propose) and `executeProposed()` (approved writes). In-memory eval cache + live calibration. |
| [`src/agent-engine.js`](src/agent-engine.js) | **Agent Builder** client — calls the deployed Vertex AI Agent Engine over its REST `streamQuery` endpoint (ADC auth). |
| [`agent-engine/deploy.py`](agent-engine/deploy.py) | Deploys the **ADK** compliance agent to **Vertex AI Agent Engine**. |
| [`src/phoenix-mcp.js`](src/phoenix-mcp.js) | **Phoenix MCP** client — spawns `@arizeai/phoenix-mcp` and calls tools over MCP. |
| [`src/phoenix.js`](src/phoenix.js) | Phoenix access — routes through MCP when `USE_PHOENIX_MCP=true`, REST fallback. |
| [`src/criteria.js`](src/criteria.js) | The EU AI Act rubric — articles, thresholds, display metadata. |
| [`src/calibration.js`](src/calibration.js) | Confusion matrix, Cohen's κ, MAE — the "eval the evals" math. |
| [`agent-builder/agent.json`](agent-builder/agent.json) | Declarative Agent Builder definition (Gemini + Phoenix MCP, approval-gated). |

## Data flow & trust boundaries

- **Reads are automatic** (steps 1–2): collecting and scoring traces never mutates anything.
- **Writes are gated** (steps 3–4): annotations, datasets, and prompt deploys require explicit
  human approval — enforced server-side (`/api/execute` returns `403` without `approved:true`).
- **Secrets** (`PHOENIX_API_KEY`, `GEMINI_API_KEY`) live in **Secret Manager**, injected as env at
  deploy; never in the image (`.dockerignore` excludes `.env`).
- **Resilience**: MCP failures fall back to Phoenix REST; Agent Engine failures fall back to a
  direct Gemini call — the demo never goes dark. Results are cached and **prewarmed** on startup so
  the dashboard is instant.

## Request lifecycle: `POST /api/evaluate`

1. `getTraces()` → Phoenix **MCP** `get-spans` → collapse to one representative span per trace.
2. `scoreTrace()` → **Vertex AI Agent Engine** (`streamQuery`) → Gemini returns rubric JSON.
3. `evaluateScores()` → per-article pass/fail vs thresholds → overall score + violations.
4. Draft `proposedAction` (annotate + dataset) → returned to the UI, which raises the **ApprovalBar**.
5. Result cached by `trace_id` (so repeat loads are instant; `fresh:true` bypasses).

## Deployment

Single **Cloud Run** service (europe-west1, `--min-instances=1` to keep the prewarmed cache hot).
The judged scoring agent runs on **Vertex AI Agent Engine** (us-central1). See the deploy block in
[`README.md`](README.md).
