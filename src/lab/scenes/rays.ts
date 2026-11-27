/**
 * The optical-ray scene.
 *
 * Sends light packets along exactly the ray paths the model constructed — the
 * same `BenchRay[]` the SVG bench draws — so the animation cannot disagree with
 * the diagram beneath it. Move the object and the packets take the new path on
 * the next frame, because the path is recomputed, not tweened.
 *
 * A ray may also say which medium it crosses. Inside a medium of index n the
 * packets slow to v = c/n **and** crowd together to λ/n while the rate at which
 * they arrive — the frequency — is unchanged across every boundary. That is the
 * whole content of Snell's law in one picture, and it falls out of advancing
 * each packet by *optical* path length (geometric length × n) rather than by
 * pixels: chained segments share one optical clock, so a packet that enters
 * the glass is the same packet that leaves it.
 *
 * A ray diagram is a construction, not a photograph, and the packets travel at
 * a speed chosen for legibility. The scene says so: light covers the bench in
 * nanoseconds, and pretending otherwise would teach something false.
 */
import type { ParamValues } from '@/types/lab';
import type { ModelOutput } from '@/components/shell/PhysicsExperiment';
import type { BenchRay } from '@/components/instruments/OpticsBench';
import { INK, glowParticle, particle, unit, type Vec2 } from '@/lab/canvas/primitives';
import type { CanvasScene, SceneFrame } from '@/lab/canvas/scene';

/**
 * A ray segment the scene can animate. Every extra field is optional, so a
 * plain `BenchRay[]` from a lens or mirror bench is still a valid input and
 * animates exactly as before.
 */
export interface SceneRay extends BenchRay {
  /** Refractive index of the medium the segment crosses. Defaults to 1 (air). */
  index?: number;
  /**
   * Optical path length, in stage pixels × n, the light has already covered
   * when it reaches `from`. Chained segments carry the running total, which
   * is what keeps packets continuous through a refracting surface.
   */
  start?: number;
  /** True for the last segment of a chain — the only end a packet fades out at. */
  terminal?: boolean;
  /** Relative brightness, 0–1 — a partially reflected ray carries less light. */
  weight?: number;
}

export interface RaySceneOptions {
  /** The ray bundle for the current parameters — the model's own construction. */
  rays: (params: ParamValues, model: ModelOutput) => SceneRay[];
  label: CanvasScene['label'];
  width?: number;
  height?: number;
  /** Stage pixels a packet covers per second in air. */
  speed?: number;
  /** Stage pixels between successive packets on the same ray, in air. */
  spacing?: number;
  enabled?: (params: ParamValues) => boolean;
  disclosure?: string;
  /** Draw each packet with a soft halo. Off by default for dense lens bundles. */
  glow?: boolean;
}

const lerp = (a: Vec2, b: Vec2, t: number): Vec2 => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t
});

const usable = (r: BenchRay): boolean =>
  [r.from.x, r.from.y, r.to.x, r.to.y].every(Number.isFinite) &&
  Math.hypot(r.to.x - r.from.x, r.to.y - r.from.y) > 2;

/** The fade distance at a free end, in stage pixels. */
const EDGE = 18;

/**
 * Builds a continuous chain of segments through a list of points.
 *
 * `segments[k]` describes the leg from `points[k]` to `points[k + 1]`. The
 * optical start of each leg is the running total of the ones before it, and
 * only the final leg is marked terminal. Returns the chain plus the total
 * optical length, so a branch (a partial reflection) can start where the
 * chain had reached.
 */
export function chainRays(
  points: readonly Vec2[],
  segments: readonly Omit<SceneRay, 'from' | 'to' | 'start' | 'terminal'>[],
  start = 0
): { rays: SceneRay[]; opticalLength: number; at: number[] } {
  const rays: SceneRay[] = [];
  const at: number[] = [start];
  let s = start;
  for (let k = 0; k + 1 < points.length; k += 1) {
    const seg = segments[Math.min(k, segments.length - 1)] ?? {};
    const from = points[k];
    const to = points[k + 1];
    const n = seg.index ?? 1;
    rays.push({ ...seg, from, to, start: s, terminal: k + 2 === points.length });
    const len = Math.hypot(to.x - from.x, to.y - from.y);
    s += Number.isFinite(len) ? len * n : 0;
    at.push(s);
  }
  return { rays, opticalLength: s, at };
}

export function makeRayScene(options: RaySceneOptions): CanvasScene {
  const {
    rays: raysOf,
    label,
    width,
    height,
    speed = 210,
    spacing = 74,
    enabled,
    glow = false,
    disclosure = 'Light packets are a visual construct at a readable speed — light itself crosses this bench in a few nanoseconds.'
  } = options;

  return {
    label,
    width,
    height,
    disclosure,
    draw({ ctx, params, model, time }: SceneFrame) {
      if (enabled && !enabled(params)) return;
      const rays = raysOf(params, model).filter(usable);
      if (rays.length === 0) return;

      // One optical clock drives every ray, so packets leaving the object stay
      // in step through the optic — which is what makes the construction read
      // as one wavefront rather than as unrelated dots.
      const phase = (time * speed) % spacing;

      for (const ray of rays) {
        const length = Math.hypot(ray.to.x - ray.from.x, ray.to.y - ray.from.y);
        const n = Number.isFinite(ray.index) && (ray.index as number) > 0 ? (ray.index as number) : 1;
        const chained = ray.start !== undefined;
        const s0 = ray.start ?? 0;
        // A virtual ray is where the light only appears to come from, so its
        // packets are dim: the diagram's dashes say the same thing.
        const virtual = ray.kind === 'virtual';
        const color = ray.color ?? (virtual ? INK.neutral : INK.ray);
        const weight = ray.weight === undefined ? 1 : unit(ray.weight);
        const alpha = (virtual ? 0.3 : 0.9) * weight;
        if (alpha < 0.02) continue;
        const radius = virtual ? 1.8 : 2.6;

        // The first packet on this segment: the smallest optical position
        // s ≥ s0 with (s − phase) a whole number of spacings.
        const first = s0 + ((((phase - s0) % spacing) + spacing) % spacing);
        const opticalEnd = s0 + length * n;

        for (let s = first; s < opticalEnd; s += spacing) {
          const d = (s - s0) / n;
          const t = d / length;
          const at = lerp(ray.from, ray.to, t);
          // Fade in and out at free ends only, so a packet never pops into
          // existence mid-bench — but never at a refracting surface, where the
          // same packet carries straight on into the next segment.
          const fadeIn = !chained || s0 === 0 ? d / EDGE : 1;
          const fadeOut = !chained || ray.terminal ? (length - d) / EDGE : 1;
          const a = alpha * unit(Math.min(1, fadeIn, fadeOut));
          if (glow && !virtual) glowParticle(ctx, at, radius, color, a);
          else particle(ctx, at, radius, color, a);
        }
      }
    }
  };
}
