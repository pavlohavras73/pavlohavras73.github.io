import { site } from "@/content";

export function Footer() {
  const { contact } = site;
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-4 py-10 font-mono text-[13px] sm:flex-row sm:items-end sm:justify-between sm:px-8">
        <div>
          <p className="font-display text-lg text-fg">{site.name}</p>
          <p className="mt-1 text-muted">{site.role}</p>
        </div>
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          <li><a className="text-fg underline-offset-4 hover:underline" href={`mailto:${contact.email}`}>{contact.email}</a></li>
          <li><a className="text-fg underline-offset-4 hover:underline" href={contact.github} target="_blank" rel="noopener noreferrer">GitHub ↗</a></li>
          <li><a className="text-fg underline-offset-4 hover:underline" href={contact.telegram.href} target="_blank" rel="noopener noreferrer">Telegram {contact.telegram.handle} ↗</a></li>
        </ul>
      </div>
    </footer>
  );
}
