import type { Metadata } from "next";
import { worlds } from "@/content";
import { WorldShell } from "@/components/shell/WorldShell";
import { webFonts } from "@/lib/fonts/web";

const w = worlds.web;
export const metadata: Metadata = {
  title: w.metaTitle,
  description: w.metaDescription,
  openGraph: { title: w.metaTitle, description: w.metaDescription },
};

export default function WebLayout({ children }: { children: React.ReactNode }) {
  return <WorldShell world="web" fontVars={webFonts}>{children}</WorldShell>;
}
