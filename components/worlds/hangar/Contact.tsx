import { hangar, site } from "@/content";
import { ContactForm } from "@/components/shell/ContactForm";
import { Magnetic } from "@/lib/motion/Magnetic";

export function Contact() {
  const { contact } = site;
  return (
    <section id="contact" aria-labelledby="contact-h" className="mx-auto max-w-[1600px] scroll-mt-20 px-4 py-24 sm:px-8">
      <h2 id="contact-h" className="max-w-[14ch] font-display text-[clamp(2.6rem,7vw,6.5rem)] leading-[0.92] font-semibold tracking-[-0.02em]">
        {hangar.contactTitle}
      </h2>
      <div className="mt-12 grid gap-14 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)]">
        <div>
          <p className="text-muted">{hangar.contactLead}</p>
          <ContactForm className="mt-8" />
        </div>
        <ul className="space-y-4 font-mono text-sm">
          <li><Magnetic><a className="text-fg underline-offset-4 hover:text-accent hover:underline" href={`mailto:${contact.email}`}>{contact.email}</a></Magnetic></li>
          <li><Magnetic><a className="text-fg underline-offset-4 hover:text-accent hover:underline" href={contact.telegram.href} target="_blank" rel="noopener noreferrer">Telegram {contact.telegram.handle} ↗</a></Magnetic></li>
          <li><Magnetic><a className="text-fg underline-offset-4 hover:text-accent hover:underline" href={contact.github} target="_blank" rel="noopener noreferrer">GitHub ↗</a></Magnetic></li>
        </ul>
      </div>
    </section>
  );
}
