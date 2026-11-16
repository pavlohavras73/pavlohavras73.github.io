"use client";

/**
 * Shared input for the touch-native effects. Phones have no hover, so effects that follow the
 * mouse on a laptop read this instead: the latest mouse / finger point, and the phone's tilt.
 * Plain mutable object, read inside rAF loops (no re-renders).
 */
export const sense = {
  /** latest mouse or finger position (client px) */
  x: -1e4,
  y: -1e4,
  /** performance.now() of the last update */
  at: 0,
  /** the last update came from a finger */
  touch: false,
  /** a finger is on the screen */
  down: false,
  /** tilt is streaming */
  tiltOn: false,
  /** smoothed tilt, -1..1 (x: roll left/right, y: toward/away from you) */
  tx: 0,
  ty: 0,
};

const clamp = (v: number) => Math.max(-1, Math.min(1, v));
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());
let installed = false;
let tiltListening = false;
let beta0: number | null = null;

type PermissionDOE = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<"granted" | "denied"> };

export const isTouchDevice = () => typeof window !== "undefined" && window.matchMedia("(hover: none) and (pointer: coarse)").matches;

/** iOS asks for permission (from a tap) before it streams orientation; Android does not. */
export const tiltNeedsPermission = () =>
  typeof DeviceOrientationEvent !== "undefined" && typeof (DeviceOrientationEvent as PermissionDOE).requestPermission === "function";

function onOrient(e: DeviceOrientationEvent) {
  if (e.gamma == null || e.beta == null) return;
  const angle = (screen.orientation?.angle ?? 0) % 360;
  // Portrait: gamma = left/right, beta = toward/away. Landscape swaps them.
  let lr = e.gamma, fb = e.beta;
  if (angle === 90) { lr = e.beta; fb = -e.gamma; }
  else if (angle === 270) { lr = -e.beta; fb = e.gamma; }
  if (beta0 == null) beta0 = fb;
  beta0 += (fb - beta0) * 0.01; // slowly re-centre on however the phone is being held
  sense.tx += (clamp(lr / 28) - sense.tx) * 0.3;
  sense.ty += (clamp((fb - beta0) / 20) - sense.ty) * 0.3;
  if (!sense.tiltOn) { sense.tiltOn = true; notify(); }
}

function listenTilt() {
  if (tiltListening) return;
  tiltListening = true;
  window.addEventListener("deviceorientation", onOrient, { passive: true });
}

/** Starts the shared listeners once. Safe to call from every consumer. */
export function installSense() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  const mouse = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    sense.x = e.clientX; sense.y = e.clientY; sense.at = performance.now(); sense.touch = false;
  };
  const finger = (e: TouchEvent) => {
    const t = e.touches[0];
    if (!t) return;
    sense.x = t.clientX; sense.y = t.clientY; sense.at = performance.now(); sense.touch = true; sense.down = true;
  };
  const lift = () => { sense.down = false; sense.at = performance.now(); };
  window.addEventListener("pointermove", mouse, { passive: true });
  window.addEventListener("touchstart", finger, { passive: true });
  window.addEventListener("touchmove", finger, { passive: true });
  window.addEventListener("touchend", lift, { passive: true });
  window.addEventListener("touchcancel", lift, { passive: true });
  if (isTouchDevice() && !tiltNeedsPermission()) listenTilt();
}

/** Asks for motion access (iOS) from a tap. Resolves true when tilt is streaming or will. */
export async function enableTilt(): Promise<boolean> {
  installSense();
  const D = DeviceOrientationEvent as PermissionDOE;
  if (typeof D.requestPermission === "function") {
    try {
      if ((await D.requestPermission()) !== "granted") return false;
    } catch {
      return false;
    }
  }
  listenTilt();
  return true;
}

export function subscribeTilt(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

/**
 * Where the "pointer" is for an effect, with a 0..1 strength: the mouse; a finger while it is
 * down (fading out after it lifts); otherwise the tilt, mapped onto the screen. null = nothing.
 */
export function focusPoint(): { x: number; y: number; w: number } | null {
  const now = performance.now();
  if (!sense.touch && sense.at > 0) return { x: sense.x, y: sense.y, w: 1 };
  if (sense.touch) {
    const age = sense.down ? 0 : now - sense.at;
    if (age < 900) return { x: sense.x, y: sense.y, w: 1 - age / 900 };
  }
  if (sense.tiltOn) {
    return { x: innerWidth * (0.5 + sense.tx * 0.48), y: innerHeight * (0.45 + sense.ty * 0.4), w: Math.min(1, Math.hypot(sense.tx, sense.ty) * 2.2) };
  }
  return null;
}
