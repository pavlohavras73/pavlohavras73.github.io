// Flight state shared by the terrain scene (writer) and the HTML OSD (reader). No three.js here.

export const flight = {
  /** 0..1 throttle (scroll), eased. */
  throttle: 0.2,
  /** km/h */
  speed: 0,
  /** metres above ground under the camera */
  alt: 0,
  /** radians */
  roll: 0,
  pitch: 0,
  /** volts, 6S pack */
  volts: 25.2,
  /** seconds armed */
  time: 0,
  /** scroll progress of the hero track (0..1) */
  progress: 0,
  /** scroll velocity, px/frame (from Lenis or native) */
  scrollV: 0,
};

/**
 * Terrain height in metres at world (x, z). Pure sine sums, so the shader and JS agree exactly
 * (the OSD altitude is computed from the same function the GPU displaces the mesh with).
 */
export function terrainHeight(x: number, z: number): number {
  const a = Math.sin(x * 0.021 + Math.sin(z * 0.013) * 1.7) * Math.cos(z * 0.017 - 0.6) * 18;
  const b = Math.sin(x * 0.047 - z * 0.031 + 1.3) * 7;
  const c = Math.sin(z * 0.061 + Math.sin(x * 0.039) * 2.1) * 4.2;
  const ridge = 1 - Math.abs(Math.sin(x * 0.009 + z * 0.006));
  return a + b + c + ridge * ridge * 14 - 8;
}

/** The same function in GLSL. */
export const TERRAIN_GLSL = /* glsl */ `
float terrainHeight(vec2 p) {
  float x = p.x, z = p.y;
  float a = sin(x * 0.021 + sin(z * 0.013) * 1.7) * cos(z * 0.017 - 0.6) * 18.0;
  float b = sin(x * 0.047 - z * 0.031 + 1.3) * 7.0;
  float c = sin(z * 0.061 + sin(x * 0.039) * 2.1) * 4.2;
  float ridge = 1.0 - abs(sin(x * 0.009 + z * 0.006));
  return a + b + c + ridge * ridge * 14.0 - 8.0;
}
`;
