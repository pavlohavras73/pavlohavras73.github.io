import { Bricolage_Grotesque, Familjen_Grotesk, Fraunces } from "next/font/google";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--f-display", display: "swap" });
const body = Familjen_Grotesk({ subsets: ["latin"], variable: "--f-body", display: "swap" });
const accent = Fraunces({ subsets: ["latin"], style: "italic", variable: "--f-accent", display: "swap" });

// Lobby has no mono voice: --f-mono falls back to the body face.
export const lobbyFonts = `${[display, body, accent].map((f) => f.variable).join(" ")} [--f-mono:var(--f-body)]`;
