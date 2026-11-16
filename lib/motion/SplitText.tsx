import type { ElementType, ReactNode } from "react";

type Props = {
  text: string;
  as?: ElementType;
  by?: "chars" | "words";
  className?: string;
  /** Class on every split unit; animate `[data-split]` children with GSAP. */
  unitClassName?: string;
  children?: ReactNode;
};

/**
 * Splits text into spans for staggered animation. Screen readers get the plain string via
 * aria-label; the spans are aria-hidden. Words never break mid-word (each word is nowrap).
 */
export function SplitText({ text, as: Tag = "span", by = "chars", className, unitClassName }: Props) {
  const words = text.split(" ");
  return (
    <Tag className={className} aria-label={text}>
      {words.map((w, wi) => (
        <span key={wi} aria-hidden="true" style={{ display: "inline-block", whiteSpace: "nowrap" }}>
          {by === "words" ? (
            <span data-split className={unitClassName} style={{ display: "inline-block" }}>{w}</span>
          ) : (
            [...w].map((c, ci) => (
              <span key={ci} data-split className={unitClassName} style={{ display: "inline-block" }}>{c}</span>
            ))
          )}
          {wi < words.length - 1 ? " " : null}
        </span>
      ))}
    </Tag>
  );
}
