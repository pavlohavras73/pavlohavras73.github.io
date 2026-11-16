import type { Stat } from "./types";

// Numbers measured on the server (/home/jarvis/obsidian_project/games) on 2026-11-16.
// LOC = .py/.js/.html/.css excluding staging/, backups, vendor, minified files.
// Games = unique /games/<id> entries in the live lobby catalog (static/index.html).
const MEASURED = "2026-11-16";

export const lobby = {
  liveUrl: "https://promo-dev.duckdns.org/games/",
  repoUrl: "https://github.com/pavlohavras73/lobby-gg",
  stats: [
    { value: 28, label: "games", measuredAt: MEASURED },
    { value: 41070, label: "lines of code", measuredAt: MEASURED },
    { value: 8603, label: "lines of Python", measuredAt: MEASURED },
    { value: 32467, label: "lines of frontend", measuredAt: MEASURED, note: "JS + HTML + CSS" },
  ] satisfies Stat[],
  /** The three featured games. Copy from the live lobby's own English descriptions. */
  featured: [
    { id: "poker", name: "Poker", line: "Texas Hold'em. Blinds, raises, all-in. Play vs bots too.", href: "https://promo-dev.duckdns.org/games/poker" },
    { id: "mafia", name: "Mafia", line: "Night/day, roles, voting. Doctor, sheriff, mafia. 3+ players.", href: "https://promo-dev.duckdns.org/games/mafia" },
    { id: "chess", name: "Chess", line: "Full rules: castling, en passant, mate. Play vs bot too.", href: "https://promo-dev.duckdns.org/games/chess" },
  ],
  engineering: [
    { title: "A state machine per room", body: "FastAPI + WebSockets. Every room runs its own state machine on the server." },
    { title: "Reconnect mid-game", body: "Drop out, come back: the client rejoins its seat and gets the current state." },
    { title: "Server-authoritative rules", body: "Nobody can cheat at Poker or Mafia from the browser console." },
    { title: "Honest by design", body: "PBKDF2 passwords, HMAC-signed sessions, rate limits, input sanitizing." },
    { title: "My own server", body: "Docker behind Caddy with auto-TLS and security headers." },
  ],
  stack: ["Python", "FastAPI", "WebSockets", "Vanilla JS", "three.js", "SQLite", "Docker", "Caddy"],
};
