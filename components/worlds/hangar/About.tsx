import { hangar, site, stack } from "@/content";
import s from "./hangar.module.css";

export function About() {
  return (
    <section aria-labelledby="about-h" className="mx-auto grid max-w-[1600px] gap-12 px-4 py-20 sm:px-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <div className="max-w-[420px]">
        {/* eslint-disable-next-line @next/next/no-img-element -- static export, image is already sized */}
        <img src={site.photo.src} alt={site.photo.alt} width={840} height={1050} loading="lazy" decoding="async" className={s.photo} />
      </div>
      <div>
        <h2 id="about-h" className="font-mono text-xs uppercase tracking-[0.16em] text-muted">{hangar.aboutTitle}</h2>
        <p className="mt-6 max-w-[30ch] font-display text-[clamp(1.8rem,3.2vw,2.8rem)] leading-[1.08] font-medium">
          {site.oneLiner.split(":")[0]}. <span className="font-accent italic text-accent-2">{site.aiLine}</span>
        </p>
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
