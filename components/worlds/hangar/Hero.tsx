import { hangar, site } from "@/content";
import { Clock } from "./Clock";
import { Field } from "./Field";
import s from "./hangar.module.css";

/** Name rises letter by letter in pure CSS, so it paints immediately (LCP) and needs no JS. */
function Name({ text }: { text: string }) {
  let i = 0;
  return (
    <h1 aria-label={text} className="font-display text-[clamp(4rem,15.5vw,15rem)] leading-[0.86] font-semibold tracking-[-0.035em]">
      {text.split(" ").map((w, wi) => (
        <span key={wi}>
        {wi > 0 ? " " : null}
        <span aria-hidden="true" className={s.word}>
          {[...w].map((c) => (
            <span key={i} className={s.char} style={{ ["--i" as string]: i++ }}>{c}</span>
          ))}
        </span>
        </span>
      ))}
    </h1>
  );
}

export function Hero() {
  const { heroLine } = hangar;
  return (
    <section className={s.hero} aria-label="Intro">
      <div className={s.field}><Field /></div>
      <div className="mx-auto flex min-h-[100svh] max-w-[1600px] flex-col px-4 pt-24 pb-10 sm:px-8">
        <div className={`${s.fadeIn} flex items-start justify-between gap-6 font-mono text-xs uppercase tracking-[0.16em]`} style={{ ["--d" as string]: "0.9s" }}>
          <p className="text-muted">{hangar.heroKicker}</p>
          <div className="text-right">
            <Clock timeZone={site.location.timeZone} label={hangar.clockLabel} className="text-fg" />
            <p className="mt-1 text-muted">{site.location.city}, DE</p>
          </div>
        </div>

        <div className="mt-auto">
          <Name text={site.name} />
          <div className="mt-8 grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
            <div className={s.fadeIn} style={{ ["--d" as string]: "0.75s" }}>
              <p className="font-mono text-[13px] uppercase tracking-[0.16em] text-accent">{site.role}</p>
              <p className="mt-4 max-w-[46ch] text-lg leading-relaxed text-fg/85 sm:text-xl">
                {heroLine.before} <em className="font-accent text-[1.18em] italic text-accent-2">{heroLine.accent}</em>
                {heroLine.after}
              </p>
            </div>
            <a href="#projects" className={`${s.fadeIn} ${s.scrollCue} font-mono text-xs uppercase tracking-[0.16em] text-muted hover:text-fg`} style={{ ["--d" as string]: "1.1s" }}>
              <i aria-hidden="true" /> {hangar.doorsTitle}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
