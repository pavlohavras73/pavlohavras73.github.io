"use client";
import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion/useReducedMotion";

/** Muted looping preview that stays paused (with controls) for prefers-reduced-motion. */
export function AutoVideo({ src, poster, label }: { src: string; poster: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (prefersReducedMotion()) { v.pause(); v.controls = true; return; }
    v.play().catch(() => {});
  }, []);
  return <video ref={ref} src={src} poster={poster} muted loop playsInline preload="metadata" aria-label={label} />;
}
