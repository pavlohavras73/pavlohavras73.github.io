import type { ReactNode } from "react";
import type { WorldId } from "@/content";
import { Cursor } from "./Cursor";
import { Footer } from "./Footer";
import { Nav } from "./Nav";

/**
 * The only shared frame. Everything inside <main> belongs to the world: its palette comes from
 * [data-world] tokens and its fonts from `fontVars` (next/font variables loaded by that route only).
 */
export function WorldShell({ world, fontVars, children }: { world: WorldId; fontVars: string; children: ReactNode }) {
  return (
    <div data-world={world} className={`${fontVars} grain`}>
      <a className="skip-link" href="#main">Skip to content</a>
      <Nav world={world} />
      <main id="main" className="flex-1">{children}</main>
      <Footer />
      <Cursor />
    </div>
  );
}
