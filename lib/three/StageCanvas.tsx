"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { useRef, useState, type ReactNode } from "react";
import { isPhone } from "./support";

// Phones get a lower pixel ratio and no shadow maps: iOS shares GPU memory with the page itself.
const PHONE = typeof window !== "undefined" && isPhone();
const MAX_DPR = PHONE ? 1.4 : 1.75;

function FirstFrame({ onReady }: { onReady: () => void }) {
  const done = useRef(false);
  useFrame(() => {
    if (!done.current) { done.current = true; requestAnimationFrame(onReady); }
  });
  return null;
}

/** The actual R3F canvas: capped pixel ratio, adaptive quality, paused off-screen. */
export default function StageCanvas({ active, onReady, onLost, children, camera, shadows }: { active: boolean; onReady: () => void; onLost?: () => void; children: ReactNode; camera?: { position: [number, number, number]; fov?: number }; shadows?: boolean }) {
  const [dpr, setDpr] = useState(Math.min(typeof window === "undefined" ? 1 : window.devicePixelRatio, MAX_DPR));
  return (
    <Canvas
      style={{ position: "absolute", inset: 0 }}
      dpr={dpr}
      frameloop={active ? "always" : "never"}
      camera={camera ? { fov: 35, ...camera } : undefined}
      shadows={shadows && !PHONE ? "percentage" : false}
      gl={{ antialias: !PHONE, alpha: true, powerPreference: PHONE ? "default" : "high-performance" }}
      onCreated={({ gl }) => {
        // If the browser drops the context anyway, the stage falls back to its poster.
        gl.domElement.addEventListener("webglcontextlost", (e) => { e.preventDefault(); onLost?.(); }, { once: true });
      }}
    >
      <PerformanceMonitor
        onDecline={() => setDpr((d) => Math.max(1, d - 0.5))}
        onIncline={() => setDpr((d) => Math.min(MAX_DPR, d + 0.25))}
        flipflops={3}
        onFallback={() => setDpr(1)}
      />
      <FirstFrame onReady={onReady} />
      {children}
    </Canvas>
  );
}
