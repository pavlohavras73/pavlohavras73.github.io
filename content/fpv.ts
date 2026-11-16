import { todo, type Todo } from "./types";

// Drone data mirrors public/drones/specs.json (the simulator's model parameters).
// `maker: null` = a reference build of a class, not a single manufacturer product.

export type DroneClass = "whoop" | "cinewhoop" | "toothpick" | "racer5" | "freestyle5" | "longrange7";

export type Drone = {
  id: string;
  name: string;
  maker: string | null;
  cls: DroneClass;
  massG: number;
  kv: number;
  propMm: number;
  cells: number;
  mah: number;
  twr: number;
  spinupMs: number;
  /** Not in the simulator data yet — must come from Pavlo or the manufacturer page. */
  motor: string | Todo;
  frame: string | Todo;
};

export const classLabel: Record<DroneClass, string> = {
  whoop: "Tiny whoop",
  cinewhoop: "Cinewhoop",
  toothpick: "Toothpick",
  racer5: '5" Racer',
  freestyle5: '5" Freestyle',
  longrange7: '7" Long range',
};

const t = (what: string) => todo(what);

export const drones: Drone[] = [
  { id: "air65", name: "BetaFPV Air65", maker: "BetaFPV", cls: "whoop", massG: 22.6, kv: 27000, propMm: 31, cells: 1, mah: 300, twr: 4.6, spinupMs: 7, motor: t("Air65 motor model"), frame: t("Air65 frame") },
  { id: "meteor75_pro", name: "BetaFPV Meteor75 Pro", maker: "BetaFPV", cls: "whoop", massG: 30.5, kv: 21000, propMm: 45, cells: 1, mah: 580, twr: 5.0, spinupMs: 10, motor: t("Meteor75 Pro motor model"), frame: t("Meteor75 Pro frame") },
  { id: "mobula7_1s", name: "HappyModel Mobula7", maker: "HappyModel", cls: "whoop", massG: 24.0, kv: 20000, propMm: 40, cells: 1, mah: 450, twr: 4.0, spinupMs: 8, motor: t("Mobula7 motor model"), frame: t("Mobula7 frame") },
  { id: "pavo_pico_2s", name: "BetaFPV Pavo Pico", maker: "BetaFPV", cls: "cinewhoop", massG: 78.0, kv: 14000, propMm: 45, cells: 2, mah: 450, twr: 2.8, spinupMs: 12, motor: t("Pavo Pico motor model"), frame: t("Pavo Pico frame") },
  { id: "crux35_4s", name: 'HappyModel Crux35', maker: "HappyModel", cls: "toothpick", massG: 87.0, kv: 3000, propMm: 89, cells: 4, mah: 850, twr: 7.5, spinupMs: 20, motor: t("Crux35 motor model"), frame: t("Crux35 frame") },
  { id: "racer5_6s", name: '5" Racer 6S', maker: null, cls: "racer5", massG: 580, kv: 1950, propMm: 127, cells: 6, mah: 1300, twr: 13.0, spinupMs: 45, motor: "2207 1950KV", frame: t('5" racer frame') },
  { id: "freestyle5_6s", name: '5" Freestyle 6S', maker: null, cls: "freestyle5", massG: 650, kv: 1800, propMm: 130, cells: 6, mah: 1300, twr: 9.5, spinupMs: 22, motor: "2207 1800KV", frame: t('5" freestyle frame') },
  { id: "longrange7_6s", name: '7" Long Range 6S', maker: null, cls: "longrange7", massG: 1100, kv: 1300, propMm: 178, cells: 6, mah: 3000, twr: 5.0, spinupMs: 60, motor: "2807 1300KV", frame: t('7" long-range frame') },
];

// Facts from the public showcase repo README (github.com/pavlohavras73/fpvsim) and its screenshots.
export const fpv = {
  repoUrl: "https://github.com/pavlohavras73/fpvsim",
  status: "In active development · since Sep 2026",
  sourceNote: "The source is private while the simulator is in development; the showcase repo has the details.",
  hero: {
    kicker: "Unity 6 · C# · Python",
    lead: "A physics-first simulator, flown with a real RadioMaster Pocket radio. The goal: every drone feels like its real counterpart.",
    hint: "Scroll is the throttle.",
    hintPointer: "Move the mouse to roll and pitch.",
  },
  modelling: "Every model is built from manufacturer data, not tuned by eye: mass, motor KV, prop size, thrust, battery cell count, voltage sag, rotor inertia, motor spin-up time.",
  pipeline: [
    { id: "py", step: "Python reference", file: "flight_model.py", body: "The flight model is written first as a readable Python reference. It runs without a GPU, so the physics can be checked anywhere, including in CI." },
    { id: "golden", step: "Golden vectors", file: "golden test vectors", body: "Its outputs are frozen as golden test vectors." },
    { id: "cs", step: "C# engine", file: "same equations", body: "The Unity engine implements the same equations and has to match the golden vectors." },
  ],
  tuner: "The PID auto-tuner finds gains for each drone class against a target step response, instead of hand-tuning.",
  features: [
    { id: "pid", title: "PID auto-tuner", body: "Gains for each drone class, found against a target step response." },
    { id: "rates", title: "Acro rates", body: "Betaflight-style rates. The curve below uses RC rate 1.00, super rate 0.70, expo 0.00, as set in the simulator's menu." },
    { id: "sag", title: "Voltage sag", body: "The battery drops under load, so a punch-out feels different at the end of a pack." },
    { id: "vrs", title: "Vortex ring state", body: "Descend straight into your own downwash and the drone loses lift, like the real thing." },
  ],
  rates: { rcRate: 1.0, superRate: 0.7, expo: 0.0 },
  maps: {
    title: "Procedural maps",
    lead: "A 4-storey abandoned building, 48 × 28 m, with an atrium, stairwells, collapsed floors and 22 gates, generated from a single layout file, so visuals, colliders and race gates never drift apart.",
    voxel: "A voxel flyability check proves every gate is reachable before the map is built.",
    steps: ["Layout script", "Voxel flyability check", "Blender: meshes, FBX", "Unity prefab builder"],
    shots: [
      { src: "/img/fpv/aerial.webp", alt: "The abandoned building map from above, with the simulator's flight HUD" },
      { src: "/img/fpv/atrium.webp", alt: "Flying inside the building's atrium" },
      { src: "/img/fpv/ruins.webp", alt: "Collapsed floors inside the building" },
    ],
  },
  hardware: "RadioMaster Pocket over USB, with configurable rates and key bindings.",
  menuShot: { src: "/img/fpv/menu-main.webp", alt: "The simulator's main menu: a 5-inch freestyle drone on a pedestal with its spec card, rates and live radio channels" },
  stack: ["Unity 6 (URP)", "C#", "Python", "Blender (bpy)", "Linux & Windows builds", "CI on my own server"],
};
