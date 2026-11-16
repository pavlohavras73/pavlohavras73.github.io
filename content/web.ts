// The seven showcase sites. Copy from the previous site; all brands are fictional concept projects.

export type WebProject = {
  slug: string;
  name: string;
  line: string;
  href: string;
  image: string;
  /** Short looping preview; recorded from the live site in Phase 6. */
  video?: string;
};

export const webProjects: WebProject[] = [
  { slug: "nexa-ai", name: "Nexa AI", line: "Landing page for an AI agent platform: WebGL hero, animated workflow graph, live terminal.", href: "/sites/nexa-ai/", image: "/img/site-nexa.jpg" },
  { slug: "aeroflux-fpv", name: "AeroFlux FPV", line: "Scroll storytelling with a 3D drone and a live configurator.", href: "/sites/aeroflux-fpv/", image: "/img/site-aeroflux.jpg" },
  { slug: "quant-terminal", name: "Quant Terminal", line: "A working market dashboard: live charts, order book, strategy backtester.", href: "/sites/quant-terminal/", image: "/img/site-quant.jpg" },
  { slug: "automind", name: "AutoMind", line: "AI automation agency: marketing site plus a client portal with 8 app screens.", href: "/sites/automind/", image: "/img/site-automind.jpg" },
  { slug: "botforge", name: "BotForge", line: "No-code Telegram bot builder: SaaS site and a flow-editor app.", href: "/sites/botforge/", image: "/img/site-botforge.jpg" },
  { slug: "voxdesk", name: "VoxDesk", line: "AI voice receptionist for salons and clinics, with call transcripts in the app.", href: "/sites/voxdesk/", image: "/img/site-voxdesk.jpg" },
  { slug: "aerorace", name: "AeroRace League", line: "FPV racing championship: editorial layout, standings, live telemetry.", href: "/sites/aerorace/", image: "/img/site-aerorace.jpg" },
];

export const webNote = "All brands are fictional concept projects.";
