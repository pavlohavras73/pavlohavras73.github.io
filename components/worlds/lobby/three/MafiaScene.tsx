"use client";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { lobby } from "@/content";
import { Card, StudioEnv, ease, progress, seg, useCardBack } from "./shared";
import { roleCard, woodTexture } from "./textures";

const NIGHT_KEY = new THREE.Color("#7f9cff"), DAY_KEY = new THREE.Color("#ffd2a0");
const NIGHT_BG = new THREE.Color("#0a0d18"), DAY_BG = new THREE.Color("#3b2318");

/** Three role cards standing on a table. Night → cards turn over one by one → dawn breaks. */
export default function MafiaScene() {
  const { camera, pointer, scene, size } = useThree();
  const faces = useMemo(() => lobby.mafiaRoles.map((r) => roleCard(r.role, r.line, r.color)), []);
  const back = useCardBack("#ff4a3d");
  const wood = useMemo(() => woodTexture("#3a1d10", "#120703", 21), []);
  const cards = useRef<(THREE.Group | null)[]>([]);
  const key = useRef<THREE.DirectionalLight>(null);
  const candle = useRef<THREE.PointLight>(null);
  const sky = useRef<THREE.Group>(null);
  const skyMat = useRef<THREE.MeshBasicMaterial>(null);
  const bg = useMemo(() => new THREE.Color(), []);

  useFrame(({ clock }, dt) => {
    const p = progress.mafia;
    const dawn = ease(seg(p, 0.62, 0.95));
    // Cards flip one by one.
    cards.current.forEach((g, i) => {
      if (!g) return;
      const t = ease(seg(p, 0.18 + i * 0.13, 0.32 + i * 0.13));
      const x = (i - 1) * 0.95;
      g.position.set(x, 0.46 + Math.sin(t * Math.PI) * 0.18, Math.abs(i - 1) * 0.25);
      g.rotation.set(-0.12, Math.PI * (1 - t) + (1 - i) * 0.22, (i - 1) * -0.04);
      // The mafia card pulses red once everyone is revealed.
      if (i === 2) g.scale.setScalar(1 + Math.sin(clock.elapsedTime * 3) * 0.015 * seg(p, 0.6, 0.7));
    });
    // Night → day: key light colour/angle, background, moon down / sun up.
    if (key.current) {
      key.current.color.copy(NIGHT_KEY).lerp(DAY_KEY, dawn);
      key.current.intensity = 1.6 + dawn * 2.2;
      key.current.position.set(-3 + dawn * 6, 2.5 + dawn * 1.5, 2);
    }
    if (candle.current) candle.current.intensity = (1 - dawn) * (5 + Math.sin(clock.elapsedTime * 13) * 0.6 + Math.sin(clock.elapsedTime * 7.3) * 0.4);
    bg.copy(NIGHT_BG).lerp(DAY_BG, dawn);
    scene.background = bg;
    if (sky.current && skyMat.current) {
      const a = Math.PI * (0.25 + dawn * 0.5);
      sky.current.position.set(Math.cos(a) * 3.0, -0.2 + Math.sin(a) * 2.2, -4.5);
      skyMat.current.color.set(dawn < 0.5 ? "#dfe6ff" : "#ffcf7a");
    }
    const k = Math.min(1, dt * 2.5);
    camera.position.x += (pointer.x * 0.35 - camera.position.x) * k;
    camera.position.y += (1.35 + pointer.y * 0.15 - camera.position.y) * k;
    const far = size.width / size.height < 1.1 ? 4.9 : 4.1;
    camera.position.z += (far - camera.position.z) * k;
    camera.lookAt(0, 0.45, 0);
  });

  return (
    <>
      <StudioEnv warm="#ffc890" cool="#8aa2ff" />
      <ambientLight intensity={0.25} />
      <directionalLight ref={key} castShadow shadow-mapSize={[1024, 1024]} />
      <pointLight ref={candle} position={[0, 0.35, 0.9]} color="#ff9a4a" distance={4} decay={2} />
      {/* moon / sun */}
      <group ref={sky}>
        <mesh>
          <circleGeometry args={[0.16, 48]} />
          <meshBasicMaterial ref={skyMat} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0, -0.01]}>
          <circleGeometry args={[0.55, 48]} />
          <meshBasicMaterial color="#ffd9a0" transparent opacity={0.08} depthWrite={false} />
        </mesh>
      </group>
      {/* table */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[2.6, 96]} />
        <meshPhysicalMaterial map={wood} roughness={0.38} clearcoat={0.7} clearcoatRoughness={0.25} />
      </mesh>
      {/* candle */}
      <group position={[0, 0, 0.9]}>
        <mesh position={[0, 0.12, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.07, 0.24, 24]} />
          <meshStandardMaterial color="#f3e7d1" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.28, 0]}>
          <sphereGeometry args={[0.025, 16, 16]} />
          <meshBasicMaterial color="#ffcf7a" toneMapped={false} />
        </mesh>
      </group>
      {faces.map((f, i) => (
        <Card key={i} face={f} back={back} poseRef={(g) => { cards.current[i] = g; }} />
      ))}
    </>
  );
}
