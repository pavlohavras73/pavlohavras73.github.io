import { Barlow_Condensed, Big_Shoulders_Stencil, Bricolage_Grotesque, Sora } from "next/font/google";

// Not preloaded: the doors sit below the fold, so these must not compete with the hero font.
// Each portal door previews its world in that world's display face (one weight each, Latin only).
const lobby = Bricolage_Grotesque({ subsets: ["latin"], weight: "700", variable: "--pf-lobby", display: "swap", preload: false });
const fpv = Barlow_Condensed({ subsets: ["latin"], weight: "600", variable: "--pf-fpv", display: "swap", preload: false });
const jarvis = Sora({ subsets: ["latin"], weight: "300", variable: "--pf-jarvis", display: "swap", preload: false });
const web = Big_Shoulders_Stencil({ subsets: ["latin"], weight: "900", variable: "--pf-web", display: "swap", adjustFontFallback: false, preload: false });

export const portalFonts = [lobby, fpv, jarvis, web].map((f) => f.variable).join(" ");
