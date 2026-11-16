import { nav, site, type WorldId } from "@/content";
import { TLink } from "./TLink";

/** Minimal shared nav: logo · projects · contact, plus "← Hangar" inside a world. */
export function Nav({ world }: { world: WorldId }) {
  return (
    <header className="nav-fade pointer-events-none fixed inset-x-0 top-0 z-50">
      <nav
        aria-label="Main"
        className="pointer-events-auto mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4 font-mono text-[13px] uppercase tracking-[0.12em] sm:px-8"
      >
        <div className="flex items-center gap-5">
          <TLink href="/" className="font-display text-base font-semibold tracking-[0.04em] text-fg" aria-label={`${site.name}, home`}>
            {site.shortName}
            <span className="text-accent">.</span>
          </TLink>
          {world !== "hangar" ? (
            <TLink href="/#projects" className="text-muted transition-colors hover:text-fg">
              <span aria-hidden="true">← </span>Hangar
            </TLink>
          ) : null}
        </div>
        <ul className="flex items-center gap-5">
          {nav.map((l) => (
            <li key={l.href}>
              <TLink href={world === "hangar" ? l.href.replace("/", "") : l.href} className="text-muted transition-colors hover:text-fg">
                {l.label}
              </TLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
