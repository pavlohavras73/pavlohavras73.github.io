"use client";
import { useRef, type ComponentType } from "react";
import { lobby } from "@/content";
import { Stage } from "@/lib/three/Stage";
import { useSceneProgress } from "./useSceneProgress";
import { Reveal } from "@/lib/motion/Reveal";
import { Kicker, Phone, Poster } from "./Bits";
import s from "./lobby.module.css";

type Id = "poker" | "mafia" | "chess";

/**
 * One featured game. The 3D table stays pinned while the copy scrolls past it; scroll drives
 * the scene (chips land, roles turn over, the mate plays out). The real game screen sits beside it.
 */
export function Chapter({ id, Scene, camera, extra }: { id: Id; Scene: ComponentType; camera: { position: [number, number, number]; fov?: number }; extra?: string }) {
  const ref = useRef<HTMLElement>(null);
  const visual = useRef<HTMLDivElement>(null);
  const game = lobby.featured.find((f) => f.id === id)!;
  const ch = lobby.chapters[id];
  const screen = lobby.screens[id];
  useSceneProgress(ref, id, "top 60%", "bottom 80%", undefined, { ref: visual, start: "top 85%", end: "bottom 25%" });

  return (
    <section ref={ref} aria-labelledby={`${id}-h`} className={s.chapter} data-game={id}>
      <div ref={visual} className={s.chapterVisual}>
        <Stage className="absolute inset-0" Scene={Scene} camera={camera} shadows poster={<Poster src={`/img/lobby/poster-${id === "poker" ? "pokerclose" : id}.webp`} />} />
        <Phone src={screen.src} alt={screen.alt} className={s.chapterPhone} />
      </div>
      <div className={s.chapterCopy}>
        <div className={s.chapterBlock}>
          <Kicker>{ch.num} · {ch.kicker}</Kicker>
          <h2 id={`${id}-h`} className={`${s.neon} ${s.neonTone} mt-4 font-accent text-[clamp(2.8rem,7vw,6.5rem)] leading-[1]`} data-tone={id}>{game.name}</h2>
          <p className="mt-5 max-w-[34ch] text-[clamp(1.2rem,1.8vw,1.5rem)] font-light leading-snug text-accent-2">{game.line}</p>
          <a href={game.href} target="_blank" rel="noopener noreferrer" className="mt-6 inline-block font-body text-sm font-semibold uppercase tracking-[0.16em] text-accent underline-offset-4 hover:underline">
            Play {game.name} ↗
          </a>
        </div>
        <ul className={s.chapterPoints}>
          {ch.points.map((pt, i) => (
            <Reveal as="li" key={pt} className={s.chapterBlock} variant="float">
              <span className={s.pointNum}>{ch.num}.{i + 1}</span>
              <p className="font-display text-[clamp(1.4rem,2.6vw,2.2rem)] leading-[1.1]">{pt}</p>
            </Reveal>
          ))}
          {extra ? <li className={s.chapterBlock}><p className="max-w-[46ch] text-fg/75">{extra}</p></li> : null}
        </ul>
        <Phone src={screen.src} alt={screen.alt} className={s.chapterPhoneMobile} />
      </div>
    </section>
  );
}
