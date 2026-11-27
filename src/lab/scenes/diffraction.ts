/**
 * The wavefront scene, for slits and apertures.
 *
 * Three layers, all driven by one clock so the picture is one continuous wave:
 *
 * 1. **Plane wavefronts** march from the source to the aperture, one crest per
 *    (display) wavelength.
 * 2. **Huygens wavelets** open out from each secondary source in the aperture —
 *    one slit for single-slit diffraction, two for Young's experiment.
 * 3. **Diffracted wavefronts** spread from the aperture towards the screen, and
 *    each piece of each arc is as bright as the model's intensity at the point
 *    of the screen that direction lands on. Bright spokes therefore run to the
 *    bright fringes and dark lanes to the dark ones — the pattern on the screen
 *    strip and the wave that makes it are the same numbers.
 *
 * With incoherent sources each slit's wavelets take a phase that jumps at
 * random every few tenths of a second, and the far field carries only the
 * envelope the model computes for that case. That *is* the reason two lamps
 * give no fringes, shown rather than told.
 *
 * Visible light has a wavelength of half a micrometre; nothing on a screen can
 * show it to scale. The display wavelength grows with the real one, so red is
 * visibly longer than violet, and the scene says the scale is not literal.
 */
import type { ParamValues } from '@/types/lab';
import type { ModelOutput } from '@/components/shell/PhysicsExperiment';
import { unit } from '@/lab/canvas/primitives';
import type { CanvasScene, SceneFrame } from '@/lab/canvas/scene';

export interface DiffractionLayout {
  /** Stage x of the slit plane. */
  apertureX: number;
  /** Stage y of the optical axis. */
  axisY: number;
  /** Stage x of the screen face. */
  screenX: number;
  /** Half-height of the screen strip, in stage pixels. */
  screenHalf: number;
  /** Offsets from the axis, in stage pixels, of the secondary sources. */
  sources: number[];
  /** Stage x where the incident plane waves start. */
  sourceX: number;
  /** Half-height of the incident beam. */
  beamHalf: number;
  /** Display wavelength in stage pixels. */
  wavelengthPx: number;
  /** CSS colour of the light. */
  color: string;
  /** Relative intensity 0–1 at a screen point this many stage pixels off-axis. */
  intensityAt: (offsetPx: number) => number;
  /** False for two independent lamps: the wavelet phases scramble. */
  coherent?: boolean;
}

export interface DiffractionSceneOptions {
  layout: (params: ParamValues, model: ModelOutput) => DiffractionLayout;
  label: CanvasScene['label'];
  width?: number;
  height?: number;
  /** Stage pixels per second the wavefronts advance. */
  speed?: number;
  disclosure?: string;
}

/** Maps a real wavelength in nanometres to a display wavelength in pixels. */
export const displayWavelength = (lambdaNm: number): number =>
  12 + unit((lambdaNm - 400) / 300) * 14;

/** How far the wavelets are drawn from each slit before the far field takes over. */
const NEAR = 46;
/** Segments per diffracted arc — enough for a smooth fringe lane, cheap enough for 60 fps. */
const SEGMENTS = 44;

export function makeDiffractionScene(options: DiffractionSceneOptions): CanvasScene {
  const {
    layout: layoutOf,
    label,
    width,
    height,
    speed = 64,
    disclosure = 'Wavefronts are a construct drawn at a display wavelength — real light is about half a micrometre. Arc brightness follows the computed intensity on the screen.'
  } = options;

  /** Per-slit phase offsets for incoherent sources, re-rolled on a timer. */
  let scrambled: number[] = [];
  let nextJump = 0;

  return {
    label,
    width,
    height,
    disclosure,
    draw({ ctx, params, model, time }: SceneFrame) {
      const L = layoutOf(params, model);
      const lambda = Math.max(4, L.wavelengthPx);
      const run = L.screenX - L.apertureX;
      if (!(run > NEAR) || !Number.isFinite(lambda)) return;
      const phase = (time * speed) % lambda;
      const coherent = L.coherent !== false;

      if (!coherent && (time >= nextJump || scrambled.length !== L.sources.length)) {
        scrambled = L.sources.map(() => Math.random() * lambda);
        nextJump = time + 0.18 + Math.random() * 0.22;
      }

      ctx.save();
      ctx.strokeStyle = L.color;
      ctx.lineCap = 'round';

      // 1 — plane wavefronts approaching the slit.
      ctx.lineWidth = 1.5;
      for (let x = L.apertureX + phase - lambda; x > L.sourceX; x -= lambda) {
        const f = (x - L.sourceX) / (L.apertureX - L.sourceX);
        ctx.globalAlpha = 0.18 + 0.4 * unit(f * 3);
        ctx.beginPath();
        ctx.moveTo(x, L.axisY - L.beamHalf);
        ctx.lineTo(x, L.axisY + L.beamHalf);
        ctx.stroke();
      }

      // 2 — Huygens wavelets from each secondary source, forward half only.
      ctx.lineWidth = 1.2;
      L.sources.forEach((dy, k) => {
        const offset = coherent ? 0 : scrambled[k] ?? 0;
        const p = (phase + offset) % lambda;
        for (let r = p; r < NEAR; r += lambda) {
          if (r < 1.5) continue;
          ctx.globalAlpha = 0.55 * (1 - r / NEAR);
          ctx.beginPath();
          ctx.arc(L.apertureX, L.axisY + dy, r, -Math.PI / 2, Math.PI / 2);
          ctx.stroke();
        }
      });

      // 3 — the diffracted field, each arc segment lit by the intensity at
      // the screen point its direction reaches.
      const phiMax = Math.atan2(L.screenHalf, run);
      const lit: number[] = [];
      for (let s = 0; s <= SEGMENTS; s += 1) {
        const phi = -phiMax + (2 * phiMax * s) / SEGMENTS;
        lit.push(unit(L.intensityAt(run * Math.tan(phi))));
      }
      ctx.lineWidth = 1.6;
      for (let r = NEAR * 0.6 + ((phase - NEAR * 0.6) % lambda + lambda) % lambda; r < run; r += lambda) {
        // Fade in where the wavelets hand over, out just before the screen.
        const edge = unit((r - NEAR * 0.6) / (NEAR * 0.8)) * unit((run - r) / 24);
        if (edge <= 0.01) continue;
        for (let s = 0; s < SEGMENTS; s += 1) {
          const i = (lit[s] + lit[s + 1]) / 2;
          if (i < 0.015) continue;
          const a0 = -phiMax + (2 * phiMax * s) / SEGMENTS;
          const a1 = a0 + (2 * phiMax) / SEGMENTS;
          ctx.globalAlpha = edge * (0.08 + 0.72 * Math.pow(i, 0.7));
          ctx.beginPath();
          ctx.arc(L.apertureX, L.axisY, r, a0, a1);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  };
}
