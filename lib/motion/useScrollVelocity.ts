"use client";
import { useEffect, useRef } from "react";
import { useLenis } from "./LenisProvider";

/**
 * Scroll velocity in px/frame, kept in a ref (no re-renders): read it inside rAF / useFrame.
 * Falls back to native scroll deltas when Lenis is off (reduced motion).
 */
export function useScrollVelocity() {
  const v = useRef(0);
  const lenis = useLenis();

  useEffect(() => {
    if (lenis) {
      const on = () => { v.current = lenis.velocity; };
      lenis.on("scroll", on);
      return () => lenis.off("scroll", on);
    }
    let last = window.scrollY;
    let raf = 0;
    const loop = () => {
      const y = window.scrollY;
      v.current = v.current * 0.8 + (y - last) * 0.2;
      last = y;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [lenis]);

  return v;
}
