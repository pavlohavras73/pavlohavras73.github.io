import { Doto, Geist_Mono } from "next/font/google";

// Futuristic matrix: a dot-matrix display face, terminal mono for everything else.
const display = Doto({ subsets: ["latin"], weight: ["700", "900"], variable: "--f-display", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--f-mono", display: "swap" });

export const jarvisFonts = `${display.variable} ${mono.variable} [--f-body:var(--f-mono)] [--f-accent:var(--f-display)]`;
