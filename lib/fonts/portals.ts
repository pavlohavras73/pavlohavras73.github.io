import { Barlow_Condensed, Bodoni_Moda, Bricolage_Grotesque, Sora } from "next/font/google";

// Each portal door previews its world in that world's display face (one weight each, Latin only).
const lobby = Bricolage_Grotesque({ subsets: ["latin"], weight: "700", variable: "--pf-lobby", display: "swap" });
const fpv = Barlow_Condensed({ subsets: ["latin"], weight: "600", variable: "--pf-fpv", display: "swap" });
const jarvis = Sora({ subsets: ["latin"], weight: "300", variable: "--pf-jarvis", display: "swap" });
const web = Bodoni_Moda({ subsets: ["latin"], style: "italic", weight: "500", variable: "--pf-web", display: "swap" });

export const portalFonts = [lobby, fpv, jarvis, web].map((f) => f.variable).join(" ");
