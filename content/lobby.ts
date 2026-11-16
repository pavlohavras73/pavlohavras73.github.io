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
  /** From the live product's own copy (promo-dev.duckdns.org/games, EN). */
  howItWorks: [
    { step: "Create a room", body: "One tap. No installs." },
    { step: "Share the 4-letter code", body: "Friends join from their own phones." },
    { step: "Bots fill empty seats", body: "Short on players? The table still runs." },
    { step: "Deal", body: "Real-time, in UA · RU · EN · DE." },
  ],
  /** Mafia role texts, verbatim from the game. */
  mafiaRoles: [
    { role: "Doctor", line: "At night you heal one player — saving them from being killed.", color: "#46e39a" },
    { role: "Sheriff", line: "At night you check one player — you learn whether they're mafia or not.", color: "#f5c451" },
    { role: "Mafia", line: "At night you pick a victim with your accomplices. By day, act innocent.", color: "#ff4a3d" },
  ],
  mafiaRules: "At night the mafia kills, the doctor heals, the sheriff checks. By day the town discusses and votes. Town wins by eliminating all mafia; mafia wins once they equal the town.",
  hero: {
    kicker: "Lobby.gg · 28 games",
    title: "Game night,",
    titleAccent: "one link away.",
    lead: "Party games with friends in the browser. No installs: create a room, share the code, deal.",
  },
  room: {
    title: "The room fills up",
    lead: "Friends join with a 4-letter code. Not enough people? Bots take the empty seats.",
    /** Names from the product's own lobby demo card. */
    players: ["Oleh", "Mila", "Max", "Ira"],
    seats: 8,
  },
  chapters: {
    poker: {
      num: "01",
      kicker: "Cards",
      points: ["Bots sit in when your friends can't.", "Every bet is checked on the server."],
    },
    mafia: {
      num: "02",
      kicker: "Social deduction",
      points: ["Doctor from 4 players, sheriff from 5.", "Roles stay private: each player is only sent their own."],
    },
    chess: {
      num: "03",
      kicker: "Strategy",
      points: ["Play a friend or a bot.", "Every move is checked on the server before it reaches the board."],
    },
  },
  reconnect: {
    title: "Phone died mid-hand?",
    titleAccent: "Your seat waits.",
    lead: "Drop out, come back: the client rejoins its seat and gets the current state.",
    steps: ["Connected", "Signal lost", "Seat held on the server", "Rejoined with the full state"],
  },
  honestTitle: "How we keep the game honest",
  finalCta: { title: "Deal me in.", lead: "Free. In your browser. Bring friends or let the bots sit in." },
  screens: {
    lobby: { src: "/img/lobby/screen-lobby.webp", alt: "Lobby.gg home screen on a phone: game list and rooms" },
    poker: { src: "/img/lobby/screen-poker.webp", alt: "Poker in Lobby.gg: a table with three bots, pot 25, the player's hole cards and Fold / Call / Raise / All-in" },
    mafia: { src: "/img/lobby/screen-mafia.webp", alt: "Mafia in Lobby.gg at night: the player is the Doctor and picks who to heal" },
    chess: { src: "/img/lobby/screen-chess.webp", alt: "Chess in Lobby.gg against a medium bot, starting position" },
  },
  engineering: [
    { title: "A state machine per room", body: "FastAPI + WebSockets. Every room runs its own state machine on the server." },
    { title: "Reconnect mid-game", body: "Drop out, come back: the client rejoins its seat and gets the current state." },
    { title: "Server-authoritative rules", body: "Nobody can cheat at Poker or Mafia from the browser console." },
    { title: "Honest by design", body: "PBKDF2 passwords, HMAC-signed sessions, rate limits, input sanitizing." },
    { title: "My own server", body: "Docker behind Caddy with auto-TLS and security headers." },
  ],
  stack: ["Python", "FastAPI", "WebSockets", "Vanilla JS", "three.js", "SQLite", "Docker", "Caddy"],
};
