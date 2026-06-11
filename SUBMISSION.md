# AuditLens — Devpost submission (copy-paste ready)

> ⚠️ **Partner track = Arize** (not Fivetran). Set the "first time using Arize tools?" question to
> **Yes**, and set every other partner (Fivetran/Elastic/GitLab/MongoDB/Dynatrace) to
> **"N/A, I am not submitting for the … track."**

---

## Project overview

**Project name** (≤60)
```
AuditLens — EU AI Act Compliance Agent
```

**Elevator pitch** (≤200)
```
Audits your production LLM traces against the EU AI Act with Gemini — and, with human approval, writes the verdict back to Arize Phoenix. A daily 8-minute audit, not a quarterly 3-day review.
```

**Thumbnail** — upload `gallery/00-thumbnail.png` (1200×800, 3:2).

---

## Additional info (judges/organizers)

| Field | Value |
|---|---|
| Submitter Type | Individual |
| Organization name | N/A |
| Government employee? | No |
| Country of Residence | Netherlands |
| Canada province | N/A |
| **Partner track** | **Arize** |
| New or existing? | **New** |
| Open-source repo URL (must include OSI license) | `https://github.com/manojmallick/auditlens` |
| Hosted Project URL (for judging) | `https://auditlens-908307939543.europe-west1.run.app` |
| First time using **Arize** tools? | **Yes** |
| First time using Elastic/Fivetran/GitLab/MongoDB/Dynatrace? | N/A — not submitting for that track |

**What Google Cloud products did you use?**
```
Vertex AI (Gemini); Vertex AI Agent Engine (Google Cloud Agent Builder) running an Agent Development Kit (ADK) agent that the app calls at runtime for scoring; Gemini API (gemini-3-flash-preview); Cloud Run (hosting the agent + dashboard); Cloud Build (container builds via gcloud run deploy --source); Secret Manager (Phoenix + Gemini API keys); Cloud Storage (Agent Engine staging bucket); Artifact Registry; IAM.
```

**Please list all other tools or products you used**
```
Arize Phoenix (LLM observability) via the Phoenix MCP server (@arizeai/phoenix-mcp); Model Context Protocol SDK (@modelcontextprotocol/sdk); Node.js + Express; OpenInference / OpenTelemetry (to instrument traces into Phoenix); Tailwind CSS, Inter, Material Symbols (UI); Puppeteer (gallery capture). EU AI Act — Regulation (EU) 2024/1689 (Art.50/9/14/53).
```

---

## Built with (tags)
```
gemini, vertex-ai, agent-engine, google-cloud-agent-builder, adk, google-cloud, cloud-run, cloud-build, secret-manager, arize-phoenix, mcp, model-context-protocol, node.js, express, javascript, tailwindcss, openinference, opentelemetry, eu-ai-act, llm-observability
```

## "Try it out" links
```
https://auditlens-908307939543.europe-west1.run.app
https://github.com/manojmallick/auditlens
```

---

## About the project (paste into the Markdown box)

## Inspiration
The **EU AI Act** (Regulation (EU) 2024/1689) is in force. Every company running LLMs in the EU now
has to prove transparency (Art.50), risk management (Art.9), human oversight (Art.14), and GPAI
obligations (Art.53) — with fines up to €35M or 7% of global turnover. Today that's a **quarterly,
multi-day manual review** by experts: slow, expensive, and stale the moment it ships, while the
models keep generating traces nobody is checking. We wanted to turn that into something continuous
and automatic — an agent that audits the traces you already produce.

## What it does
AuditLens is a **multi-step compliance agent, not a chatbot**:
1. **Collects** real production LLM traces from **Arize Phoenix** (via the Phoenix MCP server).
2. **Scores** each trace against the EU AI Act rubric (Art.50 transparency, Art.9 risk, Art.14 human
   oversight, Art.53 GPAI) with **Gemini**, running on a **Vertex AI Agent Engine** agent.
3. **Rolls up** violations and drafts the exact prompt fix for the worst article.
4. **Proposes** writing the verdict back — **gated on human approval.** Nothing is written until a
   person clicks approve.
5. On approval, **writes** annotations and collects violations into a Phoenix dataset for a prompt
   A/B experiment — closing the improvement loop.

It also validates its own judge: a live **“eval the evals”** calibration re-scores a human-labelled
golden set with the same Gemini evaluator and reports **Cohen's κ ≈ 0.65 (substantial agreement)**.

## How we built it
- **Gemini** for rubric scoring — Gemini 3 (`gemini-3-flash-preview`) on the direct path, Gemini 2.5
  inside the agent.
- **Google Cloud Agent Builder** — a **Vertex AI Agent Engine** agent built with the **ADK**; the
  hosted app calls it over its REST endpoint per scoring request.
- **Arize Phoenix via the Phoenix MCP server** (`@arizeai/phoenix-mcp`) — the app spawns it and calls
  `get-spans` / `add-dataset-examples` over the **Model Context Protocol**, at runtime.
- **Cloud Run** (single Node/Express service + SPA, prewarmed evaluation cache), **Secret Manager**
  for keys, **Cloud Build** for source deploys.
- A single-file dashboard (Tailwind, Material design) with a self-driving **Judge Tour** (`?tour=auto`).

You can verify all three required techs at runtime with one command:
`curl <url>/health → agent_builder_runtime:true · partner_transport:"mcp" · model:gemini-3-flash-preview`

## Challenges we ran into
- **Gemini 3 isn't on Vertex for every project yet** — we run it through the Gemini Developer API and
  fall back to Vertex Gemini 2.5.
- **Using the partner genuinely at runtime** (not just naming it): we spawn the Phoenix MCP server
  inside the Cloud Run container and confirm a real MCP handshake.
- **Making an LLM judge defensible**: our first live κ was only “fair” (0.38). The calibration loop
  caught that the judge over-flagged GPAI; we tuned the rubric and expanded the golden set to reach
  “substantial” (~0.65). We kept it honest rather than faking a number.
- **Latency**: Gemini + Agent Engine round-trips are slow, so we prewarm and cache evaluations — the
  dashboard is instant for judges.

## Accomplishments that we're proud of
- **All three required technologies invoked at runtime**, verifiable with one `curl /health`.
- A real **human-in-the-loop approval gate** before any write to Phoenix.
- **Live, honest evaluator calibration** — we measure our own judge and improved it.
- Deployed end-to-end on Google Cloud with a polished, self-demoing UI.

## What we learned
- LLM-as-judge is only as trustworthy as its **calibration** — measuring the judge is the product,
  not an afterthought.
- **MCP** makes partner integrations genuinely composable — the same Phoenix MCP server backs both the
  Agent Builder agent and the hosted app.
- Honest metrics beat impressive-looking ones with technical judges.

## What's next for AuditLens
- Expand the golden set + per-article thresholds with compliance experts; push κ toward “almost perfect.”
- Run the prompt-improvement experiments automatically through Agent Engine + Phoenix.
- Cover more of the Act (Annex III high-risk categories, logging & record-keeping) and add scheduled
  daily audits with alerting — the conformity layer for an entire AI platform.
