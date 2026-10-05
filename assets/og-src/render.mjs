// Renders assets/og.png (en) and assets/og-ko.png (ko) from template.html with headless Chrome.
// Usage: node assets/og-src/render.mjs [outDir]   (default outDir: assets/)
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(process.argv[2] || path.join(here, ".."));
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const port = 9400 + Math.floor(Math.random() * 400);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "og-render-"));

const server = http.createServer((req, res) => {
  res.setHeader("content-type", "text/html; charset=utf-8");
  res.end(fs.readFileSync(path.join(here, "template.html")));
}).listen(0, "127.0.0.1");
await new Promise((r) => server.once("listening", r));
const base = `http://127.0.0.1:${server.address().port}/`;

const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
  "--no-first-run", "--hide-scrollbars", "--force-device-scale-factor=1", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await sleep(2500);
const tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
const ws = new WebSocket(tabs.find((t) => t.type === "page").webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });

await send("Emulation.setDeviceMetricsOverride", { width: 1200, height: 630, deviceScaleFactor: 1, mobile: false });
for (const [lang, file] of [["en", "og.png"], ["ko", "og-ko.png"]]) {
  await send("Page.navigate", { url: `${base}?lang=${lang}` });
  await sleep(1500);
  await send("Runtime.evaluate", { expression: "document.fonts.ready.then(() => document.fonts.load('800 80px \"Pretendard Variable\"', '할 일은 One'))", awaitPromise: true });
  await sleep(1000);
  const shot = await send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: 1200, height: 630, scale: 1 } });
  const buf = Buffer.from(shot.data, "base64");
  fs.writeFileSync(path.join(outDir, file), buf);
  console.log(`${file}: ${buf.length} bytes`);
}
ws.close(); server.close();
chrome.kill("SIGINT");
await sleep(800);
if (chrome.exitCode === null) chrome.kill("SIGTERM");
fs.rmSync(profile, { recursive: true, force: true });
process.exit(0);
