"use client";
import { useEffect, useRef, useState } from "react";
import { classLabel, drones, fpv, isTodo } from "@/content";
import { Stage } from "@/lib/three/Stage";
import { prefersReducedMotion } from "@/lib/motion/useReducedMotion";
import { DroneScene } from "./scenes";
import { droneSel } from "./droneSel";
import s from "./fpv.module.css";

const HOLD = 5200;
const maxTwr = Math.max(...drones.map((d) => d.twr));

function Num({ value, dec = 0 }: { value: number; dec?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const from = useRef(value);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
    if (prefersReducedMotion()) { el.textContent = fmt(value); from.current = value; return; }
    const a = from.current, t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / 800), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(a + (value - a) * e);
      if (p < 1) raf = requestAnimationFrame(step); else from.current = value;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, dec]);
  return <span ref={ref}>{value.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec })}</span>;
}

/** Datasheet + 3D carousel of the eight modelled drones. */
export function Drones() {
  const [i, setI] = useState(0);
  const [auto, setAuto] = useState(true);
  const box = useRef<HTMLElement>(null);
  const d = drones[i];

  useEffect(() => { droneSel.index = i; }, [i]);
  useEffect(() => { droneSel.reduce = prefersReducedMotion(); }, []);
  useEffect(() => {
    if (!auto || prefersReducedMotion()) return;
    let visible = false;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    if (box.current) io.observe(box.current);
    const id = window.setInterval(() => { if (visible && !droneSel.hold) setI((x) => (x + 1) % drones.length); }, HOLD);
    return () => { clearInterval(id); io.disconnect(); };
  }, [auto]);

  const pick = (k: number) => { setAuto(false); setI(k); };
  const motor = isTodo(d.motor) ? null : d.motor;

  return (
    <section ref={box} aria-labelledby="drones-h" className={s.drones}>
      <div className={s.dronesStage}>
        <Stage className="absolute inset-0" Scene={DroneScene} camera={{ position: [0, 0.85, 4.4], fov: 32 }} poster={<div className={s.dronePoster} />} />
        <p className={s.dragHint} aria-hidden="true">← drag to turn →</p>
      </div>
      <div className={s.sheet}>
        <p className={s.kicker}>Fleet · {drones.length} drones</p>
        <h2 id="drones-h" className="mt-3 font-display text-[clamp(2.4rem,5vw,4.6rem)] leading-[0.9] font-semibold uppercase">From a 22 g whoop to a 1.1 kg long-range</h2>
        <p className="mt-4 max-w-[52ch] text-[14px] leading-relaxed text-fg/75">{fpv.modelling}</p>

        <div className={s.card} aria-live="polite">
          <div className={s.cardTop}>
            <span>{classLabel[d.cls]}</span>
            <span>{d.maker ? "Manufacturer data" : "Reference build"} · {String(i + 1).padStart(2, "0")}/{drones.length}</span>
          </div>
          <h3 className="mt-2 font-display text-3xl font-semibold uppercase">{d.name}</h3>
          <dl className={s.specs}>
            <div><dt>Mass</dt><dd><Num value={d.massG} dec={d.massG < 100 ? 1 : 0} /> <small>g</small></dd></div>
            <div><dt>Thrust / weight</dt><dd><Num value={d.twr} dec={1} /></dd></div>
            <div><dt>Motor KV</dt><dd><Num value={d.kv} /></dd></div>
            <div><dt>Battery</dt><dd>{d.cells}S · <Num value={d.mah} /> <small>mAh</small></dd></div>
            <div><dt>Prop</dt><dd><Num value={d.propMm} /> <small>mm</small></dd></div>
            <div><dt>Motor spin-up</dt><dd><Num value={d.spinupMs} /> <small>ms</small></dd></div>
            {motor ? <div><dt>Motor</dt><dd>{motor}</dd></div> : null}
          </dl>
          <div className={s.twrBar} aria-hidden="true"><i style={{ transform: `scaleX(${d.twr / maxTwr})` }} /></div>
        </div>

        <div className={s.picker} role="group" aria-label="Choose a drone">
          {drones.map((dr, k) => (
            <button key={dr.id} type="button" aria-pressed={k === i} onClick={() => pick(k)} className={s.pick}>
              <span>{String(k + 1).padStart(2, "0")}</span> {dr.name}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
