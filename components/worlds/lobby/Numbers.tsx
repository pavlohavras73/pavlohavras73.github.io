"use client";
import { useEffect, useRef } from "react";
import { lobby } from "@/content";
import { gsap } from "@/lib/motion/gsap";
import { prefersReducedMotion } from "@/lib/motion/useReducedMotion";
import { PlayButton } from "./Bits";
import s from "./lobby.module.css";

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
const dateLabel = (iso?: string) => (iso ? new Date(iso + "T12:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "");

/** Measured numbers (count up once in view), stack, and the closing Play now. */
export function Numbers() {
  const ref = useRef<HTMLDListElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const nodes = [...el.querySelectorAll<HTMLElement>("[data-to]")];
    nodes.forEach((n) => { n.textContent = "0"; });
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      nodes.forEach((n, i) => {
        const o = { v: 0 };
        gsap.to(o, { v: Number(n.dataset.to), duration: 1.6, delay: i * 0.08, ease: "power3.out", onUpdate: () => { n.textContent = fmt(o.v); } });
      });
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const measured = dateLabel(lobby.stats[0].measuredAt);
  return (
    <>
      <section aria-label="Lobby.gg in numbers" className="mx-auto max-w-[1600px] border-t border-line px-4 py-24 sm:px-8">
        <dl ref={ref} className={s.numbers}>
          {lobby.stats.map((st) => (
            <div key={st.label}>
              <dd className="font-display text-[clamp(2.6rem,6vw,5.5rem)] leading-none font-extrabold tracking-[-0.03em] tabular-nums" data-to={st.value}>{fmt(st.value)}</dd>
              <dt className="mt-2 text-sm text-muted">{st.label}{st.note ? <span className="text-fg/50"> ({st.note})</span> : null}</dt>
            </div>
          ))}
        </dl>
        <p className="mt-8 text-xs uppercase tracking-[0.16em] text-muted">Counted from the source on {measured}</p>
        <div className="mt-14 flex flex-wrap items-baseline gap-x-6 gap-y-3">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-2">Stack</span>
          {lobby.stack.map((t) => <span key={t} className="font-display text-xl font-bold text-fg/85">{t}</span>)}
          <a href={lobby.repoUrl} target="_blank" rel="noopener noreferrer" className="ml-auto text-sm font-semibold uppercase tracking-[0.16em] text-accent underline-offset-4 hover:underline">Code on GitHub ↗</a>
        </div>
      </section>

      <section aria-labelledby="final-h" className={s.final}>
        <h2 id="final-h" className={`${s.neon} font-accent text-[clamp(3rem,11vw,10rem)] leading-[1]`}>{lobby.finalCta.title}</h2>
        <p className="mt-6 max-w-[40ch] text-lg text-fg/80">{lobby.finalCta.lead}</p>
        <div className="mt-10"><PlayButton size="xl" /></div>
      </section>
    </>
  );
}
