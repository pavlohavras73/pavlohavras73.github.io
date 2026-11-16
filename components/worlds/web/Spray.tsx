"use client";
import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion/useReducedMotion";

type Drip = { x: number; y: number; vy: number; r: number; life: number; c: string };

/**
 * Spray paint under the pointer: a soft mist of dots, and now and then a drip that runs down.
 * Paint fades over a few seconds so the hero never fills up. Decorative; skipped for reduced motion.
 */
export function Spray({ className, colors = ["#c6ff1a", "#c6ff1a", "#ff4b1f"] }: { className?: string; colors?: string[] }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv || prefersReducedMotion()) return;
    const ctx = cv.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0;
    const resize = () => { W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    const ro = new ResizeObserver(resize); ro.observe(cv); resize();

    const drips: Drip[] = [];
    let last: { x: number; y: number } | null = null, color = colors[0], raf = 0, idle = 0;
    const spray = (x: number, y: number, amount: number) => {
      for (let i = 0; i < amount; i++) {
        const a = Math.random() * Math.PI * 2, d = Math.pow(Math.random(), 1.8) * 26;
        ctx.globalAlpha = 0.18 + Math.random() * 0.5;
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, Math.random() * 1.8 + 0.3, 0, Math.PI * 2); ctx.fill();
      }
      if (Math.random() < 0.035 && drips.length < 24) drips.push({ x: x + (Math.random() - 0.5) * 10, y, vy: 0.4 + Math.random() * 0.9, r: 1.6 + Math.random() * 1.6, life: 60 + Math.random() * 120, c: color });
    };
    const move = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      if (x < 0 || y < 0 || x > W || y > H) { last = null; return; }
      if (!last) color = colors[(Math.random() * colors.length) | 0];
      const dist = last ? Math.hypot(x - last.x, y - last.y) : 0;
      const steps = Math.max(1, Math.ceil(dist / 6));
      for (let s = 1; s <= steps; s++) spray(last ? last.x + ((x - last.x) * s) / steps : x, last ? last.y + ((y - last.y) * s) / steps : y, 10);
      last = { x, y }; idle = 0;
    };
    const leave = () => { last = null; };
    window.addEventListener("pointermove", move, { passive: true });
    cv.addEventListener("pointerleave", leave);

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (++idle > 40) last = null;
      // fade old paint toward transparent
      ctx.globalCompositeOperation = "destination-out";
      ctx.globalAlpha = 0.018; ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "source-over";
      for (let i = drips.length - 1; i >= 0; i--) {
        const d = drips[i];
        d.y += d.vy; d.vy *= 0.992; d.life--;
        ctx.globalAlpha = Math.min(0.85, d.life / 60); ctx.fillStyle = d.c;
        ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill();
        if (d.life <= 0 || d.vy < 0.05) drips.splice(i, 1);
      }
      ctx.globalAlpha = 1;
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener("pointermove", move); cv.removeEventListener("pointerleave", leave); };
  }, [colors]);

  return <canvas ref={ref} aria-hidden="true" className={className} />;
}
