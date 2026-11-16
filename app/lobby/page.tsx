import { lobby } from "@/content";
import { Hero } from "@/components/worlds/lobby/Hero";
import { Room } from "@/components/worlds/lobby/Room";
import { Chapter } from "@/components/worlds/lobby/Chapter";
import { Reconnect } from "@/components/worlds/lobby/Reconnect";
import { Numbers } from "@/components/worlds/lobby/Numbers";
import { StickyPlay } from "@/components/worlds/lobby/Bits";
import { Bokeh } from "@/components/worlds/lobby/Bokeh";
import { ChessScene, MafiaScene, PokerCloseupScene } from "@/components/worlds/lobby/scenes";

export default function LobbyPage() {
  return (
    <div className="relative pb-24 md:pb-0">
      <Bokeh />
      <div className="relative z-[1]">
      <Hero />
      <Room />
      <Chapter id="poker" Scene={PokerCloseupScene} camera={{ position: [1.9, 1.15, 2.3], fov: 40 }} />
      <Chapter id="mafia" Scene={MafiaScene} camera={{ position: [0, 1.35, 3.6], fov: 38 }} extra={lobby.mafiaRules} />
      <Chapter id="chess" Scene={ChessScene} camera={{ position: [1.9, 2.4, 3.1], fov: 38 }} />
      <Reconnect />
      <Numbers />
      </div>
      <StickyPlay />
    </div>
  );
}
