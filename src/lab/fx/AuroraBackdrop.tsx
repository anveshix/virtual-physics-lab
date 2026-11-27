import { useEffect, useRef } from "react";
import { Mesh, Program, Renderer, Triangle } from "ogl";
import { motionAllowed } from "./motion";

const vertex = /* glsl */ `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

/**
 * A slow, domain-warped nebula in the lab's colours, with faint iso-contours
 * (they read as field lines) and a soft light that follows the cursor. Kept
 * dark on purpose: it sits behind text, so its brightest point stays well
 * under the contrast of body copy.
 */
const fragment = /* glsl */ `
precision highp float;
uniform float uTime;
uniform vec2 uRes;
uniform vec2 uMouse;
varying vec2 vUv;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = m * p;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float t = uTime * 0.03;

  vec2 q = vec2(fbm(p * 1.3 + vec2(0.0, t)), fbm(p * 1.3 + vec2(5.2, -t)));
  vec2 r = vec2(fbm(p * 1.7 + 3.0 * q + vec2(1.7, 9.2) + t * 0.6),
                fbm(p * 1.7 + 3.0 * q + vec2(8.3, 2.8) - t * 0.5));
  float f = fbm(p * 1.1 + 2.4 * r);

  vec3 col = vec3(0.012, 0.018, 0.043);
  vec3 cyan = vec3(0.09, 0.72, 0.88);
  vec3 violet = vec3(0.40, 0.30, 0.95);
  vec3 rose = vec3(0.90, 0.32, 0.62);
  col = mix(col, violet * 0.30, smoothstep(0.40, 0.90, f));
  col = mix(col, cyan * 0.30, smoothstep(0.50, 0.98, r.x) * 0.8);
  col += rose * 0.07 * smoothstep(0.62, 1.0, q.y);

  // Contours of the same field: thin, faint, drifting with it.
  float c = abs(fract(f * 8.0) - 0.5);
  col += cyan * 0.045 * smoothstep(0.07, 0.0, c) * smoothstep(0.35, 0.85, f);

  // A sparse, twinkling star field.
  vec2 cell = floor(p * 70.0);
  float h = hash(cell);
  if (h > 0.982) {
    vec2 at = fract(p * 70.0) - (0.25 + 0.5 * vec2(hash(cell + 3.1), hash(cell + 7.7)));
    float tw = 0.55 + 0.45 * sin(uTime * (0.6 + h) + h * 90.0);
    col += vec3(0.75, 0.85, 1.0) * 0.5 * tw * smoothstep(0.09, 0.0, length(at));
  }

  // Cursor light.
  float d = length(p - uMouse);
  col += cyan * 0.07 * exp(-d * d * 5.0);

  col *= 1.0 - 0.5 * length(vUv - 0.5);
  gl_FragColor = vec4(col, 1.0);
}
`;

/** Whether this browser can run WebGL at all (jsdom cannot). */
export function webglAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.WebGLRenderingContext !== "undefined"
  );
}

export interface AuroraBackdropProps {
  /** Render one frame and hold it — used on experiment pages to leave the GPU to the simulation. */
  frozen?: boolean;
}

/**
 * The fixed WebGL backdrop behind every page. Rendered at half resolution
 * (soft clouds lose nothing) and at most 30 frames a second, paused while the
 * tab is hidden, and frozen when motion is off. Without WebGL the element's
 * CSS gradient is the backdrop.
 */
export function AuroraBackdrop({ frozen = false }: AuroraBackdropProps) {
  const host = useRef<HTMLDivElement>(null);
  const frozenRef = useRef(frozen);
  frozenRef.current = frozen;
  const kick = useRef<() => void>(() => undefined);

  useEffect(() => {
    const el = host.current;
    if (!el || !webglAvailable()) return;

    let renderer: Renderer;
    try {
      renderer = new Renderer({
        dpr: 1,
        alpha: false,
        antialias: false,
        depth: false,
        powerPreference: "low-power",
      });
    } catch {
      return;
    }
    const gl = renderer.gl;
    if (!gl) return;
    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.className = "aurora-canvas";
    canvas.setAttribute("aria-hidden", "true");
    el.appendChild(canvas);

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uTime: { value: 0 },
        uRes: { value: [1, 1] },
        uMouse: { value: [0.4, 0.1] },
      },
    });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    const SCALE = 0.5;
    const resize = (): void => {
      const w = Math.max(1, Math.round(window.innerWidth * SCALE));
      const h = Math.max(1, Math.round(window.innerHeight * SCALE));
      renderer.setSize(w, h);
      program.uniforms.uRes.value = [w, h];
      canvas.style.width = "100%";
      canvas.style.height = "100%";
    };
    resize();

    const target = { x: 0.4, y: 0.1 };
    const mouse = { x: 0.4, y: 0.1 };
    const onMove = (e: PointerEvent): void => {
      const h = window.innerHeight;
      target.x = (e.clientX - window.innerWidth / 2) / h;
      target.y = (h / 2 - e.clientY) / h;
    };

    let raf = 0;
    let last = 0;
    let time = 12;
    let running = false;
    const frame = (now: number): void => {
      raf = 0;
      const animate = motionAllowed() && !frozenRef.current && !document.hidden;
      const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
      if (animate && dt < 1 / 32 && last) {
        raf = requestAnimationFrame(frame);
        return;
      }
      last = now;
      if (animate) time += dt;
      mouse.x += (target.x - mouse.x) * 0.06;
      mouse.y += (target.y - mouse.y) * 0.06;
      program.uniforms.uTime.value = time;
      program.uniforms.uMouse.value = [mouse.x, mouse.y];
      renderer.render({ scene: mesh });
      if (animate) raf = requestAnimationFrame(frame);
      else running = false;
    };
    const start = (): void => {
      if (raf) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(frame);
    };
    kick.current = start;
    start();

    const onVisible = (): void => {
      if (!document.hidden) start();
    };
    const onResize = (): void => {
      resize();
      start();
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("visibilitychange", onVisible);
    // The Motion switch flips an attribute on <html>; resume when it does.
    const mo = new MutationObserver(() => start());
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-motion"],
    });

    return () => {
      void running;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVisible);
      mo.disconnect();
      kick.current = () => undefined;
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      canvas.remove();
    };
  }, []);

  useEffect(() => {
    kick.current();
  }, [frozen]);

  return <div ref={host} className="aurora" aria-hidden="true" />;
}
