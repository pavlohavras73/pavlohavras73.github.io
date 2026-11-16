"use client";
import { ViewTransition, useCallback, useEffect, useRef } from "react";
import { lobby, worlds } from "@/content";
import { Stage } from "@/lib/three/Stage";
import { portalName } from "@/lib/portal";
import { prefersReducedMotion } from "@/lib/motion/useReducedMotion";
import { gsap } from "@/lib/motion/gsap";
import { PokerScene } from "./scenes";
import { progress } from "./progress";
import { useSceneProgress } from "./useSceneProgress";
import { Kicker, PlayButton, Poster } from "./Bits";
import s from "./lobby.module.css";

const names = portalName("lobby");

/**
 * Pinned hero: the poker table deals a hand as you scroll, and the four steps of starting a
 * game night appear alongside (create → share code → bots fill seats → deal).
 */
export function Hero() {
  const section = useRef<HTMLElement>(null);
  const steps = useRef<HTMLOListElement>(null);
  const intro = useRef({ v: 0 });
  const scroll = useRef(0);

  const apply = useCallback(() => {
    // The first cards are dealt on load; scrolling deals the rest.
    progress.hero = Math.max(scroll.current, intro.current.v);
    const items = steps.current?.children;
    if (!items) return;
    const active = Math.min(items.length - 1, Math.floor(progress.hero * items.length * 0.999));
    for (let i = 0; i < items.length; i++) (items[i] as HTMLElement).dataset.on = i <= active ? "1" : "";
  }, []);

  useSceneProgress(section, "hero", "top top", "bottom bottom", (p) => { scroll.current = p; apply(); });

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const t = gsap.to(intro.current, { v: 0.19, duration: 2.2, delay: 0.6, ease: "power2.inOut", onUpdate: apply });
    return () => { t.kill(); };
  }, [apply]);

  return (
    <section ref={section} className={s.heroTrack} aria-labelledby="lobby-h">
      <ViewTransition name={names.frame} share="morph" default="none">
        <div className={s.heroPin}>
          <Stage
            className="absolute inset-0"
            Scene={PokerScene}
            camera={{ position: [0, 3.6, 4.9], fov: 38 }}
            shadows
            poster={<Poster src="/img/lobby/poster-poker.webp" />}
          />
          <div className={s.heroShade} aria-hidden="true" />
          <div className="relative z-10 mx-auto flex h-full max-w-[1600px] flex-col px-4 pt-24 pb-8 sm:px-8 sm:pb-12">
            <Kicker>{lobby.hero.kicker}</Kicker>
            <ViewTransition name={names.title} share="morph" default="none">
              <h1 id="lobby-h" className="mt-4 font-display text-[clamp(3.6rem,13vw,12rem)] leading-[0.82] font-extrabold tracking-[-0.045em]">
                {worlds.lobby.title}
              </h1>
            </ViewTransition>
            <p className="mt-5 max-w-[22ch] font-display text-[clamp(1.5rem,3vw,2.6rem)] leading-[1.02] font-bold">
              {lobby.hero.title} <span className="font-accent font-normal italic text-accent-2">{lobby.hero.titleAccent}</span>
            </p>
            <div className="mt-auto grid items-end gap-8 md:grid-cols-[1fr_auto]">
              <div>
                <p className="max-w-[44ch] text-base text-fg/85 sm:text-lg">{lobby.hero.lead}</p>
                <ol ref={steps} className={s.steps}>
                  {lobby.howItWorks.map((h, i) => (
                    <li key={h.step}>
                      <span className={s.stepNum}>{i + 1}</span>
                      <span><b>{h.step}</b> <span className="text-muted">{h.body}</span></span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="hidden md:block"><PlayButton size="xl" /></div>
            </div>
          </div>
        </div>
      </ViewTransition>
    </section>
  );
}
