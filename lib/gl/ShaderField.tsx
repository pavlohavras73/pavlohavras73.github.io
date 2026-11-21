"use client";
import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion/useReducedMotion";
import { focusPoint } from "@/lib/motion/sense";
import { afterFirstPaint } from "@/lib/three/support";
import { onFirstInteraction } from "@/lib/three/interaction";

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

type Props = {
  /** WebGL1 fragment shader. Uniforms available: uRes, uTime, uMouse (px, y up), uAccent, uScroll. */
  frag: string;
  /** Accent colour as 0..1 RGB. */
  accent: [number, number, number];
  className?: string;
  maxDpr?: number;
};

/**
 * A tiny full-bleed fragment-shader canvas with no three.js: ~2 KB of JS.
 * Starts after first paint, pauses off-screen, renders a single frame for reduced motion,
 * and leaves the CSS poster behind it untouched when WebGL is missing.
 */
export function ShaderField({ frag, accent, className, maxDpr = 1.5 }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let disposed = false;
    let cleanup = () => {};

    const start = () => {
      if (disposed) return;
      const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false });
      if (!gl) return;
      const sh = (type: number, src: string) => {
        const s = gl.createShader(type)!;
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "shader");
        return s;
      };
      const prog = gl.createProgram()!;
      try {
        gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
        gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, frag));
      } catch {
        return; // keep the poster
      }
      gl.linkProgram(prog);
      gl.useProgram(prog);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, "p");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      const u = (n: string) => gl.getUniformLocation(prog, n);
      const uRes = u("uRes"), uTime = u("uTime"), uMouse = u("uMouse"), uAccent = u("uAccent"), uScroll = u("uScroll");
      gl.uniform3f(uAccent, accent[0], accent[1], accent[2]);

      let dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      let w = 0, h = 0;
      const resize = () => {
        w = canvas.clientWidth; h = canvas.clientHeight;
        canvas.width = Math.max(1, Math.round(w * dpr)); canvas.height = Math.max(1, Math.round(h * dpr));
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform2f(uRes, canvas.width, canvas.height);
      };
      const ro = new ResizeObserver(resize);
      ro.observe(canvas);
      resize();

      // The glow eases toward the mouse, a finger or the phone's tilt (lib/motion/sense); it starts
      // off-canvas so nothing glows until one of them moves.
      const mouse = { x: -1e4, y: -1e4, tx: -1e4, ty: -1e4 };
      const follow = () => {
        const fp = focusPoint();
        if (!fp) return;
        const r = canvas.getBoundingClientRect();
        mouse.tx = (fp.x - r.left) * dpr;
        mouse.ty = (r.height - (fp.y - r.top)) * dpr;
        if (mouse.x < -1e3) { mouse.x = mouse.tx; mouse.y = mouse.ty; }
      };

      // Reduced motion: the field still breathes, at a third of the speed.
      const rate = prefersReducedMotion() ? 0.33 : 1;
      let visible = true, raf = 0;
      const t0 = performance.now();
      let lastDraw = 0, lateFrames = 0;
      const frame = () => {
        raf = 0;
        const now = performance.now();
        // 30 fps: the field drifts slowly, 60 fps only doubled the GPU work on weak laptops
        if (now - lastDraw < 32) { if (visible) raf = requestAnimationFrame(frame); return; }
        // adaptive: frames keep arriving late -> render at a lower resolution
        if (lastDraw && now - lastDraw > 55) { if (++lateFrames === 15 && dpr > 0.75) { dpr = Math.max(0.75, dpr * 0.6); resize(); } }
        lastDraw = now;
        follow();
        mouse.x += (mouse.tx - mouse.x) * 0.08;
        mouse.y += (mouse.ty - mouse.y) * 0.08;
        gl.uniform1f(uTime, 12 + ((performance.now() - t0) / 1000) * rate);
        gl.uniform2f(uMouse, mouse.x, mouse.y);
        gl.uniform1f(uScroll, window.scrollY * dpr);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        if (visible) raf = requestAnimationFrame(frame);
      };
      const io = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        if (visible && !raf) raf = requestAnimationFrame(frame);
      });
      io.observe(canvas);
      raf = requestAnimationFrame(frame);
      canvas.style.opacity = "1";

      cleanup = () => {
        cancelAnimationFrame(raf);
        io.disconnect();
        ro.disconnect();
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      };
    };

    let cancelPaint = () => {};
    const cancelWait = onFirstInteraction(() => { cancelPaint = afterFirstPaint(start); });
    return () => { disposed = true; cancelWait(); cancelPaint(); cleanup(); };
  }, [frag, accent, maxDpr]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={className}
      style={{ opacity: 0, transition: "opacity 1.2s ease", display: "block", width: "100%", height: "100%" }}
    />
  );
}
