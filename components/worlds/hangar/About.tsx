import { hangar, site, stack } from "@/content";

export function About() {
  return (
    <section aria-labelledby="about-h" className="mx-auto grid max-w-[1600px] gap-12 px-4 py-20 sm:px-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <div>
        <h2 id="about-h" className="font-mono text-xs uppercase tracking-[0.16em] text-muted">{hangar.aboutTitle}</h2>
        <p className="mt-6 max-w-[22ch] font-display text-[clamp(2rem,3.6vw,3.2rem)] leading-[1.04] font-medium">
          {site.oneLiner.split(":")[0]}. <span className="text-accent">{site.aiLine}</span>
        </p>
      </div>
      <div>
        <dl className="mt-10 grid gap-x-10 gap-y-5 sm:grid-cols-2">
          {site.facts.map((f) => (
            <div key={f.k} className="border-t border-line pt-3">
              <dt className="font-mono text-xs uppercase tracking-[0.16em] text-muted">{f.k}</dt>
              <dd className="mt-1 text-fg">{f.v}</dd>
            </div>
          ))}
        </dl>

        <h2 className="mt-16 font-mono text-xs uppercase tracking-[0.16em] text-muted">{hangar.stackTitle}</h2>
        <dl className="mt-6 divide-y divide-line border-y border-line">
          {stack.map((g) => (
            <div key={g.group} className="grid gap-2 py-4 sm:grid-cols-[180px_1fr]">
              <dt className="font-mono text-xs uppercase tracking-[0.16em] text-accent">{g.group}</dt>
              <dd className="text-fg/90">{g.items.join("  /  ")}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
