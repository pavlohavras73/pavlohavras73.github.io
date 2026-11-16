"use client";
import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion/useReducedMotion";
import s from "./hangar.module.css";

/**
 * The name in Climate Crisis. Letters are INLINE spans (one text block for LCP), each with its own
 * YEAR value: a slow wave runs through them, and letters near the pointer melt toward 2050.
 */
export function Melt({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const h = ref.current;
    if (!h || prefersReducedMotion()) return;
    const letters = [...h.querySelectorAll<HTMLSpanElement>("[data-l]")];
    let mx = -1e4, my = -1e4, raf = 0;
    const cur = letters.map(() => 1979);
    const move = (e: PointerEvent) => { mx = e.clientX; my = e.clientY; };
    addEventListener("pointermove", move, { passive: true });
    const t0 = performance.now();
    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      const time = (t - t0) / 1000;
      letters.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        const d = Math.hypot(r.left + r.width / 2 - mx, r.top + r.height / 2 - my);
        const near = Math.max(0, 1 - d / 260);
        const wave = (Math.sin(time * 1.1 - i * 0.45) + 1) / 2; // 0..1 travelling wave
        const target = 1979 + (wave * 0.35 + near * 0.9) * 71;
        cur[i] += (Math.min(2050, target) - cur[i]) * 0.12;
        el.style.fontVariationSettings = `"YEAR" ${cur[i].toFixed(1)}`;
      });
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); removeEventListener("pointermove", move); };
  }, []);

  return (
    <h1 ref={ref} className={`${s.melt} ${className ?? ""}`} aria-label={text}>
      {[...text].map((c, i) => (
        <span key={i} data-l aria-hidden="true">{c}</span>
      ))}
    </h1>
  );
}

/** A fixed slot that flips through phrases (screen readers get the full sentence elsewhere). */
export function Cycler({ items, className }: { items: string[]; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let i = 0;
    const id = window.setInterval(() => {
      i = (i + 1) % items.length;
      el.dataset.flip = "out";
      window.setTimeout(() => { el.textContent = items[i]; el.dataset.flip = "in"; }, 260);
    }, 2200);
    return () => clearInterval(id);
  }, [items]);
  return <span ref={ref} className={`${s.cycler} ${className ?? ""}`} aria-hidden="true" data-flip="in">{items[0]}</span>;
}

/** Spinning sticker that points down to the doors. */
export function Badge({ href, text }: { href: string; text: string }) {
  const ring = `${text} · ${text} · `;
  return (
    <a href={href} className={s.badge} aria-label={text}>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <defs><path id="badge-circle" d="M60 60 m-46 0 a46 46 0 1 1 92 0 a46 46 0 1 1 -92 0" /></defs>
        <text><textPath href="#badge-circle" textLength="286" lengthAdjust="spacing">{ring.toUpperCase()}</textPath></text>
      </svg>
      <span aria-hidden="true">↓</span>
    </a>
  );
}
