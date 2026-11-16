import { Share_Tech_Mono, Tektur } from "next/font/google";

// Aggressive tech: angular Tektur for display, Share Tech Mono for every readout and paragraph.
const display = Tektur({ subsets: ["latin"], weight: ["700", "900"], variable: "--f-display", display: "swap" });
const mono = Share_Tech_Mono({ subsets: ["latin"], weight: "400", variable: "--f-mono", display: "swap" });

export const fpvFonts = `${display.variable} ${mono.variable} [--f-body:var(--f-mono)] [--f-accent:var(--f-display)]`;
