"use client";
import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(cb: () => void) {
  const mq = window.matchMedia(QUERY);
  // Safari < 14 only has addListener; iOS 15 supports addEventListener.
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

/** true when the user asked for reduced motion. Server render assumes motion is fine. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia(QUERY).matches;
}
