# AuditLens — EU AI Act Trace Compliance Agent

Phoenix traces every LLM call → AuditLens scores each trace against the EU AI Act
(Art.50 transparency / AI-disclosure & synthetic-content marking, Art.9 scope, Art.14
human oversight, Art.53 GPAI) with Gemini 3 → and, **with your approval**, writes the
evaluation back to Phoenix and collects violations into a dataset for a prompt-improvement
experiment. Daily 8-minute audit vs a quarterly 3-day manual review.

> **Citations** follow the final EU AI Act, **Regulation (EU) 2024/1689** (Art.50 replaces
> the 2021-proposal Art.52; GPAI is Art.53, not Art.70). `[MED]` Verify paragraphs against
> the consolidated text before submission — a wrong article is the one unforgivable bug.

## 🟢 Going LIVE (the part MOCK can't prove) — and the dogfood unlock

AuditLens needs real LLM traces to audit. **You already produce them: the other five
agents in this repo are all Gemini 3 apps.** Point their OpenInference instrumentation at
your Phoenix project and AuditLens becomes the conformity layer for the whole platform.

```bash
# 0. creds
cp .env.example .env            # GCP project + PHOENIX_BASE_URL + PHOENIX_API_KEY + PHOENIX_PROJECT
gcloud auth application-default login && gcloud config set project "$GOOGLE_CLOUD_PROJECT"

# 1. get traces into Phoenix (pick one)
#    a) dogfood: instrument the sibling agents with OpenInference → your Phoenix project
#    b) or run Phoenix locally:  pip install arize-phoenix && phoenix serve

# 2. REAL evaluator calibration (replaces the synthetic offline number):
npm run score        # runs Gemini over evals/golden-labels.json → evals/scored.json (mode=live)
npm run calibrate    # κ / accuracy from REAL scores vs the human labels

# 3. deploy the judged + hosted paths
gcloud run deploy auditlens --source . --region=europe-west1 --allow-unauthenticated \
  --set-secrets="PHOENIX_API_KEY=auditlens-phoenix-key:latest" \
  --set-env-vars="GOOGLE_GENAI_USE_VERTEXAI=true,GEMINI_MODEL=gemini-3"
# import agent-builder/agent.json into Agent Builder (Phoenix MCP) for the judged agent
```

`npm run calibrate` automatically uses `scored.json` once it exists with `mode:"live"`;
until then it falls back to the offline synthetic numbers so the demo always runs.

**Stack (Google Cloud Rapid Agent Hackathon — Arize bucket):**
- 🧠 **Gemini** — EU AI Act rubric scoring *(required)* — Gemini 3 (`gemini-3-flash-preview`) on the direct fallback path; Gemini 2.5 inside the Agent Engine agent. Called at runtime.
- 🏗️ **Google Cloud Agent Builder** — a real **Vertex AI Agent Engine** agent built with the **ADK** ([`agent-engine/deploy.py`](agent-engine/deploy.py)). The hosted app's scoring step **calls it at runtime** ([`src/agent-engine.js`](src/agent-engine.js)); `/health` reports `agent_builder_runtime:true` + `agent_builder_connected:true`. *(required)*
- 🔭 **Arize Phoenix via the Phoenix MCP server** — `@arizeai/phoenix-mcp`, **spawned and called at runtime** when `USE_PHOENIX_MCP=true` (reads via `get-spans`, dataset write via `add-dataset-examples`); falls back to Phoenix REST on error *(required)*
- ☁️ Cloud Run (hosting)

> **Required tech is invoked at runtime, not just named:** with `USE_PHOENIX_MCP=true`
> the hosted app spawns the `@arizeai/phoenix-mcp` server and calls partner tools over
> MCP — `/health` reports `partner_transport:"mcp"` and `partner_mcp_connected:true`
> from a real MCP handshake. **`[TESTED]`** the MCP read path + full Gemini-3 scoring
> loop against a live Phoenix project. The MCP write tool (`add-dataset-examples`) runs
> only after human approval — **`[TESTED: NO]`** to avoid mutating the demo project;
> confirm the argument shape against your `@arizeai/phoenix-mcp` version.

## Architecture
```
Browser (public/index.html) ──POST /api/evaluate──► agent (src/agent.js)
                                                      1. collect traces  → Phoenix MCP
                                                      2. score vs rubric → Gemini 3 (criteria.js)
                                                      3. roll up score + violations
                                                      4. suggest prompt fix (worst article)
                                                      5. PROPOSE annotate+dataset ─┐ (gated)
ApprovalBar (human approves) ──POST /api/execute──►  phoenix.create_annotation + create_dataset
```
The **judged** agent is [`agent-builder/agent.json`](agent-builder/agent.json)
(Gemini 3 + Phoenix MCP, writes require approval). The Express app mirrors it.

## Two agents
- **TraceCollector** — pulls recent traces/spans from Phoenix.
- **ComplianceEvaluator** — scores each trace per EU AI Act rubric, rolls up violations, drafts a prompt fix, proposes the write.

## Quick start (local)
```bash
cp .env.example .env     # GCP project + PHOENIX_BASE_URL + PHOENIX_API_KEY + PHOENIX_PROJECT
npm install
gcloud auth application-default login && gcloud config set project "$GOOGLE_CLOUD_PROJECT"
npm run dev              # http://localhost:8080 → Evaluate (blank = latest trace)
```
Need traces to evaluate? Instrument any app with OpenInference and point it at your
Phoenix, or run Phoenix locally: `pip install arize-phoenix && phoenix serve`.

## Deploy to Cloud Run
```bash
# Secrets in Secret Manager (once):
printf "%s" "$PHOENIX_API_KEY" | gcloud secrets create auditlens-phoenix-key --data-file=-
printf "%s" "$GEMINI_API_KEY"  | gcloud secrets create auditlens-gemini-key  --data-file=-

gcloud run deploy auditlens \
  --source . \
  --region=europe-west1 \
  --allow-unauthenticated \
  --min-instances=1 \
  --set-secrets="PHOENIX_API_KEY=auditlens-phoenix-key:latest,GEMINI_API_KEY=auditlens-gemini-key:latest" \
  --set-env-vars="GEMINI_MODEL=gemini-3-flash-preview,GOOGLE_GENAI_USE_VERTEXAI=false,USE_PHOENIX_MCP=true,PHOENIX_BASE_URL=https://app.phoenix.arize.com/s/<space>,PHOENIX_PROJECT=auditlens-demo"
```
> The runtime service account needs `roles/secretmanager.secretAccessor`. (Vertex fallback also needs `roles/aiplatform.user`.)
> `--min-instances=1` keeps the prewarmed evaluation cache hot so judges never wait.
> **Model:** `gemini-3-flash-preview` runs on the **Gemini Developer API** (set `GEMINI_API_KEY`). Gemini 3 isn't on Vertex for every project yet; unset the key to fall back to Vertex `gemini-2.5-flash`/`pro`.

## Demo
- **Live:** see deployed URL. Click **Judge Tour** for a hands-free, spotlighted walkthrough (or append `?tour=1`).
- **Runbook:** [`DEMO.md`](DEMO.md) — 3-minute script.
- **Seed demo violations into Phoenix:** `npm run seed` (writes the curated non-compliant traces via OTLP).

## Health check (proof for judges)
```bash
curl https://<your-cloud-run-url>/health
# { "status":"ok", "model":"gemini-3-flash-preview", "partner":"arize-phoenix",
#   "partner_transport":"mcp", "partner_connected":true, "partner_mcp_connected":true,
#   "stack":{...}, "cached_evaluations":6, "live_calibration":"ready", ... }
```

## License
MIT — see [LICENSE](LICENSE).
