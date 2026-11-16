import { todo, type Stat, type Todo } from "./types";

// Measured on Pavlo's server on 2026-11-16:
//  - active n8n workflows: `n8n list:workflow --active=true` → 21
//  - Obsidian vault: unique-name notes and unique [[wikilink]] pairs between existing notes
// Never mention Gemini Live (decision 2026-11-16). Local LLMs are past experience, not a feature.
const MEASURED = "2026-11-16";

export const jarvis = {
  stats: [
    { value: 21, label: "live n8n automations", measuredAt: MEASURED },
    { value: 1243, label: "notes in its memory", measuredAt: MEASURED },
    { value: 528, label: "links between notes", measuredAt: MEASURED },
  ] satisfies Stat[],
  pitch:
    "From idea to a running system: design the agent, connect it to tools and APIs, automate the workflows around it, and run it safely.",
  /** Architecture, top to bottom. Phase 5 turns this into the interactive diagram. */
  architecture: [
    { id: "telegram", title: "Telegram", body: "Text, voice notes and photos. Voice is transcribed for free." },
    { id: "brain", title: "Claude Code brain", body: "Runs 24/7 on my server as a service and answers in Telegram." },
    { id: "gateway", title: "Key gateway", body: "Tools get API keys through one gateway that never shows them to the agent." },
    { id: "guard", title: "Guard", body: "Every action is checked by code: secrets and destructive commands are blocked; risky ones wait for my tap." },
    { id: "n8n", title: "n8n", body: "21 live automations: briefings, calendar, habits, content, watchdogs." },
    { id: "memory", title: "Obsidian memory", body: "A 1,200+ note knowledge base it reads and writes." },
    { id: "infra", title: "Docker · Redis · backups", body: "Everything runs in containers on my own server, backed up nightly." },
  ],
  /** Real workflow names and schedules from n8n. Feed copy beyond this needs real samples. */
  day: [
    { time: "03:00", name: "YouTube Watch Later", sample: todo("real message sample") as string | Todo },
    { time: "09:09", name: "Morning Briefing", sample: todo("real message sample") as string | Todo },
    { time: "10:00", name: "GitHub Trending", sample: todo("real message sample") as string | Todo },
    { time: "11:00", name: "Opportunity Hunter", sample: todo("real message sample") as string | Todo },
    { time: "—", name: "Life Agent (habits + health)", sample: todo("real message sample") as string | Todo },
    { time: "22:30", name: "Evening Review", sample: todo("real message sample") as string | Todo },
    { time: "23:00", name: "Token Cost Controller", sample: todo("real message sample") as string | Todo },
  ],
  offer: [
    { title: "Design agents", body: "Decide what the agent does, what it may touch and where a human signs off." },
    { title: "Connect tools & APIs", body: "Telegram, Google, CRMs, your own backend, via MCP and n8n." },
    { title: "Automate workflows", body: "Turn the repetitive parts of your week into scheduled, observable flows." },
    { title: "Run systems safely", body: "Secrets out of reach, guarded actions, logs, backups, watchdogs." },
  ],
  voiceSample: todo("5–15 s voice recording for the orb") as string | Todo,
};
