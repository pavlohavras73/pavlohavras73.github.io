"use client";
import { useEffect, useState } from "react";
import { enableTilt, installSense, isTouchDevice, sense, subscribeTilt, tiltNeedsPermission } from "@/lib/motion/sense";

/**
 * Phones only: a small button that turns on tilt control. iOS needs a tap before it shares the
 * gyroscope; Android streams it straight away, so there the chip just confirms tilt is live.
 */
export function TiltChip({ label = "Tilt to steer", className }: { label?: string; className?: string }) {
  const [state, setState] = useState<"hidden" | "ask" | "on" | "no">("hidden");

  useEffect(() => {
    if (!isTouchDevice()) return;
    installSense();
    const sync = () => setState(sense.tiltOn ? "on" : tiltNeedsPermission() ? "ask" : "hidden");
    sync();
    return subscribeTilt(sync);
  }, []);

  if (state === "hidden") return null;
  const ask = async () => { if (state === "ask") setState((await enableTilt()) ? "ask" : "no"); };
  return (
    <button type="button" onClick={ask} disabled={state !== "ask"} className={`tilt-chip ${className ?? ""}`} data-state={state}>
      <i aria-hidden="true" />
      {state === "on" ? "Tilt: live" : state === "no" ? "Motion access off" : label}
    </button>
  );
}
