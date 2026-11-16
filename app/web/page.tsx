import { worlds } from "@/content";
import { WorldIntro } from "@/components/shell/WorldIntro";
import { ContactForm } from "@/components/shell/ContactForm";

// Phase 1 placeholder: real content, final art direction comes in this world's phase.
export default function WebPage() {
  return (
    <>
      <WorldIntro world={worlds.web} />
      <section id="contact" aria-label="Contact" className="mx-auto max-w-[1600px] px-4 py-16 sm:px-8">
        <ContactForm kind="site" className="max-w-3xl" />
      </section>
    </>
  );
}
