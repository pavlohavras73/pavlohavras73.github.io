import { Climate_Crisis, IBM_Plex_Mono, Onest } from "next/font/google";

// Hangar: Climate Crisis has a YEAR axis (1979 → 2050) that "melts" the letters; the hero name
// animates it. Onest for reading, Plex Mono for labels (all with Cyrillic, for the UA version).
const display = Climate_Crisis({ subsets: ["latin", "latin-ext", "cyrillic"], axes: ["YEAR"], variable: "--f-display", display: "swap" });
const body = Onest({ subsets: ["latin", "latin-ext", "cyrillic"], weight: ["400", "500"], variable: "--f-body", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin", "cyrillic"], weight: ["400"], variable: "--f-mono", display: "swap", preload: false });

export const hangarFonts = `${[display, body, mono].map((f) => f.variable).join(" ")} [--f-accent:var(--f-display)]`;
