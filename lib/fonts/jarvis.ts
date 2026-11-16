import { Geist_Mono, Sora } from "next/font/google";

const display = Sora({ subsets: ["latin"], weight: ["300", "400", "600"], variable: "--f-display", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--f-mono", display: "swap" });

export const jarvisFonts = `${display.variable} ${mono.variable} [--f-body:var(--f-display)] [--f-accent:var(--f-display)]`;
