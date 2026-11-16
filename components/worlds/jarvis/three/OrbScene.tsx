"use client";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { pulse } from "../pulse";

// A calm, breathing sphere: simplex-noise displacement + fresnel rim. It "speaks" when the page
// kicks pulse.energy (a message arrives, a diagram node lights up) and leans toward the pointer.

const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

const vert = /* glsl */ `
uniform float uTime; uniform float uEnergy;
varying vec3 vN; varying vec3 vView; varying float vD; varying vec3 vPos;
${NOISE}
void main(){
  float slow = snoise(normal * 1.3 + uTime * 0.18);
  float fast = snoise(normal * 3.4 + uTime * 0.9) * uEnergy;
  float d = slow * 0.055 + fast * 0.1;
  vD = d;
  vec3 p = position + normal * d;
  vPos = p;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vN = normalize(normalMatrix * normal);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;

const frag = /* glsl */ `
uniform vec3 uCore; uniform vec3 uRim; uniform float uEnergy; uniform float uTime;
varying vec3 vN; varying vec3 vView; varying float vD; varying vec3 vPos;
float iso(float v, float w){ float d = abs(fract(v) - 0.5); return smoothstep(0.5 - fwidth(v) * w, 0.5, d); }
void main(){
  float f = pow(1.0 - max(dot(vN, vView), 0.0), 2.2);
  // Contour lines: latitude bands bent by the displacement, drifting slowly upward.
  float lines = iso(vPos.y * 11.0 + vD * 26.0 - uTime * 0.25, 1.4);
  float facing = max(dot(vN, vView), 0.0);
  vec3 col = uRim * lines * (0.35 + facing * 0.65) + uRim * f * (0.35 + uEnergy * 0.8) + uCore * 0.06;
  float a = clamp(lines * (0.25 + facing * 0.75) + f * 0.55 + 0.04, 0.0, 1.0);
  gl_FragColor = vec4(col, a);
}`;

export default function OrbScene() {
  const mesh = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Points>(null);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uEnergy: { value: 0 },
    uCore: { value: new THREE.Color("#2b6f61") },
    uRim: { value: new THREE.Color("#8cf5d2") },
  }), []);
  const haloGeo = useMemo(() => {
    const n = 900, pos = new Float32Array(n * 3);
    let s = 7;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < n; i++) {
      const u = r() * 2 - 1, a = r() * Math.PI * 2, rad = 1.35 + r() * 0.9, q = Math.sqrt(1 - u * u);
      pos.set([Math.cos(a) * q * rad, u * rad, Math.sin(a) * q * rad], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  useFrame(({ clock, pointer }, dt) => {
    pulse.energy = Math.max(0, pulse.energy - dt * 0.6);
    uniforms.uTime.value = clock.elapsedTime;
    uniforms.uEnergy.value += (Math.min(1, pulse.energy) + 0.12 - uniforms.uEnergy.value) * Math.min(1, dt * 4);
    const m = mesh.current;
    if (m) {
      m.rotation.y += dt * 0.08;
      m.position.x += (pointer.x * 0.25 - m.position.x) * Math.min(1, dt * 2);
      m.position.y += (pointer.y * 0.18 - m.position.y) * Math.min(1, dt * 2);
      m.scale.setScalar(1 + Math.sin(clock.elapsedTime * 0.9) * 0.015 + uniforms.uEnergy.value * 0.04);
    }
    if (halo.current) { halo.current.rotation.y -= dt * 0.03; halo.current.rotation.x = Math.sin(clock.elapsedTime * 0.1) * 0.2; }
  });

  return (
    <>
      <mesh ref={mesh}>
        <icosahedronGeometry args={[1, 64]} />
        <shaderMaterial vertexShader={vert} fragmentShader={frag} uniforms={uniforms} transparent depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <points ref={halo} geometry={haloGeo}>
        <pointsMaterial size={0.012} color="#cfe9df" transparent opacity={0.45} sizeAttenuation depthWrite={false} />
      </points>
    </>
  );
}
