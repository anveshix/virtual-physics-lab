import { describe, expect, it } from 'vitest';
import { cyclotronOrbit, type OrbitSample } from './experiments/cyclotron';

const layout = { cx: 410, cy: 236, gap: 24, maxR: 160, halves: 12, halfTime: 0.36, gapTime: 0.05, exitLength: 150 };
const orbit = cyclotronOrbit(layout);
const byHalf = (k: number) => orbit.filter((p) => p.half === k);

describe('the drawn cyclotron spiral', () => {
  it('is one continuous path with no jumps between samples', () => {
    let worst = 0;
    for (let i = 1; i < orbit.length - 1; i++) {
      const a = orbit[i - 1] as OrbitSample;
      const b = orbit[i] as OrbitSample;
      worst = Math.max(worst, Math.hypot(b.x - a.x, b.y - a.y));
    }
    // Longest step: one 1/40 slice of the outermost semicircle, or the gap.
    expect(worst).toBeLessThan(Math.max((Math.PI * layout.maxR) / 40, layout.gap) + 0.5);
  });

  it('grows its radius as √(crossings) — equal energy per crossing', () => {
    for (const k of [0, 3, 7, 11]) {
      const pts = byHalf(k);
      const width = Math.max(...pts.map((p) => Math.abs(p.x - layout.cx))) - layout.gap / 2;
      expect(width).toBeCloseTo(layout.maxR * Math.sqrt((k + 1) / layout.halves), 0);
    }
  });

  it('spends the same time on every half-turn, however large', () => {
    const span = (k: number) => {
      const pts = byHalf(k);
      return (pts[pts.length - 1] as OrbitSample).t - (pts[0] as OrbitSample).t;
    };
    const first = span(1);
    for (let k = 2; k < layout.halves; k++) expect(span(k)).toBeCloseTo(first, 9);
  });

  it('keeps each half-turn in its own dee and finishes on the dee radius', () => {
    for (let k = 0; k < layout.halves; k++) {
      const left = k % 2 === 0;
      for (const p of byHalf(k)) {
        if (left) expect(p.x).toBeLessThanOrEqual(layout.cx - layout.gap / 2 + 1e-6);
        else expect(p.x).toBeGreaterThanOrEqual(layout.cx + layout.gap / 2 - 1e-6);
      }
    }
    const last = byHalf(layout.halves - 1);
    const ys = last.map((p) => p.y);
    expect((Math.max(...ys) + Math.min(...ys)) / 2).toBeCloseTo(layout.cy, 0);
  });

  it('circulates clockwise on screen, as a positive ion does with B out of the page', () => {
    // In the left dee the ion runs bottom → top through the far left.
    const pts = byHalf(0);
    expect((pts[0] as OrbitSample).y).toBeGreaterThan((pts[pts.length - 1] as OrbitSample).y);
  });
});
