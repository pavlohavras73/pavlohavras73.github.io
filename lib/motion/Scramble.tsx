"use client";
import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "./useReducedMotion";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/<>_";

/**
 * Text that decodes from random glyphs into the final string when it enters the viewport
 * (or when `trigger` changes). The real text is always in the DOM for screen readers.
 */
export function Scramble({ text, className, duration = 700, trigger }: { text: string; className?: string; duration?: number; trigger?: unknown }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let raf = 0;
    const run = () => {
      const t0 = performance.now();
      const step = (t: number) => {
        const p = Math.min(1, (t - t0) / duration);
        const done = Math.floor(p * text.length);
        let out = text.slice(0, done);
        for (let i = done; i < text.length; i++) out += text[i] === " " ? " " : GLYPHS[(Math.random() * GLYPHS.length) | 0];
        el.textContent = out;
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { run(); io.disconnect(); } });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); el.textContent = text; };
  }, [text, duration, trigger]);

  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span ref={ref} aria-hidden="true">{text}</span>
    </span>
  );
}
