"use client";
import { useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { useMemo, useRef, type MutableRefObject, type Ref } from "react";
import * as THREE from "three";
import { CARD_H, CARD_W, cardBack, chipEdge, chipFace, rng } from "./textures";

export { progress, ease, clamp01, seg, type ProgressKey } from "../progress";
import { clamp01 } from "../progress";

const cardGeo = new THREE.PlaneGeometry(CARD_W, CARD_H);

/** Shared card back (cached per accent). */
const backs = new Map<string, THREE.Texture>();
export function useCardBack(accent = "#ff3d3d") {
  return useMemo(() => {
    if (!backs.has(accent)) backs.set(accent, cardBack(accent));
    return backs.get(accent)!;
  }, [accent]);
}

/**
 * A playing card: two planes back to back (face +Z, back −Z) with rounded corners from the
 * texture alpha. `pose` is written every frame by the parent (position, rotation).
 */
export function Card({ face, back, poseRef, castShadow = true }: { face: THREE.Texture; back: THREE.Texture; poseRef?: Ref<THREE.Group>; castShadow?: boolean }) {
  return (
    <group ref={poseRef}>
      <mesh geometry={cardGeo} castShadow={castShadow}>
        <meshPhysicalMaterial map={face} transparent alphaTest={0.5} roughness={0.42} clearcoat={0.6} clearcoatRoughness={0.35} side={THREE.FrontSide} />
      </mesh>
      <mesh geometry={cardGeo} rotation={[0, Math.PI, 0]} castShadow={castShadow}>
        <meshPhysicalMaterial map={back} transparent alphaTest={0.5} roughness={0.5} clearcoat={0.4} side={THREE.FrontSide} />
      </mesh>
    </group>
  );
}

// ─────────────── Chips ───────────────
const CHIP_R = 0.2, CHIP_H = 0.045;
const chipGeo = new THREE.CylinderGeometry(CHIP_R, CHIP_R, CHIP_H, 48, 1);
const chipMats = new Map<string, THREE.Material[]>();
function chipMaterial(color: string, label: string) {
  const key = color + label;
  if (!chipMats.has(key)) {
    const side = new THREE.MeshPhysicalMaterial({ map: chipEdge(color), roughness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.2 });
    const top = new THREE.MeshPhysicalMaterial({ map: chipFace(color, label), roughness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.2 });
    chipMats.set(key, [side, top, top]);
  }
  return chipMats.get(key)!;
}

export const CHIP_COLORS = [
  { color: "#d8321e", label: "5" },
  { color: "#1f2a44", label: "25" },
  { color: "#1c6b48", label: "50" },
  { color: "#e3a72f", label: "100" },
];

/** A stack of chips. `drop` (0..1) animates chips falling in with a small bounce. */
export function ChipStack({ count, kind = 0, position, dropRef, jitter = 0.012, seed = 1 }: { count: number; kind?: number; position: [number, number, number]; dropRef?: MutableRefObject<number>; jitter?: number; seed?: number }) {
  const { color, label } = CHIP_COLORS[kind % CHIP_COLORS.length];
  const mats = useMemo(() => chipMaterial(color, label), [color, label]);
  const offsets = useMemo(() => {
    const rand = rng(seed * 9301);
    const r = () => (rand() - 0.5) * 2;
    return Array.from({ length: count }, () => [r() * jitter, r() * Math.PI] as const);
  }, [count, jitter, seed]);
  const refs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(() => {
    const d = dropRef ? dropRef.current : 1;
    refs.current.forEach((m, i) => {
      if (!m) return;
      // Each chip lands a little after the one below; light bounce on landing.
      const t = clamp01(d * (count + 3) / 3 - i / 3);
      const fall = 1 - t;
      const bounce = t > 0.85 ? Math.sin((t - 0.85) / 0.15 * Math.PI) * 0.025 : 0;
      m.position.y = CHIP_H / 2 + i * CHIP_H + fall * fall * 1.4 + bounce;
      m.visible = t > 0;
    });
  });

  return (
    <group position={position}>
      {offsets.map(([j, rot], i) => (
        <mesh key={i} ref={(m) => { refs.current[i] = m; }} geometry={chipGeo} material={mats} position={[j, CHIP_H / 2 + i * CHIP_H, -j]} rotation={[0, rot, 0]} castShadow receiveShadow />
      ))}
    </group>
  );
}

/** Studio reflections without downloading an HDR: a few soft area lights in an environment map. */
export function StudioEnv({ warm = "#ffb37a", cool = "#7aa7ff" }: { warm?: string; cool?: string }) {
  return (
    <Environment resolution={256} frames={1}>
      <Lightformer form="rect" intensity={3} color={warm} position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[6, 6, 1]} />
      <Lightformer form="rect" intensity={1.2} color={cool} position={[-5, 2, -3]} rotation={[0, Math.PI / 3, 0]} scale={[4, 3, 1]} />
      <Lightformer form="ring" intensity={1.5} color="#ffffff" position={[4, 2, 3]} scale={2} />
    </Environment>
  );
}
