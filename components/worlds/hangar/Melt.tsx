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
    // Weak machines (friend's laptop lagged): no idle wave, only pointer/scroll melt.
    const weak = (navigator.hardwareConcurrency || 8) <= 4 || ("deviceMemory" in navigator && (navigator as { deviceMemory?: number }).deviceMemory! <= 4);
    let raf = 0, visible = true, lastY = scrollY, speed = 0, lastT = 0, slow = 0, idleWave = !weak;
    const cur = letters.map(() => 1979);
    const shown = letters.map(() => 1979);
    // Letter centres in PAGE coordinates, measured once (and on resize/font load) — reading
    // getBoundingClientRect for every letter after writing styles forced a layout per letter per frame.
    let centres: { x: number; y: number }[] = [];
    const measure = () => {
      // Fix each letter's box at its resting width: the YEAR axis changes glyph widths, which made
      // the neighbours shift sideways ("the letters twitch").
      letters.forEach((el) => { el.style.width = ""; el.style.fontVariationSettings = `"YEAR" 1979`; });
      centres = letters.map((el) => {
        const r = el.getBoundingClientRect();
        el.style.width = `${r.width}px`;
        return { x: r.left + r.width / 2 + scrollX, y: r.top + r.height / 2 + scrollY };
      });
      shown.fill(-1); // force a repaint of the current values
    };
    letters.forEach((el) => { el.style.display = "inline-block"; el.style.textAlign = "center"; });
    measure();
    document.fonts?.ready.then(measure);
    const ro = new ResizeObserver(() => measure());
    ro.observe(h);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(h);
    const t0 = performance.now();
    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      if (!visible) return;
      if (t - lastT < 32) return; // ~30 fps is plenty for a slow melt
      // adaptive: if frames keep arriving late, drop the idle wave
      if (lastT && t - lastT > 60) { if (++slow > 20) idleWave = false; } else slow = Math.max(0, slow - 1);
      lastT = t;
      const time = (t - t0) / 1000;
      // Phones: scrolling melts the whole name, a finger or the tilt melts the letters nearby.
      speed = speed * 0.9 + Math.min(1, Math.abs(scrollY - lastY) / 18) * 0.1;
      lastY = scrollY;
      const fp = focusPoint();
      const fx = fp ? fp.x + scrollX : 0, fy = fp ? fp.y + scrollY : 0;
      for (let i = 0; i < letters.length; i++) {
        const c = centres[i];
        let near = 0;
        if (fp && c) near = Math.max(0, 1 - Math.hypot(c.x - fx, c.y - fy) / (touch ? 200 : 260)) * fp.w;
        const wave = idleWave ? (Math.sin(time * (touch ? 1.6 : 1.1) - i * 0.45) + 1) / 2 : 0; // travelling wave
        const target = 1979 + (wave * (touch ? 0.5 : 0.35) + near * 0.9 + speed * 1.4) * 71;
        cur[i] += (Math.min(2050, target) - cur[i]) * 0.2;
        // write only real changes (each write re-shapes the glyph)
        if (Math.abs(cur[i] - shown[i]) >= 0.6) {
          shown[i] = cur[i];
          letters[i].style.fontVariationSettings = `"YEAR" ${cur[i].toFixed(0)}`;
        }
      }
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); };
  }, []);

  return (
    <h1 ref={ref} className={`${s.melt} ${className ?? ""}`} aria-label={text}>
      {/* Each word is an unbreakable group: letters are inline-blocks (fixed widths, see measure()),
          and without this wrapper the line could break INSIDE the name ("PAVLOHA / VRAS"). */}
      {text.split(" ").map((word, w, words) => (
        <span key={w}>
          <span style={{ whiteSpace: "nowrap", display: "inline-block" }}>
            {[...word].map((c, i) => (
              <span key={i} data-l aria-hidden="true">{c}</span>
            ))}
          </span>
          {w < words.length - 1 ? " " : null}
        </span>
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
