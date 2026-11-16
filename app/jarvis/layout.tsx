import type { Metadata } from "next";
import { worlds } from "@/content";
import { WorldShell } from "@/components/shell/WorldShell";
import { jarvisFonts } from "@/lib/fonts/jarvis";

const w = worlds.jarvis;
export const metadata: Metadata = {
  title: w.metaTitle,
  description: w.metaDescription,
  openGraph: { title: w.metaTitle, description: w.metaDescription },
};

export default function JarvisLayout({ children }: { children: React.ReactNode }) {
  return <WorldShell world="jarvis" fontVars={jarvisFonts}>{children}</WorldShell>;
}
