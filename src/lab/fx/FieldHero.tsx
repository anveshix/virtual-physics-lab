import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Mesh, Program, Renderer, Triangle } from "ogl";
import { motionAllowed } from "./motion";
import { webglAvailable } from "./AuroraBackdrop";

const vertex = /* glsl */ `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }
`;

/**
 * The field of three infinite line charges, exactly.
 *
 * In two dimensions the potential of a line charge is V = −q ln r and its
 * field lines are the level sets of the stream function ψ = q θ. Both sum
 * over charges, so the shader draws the true field lines (contours of Σ qθ)
 * and the true equipotentials (contours of −Σ q ln r), which cross at right
 * angles everywhere. Line width is held constant on screen by dividing each
 * contour distance by |∇ψ| = |∇V| = |E|. The dashes travel along E — from +
 * towards − — at a rate that is illustrative, not physical.
 */
const fragment = /* glsl */ `
precision highp float;
uniform float uTime;
uniform vec2 uRes;
uniform vec3 uQ[3];
varying vec2 vUv;

const float PI = 3.14159265;

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float V = 0.0;
  float psi = 0.0;
  vec2 E = vec2(0.0);
  float near = 10.0;
  for (int i = 0; i < 3; i++) {
    vec2 d = p - uQ[i].xy;
    float r2 = dot(d, d) + 1e-6;
    V += -0.5 * uQ[i].z * log(r2);
    psi += uQ[i].z * atan(d.y, d.x);
    E += uQ[i].z * d / r2;
    near = min(near, sqrt(r2));
  }
  float e = max(length(E), 1e-4);
  float px = 1.0 / uRes.y;

  vec3 warm = vec3(1.0, 0.42, 0.49);
  vec3 cool = vec3(0.35, 0.66, 1.0);
  vec3 col = vec3(0.016, 0.024, 0.052);
  // Potential wash: warm where V > 0, cool where V < 0.
  float s = clamp(V * 0.35, -1.0, 1.0);
  col += (s > 0.0 ? warm : cool) * 0.16 * abs(s);

  // Field lines: 16 per unit charge.
  float k = 16.0 / (2.0 * PI);
  float fl = abs(fract(psi * k + 0.5) - 0.5) / (k * e);
  float line = smoothstep(1.4 * px, 0.0, fl);
  // Dashes flow towards falling V.
  float dash = 0.55 + 0.45 * smoothstep(0.25, 0.0, abs(fract(V * 1.6 + uTime * 0.45) - 0.5) - 0.12);
  col += vec3(0.62, 0.92, 1.0) * line * 0.55 * dash;

  // Equipotentials.
  float m = 2.2;
  float eq = abs(fract(V * m + 0.5) - 0.5) / (m * e);
  col += mix(cool, warm, step(0.0, V)) * smoothstep(1.1 * px, 0.0, eq) * 0.28;

  // Keep the immediate neighbourhood of each charge clean for its handle.
  col *= smoothstep(0.035, 0.07, near);
  col *= 1.0 - 0.35 * length(vUv - 0.5);
  gl_FragColor = vec4(col, 1.0);
}
`;

interface Charge {
  x: number;
  y: number;
  q: 1 | -1;
}

const START: Charge[] = [
  { x: -0.34, y: 0.06, q: 1 },
  { x: 0.3, y: -0.08, q: -1 },
  { x: 0.02, y: 0.28, q: 1 },
];

export interface FieldHeroProps {
  /** Shown instead when this browser has no WebGL. */
  fallback: React.ReactNode;
}

/** The interactive field lab on the home page. */
export function FieldHero({ fallback }: FieldHeroProps) {
  const host = useRef<HTMLDivElement>(null);
  const [charges, setCharges] = useState<Charge[]>(START);
  const chargesRef = useRef(charges);
  chargesRef.current = charges;
  const [ok, setOk] = useState(true);
  const redraw = useRef<() => void>(() => undefined);
  const size = useRef({ w: 1, h: 1 });
  const [aspect, setAspect] = useState(1.5);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    if (!webglAvailable()) {
      setOk(false);
      return;
    }
    let renderer: Renderer;
    try {
      renderer = new Renderer({
        dpr: Math.min(window.devicePixelRatio || 1, 2),
        alpha: false,
        antialias: false,
        depth: false,
      });
    } catch {
      setOk(false);
      return;
    }
    const gl = renderer.gl;
    if (!gl) {
      setOk(false);
      return;
    }
    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.className = "field-hero-canvas";
    canvas.setAttribute("aria-hidden", "true");
    el.prepend(canvas);

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uTime: { value: 0 },
        uRes: { value: [1, 1] },
        // OGL treats a uniform as an array only when it is a real Array.
        uQ: {
          value: [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
          ],
        },
      },
    });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    const resize = (): void => {
      const r = el.getBoundingClientRect();
      size.current = { w: Math.max(1, r.width), h: Math.max(1, r.height) };
      setAspect(size.current.w / size.current.h);
      renderer.setSize(size.current.w, size.current.h);
      program.uniforms.uRes.value = [
        gl.drawingBufferWidth,
        gl.drawingBufferHeight,
      ];
    };
    resize();

    let raf = 0;
    let visible = true;
    const t0 = performance.now();
    const draw = (now: number): void => {
      raf = 0;
      program.uniforms.uQ.value = chargesRef.current.map((c) => [
        c.x,
        c.y,
        c.q,
      ]);
      const moving = motionAllowed() && visible && !document.hidden;
      program.uniforms.uTime.value = moving ? (now - t0) / 1000 : 0;
      renderer.render({ scene: mesh });
      if (moving) raf = requestAnimationFrame(draw);
    };
    const kick = (): void => {
      if (!raf) raf = requestAnimationFrame(draw);
    };
    redraw.current = kick;
    kick();

    const ro = new ResizeObserver(() => {
      resize();
      kick();
    });
    ro.observe(el);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      kick();
    });
    io.observe(el);
    const onVisible = (): void => kick();
    document.addEventListener("visibilitychange", onVisible);
    const mo = new MutationObserver(() => kick());
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-motion"],
    });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      document.removeEventListener("visibilitychange", onVisible);
      redraw.current = () => undefined;
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      canvas.remove();
    };
  }, []);

  useEffect(() => {
    redraw.current();
  }, [charges]);

  /** Field coordinates (y up, unit = stage height) to CSS percentages. */
  const toPct = (c: Charge) => ({
    left: `${(0.5 + c.x / aspect) * 100}%`,
    top: `${(0.5 - c.y) * 100}%`,
  });

  const move = useCallback((i: number, x: number, y: number) => {
    const { w, h } = size.current;
    const half = w / h / 2 - 0.05;
    setCharges((cs) =>
      cs.map((c, k) =>
        k === i
          ? {
              ...c,
              x: Math.max(-half, Math.min(half, x)),
              y: Math.max(-0.45, Math.min(0.45, y)),
            }
          : c,
      ),
    );
  }, []);
  const flip = useCallback((i: number) => {
    setCharges((cs) =>
      cs.map((c, k) =>
        k === i ? { ...c, q: (c.q === 1 ? -1 : 1) as 1 | -1 } : c,
      ),
    );
  }, []);

  const onPointerDown =
    (i: number) => (e: ReactPointerEvent<HTMLButtonElement>) => {
      const el = host.current;
      if (!el) return;
      e.preventDefault();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      const rect = el.getBoundingClientRect();
      const start = { x: e.clientX, y: e.clientY };
      let dragged = false;
      const onMove = (ev: PointerEvent): void => {
        if (Math.hypot(ev.clientX - start.x, ev.clientY - start.y) > 4)
          dragged = true;
        if (!dragged) return;
        move(
          i,
          (ev.clientX - rect.left - rect.width / 2) / rect.height,
          (rect.height / 2 - (ev.clientY - rect.top)) / rect.height,
        );
      };
      const onUp = (): void => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        if (!dragged) flip(i);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    };

  const onKey = (i: number) => (e: KeyboardEvent<HTMLButtonElement>) => {
    const step = e.shiftKey ? 0.08 : 0.025;
    const c = charges[i];
    if (!c) return;
    const d = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
    }[e.key];
    if (d) {
      e.preventDefault();
      move(i, c.x + (d[0] as number), c.y + (d[1] as number));
    }
  };

  if (!ok) return <>{fallback}</>;

  return (
    <div
      ref={host}
      className="field-hero"
      role="group"
      aria-label="Electric field of three line charges. Drag a charge to move it; press it to flip its sign."
    >
      {charges.map((c, i) => (
        <button
          key={i}
          type="button"
          className={`field-charge ${c.q > 0 ? "is-pos" : "is-neg"}`}
          style={toPct(c)}
          aria-label={`Charge ${i + 1}, ${c.q > 0 ? "positive" : "negative"}. Arrow keys move it; Enter flips its sign.`}
          onPointerDown={onPointerDown(i)}
          onKeyDown={onKey(i)}
          onClick={(e) => {
            // Pointer taps are handled on pointer-up; this is the keyboard path.
            if (e.detail === 0) flip(i);
          }}
        >
          {c.q > 0 ? "+" : "−"}
        </button>
      ))}
    </div>
  );
}
