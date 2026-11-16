import { Bodoni_Moda, Geist, Geist_Mono } from "next/font/google";

const display = Bodoni_Moda({ subsets: ["latin"], style: ["normal", "italic"], variable: "--f-display", display: "swap" });
const body = Geist({ subsets: ["latin"], variable: "--f-body", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], weight: ["400"], variable: "--f-mono", display: "swap" });

export const webFonts = `${display.variable} ${body.variable} ${mono.variable} [--f-accent:var(--f-display)]`;
