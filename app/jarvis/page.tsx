import { worlds, jarvis } from "@/content";
import { WorldIntro } from "@/components/shell/WorldIntro";
import { ContactForm } from "@/components/shell/ContactForm";

// Phase 1 placeholder: real content, final art direction comes in this world's phase.
export default function JarvisPage() {
  return (
    <>
      <WorldIntro world={worlds.jarvis} stats={jarvis.stats} />
      <section id="contact" aria-label="Contact" className="mx-auto max-w-[1600px] px-4 py-16 sm:px-8">
        <ContactForm kind="agent" className="max-w-3xl" />
      </section>
    </>
  );
}
