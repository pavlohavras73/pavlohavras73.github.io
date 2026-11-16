import { hangar, site } from "@/content";
import { Clock } from "./Clock";
import { Field } from "./Field";
import { Badge, Cycler, Melt } from "./Melt";
import { TiltChip } from "@/components/shell/TiltChip";
import s from "./hangar.module.css";

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
          <Melt text={site.name} className="text-[clamp(3.2rem,12.5vw,13rem)]" />
          <div className="mt-8 grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
            <div className={s.fadeIn} style={{ ["--d" as string]: "0.75s" }}>
              <p className="font-mono text-[13px] uppercase tracking-[0.16em] text-accent">{site.role}</p>
              <p className="mt-4 max-w-[52ch] text-lg leading-relaxed text-fg/85 sm:text-xl">
                <span className="sr-only">{heroLine.sentence}</span>
                <span aria-hidden="true">{heroLine.lead}</span>
                <br aria-hidden="true" />
                <Cycler items={heroLine.parts} />
              </p>
            </div>
            <div className={`${s.fadeIn} flex items-end justify-between gap-4`} style={{ ["--d" as string]: "1.1s" }}>
              <Badge href="#projects" text={hangar.doorsTitle} />
              <TiltChip label="Tilt to melt" className="md:hidden" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
