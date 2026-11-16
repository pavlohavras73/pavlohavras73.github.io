"use client";
import { useEffect, useRef } from "react";

/** Muted looping preview (plays inline on phones too). */
export function AutoVideo({ src, poster, label }: { src: string; poster: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.play().catch(() => {});
  }, []);
  return <video ref={ref} src={src} poster={poster} muted loop playsInline preload="metadata" aria-label={label} />;
}
