import { Chakra_Petch, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";

const display = Chakra_Petch({ subsets: ["latin"], weight: ["500", "600"], variable: "--f-display", display: "swap" });
const body = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400"], variable: "--f-body", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400"], variable: "--f-mono", display: "swap", preload: false });

export const hangarFonts = `${[display, body, mono].map((f) => f.variable).join(" ")} [--f-accent:var(--f-display)]`;
