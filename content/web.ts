// The seven showcase sites. Copy from the previous site; all brands are fictional concept projects.
// Tags restate what each line already says. Previews are screen recordings of the sites themselves.

export type WebProject = {
  slug: string;
  name: string;
  line: string;
  tags: string[];
  href: string;
  image: string;
  video: string;
};

const v = (slug: string) => `/video/web/${slug}.mp4`;

export const webProjects: WebProject[] = [
  { slug: "nexa-ai", name: "Nexa AI", line: "Landing page for an AI agent platform: WebGL hero, animated workflow graph, live terminal.", tags: ["WebGL", "Workflow graph", "Live terminal"], href: "/sites/nexa-ai/", image: "/img/site-nexa.jpg", video: v("nexa-ai") },
  { slug: "aeroflux-fpv", name: "AeroFlux FPV", line: "Scroll storytelling with a 3D drone and a live configurator.", tags: ["3D", "Scroll story", "Configurator"], href: "/sites/aeroflux-fpv/", image: "/img/site-aeroflux.jpg", video: v("aeroflux-fpv") },
  { slug: "quant-terminal", name: "Quant Terminal", line: "A working market dashboard: live charts, order book, strategy backtester.", tags: ["Dashboard", "Live charts", "Backtester"], href: "/sites/quant-terminal/", image: "/img/site-quant.jpg", video: v("quant-terminal") },
  { slug: "automind", name: "AutoMind", line: "AI automation agency: marketing site plus a client portal with 8 app screens.", tags: ["Marketing", "Client portal", "8 screens"], href: "/sites/automind/", image: "/img/site-automind.jpg", video: v("automind") },
  { slug: "botforge", name: "BotForge", line: "No-code Telegram bot builder: SaaS site and a flow-editor app.", tags: ["SaaS", "Flow editor", "Telegram"], href: "/sites/botforge/", image: "/img/site-botforge.jpg", video: v("botforge") },
  { slug: "voxdesk", name: "VoxDesk", line: "AI voice receptionist for salons and clinics, with call transcripts in the app.", tags: ["Voice AI", "Transcripts", "App"], href: "/sites/voxdesk/", image: "/img/site-voxdesk.jpg", video: v("voxdesk") },
  { slug: "aerorace", name: "AeroRace League", line: "FPV racing championship: editorial layout, standings, live telemetry.", tags: ["Editorial", "Standings", "Telemetry"], href: "/sites/aerorace/", image: "/img/site-aerorace.jpg", video: v("aerorace") },
];

export const webNote = "All brands are fictional concept projects.";

export const webPage = {
  kicker: "Frontend · 7 drops",
  sticker: "fresh",
  tape: ["7 sites", "7 art directions", "WebGL", "scroll stories", "live dashboards", "SaaS apps", "order a site"],
  indexTitle: "The drops",
  indexHint: "Hover a name. Click to open it.",
  indexHintTouch: "Tap a name to open it.",
  ctaTitle: "Your site. Loud.",
  ctaLead: "Landing page, product site or a full app front end. Tell me the brand and the goal.",
};
