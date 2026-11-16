import { Barlow_Condensed, JetBrains_Mono } from "next/font/google";

const display = Barlow_Condensed({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--f-display", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--f-mono", display: "swap" });

export const fpvFonts = `${display.variable} ${mono.variable} [--f-body:var(--f-mono)] [--f-accent:var(--f-display)]`;
