import type { Metadata } from "next";
import { worlds } from "@/content";
import { WorldShell } from "@/components/shell/WorldShell";
import { fpvFonts } from "@/lib/fonts/fpv";

const w = worlds.fpv;
export const metadata: Metadata = {
  title: w.metaTitle,
  description: w.metaDescription,
  openGraph: { title: w.metaTitle, description: w.metaDescription },
};

export default function FpvLayout({ children }: { children: React.ReactNode }) {
  return <WorldShell world="fpv" fontVars={fpvFonts}>{children}</WorldShell>;
}
