"use client";
import { fpv, worlds } from "@/content";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";
import { Reveal } from "@/lib/motion/Reveal";
import { Title } from "./Kit";
import s from "./fpv.module.css";

// ───────────────────────── Flight-model pipeline ─────────────────────────
export function Pipeline() {
  const reduce = useReducedMotion();
  const [py, golden, cs] = fpv.pipeline;
  return (
    <section aria-labelledby="pipe-h" className={s.section}>
      <Title id="pipe-h" kicker="Flight model" text="Physics first. Proven, then ported." />
      <div className={s.pipe}>
        <svg viewBox="0 0 960 260" className={s.pipeSvg} role="img" aria-label="PID auto-tuner feeds the Python reference; its outputs become golden vectors; the C# engine must match them.">
          <defs>
            <path id="p1" d="M210 150 H 370" /><path id="p2" d="M590 150 H 750" /><path id="p0" d="M110 60 C 110 100, 110 110, 110 120" />
          </defs>
          {/* tuner */}
          <g transform="translate(40 14)"><rect width="140" height="44" rx="4" className={s.nodeDim} /><text x="70" y="28" textAnchor="middle" className={s.nodeSmall}>PID auto-tuner</text></g>
          <use href="#p0" className={s.wire} />
          {/* nodes */}
          {[[py, 10], [golden, 370], [cs, 750]].map(([n, x]) => {
            const node = n as (typeof fpv.pipeline)[number];
            return (
              <g key={node.id} transform={`translate(${x as number} 120)`}>
                <rect width="200" height="64" rx="4" className={node.id === "golden" ? s.nodeGold : s.node} />
                <text x="100" y="28" textAnchor="middle" className={s.nodeTitle}>{node.step}</text>
                <text x="100" y="48" textAnchor="middle" className={s.nodeFile}>{node.file}</text>
              </g>
            );
          })}
          <use href="#p1" className={s.wire} /><use href="#p2" className={s.wire} />
          {!reduce ? [0, 0.6, 1.2].map((b) => (
            <g key={b}>
              <circle r="4" className={s.packet}><animateMotion dur="1.8s" begin={`${b}s`} repeatCount="indefinite"><mpath href="#p1" /></animateMotion></circle>
              <circle r="4" className={s.packetOk}><animateMotion dur="1.8s" begin={`${b + 0.9}s`} repeatCount="indefinite"><mpath href="#p2" /></animateMotion></circle>
            </g>
          )) : null}
          <text x="830" y="226" textAnchor="middle" className={s.nodeOk}>✓ matches golden</text>
        </svg>
        <ol className={s.pipeList}>
          {fpv.pipeline.map((p, k) => (
            <li key={p.id}><span className={s.idx}>{String(k + 1).padStart(2, "0")}</span><div><b>{p.step}</b><p>{p.body}</p></div></li>
          ))}
          <li><span className={s.idx}>+</span><div><b>PID auto-tuner</b><p>{fpv.tuner}</p></div></li>
        </ol>
      </div>
    </section>
  );
}

// ───────────────────────── Instruments ─────────────────────────
const W = 300, H = 150;

function stepPath(z: number) {
  const wn = 9, pts: string[] = [];
  for (let k = 0; k <= 120; k++) {
    const t = (k / 120) * 1.2;
    const wd = wn * Math.sqrt(1 - z * z);
    const y = 1 - Math.exp(-z * wn * t) * (Math.cos(wd * t) + (z / Math.sqrt(1 - z * z)) * Math.sin(wd * t));
    pts.push(`${(16 + (t / 1.2) * (W - 24)).toFixed(1)},${(H - 20 - y * (H - 60)).toFixed(1)}`);
  }
  return "M" + pts.join(" L");
}

function Pid() {
  const zs = [0.12, 0.28, 0.48, 0.72];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={s.inst} aria-hidden="true">
      <path d={`M16 ${H - 20} H 30 V ${H - 20 - (H - 60)} H ${W - 8}`} className={s.instTarget} />
      {zs.map((z, k) => <path key={z} d={stepPath(z)} className={s.instTrace} style={{ ["--k" as string]: k }} />)}
      <text x={W - 10} y="18" textAnchor="end" className={s.instLabel}>target step vs response</text>
    </svg>
  );
}

function Rates() {
  const { rcRate, superRate } = fpv.rates;
  const rate = (x: number) => (200 * rcRate * x) / Math.max(0.01, 1 - x * superRate);
  const max = rate(1);
  const pts = Array.from({ length: 61 }, (_, k) => { const x = k / 60; return `${(20 + x * (W - 36)).toFixed(1)},${(H - 22 - (rate(x) / max) * (H - 50)).toFixed(1)}`; });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={s.inst} aria-hidden="true">
      <path d={`M20 ${H - 22} H ${W - 12} M20 ${H - 22} V 18`} className={s.instAxis} />
      <path d={"M" + pts.join(" L")} id="rateCurve" className={s.instTraceOn} />
      <circle r="5" className={s.instDot}><animateMotion dur="3s" repeatCount="indefinite" keyPoints="0;1;0" keyTimes="0;0.5;1" calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"><mpath href="#rateCurve" /></animateMotion></circle>
      <text x="24" y="20" className={s.instLabel}>{Math.round(max)}°/s at full stick</text>
      <text x={W - 12} y={H - 6} textAnchor="end" className={s.instLabel}>stick →</text>
    </svg>
  );
}

function Sag() {
  // Illustration: a 6S pack under throttle punches.
  const pts: string[] = [];
  for (let k = 0; k <= 150; k++) {
    const t = k / 150;
    const punch = Math.max(0, Math.sin(t * Math.PI * 5)) ** 3;
    const v = 25.2 - t * 1.6 - punch * 2.4;
    pts.push(`${(16 + t * (W - 28)).toFixed(1)},${(18 + ((25.2 - v) / 5) * (H - 40)).toFixed(1)}`);
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={s.inst} aria-hidden="true">
      <path d={`M16 18 H ${W - 12}`} className={s.instAxis} />
      <path d={"M" + pts.join(" L")} className={s.instTraceAmber} />
      <text x={W - 12} y="14" textAnchor="end" className={s.instLabel}>volts under load (illustration)</text>
    </svg>
  );
}

function Vrs() {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={s.inst} aria-hidden="true">
      <g className={s.vrsDrone}>
        <rect x={W / 2 - 22} y="40" width="44" height="8" rx="2" />
        <rect x={W / 2 - 34} y="36" width="18" height="3" rx="1.5" /><rect x={W / 2 + 16} y="36" width="18" height="3" rx="1.5" />
      </g>
      {[0, 1, 2].map((k) => (
        <g key={k} className={s.vrsRing} style={{ ["--k" as string]: k }}>
          <ellipse cx={W / 2 - 26} cy="70" rx="14" ry="8" /><ellipse cx={W / 2 + 26} cy="70" rx="14" ry="8" />
        </g>
      ))}
      <text x={W / 2} y={H - 8} textAnchor="middle" className={s.instLabel}>descending into its own downwash</text>
    </svg>
  );
}

const instruments = { pid: Pid, rates: Rates, sag: Sag, vrs: Vrs } as const;

export function Features() {
  return (
    <section aria-labelledby="feat-h" className={s.section}>
      <Title id="feat-h" kicker="Flight feel" text="The effects that matter in real flying" />
      <div className={s.cluster}>
        {fpv.features.map((f, k) => {
          const Inst = instruments[f.id as keyof typeof instruments];
          return (
            <Reveal as="article" key={f.id} className={s.panel} variant="scan" delay={k * 120}>
              <header><span className={s.idx}>{`F${k + 1}`}</span><h3>{f.title}</h3></header>
              <Inst />
              <p>{f.body}</p>
            </Reveal>
          );
        })}
      </div>
      <p className={s.hardware}><span className={s.idx}>INPUT</span> {fpv.hardware}</p>
    </section>
  );
}

// ───────────────────────── Maps ─────────────────────────
export function Maps() {
  const { maps } = fpv;
  return (
    <section aria-labelledby="maps-h" className={s.section}>
      <Title id="maps-h" kicker="Content pipeline" text={maps.title} />
      <p className="mt-5 max-w-[62ch] text-[15px] leading-relaxed text-fg/80">{maps.lead}</p>
      <div className={s.gallery}>
        {maps.shots.map((sh, k) => (
          <figure key={sh.src} className={k === 0 ? s.shotBig : s.shot}>
            {/* eslint-disable-next-line @next/next/no-img-element -- static export */}
            <img src={sh.src} alt={sh.alt} width={1280} height={720} loading="lazy" decoding="async" />
          </figure>
        ))}
      </div>
      <ol className={s.voxelSteps}>
        {maps.steps.map((st, k) => <li key={st} style={{ ["--k" as string]: k }}><span className={s.idx}>{String(k + 1).padStart(2, "0")}</span>{st}</li>)}
      </ol>
      <p className="mt-4 max-w-[62ch] text-[14px] text-fg/70">{maps.voxel}</p>
    </section>
  );
}

// ───────────────────────── Status / CTA ─────────────────────────
export function Status() {
  const cta = worlds.fpv.cta;
  return (
    <section aria-labelledby="status-h" className={`${s.section} ${s.status}`}>
      <div>
        <p className={s.statusLine}><span className={s.rec}>●</span> {fpv.status}</p>
        <h2 id="status-h" className="mt-6 font-display text-[clamp(3rem,9vw,8rem)] leading-[0.85] font-semibold uppercase">Arm. Throttle up.</h2>
        <p className="mt-5 max-w-[50ch] text-[14px] leading-relaxed text-fg/75">{fpv.sourceNote}</p>
        <ul className={s.stack}>{fpv.stack.map((t) => <li key={t}>{t}</li>)}</ul>
        <a href={cta.href} target="_blank" rel="noopener noreferrer" className={s.cta}>{cta.label} <span aria-hidden="true">↗</span></a>
      </div>
      <figure className={s.menuShot}>
        {/* eslint-disable-next-line @next/next/no-img-element -- static export */}
        <img src={fpv.menuShot.src} alt={fpv.menuShot.alt} width={1280} height={720} loading="lazy" decoding="async" />
      </figure>
    </section>
  );
}
