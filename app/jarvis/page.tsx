import { ContactForm } from "@/components/shell/ContactForm";
import { Architecture, Brain, Day, Exchange, Hero, Offer } from "@/components/worlds/jarvis/Jarvis";
import { Rain } from "@/components/worlds/jarvis/Rain";

export default function JarvisPage() {
  return (
    <>
      <Rain />
      <div className="relative z-[1]">
      <Hero />
      <Architecture />
      <Exchange />
      <Day />
      <Brain />
      <Offer />
      <section id="contact" aria-labelledby="jv-contact-h" className="mx-auto max-w-[1600px] scroll-mt-24 px-4 pb-32 sm:px-8">
        <h2 id="jv-contact-h" className="max-w-[16ch] font-display text-[clamp(2.6rem,6vw,5.5rem)] leading-[0.95] font-black tracking-[-0.02em]">
          Want one that works for you?
        </h2>
        <p className="mt-5 max-w-[48ch] text-lg text-fg/75">Tell me what your week looks like. I&apos;ll tell you what an agent could take off it.</p>
        <ContactForm kind="agent" className="mt-10 max-w-3xl" />
      </section>
      </div>
    </>
  );
}
