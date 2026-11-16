import { WorldShell } from "@/components/shell/WorldShell";
import { hangarFonts } from "@/lib/fonts/hangar";
import { portalFonts } from "@/lib/fonts/portals";

export default function HubLayout({ children }: { children: React.ReactNode }) {
  return <WorldShell world="hangar" fontVars={`${hangarFonts} ${portalFonts}`}>{children}</WorldShell>;
}
