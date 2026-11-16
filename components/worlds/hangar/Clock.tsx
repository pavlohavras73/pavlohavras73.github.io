"use client";
import { useEffect, useState } from "react";

/** Live clock for a time zone. Empty on the server (static HTML must not freeze a build time). */
export function Clock({ timeZone, label, className }: { timeZone: string; label: string; className?: string }) {
  const [now, setNow] = useState<{ time: string; zone: string } | null>(null);

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
    const zone = new Intl.DateTimeFormat("en-GB", { timeZone, timeZoneName: "short" });
    const tick = () => {
      const d = new Date();
      setNow({ time: fmt.format(d), zone: zone.formatToParts(d).find((p) => p.type === "timeZoneName")?.value ?? "" });
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timeZone]);

  return (
    <p className={className}>
      <span className="sr-only">{label}: </span>
      <time aria-live="off" className="tabular-nums" suppressHydrationWarning>
        {now ? now.time : "--:--:--"}
      </time>{" "}
      <span className="text-muted">{now?.zone ?? ""}</span>
    </p>
  );
}
