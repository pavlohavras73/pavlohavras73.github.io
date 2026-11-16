# pavlohavras73.github.io

My portfolio site: **https://pavlohavras73.github.io**

A hangar with doors: a short home page, and a separate world with its own art direction for each project.

| Route | World |
|---|---|
| `/` | Hangar: who I am, and the doors |
| `/lobby/` | Lobby.gg, multiplayer browser games |
| `/fpv/` | FPV drone simulator |
| `/jarvis/` | Jarvis, my personal AI agent |
| `/web/` | Web showcase: seven sites |

Built with Next.js (App Router, static export), TypeScript, Tailwind, GSAP + ScrollTrigger, Lenis and React Three Fiber.
All copy and numbers live in `content/*.ts`; numbers carry the date they were measured.

## Web showcase

The seven showcase sites are static and served unchanged from `public/sites/`:

| Site | What it is |
|---|---|
| [Nexa AI](https://pavlohavras73.github.io/sites/nexa-ai/) | Landing page for an AI agent platform: WebGL hero, animated workflow graph |
| [AeroFlux FPV](https://pavlohavras73.github.io/sites/aeroflux-fpv/) | Scroll storytelling with a 3D drone and a live configurator |
| [Quant Terminal](https://pavlohavras73.github.io/sites/quant-terminal/) | Market dashboard: live charts, order book, strategy backtester |
| [AutoMind](https://pavlohavras73.github.io/sites/automind/) | AI automation agency: marketing site + client portal (`/app`) |
| [BotForge](https://pavlohavras73.github.io/sites/botforge/) | No-code Telegram bot builder: SaaS site + flow editor (`/app`) |
| [VoxDesk](https://pavlohavras73.github.io/sites/voxdesk/) | AI voice receptionist: marketing site + call transcripts (`/app`) |
| [AeroRace League](https://pavlohavras73.github.io/sites/aerorace/) | FPV racing championship: editorial layout, standings, telemetry |

All brands are fictional concept projects.

## Develop

```bash
npm ci
npm run dev            # http://localhost:3000
npx next build         # static export → out/
node scripts/shots.mjs # screenshots at 1440 / 768 / 390 px + console/overflow check
```

Deployed by GitHub Actions (`.github/workflows/pages.yml`) on push to `main`.
