"use client";
import { useEffect, useRef } from "react";
import { gsap } from "@/lib/motion/gsap";
import { prefersReducedMotion } from "@/lib/motion/useReducedMotion";

/**
 * A follower ring + dot in the world's colour (var(--cursor) or var(--accent)).
 * The native cursor stays visible (text inputs keep their caret). Only on fine pointers.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const d = dot.current, r = ring.current;
    if (!d || !r) return;
    if (prefersReducedMotion() || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const dx = gsap.quickTo(d, "x", { duration: 0.12 }), dy = gsap.quickTo(d, "y", { duration: 0.12 });
    const rx = gsap.quickTo(r, "x", { duration: 0.45 }), ry = gsap.quickTo(r, "y", { duration: 0.45 });
    let shown = false;
    const move = (e: PointerEvent) => {
      if (!shown) { shown = true; gsap.to([d, r], { autoAlpha: 1, duration: 0.3 }); }
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
      const hot = (e.target as Element | null)?.closest?.("a, button, [data-cursor]");
      r.dataset.hot = hot ? "1" : "";
    };
    const leave = () => { shown = false; gsap.to([d, r], { autoAlpha: 0, duration: 0.3 }); };
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, []);

  const base = "pointer-events-none fixed left-0 top-0 z-[80] rounded-full opacity-0 invisible";
  return (
    <div aria-hidden="true">
      <div ref={dot} className={`${base} -ml-[3px] -mt-[3px] h-[6px] w-[6px]`} style={{ background: "var(--cursor, var(--accent))" }} />
      <div
        ref={ring}
        className={`${base} -ml-5 -mt-5 h-10 w-10 border transition-[transform,background-color,border-color] duration-300 data-[hot=1]:scale-150 data-[hot=1]:bg-[color-mix(in_srgb,var(--cursor,var(--accent))_12%,transparent)]`}
        style={{ borderColor: "var(--cursor, var(--accent))" }}
      />
    </div>
  );
}
