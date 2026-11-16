"use client";
import { useRef, useState } from "react";
import { lobby } from "@/content";
import { useSceneProgress } from "./useSceneProgress";
import { Reveal } from "@/lib/motion/Reveal";
import { Kicker, Phone } from "./Bits";
import s from "./lobby.module.css";

type Seat = { name: string; bot: boolean };

/** Seats around the table fill as you scroll: you, four friends, then bots take the rest. */
export function Room() {
  const ref = useRef<HTMLElement>(null);
  const [filled, setFilled] = useState(0);
  const { players, seats } = lobby.room;
  const all: Seat[] = [{ name: "You", bot: false }, ...players.map((n) => ({ name: n, bot: false }))];
  while (all.length < seats) all.push({ name: "Bot", bot: true });

  useSceneProgress(ref, "room", "top 70%", "bottom 60%", (p) => setFilled(Math.round(p * seats)));

  return (
    <section ref={ref} aria-labelledby="room-h" className="mx-auto grid max-w-[1600px] items-center gap-14 px-4 py-28 sm:px-8 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
      <div>
        <Reveal variant="float"><Kicker>Multiplayer</Kicker>
        <h2 id="room-h" className="mt-4 font-display text-[clamp(2.4rem,5.5vw,5rem)] leading-[0.92] font-extrabold tracking-[-0.03em]">{lobby.room.title}</h2>
        <p className="mt-5 max-w-[42ch] text-lg text-fg/80">{lobby.room.lead}</p></Reveal>

        <div className={s.table} aria-label={`${filled} of ${seats} seats taken`} role="img">
          <div className={s.tableFelt}>
            <span className="font-display text-sm font-bold tracking-[0.3em] text-fg/80">K7QX</span>
            <span className="mt-1 text-xs tabular-nums text-muted">{filled} / {seats}</span>
          </div>
          {all.map((seat, i) => {
            const a = (i / seats) * Math.PI * 2 - Math.PI / 2;
            return (
              <span
                key={i}
                className={s.seat}
                data-on={i < filled ? "1" : ""}
                data-bot={seat.bot ? "1" : ""}
                style={{ left: `${50 + Math.cos(a) * 44}%`, top: `${50 + Math.sin(a) * 40}%`, transitionDelay: `${(i % 3) * 40}ms` }}
              >
                <i>{seat.bot ? "AI" : seat.name[0]}</i>
                <b>{seat.name}</b>
              </span>
            );
          })}
        </div>
      </div>
      <Phone src={lobby.screens.lobby.src} alt={lobby.screens.lobby.alt} className="mx-auto w-[min(300px,72vw)] lg:rotate-[3deg]" />
    </section>
  );
}
