// Shared content types. All copy, numbers and links live in content/*.ts — never in components.

export type WorldId = "hangar" | "lobby" | "fpv" | "jarvis" | "web";

export type Link = { label: string; href: string; external?: boolean };

/** A number shown on the site. `measuredAt` is when it was last counted (ISO date). */
export type Stat = { value: number; label: string; suffix?: string; measuredAt?: string; note?: string };

/** Marks content that still has to come from Pavlo. Rendered visibly as [TODO: …] in dev. */
export type Todo = { todo: string };
export const todo = (what: string): Todo => ({ todo: what });
export const isTodo = (v: unknown): v is Todo => typeof v === "object" && v !== null && "todo" in v;

export type WorldMeta = {
  id: WorldId;
  route: string;
  title: string;
  /** One line under the title on the portal tile. */
  tagline: string;
  /** Page <title> and description. */
  metaTitle: string;
  metaDescription: string;
  /** Main call to action of the world. */
  cta: Link;
};
