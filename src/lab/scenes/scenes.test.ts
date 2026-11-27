import { describe, expect, it } from 'vitest';
import { chainRays, makeRayScene } from './rays';
import { displayWavelength, makeDiffractionScene, type DiffractionLayout } from './diffraction';
import { fresnelReflectance, criticalAngle } from '@/physics-engine/optics';
import type { ModelOutput } from '@/components/shell/PhysicsExperiment';
import type { SceneFrame } from '@/lab/canvas/scene';

/** A 2D context that records every arc it is asked for, with its alpha. */
function arcRecorder() {
  const arcs: { x: number; y: number; r: number; a0: number; alpha: number }[] = [];
  const ctx = {
    globalAlpha: 1,
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    lineCap: '',
    save() {},
    restore() {},
    beginPath() {},
    moveTo() {},
    lineTo() {},
    stroke() {},
    fill() {},
    arc(x: number, y: number, r: number, a0 = 0) {
      arcs.push({ x, y, r, a0, alpha: ctx.globalAlpha });
    }
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, arcs };
}

const model = {} as ModelOutput;
const frame = (ctx: CanvasRenderingContext2D, time = 0): SceneFrame => ({
  ctx,
  time,
  dt: 0,
  params: {},
  model,
  width: 820,
  height: 470
});

describe('Fresnel reflectance', () => {
  it('reflects ((n−1)/(n+1))² at normal incidence', () => {
    expect(fresnelReflectance(0, 1, 1.5)).toBeCloseTo(0.04, 4);
    expect(fresnelReflectance(0, 1.5, 1)).toBeCloseTo(0.04, 4);
  });

  it('reflects everything beyond the critical angle', () => {
    const ic = criticalAngle(1.52, 1);
    expect(fresnelReflectance(ic + 0.5, 1.52, 1)).toBe(1);
    expect(fresnelReflectance(ic - 5, 1.52, 1)).toBeLessThan(1);
  });

  it('climbs towards grazing incidence, and to one at the critical angle', () => {
    const a = fresnelReflectance(20, 1, 1.52);
    const b = fresnelReflectance(60, 1, 1.52);
    const c = fresnelReflectance(85, 1, 1.52);
    expect(a).toBeLessThan(b);
    expect(b).toBeLessThan(c);
    expect(fresnelReflectance(criticalAngle(1.52, 1) - 0.01, 1.52, 1)).toBeGreaterThan(0.8);
  });
});

describe('chained rays keep one optical clock', () => {
  it('accumulates optical path as geometric length × n', () => {
    const { rays, opticalLength } = chainRays(
      [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 200, y: 0 }
      ],
      [{ index: 1 }, { index: 1.5 }]
    );
    expect(rays.map((r) => r.start)).toEqual([0, 100]);
    expect(opticalLength).toBeCloseTo(250, 6);
    expect(rays.map((r) => r.terminal)).toEqual([false, true]);
  });

  it('crowds packets to λ/n inside a medium — the same frequency, a shorter wavelength', () => {
    const spacing = 50;
    const scene = makeRayScene({
      label: () => 'x',
      spacing,
      speed: 100,
      rays: () =>
        chainRays(
          [
            { x: 0, y: 0 },
            { x: 500, y: 0 },
            { x: 1000, y: 0 }
          ],
          [{ index: 1 }, { index: 2 }]
        ).rays
    });
    const { ctx, arcs } = arcRecorder();
    scene.draw(frame(ctx, 0.123));
    const inAir = arcs.filter((a) => a.x > 20 && a.x < 480).map((a) => a.x);
    const inGlass = arcs.filter((a) => a.x > 520 && a.x < 980).map((a) => a.x);
    const gap = (xs: number[]) => xs[1] - xs[0];
    expect(gap(inAir)).toBeCloseTo(spacing, 3);
    expect(gap(inGlass)).toBeCloseTo(spacing / 2, 3);
  });

  it('dims a ray in proportion to the light it carries', () => {
    const scene = makeRayScene({
      label: () => 'x',
      rays: () => [
        { from: { x: 0, y: 0 }, to: { x: 400, y: 0 }, start: 0, terminal: false, weight: 1 },
        { from: { x: 0, y: 50 }, to: { x: 400, y: 50 }, start: 0, terminal: false, weight: 0.25 }
      ]
    });
    const { ctx, arcs } = arcRecorder();
    scene.draw(frame(ctx, 0.5));
    const bright = Math.max(...arcs.filter((a) => a.y === 0).map((a) => a.alpha));
    const dim = Math.max(...arcs.filter((a) => a.y === 50).map((a) => a.alpha));
    expect(dim / bright).toBeCloseTo(0.25, 2);
  });
});

describe('the diffraction scene', () => {
  const base: DiffractionLayout = {
    apertureX: 250,
    axisY: 250,
    screenX: 650,
    screenHalf: 140,
    sources: [0],
    sourceX: 120,
    beamHalf: 18,
    wavelengthPx: 20,
    color: '#fff',
    intensityAt: () => 1
  };

  it('states that it is a construct and that the wavelength is not to scale', () => {
    const scene = makeDiffractionScene({ label: () => 'x', layout: () => base });
    expect(scene.disclosure).toMatch(/construct/i);
    expect(scene.disclosure).toMatch(/micrometre/i);
  });

  it('draws no far-field wavefront where the model says the screen is dark', () => {
    const lit = arcRecorder();
    makeDiffractionScene({ label: () => 'x', layout: () => base }).draw(frame(lit.ctx, 0.3));
    const dark = arcRecorder();
    makeDiffractionScene({ label: () => 'x', layout: () => ({ ...base, intensityAt: () => 0 }) }).draw(frame(dark.ctx, 0.3));
    const far = (arcs: { r: number }[]) => arcs.filter((a) => a.r > 60).length;
    expect(far(lit.arcs)).toBeGreaterThan(100);
    expect(far(dark.arcs)).toBe(0);
  });

  it('lights each direction by the intensity at the screen point it reaches', () => {
    // Bright above the axis, dark below: every far-field arc piece must be above.
    const { ctx, arcs } = arcRecorder();
    makeDiffractionScene({
      label: () => 'x',
      layout: () => ({ ...base, intensityAt: (px) => (px < -10 ? 1 : 0) })
    }).draw(frame(ctx, 0.3));
    const far = arcs.filter((a) => a.r > 60);
    expect(far.length).toBeGreaterThan(20);
    // Screen y grows downwards, so "above the axis" is a negative angle.
    expect(far.every((a) => a.a0 < 0)).toBe(true);
  });

  it('shows red with a longer display wavelength than violet', () => {
    expect(displayWavelength(700)).toBeGreaterThan(displayWavelength(400));
    expect(displayWavelength(10_000)).toBe(displayWavelength(700));
  });
});
