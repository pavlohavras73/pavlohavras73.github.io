"use client";
import { ViewTransition, useEffect, useRef } from "react";
import { fpv, worlds } from "@/content";
import { Stage } from "@/lib/three/Stage";
import { portalName } from "@/lib/portal";
import { ScrollTrigger } from "@/lib/motion/gsap";
import { useScrollVelocity } from "@/lib/motion/useScrollVelocity";
import { TiltChip } from "@/components/shell/TiltChip";
import { prefersReducedMotion } from "@/lib/motion/useReducedMotion";
import { TerrainScene } from "./scenes";
import { flight } from "./flight";
import s from "./fpv.module.css";

const names = portalName("fpv");
const pad = (n: number, w: number) => String(Math.max(0, Math.round(n))).padStart(w, "0");

/** The goggle OSD: values come from the flight store, written straight into the DOM every frame. */
function Osd() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const q = (k: string) => root.querySelector<HTMLElement>(`[data-k="${k}"]`)!;
    const el = { spd: q("spd"), alt: q("alt"), thr: q("thr"), thrBar: q("thrBar"), v: q("v"), time: q("time"), ladder: q("ladder"), roll: q("roll") };
    let raf = 0;
    const tick = () => {
      el.spd.textContent = pad(flight.speed, 3);
      el.alt.textContent = pad(flight.alt, 3);
      el.thr.textContent = pad(flight.throttle * 100, 2);
      el.thrBar.style.transform = `scaleY(${flight.throttle})`;
      el.v.textContent = flight.volts.toFixed(1);
      const t = flight.time;
      el.time.textContent = `${pad(t / 60, 2)}:${pad(t % 60, 2)}`;
      const deg = (flight.roll * 180) / Math.PI;
      el.ladder.style.transform = `translate(-50%, calc(-50% + ${flight.pitch * 260}px)) rotate(${-deg}deg)`;
      el.roll.textContent = `${deg >= 0 ? "R" : "L"}${pad(Math.abs(deg), 2)}°`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={ref} className={s.osd} aria-hidden="true">
      <i className={s.cornerTL} /><i className={s.cornerTR} /><i className={s.cornerBL} /><i className={s.cornerBR} />
      <div className={s.ladder} data-k="ladder">
        {[-20, -10, 0, 10, 20].map((d) => (
          <div key={d} className={d === 0 ? s.horizon : s.rung} style={{ top: `${50 - d * 2.2}%` }}>
            {d !== 0 ? <><span>{Math.abs(d)}</span><span>{Math.abs(d)}</span></> : null}
          </div>
        ))}
      </div>
      <div className={s.cross} />
      <div className={s.osdL}>
        <div className={s.thrTrack}><i data-k="thrBar" /></div>
        <p>THR <b data-k="thr">20</b>%</p>
        <p className={s.dim}>ACRO</p>
      </div>
      <div className={s.osdR}>
        <p className={s.big}><b data-k="spd">000</b></p>
        <p className={s.dim}>KM/H</p>
        <p className={s.mid}><b data-k="alt">000</b> M</p>
        <p className={s.dim}>ALT</p>
        <p className={s.mid}><b data-k="v">25.2</b>V</p>
        <p className={s.dim}>6S</p>
      </div>
      <ol className={s.boot}>
        {["SYS CHECK ........ OK", "RADIO · RADIOMASTER POCKET", "BATTERY · 6S 25.2V", "MODE · ACRO", "ARMED"].map((l, i) => (
          <li key={l} style={{ ["--i" as string]: i }}>{l}</li>
        ))}
      </ol>
      <div className={s.osdTop}><span className={s.rec}>● REC</span><b data-k="time">00:00</b><span data-k="roll">R00°</span></div>
    </div>
  );
}

/** Pinned first-person flight over contour-line terrain, with the title riding on the OSD. */
export function Hero() {
  const track = useRef<HTMLElement>(null);
  const vel = useScrollVelocity();

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    if (prefersReducedMotion()) { flight.progress = 0.3; return; }
    const st = ScrollTrigger.create({ trigger: el, start: "top top", end: "bottom bottom", onUpdate: (x) => { flight.progress = x.progress; } });
    let raf = 0;
    const loop = () => { flight.scrollV = vel.current; raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => { st.kill(); cancelAnimationFrame(raf); };
  }, [vel]);

  return (
    <section ref={track} className={s.heroTrack} aria-labelledby="fpv-h">
      <ViewTransition name={names.frame} share="morph" default="none">
        <div className={s.heroPin}>
          <Stage
            className="absolute inset-0"
            Scene={TerrainScene}
            camera={{ position: [0, 30, 0], fov: 72 }}
            poster={<div className={s.heroPoster} />}
          />
          <Osd />
          <div className={s.heroCopy}>
            <p className={s.kicker}>{fpv.hero.kicker}</p>
            <ViewTransition name={names.title} share="morph" default="none">
              <h1 id="fpv-h" className={s.title} data-text={worlds.fpv.title}>
                {worlds.fpv.title}
              </h1>
            </ViewTransition>
            <p className="mt-5 max-w-[46ch] text-[15px] leading-relaxed text-fg/85">{fpv.hero.lead}</p>
            <p className={s.hint}>{fpv.hero.hint} <span className={s.hintPointer}>{fpv.hero.hintPointer}</span></p>
            <TiltChip label="Tilt phone to fly" className="mt-4" />
          </div>
        </div>
      </ViewTransition>
    </section>
  );
}
