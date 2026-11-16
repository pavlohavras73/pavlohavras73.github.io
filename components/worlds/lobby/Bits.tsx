import type { ReactNode } from "react";
import { worlds } from "@/content";
import { Magnetic } from "@/lib/motion/Magnetic";
import s from "./lobby.module.css";

const play = worlds.lobby.cta;

/** The one CTA of this world. */
export function PlayButton({ size = "lg", label = play.label }: { size?: "lg" | "xl"; label?: string }) {
  return (
    <Magnetic strength={0.25}>
      <a href={play.href} target="_blank" rel="noopener noreferrer" className={`${s.play} ${size === "xl" ? s.playXl : ""}`}>
        <span>{label}</span>
        <span aria-hidden="true" className={s.playArrow}>↗</span>
      </a>
    </Magnetic>
  );
}


/** A phone frame around a real screenshot from the live game. */
export function Phone({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    <figure className={`${s.phone} ${className ?? ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- static export */}
      <img src={src} alt={alt} width={600} height={1298} loading="lazy" decoding="async" />
    </figure>
  );
}

export function Poster({ src }: { src: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- decorative still of the 3D scene
  return <img src={src} alt="" className="h-full w-full object-cover" decoding="async" />;
}

export function Kicker({ children }: { children: ReactNode }) {
  return <p className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-accent-2">{children}</p>;
}
