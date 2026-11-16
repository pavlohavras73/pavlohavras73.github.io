"use client";
import Lenis from "lenis";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { gsap, ScrollTrigger } from "./gsap";
import { prefersReducedMotion } from "./useReducedMotion";

const LenisContext = createContext<Lenis | null>(null);

/** The page's Lenis instance, or null (reduced motion / before mount). */
export function useLenis(): Lenis | null {
  return useContext(LenisContext);
}

/**
 * Smooth scroll driven by GSAP's ticker so ScrollTrigger and Lenis share one clock.
 * Disabled entirely for prefers-reduced-motion: native scrolling, no inertia.
 */
export function LenisProvider({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const l = new Lenis({ lerp: 0.11, wheelMultiplier: 1, touchMultiplier: 1.4 });
    l.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => l.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    // Publishing the instance is the point of this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLenis(l);
    return () => {
      gsap.ticker.remove(tick);
      l.destroy();
      setLenis(null);
    };
  }, []);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
