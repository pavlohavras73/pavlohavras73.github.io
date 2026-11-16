"use client";
import dynamic from "next/dynamic";

// three.js and the scenes load only when a Stage mounts (after first paint, near the viewport).
export const PokerScene = dynamic(() => import("./three/PokerScene"), { ssr: false });
export const PokerCloseupScene = dynamic(() => import("./three/PokerScene").then((m) => m.PokerCloseup), { ssr: false });
export const MafiaScene = dynamic(() => import("./three/MafiaScene"), { ssr: false });
export const ChessScene = dynamic(() => import("./three/ChessScene"), { ssr: false });
