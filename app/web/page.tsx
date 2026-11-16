import { webPage } from "@/content";
import { ContactForm } from "@/components/shell/ContactForm";
import { Hero, Index, Tape } from "@/components/worlds/web/Web";
import s from "@/components/worlds/web/web.module.css";

export default function WebPage() {
  return (
    <>
      <Hero />
      <Index />
      <section id="contact" aria-labelledby="web-cta-h" className={`${s.cta} scroll-mt-16`}>
        <Tape items={["order a site", "landing pages", "product sites", "app front ends", "order a site"]} tone="orange" angle={-2} />
        <div className={s.ctaInner}>
          <h2 id="web-cta-h" className={s.ctaTitle}>Your site.<br /><em>Loud.</em></h2>
          <p className="mt-6 max-w-[48ch] text-lg text-fg/80">{webPage.ctaLead} <span className={s.tag} aria-hidden="true">let&apos;s go</span></p>
          <ContactForm kind="site" className="mt-10 max-w-3xl" />
        </div>
      </section>
    </>
  );
}
