"use client";
import dynamic from "next/dynamic";
import { ViewTransition, useEffect, useRef, useState } from "react";
import { jarvis, site, worlds } from "@/content";
import { Stage } from "@/lib/three/Stage";
import { portalName } from "@/lib/portal";
import { prefersReducedMotion } from "@/lib/motion/useReducedMotion";
import { Magnetic } from "@/lib/motion/Magnetic";
import { TLink } from "@/components/shell/TLink";
import { pulse } from "./pulse";
import s from "./jarvis.module.css";

const OrbScene = dynamic(() => import("./three/OrbScene"), { ssr: false });
const names = portalName("jarvis");
const fmt = (n: number) => n.toLocaleString("en-US");

/** Run `fn` once when `ref` scrolls into view. */
function useInView(ref: React.RefObject<Element | null>, fn: () => void | (() => void), threshold = 0.35) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let cleanup: void | (() => void);
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); cleanup = fn(); } }, { threshold });
    io.observe(el);
    return () => { io.disconnect(); if (cleanup) cleanup(); };
    // fn is stable per call site
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, threshold]);
}

// ───────────────────────── Hero ─────────────────────────
export function Hero() {
  return (
    <ViewTransition name={names.frame} share="morph" default="none">
      <section className={s.hero} aria-labelledby="jv-h">
        <Stage className={s.orb} Scene={OrbScene} camera={{ position: [0, 0, 4.2], fov: 38 }} poster={<div className={s.orbPoster} />} />
        <div className={s.heroCopy}>
          <p className={s.kicker}>{jarvis.hero.kicker}</p>
          <ViewTransition name={names.title} share="morph" default="none">
            <h1 id="jv-h" className="font-display text-[clamp(4rem,14vw,12rem)] leading-[0.85] font-light tracking-[-0.04em]">{worlds.jarvis.title}</h1>
          </ViewTransition>
          <p className="mt-6 max-w-[44ch] text-lg leading-relaxed text-fg/80">{jarvis.hero.lead}</p>
          <dl className={s.stats}>
            {jarvis.stats.map((st) => (
              <div key={st.label}><dd>{fmt(st.value)}</dd><dt>{st.label}</dt></div>
            ))}
          </dl>
          <div className="mt-10"><Magnetic><TLink href="#contact" className={s.cta}>{worlds.jarvis.cta.label} <span aria-hidden="true">→</span></TLink></Magnetic></div>
        </div>
      </section>
    </ViewTransition>
  );
}

// ───────────────────────── Architecture ─────────────────────────
export function Architecture() {
  const nodes = jarvis.architecture;
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);
  const box = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!auto || prefersReducedMotion()) return;
    const id = window.setInterval(() => { setActive((a) => (a + 1) % nodes.length); pulse.kick(0.5); }, 2600);
    return () => clearInterval(id);
  }, [auto, nodes.length]);

  const pick = (i: number) => { setAuto(false); setActive(i); pulse.kick(0.8); };
  const n = nodes[active];

  return (
    <section ref={box} aria-labelledby="arch-h" className={s.section}>
      <p className={s.kicker}>How it works</p>
      <h2 id="arch-h" className={s.h2}>One message, all the way down.</h2>
      <div className={s.arch}>
        <ol className={s.chain}>
          {nodes.map((nd, i) => (
            <li key={nd.id}>
              <button type="button" className={s.node} aria-pressed={i === active} onClick={() => pick(i)} onMouseEnter={() => pick(i)}>
                <span className={s.nodeIdx}>{String(i + 1).padStart(2, "0")}</span>
                <span>{nd.title}</span>
              </button>
            </li>
          ))}
        </ol>
        <div className={s.detail} aria-live="polite">
          <p className={s.detailIdx}>{String(active + 1).padStart(2, "0")} / {String(nodes.length).padStart(2, "0")}</p>
          <p className="mt-4 font-display text-[clamp(2rem,4vw,3.4rem)] leading-[1.02] font-light">{n.title}</p>
          <p className="mt-4 max-w-[40ch] text-lg leading-relaxed text-fg/75">{n.body}</p>
        </div>
      </div>
    </section>
  );
}

// ───────────────────────── Example exchange ─────────────────────────
export function Exchange() {
  const ref = useRef<HTMLElement>(null);
  const msgs = jarvis.example;
  const [shown, setShown] = useState(0);
  const [typing, setTyping] = useState(false);

  useInView(ref, () => {
    if (prefersReducedMotion()) { setShown(msgs.length); return; }
    const timers: number[] = [];
    let t = 300;
    msgs.forEach((m, i) => {
      if (m.from === "jarvis") { timers.push(window.setTimeout(() => setTyping(true), t)); t += 900; }
      timers.push(window.setTimeout(() => { setTyping(false); setShown(i + 1); pulse.kick(m.from === "jarvis" ? 1 : 0.4); }, t));
      t += 1100;
    });
    return () => timers.forEach(clearTimeout);
  });

  return (
    <section ref={ref} aria-labelledby="ex-h" className={`${s.section} ${s.exchange}`}>
      <div>
        <p className={s.kicker}>Safe by construction</p>
        <h2 id="ex-h" className={s.h2}>It does the work. You keep the keys.</h2>
        <p className="mt-6 max-w-[44ch] text-lg leading-relaxed text-fg/75">
          Harmless things happen on their own. Anything that deletes, moves, restarts or sends in my name stops and asks for a tap. Secrets never reach the model.
        </p>
      </div>
      <figure className={s.phone}>
        <div className={s.chatHead}><i className={s.miniOrb} aria-hidden="true" /><b>Jarvis</b><span>{typing ? "typing…" : "online"}</span></div>
        <ol className={s.chat} aria-label="Example exchange">
          {msgs.slice(0, shown).map((m, i) => (
            <li key={i} className={m.from === "me" ? s.me : s.bot}>
              {"voice" in m && m.voice ? <span className={s.voice} aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></span> : null}
              <span>{m.text}</span>
              {"sub" in m && m.sub ? <small>{m.sub}</small> : null}
              {"guard" in m && m.guard ? (
                <span className={s.guard}>
                  <code>{m.guard}</code>
                  <span className={s.guardBtns}><b>Allow</b><b>Deny</b></span>
                </span>
              ) : null}
            </li>
          ))}
          {typing ? <li className={`${s.bot} ${s.typing}`} aria-hidden="true"><i /><i /><i /></li> : null}
        </ol>
        <figcaption>{jarvis.exampleNote}</figcaption>
      </figure>
    </section>
  );
}

// ───────────────────────── A day: 24 h dial ─────────────────────────
function useDuisburgMinutes() {
  const [m, setM] = useState<number | null>(null);
  useEffect(() => {
    const f = new Intl.DateTimeFormat("en-GB", { timeZone: site.location.timeZone, hour: "2-digit", minute: "2-digit", hour12: false });
    const tick = () => { const [h, mm] = f.format(new Date()).split(":").map(Number); setM(h * 60 + mm); };
    tick();
    const id = window.setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);
  return m;
}

export function Day() {
  const now = useDuisburgMinutes();
  const timed = jarvis.automations.filter((a) => a.at).flatMap((a) => a.at!.map((t) => ({ ...a, t })));
  const intervals = jarvis.automations.filter((a) => a.kind === "interval");
  const hooks = jarvis.automations.filter((a) => a.kind === "hook");
  const R = 150, C = 180;
  const ang = (min: number) => (min / 1440) * Math.PI * 2 - Math.PI / 2;
  const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };

  return (
    <section aria-labelledby="day-h" className={s.section}>
      <p className={s.kicker}>A day of Jarvis</p>
      <h2 id="day-h" className={s.h2}>21 automations, on a clock.</h2>
      <div className={s.day}>
        <svg viewBox="0 0 360 400" className={s.dial} role="img" aria-label={`Scheduled runs: ${timed.map((a) => `${a.t} ${a.name}`).join(", ")}`}>
          <circle cx={C} cy={C} r={R} className={s.dialRing} />
          {Array.from({ length: 24 }, (_, h) => {
            const a = ang(h * 60), r1 = h % 6 === 0 ? R - 14 : R - 7;
            return <line key={h} x1={C + Math.cos(a) * r1} y1={C + Math.sin(a) * r1} x2={C + Math.cos(a) * R} y2={C + Math.sin(a) * R} className={s.tick} />;
          })}
          {[0, 6, 12, 18].map((h) => { const a = ang(h * 60); return <text key={h} x={C + Math.cos(a) * (R - 30)} y={C + Math.sin(a) * (R - 30) + 4} textAnchor="middle" className={s.hourLabel}>{String(h).padStart(2, "0")}</text>; })}
          {timed.map((a, i) => {
            const an = ang(toMin(a.t)), x = C + Math.cos(an) * R, y = C + Math.sin(an) * R;
            return <circle key={i} cx={x} cy={y} r={a.kind === "weekly" ? 5 : 6.5} className={a.kind === "weekly" ? s.markWeek : s.mark} />;
          })}
          {now !== null ? (
            <g>
              <line x1={C} y1={C} x2={C + Math.cos(ang(now)) * (R - 20)} y2={C + Math.sin(ang(now)) * (R - 20)} className={s.hand} />
              <circle cx={C} cy={C} r="4" className={s.handDot} />
              <text x={C} y={C + R + 40} textAnchor="middle" className={s.nowLabel}>hand: Duisburg time now</text>
            </g>
          ) : null}
        </svg>
        <div className={s.dayLists}>
          <ol className={s.sched}>
            {timed.sort((a, b) => toMin(a.t) - toMin(b.t)).map((a, i) => (
              <li key={i}><time>{a.t}</time><span>{a.name}</span>{a.days ? <em>{a.days}</em> : null}</li>
            ))}
          </ol>
          <div className={s.always}>
            <p className={s.listHead}>Always on</p>
            <ul>{intervals.map((a) => <li key={a.name}><i aria-hidden="true" style={{ animationDuration: `${1.2 + intervals.indexOf(a) * 0.4}s` }} />{a.name}<em>every {a.every}</em></li>)}</ul>
            <p className={s.listHead}>On call</p>
            <ul className={s.hooks}>{hooks.map((a) => <li key={a.name}>{a.name}</li>)}</ul>
          </div>
        </div>
      </div>
    </section>
  );
}

// ───────────────────────── Second brain ─────────────────────────
const GROUP_COLORS = ["#8cf5d2", "#f2f0e6", "#e7c79a", "#7fb7a8", "#c9d6e3", "#9fd3c7", "#d9b8a3", "#a9c4b0", "#5d6a72"];

export function Brain() {
  const box = useRef<HTMLDivElement>(null);
  const [counts, setCounts] = useState<{ n: number; e: number } | null>(null);

  useInView(box, () => {
    const el = box.current!;
    let stop = false, raf = 0;
    const cv = document.createElement("canvas");
    el.appendChild(cv);
    const ctx = cv.getContext("2d")!;
    const reduce = prefersReducedMotion();
    let W = 0, H = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => { W = el.clientWidth; H = el.clientHeight; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + "px"; cv.style.height = H + "px"; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    const ro = new ResizeObserver(resize); ro.observe(el); resize();
    let mx = -1e9, my = -1e9;
    const move = (e: PointerEvent) => { const r = el.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; };
    el.addEventListener("pointermove", move);

    (async () => {
      const [{ forceSimulation, forceLink, forceManyBody, forceX, forceY, forceCollide }, data] = await Promise.all([
        import("d3-force"),
        fetch("/data/brain.json").then((r) => r.json() as Promise<{ g: number[]; e: [number, number][] }>),
      ]);
      if (stop) return;
      setCounts({ n: data.g.length, e: data.e.length });
      const deg = new Array(data.g.length).fill(0);
      data.e.forEach(([a, b]) => { deg[a]++; deg[b]++; });
      type N = { i: number; g: number; d: number; r: number; x?: number; y?: number };
      const nodes: N[] = data.g.map((g, i) => ({ i, g, d: deg[i], r: 1.4 + Math.sqrt(deg[i]) * 1.3 }));
      const links = data.e.map(([s0, t]) => ({ source: s0, target: t }));
      const sim = forceSimulation(nodes as never)
        .force("link", forceLink(links).distance(16).strength(0.55))
        .force("charge", forceManyBody().strength(-7).distanceMax(150))
        .force("x", forceX(0).strength(0.05)).force("y", forceY(0).strength(0.07))
        .force("collide", forceCollide((d: N) => d.r + 0.6))
        .alphaDecay(reduce ? 0.2 : 0.012);
      if (reduce) sim.tick(300);
      let scale = 1, t = 0;
      const draw = () => {
        if (stop) return;
        raf = requestAnimationFrame(draw);
        t += reduce ? 0 : 0.0025;
        let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
        for (const n of nodes) { x0 = Math.min(x0, n.x!); x1 = Math.max(x1, n.x!); y0 = Math.min(y0, n.y!); y1 = Math.max(y1, n.y!); }
        scale += (Math.min(W / (x1 - x0 + 40), H / (y1 - y0 + 40)) - scale) * 0.05;
        const cs = Math.cos(t), sn = Math.sin(t);
        const P = (n: N) => [W / 2 + (n.x! * cs - n.y! * sn) * scale, H / 2 + (n.x! * sn + n.y! * cs) * scale];
        ctx.clearRect(0, 0, W, H);
        ctx.lineWidth = 0.6; ctx.strokeStyle = "rgba(221,230,238,0.10)"; ctx.beginPath();
        for (const l of links as unknown as { source: N; target: N }[]) { const [a, b] = P(l.source), [c, d] = P(l.target); ctx.moveTo(a, b); ctx.lineTo(c, d); }
        ctx.stroke();
        for (const n of nodes) {
          const [x, y] = P(n);
          const near = Math.hypot(x - mx, y - my) < 50;
          ctx.globalAlpha = n.d ? 0.95 : 0.35;
          ctx.fillStyle = GROUP_COLORS[n.g] ?? GROUP_COLORS[8];
          ctx.beginPath(); ctx.arc(x, y, n.r * Math.max(0.7, scale) * (near ? 1.9 : 1), 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
      };
      draw();
    })();

    return () => { stop = true; cancelAnimationFrame(raf); ro.disconnect(); el.removeEventListener("pointermove", move); cv.remove(); };
  }, 0.1);

  const [notes, links] = [jarvis.stats[1], jarvis.stats[2]];
  return (
    <section aria-labelledby="brain-h" className={`${s.section} ${s.brain}`}>
      <div>
        <p className={s.kicker}>Memory</p>
        <h2 id="brain-h" className={s.h2}>A second brain it can read.</h2>
        <p className="mt-6 max-w-[42ch] text-lg leading-relaxed text-fg/75">
          My Obsidian vault is its long-term memory: {fmt(notes.value)} notes, {fmt(links.value)} links between them. It looks things up there before it answers, and writes down what it learns.
        </p>
        <p className={s.small}>Every dot is a real note, every line a real link. Titles are left out on purpose.{counts ? ` Graph: ${fmt(counts.n)} uniquely named notes, ${fmt(counts.e)} links.` : ""}</p>
      </div>
      <div ref={box} className={s.graph} role="img" aria-label={`Knowledge graph of ${fmt(notes.value)} notes and ${fmt(links.value)} links`} />
    </section>
  );
}

// ───────────────────────── Offer ─────────────────────────
export function Offer() {
  return (
    <section aria-labelledby="offer-h" className={s.section}>
      <p className={s.kicker}>For you</p>
      <h2 id="offer-h" className={s.h2}>{jarvis.pitch}</h2>
      <ol className={s.offer}>
        {jarvis.offer.map((o, i) => (
          <li key={o.title}><span className={s.nodeIdx}>{String(i + 1).padStart(2, "0")}</span><h3>{o.title}</h3><p>{o.body}</p></li>
        ))}
      </ol>
    </section>
  );
}
