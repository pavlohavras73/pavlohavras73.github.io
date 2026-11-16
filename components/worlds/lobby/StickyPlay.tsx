"use client";
import { useEffect, useRef } from "react";
import { worlds } from "@/content";
import s from "./lobby.module.css";

const play = worlds.lobby.cta;

/**
 * Phones: Play now stays at the bottom of the screen, but slides away while you scroll down
 * (so it never sits on top of what you are reading) and comes back when you scroll up or stop.
 */
export function StickyPlay() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let last = scrollY, timer = 0;
    const on = () => {
      const y = scrollY, down = y > last + 4, up = y < last - 4;
      if (down && y > 200) el.dataset.hide = "1";
      if (up) delete el.dataset.hide;
      if (down || up) last = y;
      clearTimeout(timer);
      timer = window.setTimeout(() => { delete el.dataset.hide; }, 900);
    };
    addEventListener("scroll", on, { passive: true });
    return () => { removeEventListener("scroll", on); clearTimeout(timer); };
  }, []);
  return (
    <div ref={ref} className={s.sticky}>
      <a href={play.href} target="_blank" rel="noopener noreferrer" className={s.play}>
        <span>{play.label}</span>
        <span aria-hidden="true" className={s.playArrow}>↗</span>
      </a>
    </div>
  );
}
