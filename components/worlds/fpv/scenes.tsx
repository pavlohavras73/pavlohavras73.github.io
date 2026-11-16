"use client";
import dynamic from "next/dynamic";

export const TerrainScene = dynamic(() => import("./three/TerrainScene"), { ssr: false });
export const DroneScene = dynamic(() => import("./three/DroneScene"), { ssr: false });
