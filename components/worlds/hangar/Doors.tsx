"use client";
import { ViewTransition, type ReactNode } from "react";
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

export function Doors() {
  return (
    <section id="projects" aria-labelledby="doors-h" className="mx-auto max-w-[1600px] scroll-mt-20 px-4 py-20 sm:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <h2 id="doors-h" className="font-display text-[clamp(2rem,4vw,3.4rem)] leading-none font-semibold">{hangar.doorsTitle}</h2>
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted">{hangar.doorsLead}</p>
      </div>
      <div className={s.doors} onPointerLeave={() => peek(null)}>
        {worldOrder.map((id, i) => {
          const w = worlds[id];
          const names = portalName(id);
          return (
              <ViewTransition key={id} name={names.frame} share="morph" default="none">
                <TLink
                  href={w.route}
                  className={`${s.door} ${s[id]}`}
                  onPointerEnter={() => peek(id)}
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
