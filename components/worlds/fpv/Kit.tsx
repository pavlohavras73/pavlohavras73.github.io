"use client";
import { Reveal } from "@/lib/motion/Reveal";
import { GLYPHS, Scramble } from "@/lib/motion/Scramble";
import s from "./fpv.module.css";

/** Section title: a skewed wipe, then the text decodes out of block glyphs. */
export function Title({ id, text, kicker }: { id: string; text: string; kicker: string }) {
  return (
    <Reveal variant="glitch">
      <p className={s.kicker}>{"// "}{kicker}</p>
      <h2 id={id} className={s.h2}>
        <Scramble text={text} glyphs={GLYPHS.block} duration={900} />
      </h2>
    </Reveal>
  );
}

/** Hazard tape between sections: sliding amber/black stripes with a status line. */
export function Hazard({ items }: { items: string[] }) {
  return (
    <div className={s.hazard} aria-hidden="true">
      <div className={s.hazardTrack}>
        {[0, 1].map((k) => (
          <span key={k}>{items.map((t, i) => <b key={i}>{t}</b>)}</span>
        ))}
      </div>
    </div>
  );
}
