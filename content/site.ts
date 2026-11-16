import type { Link } from "./types";

// Source: the previous site (index.html, profile + contact slides) unless noted.

export const site = {
  url: "https://pavlohavras73.github.io",
  name: "Pavlo Havras",
  shortName: "PH",
  role: "AI agents & automation · Full-stack frontend",
  /** One line for the hero. Rewritten from the old cover lead; same facts. */
  oneLiner:
    "I build complete products on my own: the UI, the backend, the real-time protocol, and the Linux server it all runs on.",
  aiLine: "I use AI agents as a force multiplier and know where they stop being useful.",
  location: { city: "Duisburg", country: "Germany", timeZone: "Europe/Berlin" },
  facts: [
    { k: "Based in", v: "Duisburg, Germany" },
    { k: "Studies", v: "Computer Science, 3rd year, V. N. Karazin Kharkiv National University (distance)" },
    { k: "Experience", v: "1.5 years of AI automation and full-stack projects" },
    { k: "Languages", v: "Ukrainian, Russian, English, German (B1)" },
  ],
  photo: { src: "/img/pavlo.jpg", alt: "Photo of Pavlo Havras" },
  contact: {
    email: "pavlo.havras73@gmail.com",
    github: "https://github.com/pavlohavras73",
    telegram: { handle: "@rainar_73", href: "https://t.me/rainar_73" },
    /**
     * Lead form → n8n "Portfolio — Lead Form" on Pavlo's server → his Telegram.
     * The only public webhook (Caddy), CORS pinned to this site, validated + rate-limited in n8n.
     * If it fails, the form falls back to email / Telegram.
     */
    formEndpoint: "https://my-first-jarvis.duckdns.org/webhook/portfolio-lead",
  },
} as const;

export const stack: { group: string; items: string[] }[] = [
  { group: "Frontend", items: ["TypeScript", "JavaScript", "React / Next.js", "three.js", "GSAP", "WebSockets", "HTML / CSS"] },
  { group: "Backend", items: ["Python", "FastAPI", "Node.js", "SQLite / Postgres", "Redis"] },
  { group: "AI & automation", items: ["Claude Code", "n8n", "LLM APIs (Claude, Gemini)", "MCP", "Playwright"] },
  { group: "DevOps", items: ["Linux", "Docker", "Caddy", "Git", "CI", "Server hardening"] },
  { group: "Game / 3D", items: ["Unity 6", "C#", "Blender pipelines", "Flight physics"] },
  // Pavlo no longer runs local models (GPU sold), so this is framed as experience.
  { group: "Also", items: ["Experience running and tuning local LLMs on my own GPU", "My own Linux desktop (Hyprland) with AI integration"] },
];

export const nav: Link[] = [
  { label: "Projects", href: "/#projects" },
  { label: "Contact", href: "/#contact" },
];
