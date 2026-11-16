"use client";

// Heavy visuals (WebGL scenes, shader backgrounds) start on the visitor's first sign of life:
// a pointer move, a touch, a wheel/scroll or a key. Until then the page shows its posters, which
// keeps first load light on weak phones (and in lab tools that never interact).

let interacted = false;
const waiting = new Set<() => void>();
const EVENTS = ["pointermove", "pointerdown", "touchstart", "wheel", "scroll", "keydown"] as const;

function fire() {
  if (interacted) return;
  interacted = true;
  EVENTS.forEach((e) => window.removeEventListener(e, fire, true));
  waiting.forEach((cb) => cb());
  waiting.clear();
}

if (typeof window !== "undefined") {
  EVENTS.forEach((e) => window.addEventListener(e, fire, { capture: true, passive: true }));
}

/** Calls `cb` once the visitor has interacted (immediately if they already have). Returns a canceller. */
export function onFirstInteraction(cb: () => void): () => void {
  if (interacted) { cb(); return () => {}; }
  waiting.add(cb);
  return () => { waiting.delete(cb); };
}
