"use client";
import { useEffect, useRef } from "react";
import type { WebProject } from "@/content";
import { prefersReducedMotion } from "@/lib/motion/useReducedMotion";

const VERT = `attribute vec2 p; varying vec2 vUv; void main(){ vUv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;

// Liquid stretch along the cursor velocity, RGB split, torn-edge reveal, faint scanlines.
const FRAG = `
precision mediump float;
uniform sampler2D uTex; uniform vec2 uVel; uniform float uTime; uniform float uShow;
varying vec2 vUv;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y); }
void main(){
  vec2 uv = vec2(vUv.x, 1.0 - vUv.y);
  float sp = clamp(length(uVel), 0.0, 1.0);
  uv += uVel * 0.06 * (0.5 - abs(uv - 0.5)).yx * 2.0;                 // drag the middle along the motion
  uv.x += sin(uv.y * 14.0 + uTime * 5.0) * 0.012 * sp;                  // liquid wobble while moving
  vec2 off = uVel * 0.025 + vec2(0.002, 0.0);
  float r = texture2D(uTex, uv + off).r;
  float g = texture2D(uTex, uv).g;
  float b = texture2D(uTex, uv - off).b;
  vec3 col = vec3(r, g, b);
  col *= 0.92 + 0.08 * sin(vUv.y * 600.0);                               // scanlines
  // torn reveal: a noisy edge sweeps up as uShow goes 0 → 1
  float edge = vUv.y + noise(vec2(vUv.x * 18.0, uTime)) * 0.12 - 0.06;
  float a = smoothstep(edge - 0.02, edge, uShow * 1.15);
  float lime = smoothstep(edge - 0.035, edge - 0.02, uShow * 1.15) - smoothstep(edge - 0.02, edge, uShow * 1.15);
  col = mix(col, vec3(0.776, 1.0, 0.102), clamp(lime * 1.5, 0.0, 1.0));
  gl_FragColor = vec4(col * a, a);
}`;

const W = 460, H = 288;

/**
 * Cursor-following preview of the hovered project: its screen recording (or still) as a WebGL
 * texture, distorted by pointer velocity. Fine pointers only; decorative (the list is the content).
 */
export function Distort({ projects, active }: { projects: WebProject[]; active: string | null }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const state = useRef({ active: null as string | null, show: 0 });
  useEffect(() => { state.current.active = active; }, [active]);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv || prefersReducedMotion() || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const gl = cv.getContext("webgl", { premultipliedAlpha: true, alpha: true });
    if (!gl) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = W * dpr; cv.height = H * dpr;
    const sh = (t: number, src: string) => { const s = gl.createShader(t)!; gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog); gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uVel = gl.getUniformLocation(prog, "uVel"), uTime = gl.getUniformLocation(prog, "uTime"), uShow = gl.getUniformLocation(prog, "uShow");
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);

    // One <video> + still per project, created lazily on first hover.
    const media = new Map<string, { video: HTMLVideoElement; img: HTMLImageElement }>();
    const get = (slug: string) => {
      if (!media.has(slug)) {
        const p = projects.find((x) => x.slug === slug)!;
        const img = new Image(); img.src = p.image;
        const video = document.createElement("video");
        Object.assign(video, { muted: true, loop: true, playsInline: true, preload: "auto", src: p.video });
        video.setAttribute("muted", ""); video.setAttribute("playsinline", "");
        media.set(slug, { video, img });
      }
      return media.get(slug)!;
    };

    let mx = innerWidth / 2, my = innerHeight / 2, x = mx, y = my, vx = 0, vy = 0, raf = 0, shown: string | null = null;
    const move = (e: PointerEvent) => { mx = e.clientX; my = e.clientY; };
    window.addEventListener("pointermove", move, { passive: true });
    const t0 = performance.now();

    const frame = () => {
      raf = requestAnimationFrame(frame);
      const st = state.current;
      const nx = x + (mx - x) * 0.14, ny = y + (my - y) * 0.14;
      vx = vx * 0.8 + (nx - x) * 0.2; vy = vy * 0.8 + (ny - y) * 0.2;
      x = nx; y = ny;
      st.show += ((st.active ? 1 : 0) - st.show) * 0.12;
      cv.style.transform = `translate3d(${x - W / 2}px, ${y - H / 2}px, 0) rotate(${Math.max(-8, Math.min(8, vx * 0.35))}deg)`;
      cv.style.opacity = st.show > 0.01 ? "1" : "0";
      if (st.show < 0.01 && !st.active) { if (shown) { get(shown).video.pause(); shown = null; } return; }
      const slug = st.active ?? shown;
      if (!slug) return;
      const m = get(slug);
      if (slug !== shown) { if (shown) get(shown).video.pause(); shown = slug; st.show = Math.min(st.show, 0.15); m.video.play().catch(() => {}); }
      gl.bindTexture(gl.TEXTURE_2D, tex);
      if (m.video.readyState >= 2) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, m.video);
      else if (m.img.complete && m.img.naturalWidth) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, m.img);
      gl.viewport(0, 0, cv.width, cv.height);
      gl.uniform2f(uVel, Math.max(-1, Math.min(1, vx / 40)), Math.max(-1, Math.min(1, -vy / 40)));
      gl.uniform1f(uTime, (performance.now() - t0) / 1000);
      gl.uniform1f(uShow, st.show);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      media.forEach((m) => { m.video.pause(); m.video.removeAttribute("src"); m.video.load(); });
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [projects]);

  return (
    <canvas
      ref={canvas}
      aria-hidden="true"
      style={{ position: "fixed", left: 0, top: 0, width: W, height: H, pointerEvents: "none", zIndex: 40, opacity: 0, transition: "opacity .2s", willChange: "transform" }}
    />
  );
}
