"use client";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { StudioEnv, ease, progress, seg } from "./shared";
import { canvasTexture, rng, woodTexture } from "./textures";

const S = 0.32; // square size
type Kind = "p" | "r" | "n" | "b" | "q" | "k";
type Side = "w" | "b";

const sq = (s: string) => {
  const f = s.charCodeAt(0) - 97, r = Number(s[1]) - 1;
  return new THREE.Vector3((f - 3.5) * S, 0, (3.5 - r) * S);
};

// Scholar's mate: 1. e4 e5 2. Bc4 Nc6 3. Qh5 Nf6 4. Qxf7#
const MOVES: [string, string][] = [["e2", "e4"], ["e7", "e5"], ["f1", "c4"], ["b8", "c6"], ["d1", "h5"], ["g8", "f6"], ["h5", "f7"]];

// ─────────────── Piece geometry (lathe profiles, metres) ───────────────
const lathe = (pts: [number, number][]) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 48);
const base: [number, number][] = [[0, 0], [0.118, 0], [0.12, 0.022], [0.108, 0.034], [0.112, 0.045], [0.09, 0.06]];

function knightHead() {
  const s = new THREE.Shape();
  s.moveTo(-0.06, 0); s.lineTo(0.07, 0); s.quadraticCurveTo(0.08, 0.12, 0.045, 0.19);
  s.quadraticCurveTo(0.03, 0.24, 0.005, 0.255); s.lineTo(-0.02, 0.275); s.lineTo(-0.03, 0.245);
  s.quadraticCurveTo(-0.09, 0.22, -0.115, 0.15); s.quadraticCurveTo(-0.12, 0.12, -0.095, 0.11);
  s.quadraticCurveTo(-0.06, 0.125, -0.03, 0.135); s.quadraticCurveTo(-0.06, 0.07, -0.06, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 3, curveSegments: 16 });
  g.translate(0, 0.07, -0.05);
  return g;
}

function useGeometries() {
  return useMemo(() => ({
    p: [lathe([...base, [0.055, 0.08], [0.04, 0.16], [0.065, 0.175], [0.04, 0.19], [0, 0.19]]), new THREE.SphereGeometry(0.058, 32, 24).translate(0, 0.235, 0)],
    r: [lathe([...base, [0.08, 0.09], [0.074, 0.25], [0.1, 0.27], [0.1, 0.33], [0.072, 0.33], [0.072, 0.31], [0, 0.31]])],
    n: [lathe([...base, [0.085, 0.075], [0, 0.075]]), knightHead()],
    b: [lathe([...base, [0.062, 0.09], [0.042, 0.27], [0.075, 0.29], [0.04, 0.305], [0, 0.305]]), new THREE.SphereGeometry(0.062, 32, 24).scale(1, 1.45, 1).translate(0, 0.375, 0), new THREE.SphereGeometry(0.018, 16, 12).translate(0, 0.47, 0)],
    q: [lathe([...base, [0.07, 0.1], [0.045, 0.34], [0.085, 0.37], [0.05, 0.39], [0.075, 0.44], [0, 0.44]]), new THREE.SphereGeometry(0.026, 16, 12).translate(0, 0.47, 0)],
    k: [lathe([...base, [0.074, 0.1], [0.048, 0.36], [0.088, 0.385], [0.055, 0.405], [0.07, 0.45], [0, 0.45]]), new THREE.BoxGeometry(0.022, 0.1, 0.022).translate(0, 0.5, 0), new THREE.BoxGeometry(0.07, 0.022, 0.022).translate(0, 0.505, 0)],
  }) as Record<Kind, THREE.BufferGeometry[]>, []);
}

function boardTexture() {
  return canvasTexture(1024, 1024, (ctx, w) => {
    const c = w / 8, r = rng(5);
    for (let f = 0; f < 8; f++) for (let k = 0; k < 8; k++) {
      const light = (f + k) % 2 === 0;
      ctx.fillStyle = light ? "#e9d3ad" : "#6d3d22";
      ctx.fillRect(f * c, k * c, c, c);
      // grain
      for (let i = 0; i < 26; i++) {
        ctx.strokeStyle = light ? "rgba(150,100,50,.12)" : "rgba(20,8,2,.22)";
        ctx.lineWidth = 0.6 + r() * 1.6;
        const y = k * c + r() * c;
        ctx.beginPath(); ctx.moveTo(f * c, y);
        for (let x = 0; x <= c; x += 16) ctx.lineTo(f * c + x, y + Math.sin(x * 0.05 + i) * 2);
        ctx.stroke();
      }
    }
  });
}

type Piece = { id: number; kind: Kind; side: Side; start: string };
const START: Piece[] = (() => {
  const back: Kind[] = ["r", "n", "b", "q", "k", "b", "n", "r"];
  const out: Piece[] = []; let id = 0;
  "abcdefgh".split("").forEach((f, i) => {
    out.push({ id: id++, kind: back[i], side: "w", start: `${f}1` });
    out.push({ id: id++, kind: "p", side: "w", start: `${f}2` });
    out.push({ id: id++, kind: "p", side: "b", start: `${f}7` });
    out.push({ id: id++, kind: back[i], side: "b", start: `${f}8` });
  });
  return out;
})();

/** Where each piece is at progress p (moves are spread over 0.08–0.86, mate shown after). */
function plan() {
  const at = new Map<number, string>(START.map((p) => [p.id, p.start]));
  const steps: { id: number; from: string; to: string; captured?: number; a: number; b: number }[] = [];
  MOVES.forEach(([from, to], i) => {
    const id = [...at.entries()].find(([, s]) => s === from)![0];
    const captured = [...at.entries()].find(([, s]) => s === to)?.[0];
    const a = 0.08 + i * 0.11, b = a + 0.09;
    steps.push({ id, from, to, captured, a, b });
    if (captured !== undefined) at.delete(captured);
    at.set(id, to);
  });
  return steps;
}

export default function ChessScene() {
  const geos = useGeometries();
  const board = useMemo(() => boardTexture(), []);
  const frame = useMemo(() => woodTexture("#3b1d0e", "#120602", 31), []);
  const ivory = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#efe3cc", roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.12, sheen: 0.3 }), []);
  const ebony = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#1b1410", roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08 }), []);
  const steps = useMemo(() => plan(), []);
  const groups = useRef<(THREE.Group | null)[]>([]);
  const { camera, pointer } = useThree();
  const v = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, dt) => {
    const p = progress.chess;
    START.forEach((pc) => {
      const g = groups.current[pc.id];
      if (!g) return;
      v.copy(sq(pc.start));
      let lift = 0, hidden = 1;
      for (const s of steps) {
        if (s.id === pc.id) {
          const t = ease(seg(p, s.a, s.b));
          if (t > 0) { v.lerpVectors(sq(s.from), sq(s.to), t); lift = Math.sin(t * Math.PI) * (pc.kind === "n" ? 0.35 : 0.14); }
        }
        if (s.captured === pc.id) hidden = 1 - seg(p, s.b - 0.02, s.b + 0.02);
      }
      g.position.set(v.x + (hidden < 1 ? (1 - hidden) * 0.6 : 0), lift, v.z);
      g.scale.setScalar(Math.max(0.001, hidden));
      g.visible = hidden > 0.01;
      // Checkmate: the black king tips over.
      if (pc.kind === "k" && pc.side === "b") g.rotation.z = -ease(seg(p, 0.88, 1)) * 1.15;
    });
    const k = Math.min(1, dt * 2.5);
    const orbit = 0.55 - p * 0.35;
    const r = 4.6;
    camera.position.x += (Math.sin(orbit) * r + pointer.x * 0.3 - camera.position.x) * k;
    camera.position.y += (3.1 - p * 0.5 + pointer.y * 0.15 - camera.position.y) * k;
    camera.position.z += (Math.cos(orbit) * r - camera.position.z) * k;
    camera.lookAt(0, 0.05, 0);
  });

  return (
    <>
      <StudioEnv />
      <ambientLight intensity={0.2} />
      <spotLight position={[1.5, 4.5, 2]} angle={0.6} penumbra={0.7} intensity={70} decay={2} color="#ffe2bf" castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0004} />
      <pointLight position={[-3, 1.2, -2]} intensity={5} color="#ff5a36" />
      {/* board + frame */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[S * 8, S * 8]} />
        <meshPhysicalMaterial map={board} roughness={0.35} clearcoat={0.8} clearcoatRoughness={0.2} />
      </mesh>
      <mesh position={[0, -0.067, 0]} receiveShadow castShadow>
        <boxGeometry args={[S * 8 + 0.24, 0.12, S * 8 + 0.24]} />
        <meshPhysicalMaterial map={frame} roughness={0.3} clearcoat={1} clearcoatRoughness={0.15} />
      </mesh>
      {START.map((pc) => (
        <group key={pc.id} ref={(g) => { groups.current[pc.id] = g; }} rotation={[0, pc.kind === "n" && pc.side === "b" ? Math.PI : 0, 0]}>
          {geos[pc.kind].map((geo, i) => (
            <mesh key={i} geometry={geo} material={pc.side === "w" ? ivory : ebony} castShadow receiveShadow />
          ))}
        </group>
      ))}
    </>
  );
}
