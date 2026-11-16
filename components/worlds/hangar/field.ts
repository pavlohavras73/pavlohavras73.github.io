// Hangar background: a quiet dot grid on graphite. Slow value-noise drifts through it like
// dust in hangar light; the pointer warms nearby dots to amber. No blobs, no gradients.
export const HANGAR_FIELD = /* glsl */ `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform vec3 uAccent;
uniform float uScroll;

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

void main() {
  float cell = 30.0 * (uRes.y / max(uRes.y, 1.0)) * clamp(uRes.x / 1400.0, 0.75, 1.4);
  vec2 p = gl_FragCoord.xy + vec2(0.0, uScroll * 0.35);
  vec2 id = floor(p / cell);
  vec2 f = fract(p / cell) - 0.5;

  // Dust: two octaves of drifting noise per cell.
  float n = noise(id * 0.09 + vec2(uTime * 0.035, -uTime * 0.02));
  n = 0.65 * n + 0.35 * noise(id * 0.23 - uTime * 0.05);
  float lit = smoothstep(0.52, 0.92, n);

  // Pointer warmth.
  float md = length(gl_FragCoord.xy - uMouse) / (cell * 7.0);
  float warm = exp(-md * md * 1.6);

  float r = mix(0.075, 0.15, max(lit, warm));
  float dotMask = 1.0 - smoothstep(r - 0.04, r + 0.02, length(f));

  // Faint grid lines every 4 cells.
  vec2 g = abs(fract(p / (cell * 4.0)) - 0.5);
  float line = (1.0 - smoothstep(0.0, 1.2 / (cell * 4.0), 0.5 - max(g.x, g.y))) * 0.05;

  vec3 grey = vec3(0.62, 0.67, 0.72);
  vec3 col = mix(grey, uAccent, clamp(warm * 1.1 + lit * 0.25, 0.0, 1.0));
  float a = dotMask * (0.10 + lit * 0.34 + warm * 0.6) + line;

  // Fade toward the bottom so the content below sits on clean graphite.
  a *= smoothstep(0.0, 0.45, gl_FragCoord.y / uRes.y);
  gl_FragColor = vec4(col * a, a);
}
`;
