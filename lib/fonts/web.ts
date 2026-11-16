import { Archivo, Big_Shoulders_Stencil, Sedgwick_Ave_Display, Space_Mono } from "next/font/google";

// Street: stencil display, a graffiti tag hand for stickers, wide grotesk body, mono labels.
const display = Big_Shoulders_Stencil({ subsets: ["latin"], weight: ["900"], variable: "--f-display", display: "swap", adjustFontFallback: false });
const tag = Sedgwick_Ave_Display({ subsets: ["latin"], weight: "400", variable: "--f-accent", display: "swap", preload: false });
const body = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--f-body", display: "swap" });
const mono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--f-mono", display: "swap", preload: false });

export const webFonts = [display, tag, body, mono].map((f) => f.variable).join(" ");
