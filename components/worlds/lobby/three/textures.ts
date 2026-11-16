"use client";
import * as THREE from "three";

// Procedural canvas textures: crisp at any DPR, no image downloads.

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

/** Font family of a CSS variable on the world wrapper (next/font hashes family names). */
export function worldFont(varName: "--f-display" | "--f-body" | "--f-accent"): string {
  if (typeof document === "undefined") return "serif";
  const el = document.querySelector("[data-world]") ?? document.documentElement;
  return getComputedStyle(el).getPropertyValue(varName).trim() || "serif";
}

export function canvasTexture(w: number, h: number, draw: Draw, opts: { srgb?: boolean; repeat?: [number, number]; redrawOnFonts?: boolean } = {}) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d")!;
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  if (opts.srgb !== false) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  if (opts.repeat) { tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(...opts.repeat); }
  if (opts.redrawOnFonts && document.fonts) {
    document.fonts.ready.then(() => { ctx.clearRect(0, 0, w, h); draw(ctx, w, h); tex.needsUpdate = true; });
  }
  return tex;
}

/** Deterministic PRNG so textures look the same on every visit. */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ─────────────── Felt ───────────────
export function feltTexture(base = "#17553a") {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
    const r = rng(7);
    const img = ctx.getImageData(0, 0, w, h);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (r() - 0.5) * 22;
      img.data[i] += n; img.data[i + 1] += n * 1.1; img.data[i + 2] += n * 0.8;
    }
    ctx.putImageData(img, 0, 0);
  }, { repeat: [3, 3] });
}

// ─────────────── Wood ───────────────
export function woodTexture(light: string, dark: string, seed = 3, rings = 26) {
  return canvasTexture(512, 512, (ctx, w, h) => {
    const r = rng(seed);
    ctx.fillStyle = light; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < rings * 6; i++) {
      const y = r() * h, amp = 4 + r() * 10, freq = 0.004 + r() * 0.01, ph = r() * 6;
      ctx.strokeStyle = dark; ctx.globalAlpha = 0.05 + r() * 0.16; ctx.lineWidth = 0.6 + r() * 2.4;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 8) ctx.lineTo(x, y + Math.sin(x * freq + ph) * amp);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }, { repeat: [1, 1] });
}

// ─────────────── Cards ───────────────
export const CARD_W = 0.63, CARD_H = 0.88;
const SUIT_RED = "#c8261b";

export function cardFace(rank: string, suit: "♠" | "♥" | "♦" | "♣") {
  const red = suit === "♥" || suit === "♦";
  return canvasTexture(504, 704, (ctx, w, h) => {
    const font = worldFont("--f-display");
    roundRect(ctx, 4, 4, w - 8, h - 8, 38);
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#fffbf2"); g.addColorStop(1, "#f2e6cf");
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = "rgba(60,40,20,.25)"; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = red ? SUIT_RED : "#17110c";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const corner = (x: number, y: number, rot: number) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
      ctx.font = `700 78px ${font}`; ctx.fillText(rank, 0, 0);
      ctx.font = `64px serif`; ctx.fillText(suit, 0, 66);
      ctx.restore();
    };
    corner(64, 76, 0); corner(w - 64, h - 76, Math.PI);
    ctx.font = `230px serif`; ctx.fillText(suit, w / 2, h / 2 + 10);
  }, { redrawOnFonts: true });
}

export function cardBack(accent = "#ff3d3d") {
  return canvasTexture(504, 704, (ctx, w, h) => {
    roundRect(ctx, 4, 4, w - 8, h - 8, 38);
    ctx.fillStyle = "#1a0f0b"; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.strokeStyle = accent; ctx.globalAlpha = 0.55; ctx.lineWidth = 3;
    for (let i = -h; i < w + h; i += 26) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + h, h); ctx.stroke(); ctx.beginPath(); ctx.moveTo(i + h, 0); ctx.lineTo(i, h); ctx.stroke(); }
    ctx.restore(); ctx.globalAlpha = 1;
    roundRect(ctx, 34, 34, w - 68, h - 68, 22);
    ctx.strokeStyle = "#f5c451"; ctx.lineWidth = 6; ctx.stroke();
    ctx.fillStyle = "#1a0f0b"; ctx.beginPath(); ctx.arc(w / 2, h / 2, 86, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#f5c451"; ctx.lineWidth = 5; ctx.stroke();
    ctx.fillStyle = "#fff3e2"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = `800 96px ${worldFont("--f-display")}`; ctx.fillText("L.", w / 2 + 6, h / 2 + 4);
  }, { redrawOnFonts: true });
}

/** Mafia role card: title + one-line role text. */
function roleIcon(ctx: CanvasRenderingContext2D, kind: string, x: number, y: number, color: string) {
  ctx.save(); ctx.translate(x, y); ctx.fillStyle = color; ctx.strokeStyle = color; ctx.lineJoin = "round";
  if (kind === "doctor") {
    ctx.fillRect(-18, -62, 36, 124); ctx.fillRect(-62, -18, 124, 36);
  } else if (kind === "sheriff") {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) { const r = i % 2 ? 30 : 70, a = (i / 10) * Math.PI * 2 - Math.PI / 2; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#1a120c"; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.rotate(-Math.PI / 4);
    ctx.beginPath(); ctx.moveTo(0, -78); ctx.quadraticCurveTo(22, -30, 16, 18); ctx.lineTo(-16, 18); ctx.quadraticCurveTo(-22, -30, 0, -78); ctx.fill();
    ctx.fillRect(-36, 18, 72, 12); ctx.fillRect(-10, 30, 20, 46);
  }
  ctx.restore();
}

export function roleCard(title: string, line: string, color: string) {
  return canvasTexture(504, 704, (ctx, w, h) => {
    roundRect(ctx, 4, 4, w - 8, h - 8, 38);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#221812"); g.addColorStop(1, "#0f0a07");
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 5; ctx.stroke();
    ctx.fillStyle = color; ctx.globalAlpha = 0.15;
    ctx.beginPath(); ctx.arc(w / 2, h * 0.38, 150, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = color; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(w / 2, h * 0.38, 110, 0, Math.PI * 2); ctx.stroke();
    roleIcon(ctx, title.toLowerCase(), w / 2, h * 0.38, color);
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = color;
    ctx.font = `800 64px ${worldFont("--f-display")}`;
    ctx.fillText(title.toUpperCase(), w / 2, h * 0.68);
    ctx.fillStyle = "#e9dcc8"; ctx.font = `30px ${worldFont("--f-body")}`;
    const words = line.split(" "); let row = "", y = h * 0.79;
    for (const word of words) {
      const t = row ? row + " " + word : word;
      if (ctx.measureText(t).width > w - 90) { ctx.fillText(row, w / 2, y); row = word; y += 38; } else row = t;
    }
    if (row) ctx.fillText(row, w / 2, y);
  }, { redrawOnFonts: true });
}

// ─────────────── Chips ───────────────
export function chipEdge(color: string) {
  return canvasTexture(512, 32, (ctx, w, h) => {
    ctx.fillStyle = color; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#fff8ec";
    for (let i = 0; i < 8; i++) ctx.fillRect(i * (w / 8) + w / 32, 0, w / 16, h);
  });
}

export function chipFace(color: string, label: string) {
  return canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff8ec";
    for (let i = 0; i < 8; i++) {
      ctx.save(); ctx.translate(w / 2, h / 2); ctx.rotate((i / 8) * Math.PI * 2);
      ctx.fillRect(-10, -w / 2, 20, 30); ctx.restore();
    }
    ctx.strokeStyle = "rgba(255,248,236,.85)"; ctx.lineWidth = 5; ctx.setLineDash([10, 8]);
    ctx.beginPath(); ctx.arc(w / 2, h / 2, w * 0.32, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]); ctx.fillStyle = "#fff8ec"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = `800 54px ${worldFont("--f-display")}`; ctx.fillText(label, w / 2, h / 2 + 3);
  }, { redrawOnFonts: true });
}
