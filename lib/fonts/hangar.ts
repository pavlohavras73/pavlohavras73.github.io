import { Chakra_Petch, IBM_Plex_Mono, IBM_Plex_Sans, Instrument_Serif } from "next/font/google";

const display = Chakra_Petch({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--f-display", display: "swap" });
const body = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500"], variable: "--f-body", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--f-mono", display: "swap" });
const accent = Instrument_Serif({ subsets: ["latin"], weight: "400", style: "italic", variable: "--f-accent", display: "swap" });

export const hangarFonts = [display, body, mono, accent].map((f) => f.variable).join(" ");
