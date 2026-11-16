import type { WorldId, WorldMeta } from "./types";

export const worlds: Record<Exclude<WorldId, "hangar">, WorldMeta> = {
  lobby: {
    id: "lobby",
    kind: "Multiplayer games",
    route: "/lobby/",
    title: "Lobby.gg",
    tagline: "Game night with friends: 28 browser games, one link.",
    metaTitle: "Lobby.gg · Pavlo Havras",
    metaDescription: "Lobby.gg: 28 multiplayer browser games with friends. Poker, Mafia, Chess and more, server-authoritative and reconnect-safe.",
    cta: { label: "Play now", href: "https://promo-dev.duckdns.org/games/", external: true },
  },
  fpv: {
    id: "fpv",
    kind: "Unity · C# · Python",
    route: "/fpv/",
    title: "FPV Drone Simulator",
    tagline: "Physics-first, flown with a real RadioMaster radio.",
    metaTitle: "FPV Drone Simulator · Pavlo Havras",
    metaDescription: "A physics-first FPV drone simulator in Unity: my own flight model, drones modelled from manufacturer data, procedural maps.",
    cta: { label: "Follow development", href: "https://github.com/pavlohavras73/fpvsim", external: true },
  },
  jarvis: {
    id: "jarvis",
    kind: "AI agent",
    route: "/jarvis/",
    title: "Jarvis",
    tagline: "My own AI agent, running around the clock.",
    metaTitle: "Jarvis · Pavlo Havras",
    metaDescription: "Jarvis: a personal AI agent on my own server. Telegram, 21 live n8n automations, a 1,200-note memory, and a guard that keeps it safe.",
    cta: { label: "Build my agent", href: "/jarvis/#contact" },
  },
  web: {
    id: "web",
    kind: "Frontend",
    route: "/web/",
    title: "Web Showcase",
    tagline: "Seven sites, seven art directions.",
    metaTitle: "Web Showcase · Pavlo Havras",
    metaDescription: "Seven websites I designed and built: landing pages, dashboards and SaaS apps with WebGL, scroll storytelling and live data.",
    cta: { label: "Order a site", href: "/web/#contact" },
  },
};

export const worldOrder = ["lobby", "fpv", "jarvis", "web"] as const;
