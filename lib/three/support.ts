"use client";

let cached: boolean | null = null;

/** WebGL availability (WebGL2 preferred, WebGL1 accepted). Cached after the first probe. */
export function hasWebGL(): boolean {
  if (cached !== null) return cached;
  if (typeof window === "undefined") return false;
  try {
    const c = document.createElement("canvas");
    const gl = (c.getContext("webgl2") || c.getContext("webgl")) as WebGLRenderingContext | null;
    cached = !!gl;
    // Free the probe's context right away: iOS only allows a few live WebGL contexts.
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    cached = false;
  }
  return cached;
}

/** Phone-class device: touch-first or a narrow screen. Used to keep GPU memory low. */
export function isPhone(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(pointer: coarse), (max-width: 767px)").matches;
}

/** Run after the first paint and when the main thread is idle (Safari has no requestIdleCallback). */
export function afterFirstPaint(cb: () => void): () => void {
  let cancelled = false;
  let idle = 0;
  const raf = requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      if (cancelled) return;
      const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
      if (w.requestIdleCallback) idle = w.requestIdleCallback(() => !cancelled && cb(), { timeout: 1200 });
      else idle = window.setTimeout(() => !cancelled && cb(), 120);
    }),
  );
  return () => {
    cancelled = true;
    cancelAnimationFrame(raf);
    const w = window as Window & { cancelIdleCallback?: (h: number) => void };
    if (w.cancelIdleCallback) w.cancelIdleCallback(idle);
    clearTimeout(idle);
  };
}
