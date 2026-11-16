import type { Stat } from "./types";

// Measured on Pavlo's server on 2026-11-16:
//  - active n8n workflows: `n8n list:workflow --active=true` → 21 (schedules below are their trigger configs)
//  - Obsidian vault: 1,243 .md notes; 553 unique [[wikilink]] pairs between notes (public/data/brain.json,
//    which has no titles: only a folder-group index per note and the link pairs)
// Never mention Gemini Live (decision 2026-11-16). Local LLMs are past experience, not a feature.
const MEASURED = "2026-11-16";

export type Automation = {
  name: string;
  /** daily/weekly: local time "HH:MM"; interval: "every N min/h"; hook: runs when called */
  kind: "daily" | "weekly" | "interval" | "hook";
  at?: string[];
  days?: string;
  every?: string;
};

export const jarvis = {
  stats: [
    { value: 21, label: "live n8n automations", measuredAt: MEASURED },
    { value: 1243, label: "notes in its memory", measuredAt: MEASURED },
    { value: 553, label: "links between notes", measuredAt: MEASURED },
  ] satisfies Stat[],
  hero: {
    kicker: "Personal AI agent · 24/7",
    lead: "It lives on my server, talks to me in Telegram, runs my automations and remembers what I wrote down. And it cannot hurt the machine it runs on.",
  },
  pitch:
    "From idea to a running system: design the agent, connect it to tools and APIs, automate the workflows around it, and run it safely.",
  /** Architecture, request path order. */
  architecture: [
    { id: "telegram", title: "Telegram", body: "Text, voice notes and photos. Voice is transcribed for free." },
    { id: "brain", title: "Claude Code brain", body: "Runs 24/7 on my server as a service and answers in Telegram." },
    { id: "guard", title: "Guard", body: "Every action is checked by code first: secrets and destructive commands are blocked; risky ones wait for my tap." },
    { id: "gateway", title: "Key gateway", body: "Tools get API keys through one gateway that never shows them to the agent." },
    { id: "n8n", title: "n8n", body: "21 live automations: briefings, calendar, habits, content, watchdogs." },
    { id: "memory", title: "Obsidian memory", body: "A 1,200+ note knowledge base it reads and writes." },
    { id: "infra", title: "Docker · Redis · backups", body: "Everything runs in containers on my own server, backed up nightly." },
  ],
  /** The 21 active workflows and their configured triggers (names shortened, no endpoints). */
  automations: [
    { name: "YouTube Watch Later", kind: "daily", at: ["03:00"] },
    { name: "Life Agent: habits + health", kind: "daily", at: ["08:30", "21:30"] },
    { name: "Morning Briefing", kind: "daily", at: ["09:09"] },
    { name: "GitHub Trending", kind: "daily", at: ["10:00"] },
    { name: "Content Farm Generator", kind: "weekly", at: ["10:00"], days: "Tue · Thu · Sat" },
    { name: "Opportunity Hunter", kind: "daily", at: ["11:30"] },
    { name: "Weekly Review", kind: "weekly", at: ["15:00"], days: "Sun" },
    { name: "Evening Review", kind: "daily", at: ["22:30"] },
    { name: "Token Cost Controller", kind: "daily", at: ["23:00"] },
    { name: "Timer Check-in", kind: "interval", every: "5 min" },
    { name: "File Bridge", kind: "interval", every: "15 min" },
    { name: "n8n Error Watchdog", kind: "interval", every: "30 min" },
    { name: "Notes Reader", kind: "interval", every: "33 min" },
    { name: "Night Conductor", kind: "interval", every: "35 min" },
    { name: "Balance Guard", kind: "interval", every: "6 h" },
    { name: "Action Gateway", kind: "hook" },
    { name: "Create Calendar Event", kind: "hook" },
    { name: "Google Calendar Hub", kind: "hook" },
    { name: "AI Router (fallback)", kind: "hook" },
    { name: "Smart-glasses Receiver", kind: "hook" },
    { name: "Remote Restart", kind: "hook" },
  ] satisfies Automation[],
  /**
   * An example exchange, labelled as an example on the page. Every step is something the
   * running system really does (voice → text, Todoist via the gateway, the guard's tap-to-allow).
   */
  example: [
    { from: "me", voice: true, text: "Voice note · 0:07", sub: "“What's on today? And clear the old logs.”" },
    { from: "jarvis", text: "Transcribed. 3 tasks today, the first one at 14:00." },
    { from: "jarvis", text: "Deleting files needs your OK.", guard: "rm -r logs/2026-09" },
    { from: "me", text: "Allow", tap: true },
    { from: "jarvis", text: "Done. 214 MB freed." },
  ],
  exampleNote: "Example exchange. The steps are real capabilities; the numbers are illustrative.",
  offer: [
    { title: "Design agents", body: "Decide what the agent does, what it may touch and where a human signs off." },
    { title: "Connect tools & APIs", body: "Telegram, Google, CRMs, your own backend, via MCP and n8n." },
    { title: "Automate workflows", body: "Turn the repetitive parts of your week into scheduled, observable flows." },
    { title: "Run systems safely", body: "Secrets out of reach, guarded actions, logs, backups, watchdogs." },
  ],
};
