import { Monoton, Outfit, Righteous } from "next/font/google";

// Lounge: Monoton neon tubes for the big names, Righteous for headings, Outfit for reading.
const display = Righteous({ subsets: ["latin"], weight: "400", variable: "--f-display", display: "swap" });
const neon = Monoton({ subsets: ["latin"], weight: "400", variable: "--f-accent", display: "swap" });
const body = Outfit({ subsets: ["latin"], weight: ["300", "400", "600"], variable: "--f-body", display: "swap" });

// Lobby has no mono voice: --f-mono falls back to the body face.
export const lobbyFonts = `${[display, neon, body].map((f) => f.variable).join(" ")} [--f-mono:var(--f-body)]`;
