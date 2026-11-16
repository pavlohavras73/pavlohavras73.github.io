"use client";
import { ViewTransition, useEffect, useRef, useState } from "react";
import { webNote, webPage, webProjects, worlds } from "@/content";
import { portalName } from "@/lib/portal";
import { TLink } from "@/components/shell/TLink";
import { Spray } from "./Spray";
import { Distort } from "./Distort";
import s from "./web.module.css";

const names = portalName("web");
const SPRAY = ["#c6ff1a", "#c6ff1a", "#ff4b1f"];

/** A tape band that runs forever. Duplicated content so the loop is seamless. */
export function Tape({ items, tone = "lime", angle = -3, reverse = false }: { items: string[]; tone?: "lime" | "black" | "orange"; angle?: number; reverse?: boolean }) {
  const row = items.map((t) => `${t}`);
  return (
    <div className={s.tape} data-tone={tone} style={{ ["--angle" as string]: `${angle}deg` }} aria-hidden="true">
      <div className={s.tapeTrack} data-reverse={reverse ? "1" : ""}>
        {[0, 1].map((k) => (
          <span key={k}>{row.map((t, i) => <b key={i}>{t}<i>{"///"}</i></b>)}</span>
        ))}
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <ViewTransition name={names.frame} share="morph" default="none">
      <section className={s.hero} aria-labelledby="web-h">
        <div className={s.dots} aria-hidden="true" />
        <Spray className={s.spray} colors={SPRAY} />
        <div className={s.heroInner}>
          <p className={s.kicker}>{webPage.kicker}</p>
          <ViewTransition name={names.title} share="morph" default="none">
            <h1 id="web-h" className={s.title} aria-label={worlds.web.title}>
              <span className={s.titleLine} data-text="WEB" aria-hidden="true">WEB</span>
              <span className={s.titleLine} data-text="SHOWCASE" aria-hidden="true">SHOWCASE</span>
            </h1>
          </ViewTransition>
          <p className={s.lead}>{worlds.web.tagline} <span className="text-muted">{webNote}</span></p>
          <span className={s.sticker} aria-hidden="true"><em>{webPage.sticker}</em><small>7 drops</small></span>
        </div>
        <div className={s.tapes}>
          <Tape items={webPage.tape} tone="lime" angle={-4} />
          <Tape items={webPage.tape} tone="black" angle={3} reverse />
        </div>
      </section>
    </ViewTransition>
  );
}

export function Index() {
  const [active, setActive] = useState<string | null>(null);
  const [touch, setTouch] = useState(false);
  const list = useRef<HTMLOListElement>(null);
  useEffect(() => {
    if (window.matchMedia("(hover: none)").matches) {
      // Phones: no hover, so the row crossing the middle of the screen lights up and plays its clip.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only capability check
      setTouch(true);
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) setActive((e.target as HTMLElement).dataset.slug ?? null); });
      }, { rootMargin: "-46% 0px -46% 0px" });
      list.current?.querySelectorAll("[data-slug]").forEach((r) => io.observe(r));
      return () => io.disconnect();
    }
    // Mouse: scrolling moves rows out from under a still pointer, drop the preview until it moves.
    const off = () => setActive(null);
    window.addEventListener("scroll", off, { passive: true });
    return () => window.removeEventListener("scroll", off);
  }, []);
  return (
    <section aria-labelledby="drops-h" className={s.index} onPointerLeave={() => { if (!touch) setActive(null); }}>
      <div className={s.indexHead}>
        <h2 id="drops-h" className={s.h2}>{webPage.indexTitle}</h2>
        <p className={s.hint}><span className={s.hintFine}>{webPage.indexHint}</span><span className={s.hintTouch}>{webPage.indexHintTouch}</span></p>
      </div>
      <ol ref={list} className={s.rows}>
        {webProjects.map((p, i) => (
          <li key={p.slug}>
            <TLink href={`/web/${p.slug}/`} className={s.row} data-slug={p.slug} data-on={active === p.slug ? "1" : ""} onPointerEnter={(e) => { if (e.pointerType === "mouse") setActive(p.slug); }} onFocus={() => setActive(p.slug)} onBlur={() => { if (!touch) setActive(null); }}>
              <span className={s.rowNum}>{String(i + 1).padStart(2, "0")}</span>
              <ViewTransition name={`web-${p.slug}`} share="morph" default="none">
                <span className={s.rowName}>{p.name}</span>
              </ViewTransition>
              <span className={s.rowMeta}>
                <span className={s.rowLine}>{p.line}</span>
                <span className={s.rowTags}>{p.tags.map((t) => <i key={t}>{t}</i>)}</span>
              </span>
              <span className={s.rowThumb}>
                {/* eslint-disable-next-line @next/next/no-img-element -- phones: inline still instead of the hover preview */}
                <img src={p.image} alt="" loading="lazy" decoding="async" width={1280} height={800} />
                {touch && active === p.slug ? <video src={p.video} poster={p.image} muted loop playsInline autoPlay preload="auto" aria-hidden="true" /> : null}
              </span>
            </TLink>
          </li>
        ))}
      </ol>
      <Distort projects={webProjects} active={active} />
    </section>
  );
}
