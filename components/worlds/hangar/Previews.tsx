import { drones, classLabel, jarvis, lobby, webProjects } from "@/content";
import s from "./hangar.module.css";

// Decorative mini-worlds inside each door (aria-hidden by the caller). Pure CSS motion.

export function LobbyPreview() {
  const cards = [
    { c: "A♠", k: -1 },
    { c: "K♥", k: 0, red: true },
    { c: "Q♦", k: 1, red: true },
  ];
  const chips = ["#ff5a36", "#f5c451", "#fff3e2", "#ff5a36", "#1d5c3f"];
  return (
    <div className={s.preview}>
      <div className={s.felt} />
      <div className={s.cards}>
        {cards.map((c) => (
          <div key={c.c} className={s.card} data-c={c.c} data-red={c.red ? "" : undefined} style={{ ["--k" as string]: c.k }}>{c.c.slice(-1)}</div>
        ))}
      </div>
      <div className={s.chips}>
        {chips.map((c, n) => <i key={n} className={s.chip} style={{ ["--c" as string]: c, ["--n" as string]: n }} />)}
      </div>
      <span className="sr-only">{lobby.featured.map((f) => f.name).join(", ")}</span>
    </div>
  );
}

export function FpvPreview() {
  const d = drones[0];
  return (
    <div className={s.preview}>
      <div className={s.osd}>
        <div className={s.horizon}><b /><b /><b /><b /></div>
        <div className={s.cross} />
        <div className={s.tl}>
          <span>{d.name.toUpperCase()}</span>
          <span>{classLabel[d.cls].toUpperCase()}</span>
          <span>{d.cells}S · {d.mah} MAH</span>
        </div>
        <div className={s.tr}>
          <span className={s.rec}>● REC</span>
          <span>{d.massG} G</span>
          <span>{d.kv.toLocaleString("en-US")} KV</span>
        </div>
      </div>
    </div>
  );
}

export function JarvisPreview() {
  const lines = jarvis.automations.filter((a) => a.kind === "daily").slice(1, 5).map((a) => ({ time: a.at![0], name: a.name }));
  return (
    <div className={s.preview}>
      <div className={s.orb}>
        {[0, 1, 2].map((n) => <i key={n} style={{ ["--n" as string]: n }} />)}
        <b />
      </div>
      <ul className={s.sched}>
        {lines.map((l, n) => (
          <li key={l.name} style={{ ["--n" as string]: n }}><span>{l.time}</span>{l.name}</li>
        ))}
      </ul>
    </div>
  );
}

export function WebPreview() {
  const names = webProjects.map((p) => p.name);
  return (
    <div className={s.preview}>
      <div className={s.names}>
        <ul>
          {[...names, ...names].map((n, i) => <li key={i}>{n}</li>)}
        </ul>
      </div>
    </div>
  );
}
