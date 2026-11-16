"use client";
import { useId, useState, type FormEvent } from "react";
import { site } from "@/content";

type Kind = "agent" | "site" | "general";
type State = "idle" | "sending" | "sent" | "fallback";

const subject: Record<Kind, string> = {
  agent: "I want an AI agent",
  site: "I want a website",
  general: "Hi Pavlo",
};

/**
 * Lead form → n8n webhook (Telegram + Obsidian Inbox on Pavlo's server).
 * If the endpoint is not configured or the request fails, nothing is lost: the visitor gets
 * a prefilled email and the Telegram link instead.
 */
export function ContactForm({ kind = "general", className }: { kind?: Kind; className?: string }) {
  const id = useId();
  const [state, setState] = useState<State>("idle");
  const [draft, setDraft] = useState({ name: "", reply: "", message: "" });
  const { email, telegram, formEndpoint } = site.contact;

  const mailto = `mailto:${email}?subject=${encodeURIComponent(subject[kind])}&body=${encodeURIComponent(
    `${draft.message}\n\n— ${draft.name} (${draft.reply})`,
  )}`;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    if (data.get("website")) return; // honeypot
    if (!formEndpoint) { setState("fallback"); return; }
    setState("sending");
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 10000);
      const r = await fetch(formEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, ...draft, page: location.pathname }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      setState(r.ok ? "sent" : "fallback");
    } catch {
      setState("fallback");
    }
  }

  if (state === "sent") {
    return <p role="status" className={className}>Got it. I reply within a day, usually much sooner.</p>;
  }

  const field = "w-full border-b border-line bg-transparent py-3 text-fg placeholder:text-muted focus:border-accent focus:outline-none";
  return (
    <form onSubmit={submit} className={className} noValidate={false}>
      <div className="grid gap-6 sm:grid-cols-2">
        <label className="block" htmlFor={`${id}-name`}>
          <span className="font-mono text-xs uppercase tracking-[0.14em] text-muted">Name</span>
          <input id={`${id}-name`} name="name" required autoComplete="name" className={field}
            value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        </label>
        <label className="block" htmlFor={`${id}-reply`}>
          <span className="font-mono text-xs uppercase tracking-[0.14em] text-muted">Email or Telegram</span>
          <input id={`${id}-reply`} name="reply" required className={field}
            value={draft.reply} onChange={(e) => setDraft({ ...draft, reply: e.target.value })} />
        </label>
      </div>
      <label className="mt-6 block" htmlFor={`${id}-msg`}>
        <span className="font-mono text-xs uppercase tracking-[0.14em] text-muted">What do you need?</span>
        <textarea id={`${id}-msg`} name="message" required rows={4} className={`${field} resize-y`}
          value={draft.message} onChange={(e) => setDraft({ ...draft, message: e.target.value })} />
      </label>
      {/* Honeypot: hidden from people and assistive tech, bots fill it. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-px w-px opacity-0" />
      <div className="mt-8 flex flex-wrap items-center gap-4">
        <button type="submit" disabled={state === "sending"}
          className="bg-accent px-6 py-3 font-mono text-sm font-semibold uppercase tracking-[0.12em] text-bg transition-opacity disabled:opacity-60">
          {state === "sending" ? "Sending…" : "Send"}
        </button>
        {state === "fallback" ? (
          <p role="status" className="text-sm text-muted">
            The form is offline right now. <a className="text-fg underline" href={mailto}>Send it by email</a> or{" "}
            <a className="text-fg underline" href={telegram.href} target="_blank" rel="noopener noreferrer">write on Telegram</a>.
          </p>
        ) : null}
      </div>
    </form>
  );
}
