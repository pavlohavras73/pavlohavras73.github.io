"use client";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { drones } from "@/content";

/** Ready for meshopt-compressed models; the decoder ships with three (no CDN). */
const extendLoader = (loader: GLTFLoader) => { loader.setMeshoptDecoder(MeshoptDecoder); };
import { droneSel } from "../droneSel";

// Ported from the old portfolio's drones.js (props spin about their hub, on the shaft axis,
// diagonal pairs in opposite directions, spool-up on every appearance).

const bodyMat = new THREE.MeshPhysicalMaterial({ color: 0x24262b, metalness: 0.55, roughness: 0.36, clearcoat: 0.8, clearcoatRoughness: 0.25 });
const accentMat = new THREE.MeshPhysicalMaterial({ color: 0xffb020, metalness: 0.2, roughness: 0.3, emissive: 0xff8a00, emissiveIntensity: 0.25, clearcoat: 1 });
const propMat = new THREE.MeshPhysicalMaterial({ color: 0x3dff8e, metalness: 0, roughness: 0.25, transmission: 0.3, thickness: 0.02, transparent: true, opacity: 0.85, emissive: 0x1fd16c, emissiveIntensity: 0.2 });

type Prepared = { root: THREE.Group; spinners: THREE.Object3D[] };

function prepare(scene: THREE.Group): Prepared {
  const root = scene.clone(true);
  const props: THREE.Mesh[] = [];
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    m.geometry = m.geometry.clone();
    const n = (m.name + " " + (m.parent?.name || "")).toLowerCase();
    if (n.includes("prop")) { m.material = propMat; props.push(m); }
    else if (n.includes("nose")) m.material = accentMat;
    else m.material = bodyMat;
    m.castShadow = true;
    m.geometry.computeVertexNormals();
  });
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
  root.position.sub(c);
  const g = new THREE.Group();
  g.add(root);
  g.scale.setScalar(1.15 / Math.max(size.x, size.y, size.z));
  props.forEach((p) => {
    const geo = p.geometry, pos = geo.attributes.position, hub = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) hub.add(new THREE.Vector3().fromBufferAttribute(pos, i));
    hub.divideScalar(pos.count);
    geo.translate(-hub.x, -hub.y, -hub.z);
    p.position.add(hub.clone().multiply(p.scale).applyQuaternion(p.quaternion));
    geo.computeBoundingBox();
    const ext = geo.boundingBox!.getSize(new THREE.Vector3()).toArray();
    p.userData.axis = new THREE.Vector3().setComponent(ext.indexOf(Math.min(...ext)), 1);
    p.userData.dir = /_(fr|rl|br|bl)\b/i.test(p.name) ? 1 : -1;
  });
  return { root: g, spinners: props };
}

function Drone({ id }: { id: string }) {
  const gltf = useLoader(GLTFLoader, `/drones/${id}.glb`, extendLoader);
  const d = useMemo(() => prepare(gltf.scene as unknown as THREE.Group), [gltf]);
  const holder = useRef<THREE.Group>(null);
  const spool = useRef(0);
  const grow = useRef(0);
  useEffect(() => { spool.current = 0; grow.current = 0; }, [id]);
  useFrame((_, dt) => {
    spool.current = Math.min(1, spool.current + dt / 1.2);
    grow.current = Math.min(1, grow.current + dt / 0.8);
    const e = 1 - Math.pow(1 - grow.current, 3);
    if (holder.current) { holder.current.scale.setScalar(Math.max(0.001, e)); holder.current.rotation.y = -1.2 * (1 - e); }
    // ~2.2 rev/s reads as rotation; real rpm strobes on a 60 Hz screen.
    const w = 14 * (1 - Math.pow(1 - spool.current, 3)) * dt;
    d.spinners.forEach((p) => p.rotateOnAxis(p.userData.axis as THREE.Vector3, w * (p.userData.dir as number)));
  });
  return <group ref={holder}><primitive object={d.root} /></group>;
}

/** The drone on a pedestal of light. Drag to turn; the selected drone comes from droneSel. */
export default function DroneScene() {
  const [id, setId] = useState(drones[droneSel.index].id);
  const pivot = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const { pointer, gl, camera } = useThree();
  useEffect(() => { camera.lookAt(0, 0, 0); }, [camera]);
  const drag = useRef({ on: false, x: 0, v: 0, resume: 0 });

  useEffect(() => {
    const el = gl.domElement;
    el.style.touchAction = "pan-y";
    el.style.cursor = "grab";
    const down = (e: PointerEvent) => { drag.current = { on: true, x: e.clientX, v: 0, resume: 0 }; el.setPointerCapture(e.pointerId); el.style.cursor = "grabbing"; droneSel.hold = true; };
    const move = (e: PointerEvent) => { if (!drag.current.on || !pivot.current) return; const dx = e.clientX - drag.current.x; pivot.current.rotation.y += dx * 0.009; drag.current.v = dx * 0.5; drag.current.x = e.clientX; };
    const up = () => { drag.current.on = false; drag.current.resume = performance.now() + 2500; el.style.cursor = "grab"; droneSel.hold = false; };
    el.addEventListener("pointerdown", down); el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
    return () => { el.removeEventListener("pointerdown", down); el.removeEventListener("pointermove", move); el.removeEventListener("pointerup", up); el.removeEventListener("pointercancel", up); };
  }, [gl]);

  useFrame(({ clock }, dt) => {
    const want = drones[droneSel.index].id;
    if (want !== id) {
      setId(want);
      // Fetch only the next drone in the background, not the whole fleet.
      useLoader.preload(GLTFLoader, `/drones/${drones[(droneSel.index + 1) % drones.length].id}.glb`, extendLoader);
    }
    const p = pivot.current;
    if (!p) return;
    if (!drag.current.on) {
      drag.current.v *= Math.exp(-3.5 * dt);
      const auto = performance.now() < drag.current.resume || droneSel.reduce ? 0 : 0.45;
      p.rotation.y += dt * (auto + drag.current.v);
    }
    p.rotation.x += (0.18 + pointer.y * 0.2 - p.rotation.x) * 0.05;
    p.rotation.z += (-pointer.x * 0.18 - p.rotation.z) * 0.05;
    p.position.y = Math.sin(clock.elapsedTime * 1.6) * 0.04;
    if (ring.current) ring.current.scale.setScalar(0.8 + Math.sin(clock.elapsedTime * 2) * 0.016);
  });

  return (
    <>
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.5} color="#ffe2c0" position={[0, 4, 2]} rotation={[-Math.PI / 3, 0, 0]} scale={[5, 3, 1]} />
        <Lightformer form="rect" intensity={1.5} color="#3dff8e" position={[-4, 1, -3]} rotation={[0, Math.PI / 3, 0]} scale={[3, 2, 1]} />
        <Lightformer form="ring" intensity={1.5} color="#ffb020" position={[3, 1, 3]} scale={1.5} />
      </Environment>
      <directionalLight position={[3, 4, 2]} intensity={2.4} color="#ffe2cc" />
      <directionalLight position={[-4, 2, -3]} intensity={1.6} color="#7dffb6" />
      <pointLight position={[0, -0.6, 0]} intensity={4} distance={4} color="#ffb020" />
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.36, 0]}>
        <ringGeometry args={[0.78, 0.8, 128]} />
        <meshBasicMaterial color="#3dff8e" transparent opacity={0.55} side={THREE.DoubleSide} />
      </mesh>
      <group ref={pivot}>
        <Suspense fallback={null}>
          <Drone key={id} id={id} />
        </Suspense>
      </group>
    </>
  );
}
