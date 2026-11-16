"use client";
import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion/useReducedMotion";
import { onFirstInteraction } from "@/lib/three/interaction";
import { GLYPHS } from "@/lib/motion/Scramble";

/**
 * Digital rain behind the Jarvis world: sparse columns of katakana and digits, mint heads with
 * fading tails. ~24 fps on a 2D canvas, paused when the tab is hidden, a still frame for reduced
 * motion. Decorative only.
 */
export function Rain() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d")!;
    const glyphs = [...GLYPHS.matrix];
    const size = 16;
    let W = 0, H = 0, cols: { y: number; speed: number; len: number }[] = [];
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const resize = () => {
      W = innerWidth; H = innerHeight;
      cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + "px"; cv.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.ceil(W / size);
      cols = Array.from({ length: n }, () => ({ y: Math.random() * -H, speed: 0.4 + Math.random() * 0.9, len: 8 + Math.random() * 22 }));
    };
    resize();
    addEventListener("resize", resize);

    const draw = (still = false) => {
      ctx.clearRect(0, 0, W, H);
      ctx.font = `${size - 2}px ui-monospace, monospace`;
      cols.forEach((c, i) => {
        if (i % 3 === 1) return; // leave gaps: two of every three columns
        if (!still) { c.y += c.speed * size * 0.35; if (c.y - c.len * size > H) { c.y = Math.random() * -200; c.speed = 0.4 + Math.random() * 0.9; } }
        for (let k = 0; k < c.len; k++) {
          const y = c.y - k * size;
          if (y < -size || y > H + size) continue;
          const a = k === 0 ? 0.9 : (1 - k / c.len) * 0.42;
          ctx.fillStyle = k === 0 ? `rgba(230,255,247,${a})` : `rgba(140,245,210,${a})`;
          ctx.fillText(glyphs[(Math.random() * glyphs.length) | 0], i * size, y);
        }
      });
    };

    if (prefersReducedMotion()) { cols.forEach((c) => { c.y = Math.random() * H * 1.4; }); draw(true); return () => removeEventListener("resize", resize); }

    let raf = 0, last = 0, running = false;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (document.hidden || t - last < 42) return;
      last = t;
      draw();
    };
    const start = () => { if (!running) { running = true; raf = requestAnimationFrame(loop); cv.style.opacity = "1"; } };
    const cancel = onFirstInteraction(start);
    return () => { cancel(); cancelAnimationFrame(raf); removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={ref} aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0, transition: "opacity 1.5s" }} />;
}
