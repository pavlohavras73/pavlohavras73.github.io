import s from "./lobby.module.css";

// Warm out-of-focus lights drifting behind the lounge, like a bar seen through a glass. Pure CSS.
const LIGHTS = [
  { x: 8, y: 12, r: 220, c: "#ff3d7f", d: 26 }, { x: 78, y: 8, r: 280, c: "#f5c451", d: 32 },
  { x: 55, y: 34, r: 180, c: "#ff6a2b", d: 22 }, { x: 18, y: 58, r: 260, c: "#f5c451", d: 30 },
  { x: 88, y: 52, r: 200, c: "#ff3d7f", d: 28 }, { x: 40, y: 80, r: 300, c: "#ff6a2b", d: 36 },
  { x: 70, y: 88, r: 170, c: "#39d5ff", d: 24 }, { x: 28, y: 30, r: 140, c: "#39d5ff", d: 20 },
];

export function Bokeh() {
  return (
    <div className={s.bokeh} aria-hidden="true">
      {LIGHTS.map((l, i) => (
        <i key={i} style={{ left: `${l.x}%`, top: `${l.y}%`, width: l.r, height: l.r, background: `radial-gradient(circle, ${l.c}, transparent 70%)`, animationDuration: `${l.d}s`, animationDelay: `${-i * 3}s` }} />
      ))}
    </div>
  );
}
