"use client";
import { ViewTransition, useEffect, useRef, type ReactNode, type RefObject } from "react";
import { hangar, worldOrder, worlds } from "@/content";
import { TLink } from "@/components/shell/TLink";
import { portalName } from "@/lib/portal";
import { FpvPreview, JarvisPreview, LobbyPreview, WebPreview } from "./Previews";
import s from "./hangar.module.css";

const preview: Record<(typeof worldOrder)[number], ReactNode> = {
  lobby: <LobbyPreview />,
  fpv: <FpvPreview />,
  jarvis: <JarvisPreview />,
  web: <WebPreview />,
};

/** Tint the whole hangar toward the hovered/focused world. */
function peek(id: string | null) {
  const el = document.querySelector<HTMLElement>('[data-world="hangar"]');
  if (!el) return;
  if (id) el.dataset.peek = id;
  else delete el.dataset.peek;
}

/**
 * Phones / narrow screens: the doors are a sticky deck. Each card pins under the one before it,
 * the covered card shrinks and dims, and the card on top is "active": it gets the hover look and
 * tints the hangar toward its world. Desktop keeps the hover accordion.
 */
function useDeck(box: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const mq = window.matchMedia("(max-width: 1023px)");
    let raf = 0, current = "";
    const update = () => {
      raf = 0;
      const doors = [...el.children] as HTMLElement[];
      if (!mq.matches) {
        doors.forEach((d) => { d.style.removeProperty("--cover"); delete d.dataset.active; });
        return;
      }
      const vh = innerHeight;
      const rects = doors.map((d) => d.getBoundingClientRect());
      let active = -1;
      rects.forEach((r, i) => {
        const next = rects[i + 1];
        const cover = next ? Math.min(1, Math.max(0, (r.top + r.height - next.top) / (r.height - 12))) : 0;
        doors[i].style.setProperty("--cover", cover.toFixed(3));
        if (r.top < vh * 0.62) active = i;
      });
      const box = el.getBoundingClientRect();
      if (box.bottom < vh * 0.35 || box.top > vh * 0.62) active = -1;
      const id = active >= 0 ? doors[active].dataset.id ?? "" : "";
      if (id !== current) {
        current = id;
        doors.forEach((d, i) => { if (i === active) d.dataset.active = "1"; else delete d.dataset.active; });
        peek(id || null);
      }
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(update); };
    addEventListener("scroll", kick, { passive: true });
    addEventListener("resize", kick);
    mq.addEventListener("change", kick);
    kick();
    return () => { cancelAnimationFrame(raf); removeEventListener("scroll", kick); removeEventListener("resize", kick); mq.removeEventListener("change", kick); };
  }, [box]);
}

export function Doors() {
  const deck = useRef<HTMLDivElement>(null);
  useDeck(deck);
  return (
    <section id="projects" aria-labelledby="doors-h" className="mx-auto max-w-[1600px] scroll-mt-20 px-4 py-20 sm:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <h2 id="doors-h" className="font-display text-[clamp(2rem,4vw,3.4rem)] leading-none font-semibold">{hangar.doorsTitle}</h2>
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted">{hangar.doorsLead}</p>
      </div>
      <div ref={deck} className={s.doors} onPointerLeave={() => { if (window.matchMedia("(min-width: 1024px)").matches) peek(null); }}>
        {worldOrder.map((id, i) => {
          const w = worlds[id];
          const names = portalName(id);
          return (
              <ViewTransition key={id} name={names.frame} share="morph" default="none">
                <TLink
                  href={w.route}
                  className={`${s.door} ${s[id]}`}
                  data-id={id}
                  style={{ ["--i" as string]: i }}
                  onPointerEnter={(e) => { if (e.pointerType === "mouse") peek(id); }}
                  onFocus={() => peek(id)}
                  onBlur={() => peek(null)}
                >
                  <div aria-hidden="true" className="absolute inset-0 -z-10">{preview[id]}</div>
                  <div className={s.doorTop}>
                    <span>0{i + 1}</span>
                    <span>{w.kind}</span>
                  </div>
                  <div>
                    <ViewTransition name={names.title} share="morph" default="none">
                      <h3 className={s.doorTitle}>{w.title}</h3>
                    </ViewTransition>
                    <p className={s.doorLine}>{w.tagline}</p>
                    <span className={s.enter}>{hangar.enter} <span aria-hidden="true">→</span></span>
                  </div>
                </TLink>
              </ViewTransition>
          );
        })}
      </div>
    </section>
  );
}
