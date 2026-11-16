import { Archivo, Big_Shoulders_Stencil, Sedgwick_Ave_Display, Space_Mono } from "next/font/google";

// Street: stencil display, a graffiti tag hand for stickers, wide grotesk body, mono labels.
const display = Big_Shoulders_Stencil({ subsets: ["latin"], weight: ["700", "900"], variable: "--f-display", display: "swap", adjustFontFallback: false });
const tag = Sedgwick_Ave_Display({ subsets: ["latin"], weight: "400", variable: "--f-accent", display: "swap" });
const body = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--f-body", display: "swap" });
const mono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--f-mono", display: "swap" });

export const webFonts = [display, tag, body, mono].map((f) => f.variable).join(" ");
