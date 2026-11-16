// Screenshots of the static export at 1440 / 768 / 390 px, plus console errors and overflow checks.
//   npx next build && node scripts/shots.mjs [route ...] [--out dir] [--reduced]
// Serves ./out on a local port with a tiny static server (no dependencies).
import { createServer } from "node:http";
import { readFile, stat, mkdir } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { chromium } from "playwright-core";

const args = process.argv.slice(2);
const outIdx = args.indexOf("--out");
const shotsDir = outIdx >= 0 ? args[outIdx + 1] : "shots";
const reduced = args.includes("--reduced");
const routes = args.filter((a, i) => !a.startsWith("--") && (outIdx < 0 || i !== outIdx + 1));
const ROUTES = routes.length ? routes : ["/", "/lobby/", "/fpv/", "/jarvis/", "/web/"];
const WIDTHS = [1440, 768, 390];
const BROWSER = process.env.CHROME || "/usr/bin/chromium";

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".woff2": "font/woff2", ".glb": "model/gltf-binary", ".txt": "text/plain", ".mp4": "video/mp4", ".webm": "video/webm" };
const root = "out";
const server = createServer(async (req, res) => {
  let p = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname));
  let f = join(root, p);
  try {
    if ((await stat(f)).isDirectory()) f = join(f, "index.html");
    res.writeHead(200, { "Content-Type": TYPES[extname(f)] || "application/octet-stream" });
    res.end(await readFile(f));
  } catch {
    res.writeHead(404); res.end("404");
  }
}).listen(0);
const base = `http://127.0.0.1:${server.address().port}`;

await mkdir(shotsDir, { recursive: true });
const browser = await chromium.launch({ executablePath: BROWSER, args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
let problems = 0;
for (const route of ROUTES) {
  for (const w of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, deviceScaleFactor: 1, reducedMotion: reduced ? "reduce" : "no-preference" });
    const page = await ctx.newPage();
    const errors = [];
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(base + route, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    const slug = route.replace(/^\/|\/$/g, "").replace(/\//g, "_") || "home";
    const name = `${shotsDir}/${slug}_${w}${reduced ? "-rm" : ""}.png`;
    await page.screenshot({ path: name, fullPage: true });
    const flag = errors.length || overflow > 0;
    if (flag) problems++;
    console.log(`${flag ? "!!" : "ok"} ${route} @${w}  overflow=${overflow}px  errors=${errors.length}${errors.length ? "\n   " + errors.slice(0, 5).join("\n   ") : ""}`);
    await ctx.close();
  }
}
await browser.close();
server.close();
process.exit(problems ? 1 : 0);
