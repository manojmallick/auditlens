// Google Cloud **Vertex AI Agent Engine** client — the judged agent, called at RUNTIME.
//
// When AGENT_ENGINE_RESOURCE is set, src/agent.js routes the EU AI Act scoring step to this
// deployed ADK agent (Gemini on Vertex) instead of calling Gemini directly. That makes all
// three required techs genuinely runtime: Agent Builder (Agent Engine) + Gemini + Phoenix MCP.
// Auth uses ADC (the Cloud Run runtime service account in prod; gcloud ADC locally).

import { GoogleAuth } from "google-auth-library";

const RESOURCE = process.env.AGENT_ENGINE_RESOURCE || ""; // projects/.../locations/.../reasoningEngines/ID
const auth = new GoogleAuth({ scopes: "https://www.googleapis.com/auth/cloud-platform" });

export const agentEngineEnabled = () => !!RESOURCE;

function location() {
  const m = RESOURCE.match(/\/locations\/([^/]+)\//);
  return m ? m[1] : "us-central1";
}
async function token() {
  const t = await (await auth.getClient()).getAccessToken();
  return typeof t === "string" ? t : t.token;
}

function parseJsonish(text) {
  try { return JSON.parse(text); } catch {}
  const m = text.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch {} }
  return null;
}

// Collect the agent's text from a streamQuery response (SSE / json-lines of ADK events).
function textFromStream(body) {
  const out = [];
  for (let line of body.split("\n")) {
    line = line.startsWith("data:") ? line.slice(5).trim() : line.trim();
    if (!line || line === "[DONE]") continue;
    const ev = parseJsonish(line);
    for (const p of ev?.content?.parts || []) if (p.text) out.push(p.text);
  }
  return out.join("");
}

async function streamQuery(message) {
  const url = `https://${location()}-aiplatform.googleapis.com/v1/${RESOURCE}:streamQuery?alt=sse`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ class_method: "stream_query", input: { user_id: "auditlens", message } }),
  });
  if (!res.ok) throw new Error(`AgentEngine ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return textFromStream(await res.text());
}

/** Score one trace via the deployed Agent Engine. Returns the parsed rubric JSON. */
export async function agentEngineScore({ input, output }) {
  const raw = await streamQuery(`INPUT:\n${input}\n\nOUTPUT:\n${output}`);
  const parsed = parseJsonish(raw);
  if (!parsed || !parsed.scores) throw new Error("AgentEngine returned no scores JSON");
  return parsed;
}

/** Lightweight reachability probe for /health — confirms the engine exists + auth works. */
export async function agentEnginePing() {
  if (!RESOURCE) return false;
  try {
    const url = `https://${location()}-aiplatform.googleapis.com/v1/${RESOURCE}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${await token()}` } });
    return res.ok;
  } catch { return false; }
}

export const agentEngineResource = () => RESOURCE;
