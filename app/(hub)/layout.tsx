import { WorldShell } from "@/components/shell/WorldShell";
import { hangarFonts } from "@/lib/fonts/hangar";

export default function HubLayout({ children }: { children: React.ReactNode }) {
  return <WorldShell world="hangar" fontVars={hangarFonts}>{children}</WorldShell>;
}
