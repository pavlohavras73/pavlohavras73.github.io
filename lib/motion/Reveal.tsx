"use client";
import { useEffect, useRef, type ElementType, type ReactNode } from "react";
import { prefersReducedMotion } from "./useReducedMotion";

/**
 * Marks its element `data-in="1"` the first time it scrolls into view. Each world styles
 * `[data-reveal]` / `[data-reveal][data-in]` in its own CSS, so the same hook gives a neon flicker
 * in the Lobby, a glitch wipe in FPV and a decode in Jarvis. Content is visible without JS.
 */
export function Reveal({ as: Tag = "div", children, className, delay = 0, variant }: { as?: ElementType; children: ReactNode; className?: string; delay?: number; variant?: string }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.dataset.armed = "1"; // hidden state only once JS is running
    if (prefersReducedMotion()) { el.dataset.in = "1"; return; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.dataset.in = "1"; io.disconnect(); }
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref} className={className} data-reveal={variant ?? ""} style={delay ? { ["--reveal-delay" as string]: `${delay}ms` } : undefined}>
      {children}
    </Tag>
  );
}
