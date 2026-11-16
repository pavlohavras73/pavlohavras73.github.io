"use client";
import { useRef, useState } from "react";
import { lobby } from "@/content";
import { useSceneProgress } from "./useSceneProgress";
import { Reveal } from "@/lib/motion/Reveal";
import { Kicker } from "./Bits";
import s from "./lobby.module.css";

/**
 * Scroll-scrubbed diagram of the reconnect flow: a phone drops off, the server holds its seat,
 * the phone comes back and gets the whole state. Then the list of what keeps the game honest.
 */
export function Reconnect() {
  const ref = useRef<HTMLElement>(null);
  const [p, setP] = useState(0);
  useSceneProgress(ref, "reconnect", "top 65%", "bottom 75%", setP);
  const { reconnect } = lobby;
  const stage = p < 0.25 ? 0 : p < 0.5 ? 1 : p < 0.75 ? 2 : 3;
  const lost = stage === 1 || stage === 2;

  return (
    <section ref={ref} aria-labelledby="rc-h" className="mx-auto max-w-[1600px] px-4 py-28 sm:px-8">
      <Kicker>The engineering behind the fun</Kicker>
      <h2 id="rc-h" className="mt-4 max-w-[18ch] font-display text-[clamp(2.4rem,5.5vw,5rem)] leading-[0.92] font-extrabold tracking-[-0.03em]">
        {reconnect.title} <span className={s.glowText}>{reconnect.titleAccent}</span>
      </h2>
      <p className="mt-5 max-w-[46ch] text-lg text-fg/80">{reconnect.lead}</p>

      <div className={s.diagram} data-stage={stage}>
        <svg viewBox="0 0 900 300" role="img" aria-label={reconnect.steps.join(", then ")} className="h-auto w-full">
          {/* server */}
          <g transform="translate(560 40)">
            <rect width="300" height="220" rx="18" className={s.dServer} />
            <text x="24" y="40" className={s.dLabel}>Server · room K7QX</text>
            {[0, 1, 2, 3].map((i) => (
              <g key={i} transform={`translate(${24 + i * 66} 70)`}>
                <rect width="54" height="74" rx="10" className={i === 2 ? (lost ? s.dSeatHeld : s.dSeatYou) : s.dSeat} />
                <text x="27" y="44" textAnchor="middle" className={s.dSeatText}>{i === 2 ? "You" : i === 3 ? "AI" : "P" + (i + 1)}</text>
              </g>
            ))}
            <text x="24" y="182" className={s.dState}>{lost ? "Seat 3 held" : "Seat 3 · live"}</text>
            {lost ? <text x="24" y="208" className={s.dState} opacity={0.75}>hand · chips · turn</text> : null}
          </g>
          {/* link */}
          <path d="M240 150 C 360 150, 440 150, 560 150" className={lost ? s.dLinkLost : s.dLink} pathLength={1} />
          {stage === 3 ? <path d="M560 150 C 440 150, 360 150, 240 150" className={s.dSync} pathLength={1} /> : null}
          {/* phone */}
          <g transform="translate(110 40)" className={lost ? s.dPhoneOff : s.dPhone}>
            <rect width="130" height="220" rx="22" />
            <rect x="12" y="22" width="106" height="176" rx="8" className={s.dScreen} />
            <text x="65" y="118" textAnchor="middle" className={s.dLabel}>{lost ? "offline" : stage === 3 ? "back in" : "playing"}</text>
          </g>
        </svg>
        <ol className={s.dSteps}>
          {reconnect.steps.map((t, i) => <li key={t} data-on={i <= stage ? "1" : ""}>{t}</li>)}
        </ol>
      </div>

      <h3 className="mt-24 font-display text-[clamp(1.8rem,3.5vw,3rem)] leading-none font-extrabold tracking-[-0.02em]">{lobby.honestTitle}</h3>
      <ol className={s.honest}>
        {lobby.engineering.map((e, i) => (
          <Reveal as="li" key={e.title} variant="float" delay={(i % 2) * 120}>
            <span className={s.pointNum}>{String(i + 1).padStart(2, "0")}</span>
            <div>
              <p className="font-display text-[clamp(1.3rem,2.2vw,1.9rem)] leading-tight font-bold">{e.title}</p>
              <p className="mt-2 max-w-[52ch] text-fg/70">{e.body}</p>
            </div>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}
