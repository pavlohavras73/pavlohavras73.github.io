"use client";
import { useEffect, useRef } from "react";
import { focusPoint, isTouchDevice } from "@/lib/motion/sense";
import s from "./hangar.module.css";

/**
 * The name in Climate Crisis. Letters are INLINE spans (one text block for LCP), each with its own
 * YEAR value: a slow wave runs through them, and letters near the pointer melt toward 2050.
 */
export function Melt({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const h = ref.current;
    if (!h) return;
    // The letters change shape in place (no movement), so this also runs for reduced motion.
    const letters = [...h.querySelectorAll<HTMLSpanElement>("[data-l]")];
    const touch = isTouchDevice();
    let raf = 0, visible = true, lastY = scrollY, speed = 0;
    const cur = letters.map(() => 1979);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(h);
    const t0 = performance.now();
    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      if (!visible) return;
      const time = (t - t0) / 1000;
      // Phones: scrolling melts the whole name, a finger or the tilt melts the letters nearby.
      speed = speed * 0.9 + Math.min(1, Math.abs(scrollY - lastY) / 18) * 0.1;
      lastY = scrollY;
      const fp = focusPoint();
      letters.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        let near = 0;
        if (fp) near = Math.max(0, 1 - Math.hypot(r.left + r.width / 2 - fp.x, r.top + r.height / 2 - fp.y) / (touch ? 200 : 260)) * fp.w;
        const wave = (Math.sin(time * (touch ? 1.6 : 1.1) - i * 0.45) + 1) / 2; // 0..1 travelling wave
        const target = 1979 + (wave * (touch ? 0.5 : 0.35) + near * 0.9 + speed * 1.4) * 71;
        cur[i] += (Math.min(2050, target) - cur[i]) * 0.12;
        el.style.fontVariationSettings = `"YEAR" ${cur[i].toFixed(1)}`;
      });
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); io.disconnect(); };
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
    if (!el) return;
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
