import { ViewTransition } from "react";
import { site, worldOrder, worlds } from "@/content";
import { TLink } from "@/components/shell/TLink";
import { ContactForm } from "@/components/shell/ContactForm";

// Phase 1: structure only. Phase 2 builds the Hangar (WebGL field, live clock, portals).
export default function HangarPage() {
  return (
    <>
      <section className="mx-auto flex min-h-[80svh] max-w-[1600px] flex-col justify-end px-4 pb-16 pt-32 sm:px-8">
        <h1 className="font-display text-[clamp(3.5rem,12vw,11rem)] leading-[0.88] font-semibold tracking-[-0.02em]">
          {site.name}
        </h1>
        <p className="mt-6 font-mono text-sm uppercase tracking-[0.14em] text-accent">{site.role}</p>
        <p className="mt-4 max-w-[52ch] text-lg text-muted">{site.oneLiner}</p>
      </section>

      <section id="projects" aria-labelledby="projects-h" className="mx-auto max-w-[1600px] px-4 py-16 sm:px-8">
        <h2 id="projects-h" className="font-mono text-xs uppercase tracking-[0.16em] text-muted">Projects</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {worldOrder.map((id) => {
            const w = worlds[id];
            return (
              <li key={id}>
                <TLink href={w.route} className="group block border border-line p-6 transition-colors hover:border-accent">
                  <ViewTransition name={`portal-${id}`} share="morph" default="none">
                    <span className="block font-display text-4xl">{w.title}</span>
                  </ViewTransition>
                  <span className="mt-2 block text-muted">{w.tagline}</span>
                </TLink>
              </li>
            );
          })}
        </ul>
      </section>

      <section id="contact" aria-labelledby="contact-h" className="mx-auto max-w-[1600px] px-4 py-16 sm:px-8">
        <h2 id="contact-h" className="font-display text-4xl">Contact</h2>
        <ContactForm className="mt-8 max-w-3xl" />
      </section>
    </>
  );
}
