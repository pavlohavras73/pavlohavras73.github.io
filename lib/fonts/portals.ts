import { Big_Shoulders_Stencil, Doto, Monoton, Tektur } from "next/font/google";

// Not preloaded: the doors sit below the fold, so these must not compete with the hero font.
// Each portal door previews its world in that world's display face (one weight each).
const lobby = Monoton({ subsets: ["latin"], weight: "400", variable: "--pf-lobby", display: "swap", preload: false });
const fpv = Tektur({ subsets: ["latin"], weight: "900", variable: "--pf-fpv", display: "swap", preload: false });
const jarvis = Doto({ subsets: ["latin"], weight: "900", variable: "--pf-jarvis", display: "swap", preload: false });
const web = Big_Shoulders_Stencil({ subsets: ["latin"], weight: "900", variable: "--pf-web", display: "swap", adjustFontFallback: false, preload: false });

export const portalFonts = [lobby, fpv, jarvis, web].map((f) => f.variable).join(" ");
