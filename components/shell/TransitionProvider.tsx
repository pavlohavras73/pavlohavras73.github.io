"use client";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, type ReactNode } from "react";
import { gsap } from "@/lib/motion/gsap";
import { prefersReducedMotion } from "@/lib/motion/useReducedMotion";

type Ctx = { navigate: (href: string) => void };
const TransitionContext = createContext<Ctx | null>(null);

export const supportsViewTransitions = () =>
  typeof document !== "undefined" && "startViewTransition" in document;

/**
 * Page transitions. Browsers with the View Transitions API get React's <ViewTransition>
 * (Next route changes are transitions, so it just works). Others (e.g. iOS 15–17) get a
 * GSAP curtain in the current world's accent: cover → navigate → reveal.
 */
export function TransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const curtain = useRef<HTMLDivElement>(null);
  const pending = useRef(false);

  const navigate = useCallback((href: string) => {
    const el = curtain.current;
    if (!el || prefersReducedMotion() || supportsViewTransitions()) {
      router.push(href);
      return;
    }
    pending.current = true;
    gsap.set(el, { display: "block", yPercent: 100 });
    gsap.to(el, { yPercent: 0, duration: 0.5, ease: "power4.inOut", onComplete: () => router.push(href) });
  }, [router]);

  useEffect(() => {
    const el = curtain.current;
    if (!el || !pending.current) return;
    pending.current = false;
    window.scrollTo(0, 0);
    gsap.to(el, { yPercent: -100, duration: 0.6, ease: "power4.inOut", delay: 0.05, onComplete: () => { gsap.set(el, { display: "none" }); } });
  }, [pathname]);

  return (
    <TransitionContext.Provider value={{ navigate }}>
      {children}
      <div
        ref={curtain}
        aria-hidden="true"
        style={{ position: "fixed", inset: 0, zIndex: 90, display: "none", background: "var(--accent)" }}
      />
    </TransitionContext.Provider>
  );
}

export function usePageTransition(): Ctx {
  const ctx = useContext(TransitionContext);
  if (!ctx) throw new Error("usePageTransition outside TransitionProvider");
  return ctx;
}
