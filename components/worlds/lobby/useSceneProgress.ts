"use client";
import { useEffect, useRef, type RefObject } from "react";
import { ScrollTrigger } from "@/lib/motion/gsap";
import { prefersReducedMotion } from "@/lib/motion/useReducedMotion";
import { progress } from "./progress";

/**
 * Writes the scroll progress of `ref` (0 when its top hits `start`, 1 at `end`) into the shared
 * scene store. Reduced motion: the scene shows its final state.
 */
export function useSceneProgress(
  ref: RefObject<HTMLElement | null>, key: keyof typeof progress, start = "top top", end = "bottom bottom",
  onUpdate?: (p: number) => void,
  /** Phones: track a different element/range (e.g. the 3D block passing through the screen). */
  mobile?: { ref: RefObject<HTMLElement | null>; start: string; end: string },
) {
  const cb = useRef(onUpdate);
  useEffect(() => { cb.current = onUpdate; });

  useEffect(() => {
    const phone = mobile && window.matchMedia("(max-width: 1023px)").matches;
    const el = phone ? mobile.ref.current : ref.current;
    if (!el) return;
    const set = (p: number) => { progress[key] = p; cb.current?.(p); };
    if (prefersReducedMotion()) { set(1); return; }
    const st = ScrollTrigger.create({
      trigger: el, start: phone ? mobile.start : start, end: phone ? mobile.end : end,
      onUpdate: (s) => set(s.progress), onRefresh: (s) => set(s.progress),
    });
    return () => st.kill();
    // mobile is a stable config object per call site
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, key, start, end]);
}
