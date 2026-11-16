import type { Metadata } from "next";
import { worlds } from "@/content";
import { WorldShell } from "@/components/shell/WorldShell";
import { lobbyFonts } from "@/lib/fonts/lobby";

const w = worlds.lobby;
export const metadata: Metadata = {
  title: w.metaTitle,
  description: w.metaDescription,
  openGraph: { title: w.metaTitle, description: w.metaDescription },
};

export default function LobbyLayout({ children }: { children: React.ReactNode }) {
  return <WorldShell world="lobby" fontVars={lobbyFonts}>{children}</WorldShell>;
}
