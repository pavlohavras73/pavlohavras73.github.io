"use client";
import { ShaderField } from "@/lib/gl/ShaderField";
import { HANGAR_FIELD } from "./field";

const AMBER: [number, number, number] = [1, 0.69, 0.125];

export function Field() {
  return <ShaderField frag={HANGAR_FIELD} accent={AMBER} />;
}
