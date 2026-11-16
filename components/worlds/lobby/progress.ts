// Scroll progress store shared by the page (writers) and the 3D scenes (readers in useFrame).
// Deliberately free of three.js imports so the page bundle does not pull in the 3D engine.

export type ProgressKey = "hero" | "room" | "poker" | "mafia" | "chess" | "reconnect";
export const progress: Record<ProgressKey, number> = { hero: 0, room: 0, poker: 0, mafia: 0, chess: 0, reconnect: 0 };

export const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
/** 0→1 as p goes from a to b. */
export const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
