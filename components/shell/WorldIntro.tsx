import { ViewTransition } from "react";
import type { Stat, WorldMeta } from "@/content";
import { TLink } from "./TLink";

/**
 * Phase-1 placeholder hero for a world: real title, tagline, CTA and numbers.
 * The named <ViewTransition> is the morph target of the matching Hangar portal.
 * Each world replaces this with its own hero in its phase.
 */
export function WorldIntro({ world, stats }: { world: WorldMeta; stats?: Stat[] }) {
  return (
    <section className="mx-auto flex min-h-[100svh] max-w-[1600px] flex-col justify-end px-4 pb-16 pt-32 sm:px-8">
      <ViewTransition name={`portal-${world.id}`} share="morph" default="none">
        <div>
          <h1 className="font-display text-[clamp(3rem,11vw,10rem)] leading-[0.9] font-semibold tracking-[-0.02em]">{world.title}</h1>
        </div>
      </ViewTransition>
      <p className="mt-6 max-w-[40ch] text-lg text-muted sm:text-xl">{world.tagline}</p>
      {stats?.length ? (
        <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
          {stats.map((s) => (
            <div key={s.label}>
              <dt className="sr-only">{s.label}</dt>
              <dd className="font-display text-3xl text-fg">{s.value.toLocaleString("en-US")}</dd>
              <dd className="font-mono text-xs uppercase tracking-[0.14em] text-muted" aria-hidden="true">{s.label}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      <div className="mt-10">
        {world.cta.external ? (
          <a href={world.cta.href} target="_blank" rel="noopener noreferrer"
            className="inline-block bg-accent px-7 py-4 font-mono text-sm font-semibold uppercase tracking-[0.12em] text-bg">
            {world.cta.label} ↗
          </a>
        ) : (
          <TLink href={world.cta.href} className="inline-block bg-accent px-7 py-4 font-mono text-sm font-semibold uppercase tracking-[0.12em] text-bg">
            {world.cta.label}
          </TLink>
        )}
      </div>
    </section>
  );
}
