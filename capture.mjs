// Capture the AuditLens project-gallery screenshots by driving the LIVE app headlessly.
//   node capture.mjs            → uses the deployed URL
//   BASE=http://localhost:8088 node capture.mjs
import puppeteer from "puppeteer-core";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = process.env.BASE || "https://auditlens-908307939543.europe-west1.run.app";
const OUT = "gallery";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: "new",
  defaultViewport: { width: 1600, height: 1000, deviceScaleFactor: 2 },
  args: ["--no-sandbox", "--hide-scrollbars"],
});
const page = await browser.newPage();
const shot = async (name, opts = {}) => { await page.screenshot({ path: `${OUT}/${name}`, ...opts }); console.log("  ✓", name); };
const tryShot = async (label, fn) => { try { await fn(); } catch (e) { console.log("  ✗", label, String(e.message || e).slice(0, 90)); } };

console.log("capturing from", BASE);

// 1) Dashboard (hero)
await tryShot("01-dashboard", async () => {
  await page.goto(BASE + "/", { waitUntil: "networkidle2", timeout: 60000 });
  await page.waitForFunction(() => document.querySelector("#globalScore")?.textContent.trim() !== "—", { timeout: 45000 });
  await sleep(1500);
  await shot("01-dashboard.png");
});

// 2) Evaluator calibration card (the differentiator) — element crop
await tryShot("02-calibration", async () => {
  await page.waitForFunction(() => document.querySelector("#calMode")?.textContent.includes("LIVE"), { timeout: 60000 }).catch(() => {});
  const sec = await page.evaluateHandle(() => document.querySelector("#calibration").closest("section"));
  await page.evaluate((el) => el.scrollIntoView({ block: "center" }), sec);
  await sleep(800);
  await sec.asElement().screenshot({ path: `${OUT}/02-calibration.png` });
  console.log("  ✓ 02-calibration.png");
});

// 3) Trace analysis — a real violating trace scored live
await tryShot("03-trace-analysis", async () => {
  await page.evaluate(() => go("traces"));
  await sleep(800);
  await page.evaluate(() => { // fire-and-forget (don't await inside evaluate → avoids protocol GC)
    const t = (state.traces || []).find((x) => /pension|bitcoin|crypto|stock|fire|chest|photo|medication/i.test(x.input)) || state.traces[0];
    if (t) evaluateTrace(t.trace_id);
  });
  await page.waitForSelector("#tourScores", { timeout: 60000 });
  await sleep(1500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(400);
  await shot("03-trace-analysis.png");
});

// 4) The human approval gate (the money shot)
await tryShot("04-approval-gate", async () => {
  await page.evaluate(() => { const s = document.querySelector("#tourScores"); if (s) s.scrollIntoView({ block: "center" }); });
  await sleep(800);
  await shot("04-approval-gate.png");
});

// 5) Experiments — prompt A/B improvement loop
await tryShot("05-experiments", async () => {
  await page.evaluate(() => go("experiments"));
  await sleep(1500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(400);
  await shot("05-experiments.png");
});

// 6) Judge Tour spotlight (in action)
await tryShot("06-judge-tour", async () => {
  await page.evaluate(() => go("dashboard"));
  await sleep(600);
  await page.evaluate(async () => { await startTour(false); await tourStep(4); }); // calibration spotlight
  await sleep(1600);
  await shot("06-judge-tour.png");
  await page.evaluate(() => endTour());
});

// 7) Mobile (responsive)
await tryShot("07-mobile", async () => {
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto(BASE + "/", { waitUntil: "networkidle2", timeout: 60000 });
  await page.waitForFunction(() => document.querySelector("#globalScore")?.textContent.trim() !== "—", { timeout: 45000 });
  await sleep(1500);
  await shot("07-mobile.png");
  await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 2 });
});

// 8) Required-tech proof (/health) — styled terminal card
await tryShot("08-health-proof", async () => {
  const health = await (await fetch(BASE + "/health")).json();
  const pick = (k) => JSON.stringify(health[k]);
  const html = `<!DOCTYPE html><html><head><meta charset=utf-8>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Inter:wght@600;700&display=swap" rel=stylesheet>
  <style>*{margin:0;box-sizing:border-box}body{width:1200px;background:radial-gradient(800px 400px at 15% -10%,rgba(124,58,237,.14),transparent),#0C0F1A;font-family:Inter;padding:54px 60px;color:#e8dfee}
  h1{font-size:26px;font-weight:700;margin-bottom:6px}.s{color:#958da1;font-size:14px;margin-bottom:26px}
  .term{background:#141825;border:1px solid #4a4455;border-radius:14px;overflow:hidden;box-shadow:0 16px 50px rgba(0,0,0,.5)}
  .bar{background:#1F2937;padding:11px 16px;display:flex;gap:8px;align-items:center;border-bottom:1px solid #4a4455}
  .dot{width:12px;height:12px;border-radius:50%}.cmd{margin-left:12px;font:600 13px 'JetBrains Mono';color:#adc6ff}
  pre{padding:24px 26px;font:400 15px/1.7 'JetBrains Mono';color:#ccc3d8;white-space:pre-wrap}
  .k{color:#958da1}.hl{color:#34d399;font-weight:700}.v{color:#adc6ff}
  .legend{margin-top:22px;display:flex;gap:14px}.chip{font:700 13px Inter;padding:8px 14px;border-radius:999px;border:1px solid #4a4455;display:flex;gap:8px;align-items:center}
  </style></head><body>
  <h1>🛡️ Required tech — all invoked at runtime</h1><div class=s>$ curl ${BASE}/health</div>
  <div class=term><div class=bar><span class=dot style="background:#ff5f57"></span><span class=dot style="background:#febc2e"></span><span class=dot style="background:#28c840"></span><span class=cmd>auditlens — /health</span></div>
  <pre>{
  <span class=k>"service"</span>: <span class=v>"auditlens"</span>,
  <span class=k>"model"</span>: <span class=hl>${pick("model")}</span>,                <span class=k>// 🧠 Gemini</span>
  <span class=k>"agent_builder_runtime"</span>: <span class=hl>${pick("agent_builder_runtime")}</span>,        <span class=k>// 🏗️ Google Cloud Agent Builder (Vertex AI Agent Engine)</span>
  <span class=k>"agent_builder_connected"</span>: <span class=hl>${pick("agent_builder_connected")}</span>,
  <span class=k>"agent_builder"</span>: <span class=v>"${(health.stack?.agent_builder || "").replace(/^.*reasoningEngines/, "…/reasoningEngines")}"</span>,
  <span class=k>"partner_transport"</span>: <span class=hl>${pick("partner_transport")}</span>,            <span class=k>// 🔭 Arize Phoenix MCP server</span>
  <span class=k>"partner_mcp_connected"</span>: <span class=hl>${pick("partner_mcp_connected")}</span>,
  <span class=k>"live_calibration"</span>: <span class=v>${pick("live_calibration")}</span>,
  <span class=k>"cached_evaluations"</span>: <span class=v>${pick("cached_evaluations")}</span>
}</pre></div>
  <div class=legend><span class=chip><span class=dot style="background:#d2bbff"></span>Gemini</span><span class=chip><span class=dot style="background:#7c3aed"></span>Agent Builder · Agent Engine</span><span class=chip><span class=dot style="background:#adc6ff"></span>Arize Phoenix MCP</span><span class=chip><span class=dot style="background:#34d399"></span>Cloud Run</span></div>
  </body></html>`;
  await page.setViewport({ width: 1200, height: 760, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: "domcontentloaded" });
  await sleep(1400);
  await shot("08-health-proof.png");
});

await browser.close();
console.log("done →", OUT + "/");
