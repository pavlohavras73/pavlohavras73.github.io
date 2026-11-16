"use client";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { flight, terrainHeight, TERRAIN_GLSL } from "../flight";

const SIZE = 700, SEG = 240;

const vert = /* glsl */ `
uniform vec2 uOffset;
uniform float uHeading;
varying vec3 vWorld;
varying float vDist;
${TERRAIN_GLSL}
void main() {
  // The mesh stays around the camera; the world slides underneath it (infinite flight).
  float c = cos(uHeading), s = sin(uHeading);
  vec2 local = position.xy;                       // plane is XY, rotated to XZ below
  vec2 world = vec2(c * local.x - s * -local.y, s * local.x + c * -local.y) + uOffset;
  float h = terrainHeight(world);
  vec3 p = vec3(local.x, h, -local.y);
  vWorld = vec3(world.x, h, world.y);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vDist = -mv.z;
  gl_Position = projectionMatrix * mv;
}
`;

const frag = /* glsl */ `
uniform vec3 uGreen;
uniform vec3 uAmber;
uniform float uTime;
varying vec3 vWorld;
varying float vDist;

float line(float v, float w) {
  float d = abs(fract(v - 0.5) - 0.5);
  return 1.0 - smoothstep(0.0, fwidth(v) * w, d);
}

void main() {
  float h = vWorld.y;
  // flat-shaded relief from screen-space derivatives
  vec3 n = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
  float lit = clamp(dot(n, normalize(vec3(-0.4, 0.8, -0.3))), 0.0, 1.0);
  vec3 col = vec3(0.006, 0.012, 0.008) + vec3(0.02, 0.05, 0.03) * lit;

  float minor = line(h / 3.0, 1.1);
  float major = line(h / 15.0, 1.4);
  float grid = max(line(vWorld.x / 40.0, 0.9), line(vWorld.z / 40.0, 0.9)) * 0.22;

  col += uGreen * (minor * 0.55 + grid);
  col = mix(col, uAmber, major * 0.85);

  float fog = smoothstep(60.0, 330.0, vDist);
  col = mix(col, vec3(0.012, 0.016, 0.012), fog);
  gl_FragColor = vec4(col, 1.0);
}
`;

/** Contour-line terrain flown in first person. Scroll = throttle, pointer = roll / pitch. */
export default function TerrainScene() {
  const { camera, pointer, size } = useThree();
  const mat = useRef<THREE.ShaderMaterial>(null);
  const geo = useMemo(() => new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG), []);
  const uniforms = useMemo(() => ({
    uOffset: { value: new THREE.Vector2(0, 0) },
    uHeading: { value: 0 },
    uTime: { value: 0 },
    uGreen: { value: new THREE.Color("#3dff8e").convertSRGBToLinear() },
    uAmber: { value: new THREE.Color("#ffb020").convertSRGBToLinear() },
  }), []);
  const st = useRef({ heading: 0, x: 0, z: 0, y: 30, roll: 0, pitch: 0 });
  const touch = size.width < 768;

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20);
    const s = st.current;
    const t = clock.elapsedTime;
    // Throttle: base + scroll position + a kick from scroll speed.
    const target = Math.min(1, 0.18 + flight.progress * 0.6 + Math.min(0.3, Math.abs(flight.scrollV) * 0.012));
    flight.throttle += (target - flight.throttle) * Math.min(1, dt * 2.2);
    const speed = 9 + flight.throttle * 58; // m/s
    flight.speed = speed * 3.6;

    // Sticks: pointer on desktop, a gentle S-curve on touch screens.
    const rx = touch ? Math.sin(t * 0.35) * 0.45 : pointer.x;
    const ry = touch ? Math.sin(t * 0.23) * 0.2 : pointer.y;
    s.roll += (rx * 0.6 - s.roll) * Math.min(1, dt * 3);
    s.pitch += (ry * 0.18 - s.pitch) * Math.min(1, dt * 3);
    s.heading += s.roll * dt * 0.55; // bank right → turn right

    // Move forward along the heading.
    // forward in world space is (sin h, -cos h) — see the vertex shader's rotation
    s.x += Math.sin(s.heading) * speed * dt;
    s.z += -Math.cos(s.heading) * speed * dt;

    // Hold a clearance above the highest ground just ahead.
    let ground = -1e9;
    for (const d of [0, 25, 55, 90]) ground = Math.max(ground, terrainHeight(s.x + Math.sin(s.heading) * d, s.z - Math.cos(s.heading) * d));
    const clearance = 9 + (1 - flight.throttle) * 10;
    s.y += (ground + clearance - s.y) * Math.min(1, dt * 1.6);
    flight.alt = s.y - terrainHeight(s.x, s.z);
    flight.roll = s.roll;
    flight.pitch = s.pitch;
    flight.time += dt;
    flight.volts = 25.2 - flight.throttle * 2.4 - Math.min(2.2, flight.time * 0.004);

    uniforms.uOffset.value.set(s.x, s.z);
    uniforms.uHeading.value = s.heading;
    uniforms.uTime.value = t;

    camera.position.set(0, s.y, 0);
    camera.rotation.order = "YXZ";
    camera.rotation.set(-0.16 - s.pitch, 0, -s.roll);
  });

  return (
    <>
      <color attach="background" args={["#030403"]} />
      <mesh geometry={geo} frustumCulled={false}>
        <shaderMaterial ref={mat} vertexShader={vert} fragmentShader={frag} uniforms={uniforms} />
      </mesh>
    </>
  );
}
