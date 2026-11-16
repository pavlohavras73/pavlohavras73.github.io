"use client";
import { useEffect, useRef } from "react";
import { focusPoint, sense } from "@/lib/motion/sense";
import s from "./lobby.module.css";

// Warm out-of-focus lights drifting behind the lounge, like a bar seen through a glass. The drift
// is CSS; on top, each light sits at its own depth and shifts with the mouse, a finger or the
// phone's tilt (parallax), so the room moves when you move.
const LIGHTS = [
  { x: 8, y: 12, r: 220, c: "#ff3d7f", d: 26, z: 0.9 }, { x: 78, y: 8, r: 280, c: "#f5c451", d: 32, z: 0.4 },
  { x: 55, y: 34, r: 180, c: "#ff6a2b", d: 22, z: 1.3 }, { x: 18, y: 58, r: 260, c: "#f5c451", d: 30, z: 0.5 },
  { x: 88, y: 52, r: 200, c: "#ff3d7f", d: 28, z: 1.1 }, { x: 40, y: 80, r: 300, c: "#ff6a2b", d: 36, z: 0.35 },
  { x: 70, y: 88, r: 170, c: "#39d5ff", d: 24, z: 1.5 }, { x: 28, y: 30, r: 140, c: "#39d5ff", d: 20, z: 1.7 },
];

export function Bokeh() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0, x = 0, y = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      let tx = 0, ty = 0;
      if (sense.tiltOn) { tx = sense.tx; ty = sense.ty; }
      else {
        const fp = focusPoint();
        if (fp) { tx = (fp.x / innerWidth - 0.5) * 2 * fp.w; ty = (fp.y / innerHeight - 0.5) * 2 * fp.w; }
      }
      const nx = x + (tx - x) * 0.06, ny = y + (ty - y) * 0.06;
      if (Math.abs(nx - x) + Math.abs(ny - y) < 0.0015) return; // settled: no style writes
      x = nx; y = ny;
      el.style.setProperty("--tx", x.toFixed(3));
      el.style.setProperty("--ty", y.toFixed(3));
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={ref} className={s.bokeh} aria-hidden="true">
      {LIGHTS.map((l, i) => (
        <span key={i} className={s.bokehLayer} style={{ ["--z" as string]: l.z }}>
          <i style={{ left: `${l.x}%`, top: `${l.y}%`, width: l.r, height: l.r, background: `radial-gradient(circle, ${l.c}, transparent 70%)`, animationDuration: `${l.d}s`, animationDelay: `${-i * 3}s` }} />
        </span>
      ))}
    </div>
  );
}
