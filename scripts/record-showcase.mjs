// Usage: (serve out/ on :4173) node scripts/record-showcase.mjs <outdir> [slug,slug]
// Smooth showcase recordings: real GPU (Intel ANGLE/GL), CDP screencast JPEG frames with timestamps → CFR 30fps mp4.
import { mkdir, writeFile, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { chromium } from "/home/rainar/pavlohavras73.github.io/node_modules/playwright-core/index.mjs";
const OUT = process.argv[2], BASE = "http://127.0.0.1:4173", W = 1280, H = 800, DUR = 7.5;
const b = await chromium.launch({ executablePath: "/usr/bin/chromium", args: ["--use-gl=angle", "--use-angle=gl", "--enable-gpu", "--ignore-gpu-blocklist", "--force-device-scale-factor=1"] });
for (const slug of (process.argv[3] ? process.argv[3].split(",") : ["nexa-ai", "aeroflux-fpv", "quant-terminal", "automind", "botforge", "voxdesk", "aerorace"])) {
  const dir = `${OUT}/f-${slug}`; await rm(dir, { recursive: true, force: true }); await mkdir(dir, { recursive: true });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  await p.goto(`${BASE}/sites/${slug}/`, { waitUntil: "networkidle" }).catch(() => {});
  await p.mouse.move(640, 400);
  await p.waitForTimeout(2500);
  const cdp = await p.context().newCDPSession(p);
  const frames = [];
  cdp.on("Page.screencastFrame", async (f) => { frames.push({ t: f.metadata.timestamp, d: f.data }); cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {}); });
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: W, maxHeight: H, everyNthFrame: 1 });
  // eased scroll driven by rAF inside the page, mouse drifting in parallel
  const scrollDone = p.evaluate((dur) => new Promise(res => {
    document.documentElement.style.scrollBehavior = "auto"; const Hs = Math.min(document.documentElement.scrollHeight - innerHeight, 2600), t0 = performance.now(), hold = 600;
    const f = (t) => { const k = Math.min(1, Math.max(0, (t - t0 - hold) / (dur - hold * 2))); window.scrollTo(0, Hs * (1 - Math.cos(k * Math.PI)) / 2); t - t0 < dur ? requestAnimationFrame(f) : res(Hs); };
    requestAnimationFrame(f);
  }), DUR * 1000 + 300);
  const tm = Date.now();
  while (Date.now() - tm < DUR * 1000) { const i = (Date.now() - tm) / 1000; await p.mouse.move(640 + Math.sin(i * 1.1) * 330, 400 + Math.cos(i * 0.7) * 170); await p.waitForTimeout(33); }
  const Hs = await scrollDone;
  await p.waitForTimeout(300);
  await cdp.send("Page.stopScreencast");
  await p.close();
  // write frames + concat list with real durations, then resample to 30 fps CFR
  const t0 = frames[0].t; let list = "";
  for (let i = 0; i < frames.length; i++) {
    const fn = `${String(i).padStart(5, "0")}.jpg`; await writeFile(`${dir}/${fn}`, Buffer.from(frames[i].d, "base64"));
    const d = i + 1 < frames.length ? frames[i + 1].t - frames[i].t : 1 / 30;
    list += `file '${fn}'\nduration ${d.toFixed(4)}\n`;
  }
  await writeFile(`${dir}/list.txt`, list);
  const span = frames.at(-1).t - t0;
  execFileSync("ffmpeg", ["-v", "error", "-y", "-f", "concat", "-i", `${dir}/list.txt`, "-vf", `fps=30,scale=${W}:${H}:flags=lanczos,format=yuv420p`, "-t", String(DUR), "-c:v", "libx264", "-preset", "slow", "-crf", "24", "-profile:v", "high", "-movflags", "+faststart", "-an", `${OUT}/${slug}.mp4`]);
  console.log(slug, "frames", frames.length, "span", span.toFixed(2) + "s", "avg fps", (frames.length / span).toFixed(1), "H", Hs);
}
await b.close();
