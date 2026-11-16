"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { afterFirstPaint, hasWebGL, isPhone } from "./support";
import { onFirstInteraction } from "./interaction";

const StageCanvas = dynamic(() => import("./StageCanvas"), { ssr: false });

type Props = {
  /** Static frame shown first (and forever without WebGL). */
  poster: ReactNode;
  /** The R3F scene (already wrapped in next/dynamic by the world, so three.js stays out of the main bundle). */
  Scene: ComponentType;
  className?: string;
  /** Show the poster on phones too (for scenes too heavy for mobile). */
  posterOnMobile?: boolean;
  label?: string;
  /** Passed to the R3F canvas. */
  camera?: { position: [number, number, number]; fov?: number };
  shadows?: boolean;
};

/**
 * One 3D stage: poster first → WebGL scene after first paint, only while near the viewport.
 * Decorative by default (aria-hidden); the page content never depends on it.
 * `className` must position the box (relative / absolute / sticky): poster and canvas fill it.
 */
export function Stage({ poster, Scene, className, posterOnMobile = false, label, camera, shadows }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const [mount, setMount] = useState(false);
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);

  // Mount the canvas only when (a) the visitor has interacted, (b) the stage is within about a
  // screen of the viewport. Desktop: once mounted it stays, rendering only while visible.
  // Phones: a stage that scrolls far away is unmounted (its WebGL context freed) and shows its
  // poster again, so iOS never holds several 3D scenes at once (it runs out of GPU memory and
  // stops painting parts of the page).
  const [near, setNear] = useState(false);
  const [alive, setAlive] = useState(false);
  const [lost, setLost] = useState(false);
  useEffect(() => {
    // Reduced motion still gets the real (still, draggable) 3D: scenes stop their own movement.
    if (!hasWebGL()) return;
    if (posterOnMobile && window.matchMedia("(max-width: 767px)").matches) return;
    let cancelPaint = () => {};
    const cancelWait = onFirstInteraction(() => { cancelPaint = afterFirstPaint(() => setAlive(true)); });
    return () => { cancelWait(); cancelPaint(); };
  }, [posterOnMobile]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "200px 0px" });
    const phone = isPhone();
    const ioNear = new IntersectionObserver(([e]) => { if (e.isIntersecting) setNear(true); else if (phone) setNear(false); }, { rootMargin: phone ? "60% 0px" : "100% 0px" });
    io.observe(el); ioNear.observe(el);
    return () => { io.disconnect(); ioNear.disconnect(); };
  }, []);

  useEffect(() => {
    // Publishing the mount decision once both conditions hold.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (alive && near && !lost) setMount(true);
    else if (!near || lost) { setMount(false); setReady(false); }
  }, [alive, near, lost]);

  return (
    <div ref={box} className={className ?? "relative"} aria-hidden={label ? undefined : true} role={label ? "img" : undefined} aria-label={label}>
      <div style={{ position: "absolute", inset: 0, transition: "opacity .6s", opacity: ready ? 0 : 1 }}>{poster}</div>
      {mount ? (
        <StageCanvas active={visible} onReady={() => setReady(true)} onLost={() => setLost(true)} camera={camera} shadows={shadows}>
          <Scene />
        </StageCanvas>
      ) : null}
    </div>
  );
}
