"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";
import { afterFirstPaint, hasWebGL } from "./support";

const StageCanvas = dynamic(() => import("./StageCanvas"), { ssr: false });

type Props = {
  /** Static frame shown first, and forever without WebGL or with reduced motion. */
  poster: ReactNode;
  /** The R3F scene (already wrapped in next/dynamic by the world, so three.js stays out of the main bundle). */
  Scene: ComponentType;
  className?: string;
  /** Show the poster on phones too (for scenes too heavy for mobile). */
  posterOnMobile?: boolean;
  label?: string;
};

/**
 * One 3D stage: poster first → WebGL scene after first paint, only while near the viewport.
 * Decorative by default (aria-hidden); the page content never depends on it.
 */
export function Stage({ poster, Scene, className, posterOnMobile = false, label }: Props) {
  const reduce = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const [mount, setMount] = useState(false);
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (reduce || !hasWebGL()) return;
    if (posterOnMobile && window.matchMedia("(max-width: 767px)").matches) return;
    return afterFirstPaint(() => setMount(true));
  }, [reduce, posterOnMobile]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "200px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={box} className={className} style={{ position: "relative" }} aria-hidden={label ? undefined : true} role={label ? "img" : undefined} aria-label={label}>
      <div style={{ position: "absolute", inset: 0, transition: "opacity .6s", opacity: ready ? 0 : 1 }}>{poster}</div>
      {mount && !reduce ? (
        <StageCanvas active={visible} onReady={() => setReady(true)}>
          <Scene />
        </StageCanvas>
      ) : null}
    </div>
  );
}
