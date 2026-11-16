import { worlds, lobby } from "@/content";
import { WorldIntro } from "@/components/shell/WorldIntro";

// Phase 1 placeholder: real content, final art direction comes in this world's phase.
export default function LobbyPage() {
  return (
    <>
      <WorldIntro world={worlds.lobby} stats={lobby.stats} />
    </>
  );
}
