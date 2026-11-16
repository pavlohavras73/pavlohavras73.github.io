"use client";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Card, ChipStack, StudioEnv, ease, progress, seg, useCardBack, type ProgressKey } from "./shared";
import { cardFace, feltTexture, woodTexture } from "./textures";

type Suit = "♠" | "♥" | "♦" | "♣";
const HOLE: [string, Suit][] = [["A", "♠"], ["K", "♠"]];
const BOARD: [string, Suit][] = [["Q", "♠"], ["J", "♠"], ["7", "♦"], ["10", "♠"], ["2", "♣"]];

const DECK = new THREE.Vector3(2.15, 0.06, -0.85);
const FACE_UP = -Math.PI / 2, FACE_DOWN = Math.PI / 2;

/** One dealt card: flies from the deck along an arc, lands face down, then flips. */
function DealtCard({ face, slot, yaw, t0, t1, flip = true, scene = "hero" }: { face: THREE.Texture; slot: [number, number, number]; yaw: number; t0: number; t1: number; flip?: boolean; scene?: ProgressKey }) {
  const ref = useRef<THREE.Group | null>(null);
  const back = useCardBack();
  const to = useMemo(() => new THREE.Vector3(...slot), [slot]);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const k = seg(progress[scene], t0, t1);
    const fly = ease(Math.min(1, k / 0.65));
    const turn = flip ? ease(seg(k, 0.65, 1)) : 0;
    tmp.lerpVectors(DECK, to, fly);
    tmp.y += Math.sin(fly * Math.PI) * 0.55 + Math.sin(turn * Math.PI) * 0.25 + 0.004;
    g.position.copy(tmp);
    g.rotation.order = "YXZ";
    g.rotation.set(THREE.MathUtils.lerp(FACE_DOWN, FACE_UP, turn), THREE.MathUtils.lerp(-1.2, yaw, fly), 0);
    g.visible = k > 0;
  });
  return <Card face={face} back={back} poseRef={ref} />;
}

function Table() {
  const felt = useMemo(() => feltTexture("#17553a"), []);
  const wood = useMemo(() => woodTexture("#5a2e17", "#1d0c05", 11), []);
  return (
    <group>
      {/* felt */}
      <mesh scale={[3.2, 1, 1.9]} position={[0, -0.04, 0]} receiveShadow>
        <cylinderGeometry args={[1, 1, 0.08, 128]} />
        <meshStandardMaterial map={felt} roughness={0.95} color="#ffffff" />
      </mesh>
      {/* betting line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[2.35, 1.38, 1]} position={[0, 0.002, 0]}>
        <ringGeometry args={[0.995, 1, 160]} />
        <meshBasicMaterial color="#f5c451" transparent opacity={0.35} />
      </mesh>
      {/* padded leather rail */}
      <mesh rotation={[Math.PI / 2, 0, 0]} scale={[3.3, 2.0, 1]} position={[0, 0.03, 0]} castShadow receiveShadow>
        <torusGeometry args={[1, 0.085, 28, 160]} />
        <meshPhysicalMaterial color="#2b110b" roughness={0.45} clearcoat={0.5} clearcoatRoughness={0.4} sheen={0.6} sheenColor="#ff8a5c" />
      </mesh>
      {/* wood trim */}
      <mesh rotation={[Math.PI / 2, 0, 0]} scale={[3.52, 2.18, 0.6]} position={[0, -0.02, 0]} receiveShadow>
        <torusGeometry args={[1, 0.05, 16, 160]} />
        <meshPhysicalMaterial map={wood} roughness={0.3} clearcoat={1} clearcoatRoughness={0.15} />
      </mesh>
      {/* dealer button */}
      <group position={[-1.15, 0, 0.95]}>
        <mesh position={[0, 0.02, 0]} castShadow>
          <cylinderGeometry args={[0.13, 0.13, 0.04, 40]} />
          <meshPhysicalMaterial color="#fffaf0" roughness={0.3} clearcoat={1} />
        </mesh>
      </group>
      {/* deck */}
      <group position={[DECK.x, 0, DECK.z]} rotation={[0, -1.2, 0]}>
        <mesh position={[0, 0.03, 0]} castShadow>
          <boxGeometry args={[0.63, 0.06, 0.88]} />
          <meshStandardMaterial color="#1a0f0b" roughness={0.6} />
        </mesh>
      </group>
    </group>
  );
}

function Rig({ pkey, closeup }: { pkey: ProgressKey; closeup: boolean }) {
  const { camera, pointer, size } = useThree();
  // Wide screens: push the table right so the copy on the left sits on dark rail, not on cards.
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    if (!closeup && size.width >= 1024) cam.setViewOffset(size.width, size.height, -size.width * 0.16, -size.height * 0.04, size.width, size.height);
    else cam.clearViewOffset();
    cam.updateProjectionMatrix();
  }, [camera, size, closeup]);
  const look = useMemo(() => new THREE.Vector3(), []);
  const base = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, dt) => {
    const p = progress[pkey];
    // Hero: dolly in and down as the board fills up. Close-up: low over the pot, sliding around it.
    const far = size.width < size.height ? 1.22 : 1; // portrait phones need more distance
    if (closeup) { base.set((2.7 - p * 3.4) * far, 1.75 - p * 0.3, (3.2 - p * 0.4) * far); look.set(-0.05, 0.05, -0.45); }
    else { base.set(0, (4.7 - p * 1.0) * far, (6.3 - p * 1.4) * far); look.set(0, 0, 0.15); }
    const k = Math.min(1, dt * 2.5);
    camera.position.x += (base.x + pointer.x * 0.45 - camera.position.x) * k;
    camera.position.y += (base.y + pointer.y * 0.2 - camera.position.y) * k;
    camera.position.z += (base.z - camera.position.z) * k;
    camera.lookAt(look);
  });
  return null;
}

/** A card table where the hand is dealt as you scroll. `closeup` frames the pot for the Poker chapter. */
export function PokerTable({ pkey = "hero", closeup = false }: { pkey?: ProgressKey; closeup?: boolean }) {
  const hole = useMemo(() => HOLE.map(([r, s]) => cardFace(r, s)), []);
  const board = useMemo(() => BOARD.map(([r, s]) => cardFace(r, s)), []);
  const potDrop = useRef(0);
  const stackDrop = useRef(0);
  useFrame(() => {
    potDrop.current = seg(progress[pkey], 0.8, 0.98);
    stackDrop.current = seg(progress[pkey], 0.0, 0.12);
  });

  // Flop 0.2–0.45, turn 0.5–0.62, river 0.66–0.78.
  const boardTiming: [number, number][] = [[0.2, 0.32], [0.26, 0.38], [0.32, 0.45], [0.5, 0.62], [0.66, 0.78]];

  return (
    <>
      <color attach="background" args={["#140c08"]} />
      <fog attach="fog" args={["#140c08", 6.5, 12]} />
      <StudioEnv />
      <ambientLight intensity={0.18} color="#ffd9b0" />
      <spotLight position={[0, 5.2, 0.6]} angle={0.75} penumbra={0.65} intensity={95} decay={2} color="#ffd7a8" castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0004} />
      <pointLight position={[-4, 1.5, 3]} intensity={6} color="#ff5a36" />
      <Rig pkey={pkey} closeup={closeup} />
      <Table />

      {/* hole cards (player) */}
      <DealtCard face={hole[0]} slot={[-0.36, 0.012, 1.22]} yaw={0.12} t0={0.0} t1={0.14} scene={pkey} />
      <DealtCard face={hole[1]} slot={[0.36, 0.016, 1.26]} yaw={-0.1} t0={0.05} t1={0.18} scene={pkey} />
      {/* opponents' cards stay face down */}
      {[[-2.15, -0.35, 1.0], [0, -1.32, 0], [2.0, 0.5, -1.05]].map(([x, z, yaw], i) => (
        <group key={i}>
          <DealtCard face={hole[0]} slot={[x - 0.2, 0.012, z]} yaw={yaw} t0={0.02 + i * 0.02} t1={0.14 + i * 0.02} flip={false} scene={pkey} />
          <DealtCard face={hole[1]} slot={[x + 0.2, 0.016, z]} yaw={yaw + 0.15} t0={0.06 + i * 0.02} t1={0.18 + i * 0.02} flip={false} scene={pkey} />
        </group>
      ))}
      {/* board */}
      {board.map((f, i) => (
        <DealtCard key={i} face={f} slot={[-1.44 + i * 0.72, 0.012 + i * 0.001, -0.05]} yaw={0} t0={boardTiming[i][0]} t1={boardTiming[i][1]} scene={pkey} />
      ))}

      {/* stacks */}
      <ChipStack count={9} kind={0} position={[1.25, 0, 1.15]} dropRef={stackDrop} seed={1} />
      <ChipStack count={6} kind={3} position={[1.68, 0, 1.0]} dropRef={stackDrop} seed={2} />
      <ChipStack count={7} kind={1} position={[-2.35, 0, 0.35]} dropRef={stackDrop} seed={3} />
      <ChipStack count={5} kind={2} position={[0.75, 0, -1.4]} dropRef={stackDrop} seed={4} />
      {/* the pot lands at the end */}
      <ChipStack count={8} kind={3} position={[-0.25, 0, -0.95]} dropRef={potDrop} seed={5} />
      <ChipStack count={5} kind={0} position={[0.2, 0, -1.0]} dropRef={potDrop} seed={6} />
      <ChipStack count={6} kind={2} position={[-0.02, 0, -0.62]} dropRef={potDrop} seed={7} />
    </>
  );
}

export default function PokerScene() {
  return <PokerTable />;
}

export function PokerCloseup() {
  return <PokerTable pkey="poker" closeup />;
}
