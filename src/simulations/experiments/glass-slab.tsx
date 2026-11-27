import type { EducationPack, ExperimentDefinition, ParamValues } from '@/types/lab';
import type { ModelOutput } from '@/components/shell/PhysicsExperiment';
import { PhysicsExperiment } from '@/components/shell/PhysicsExperiment';
import { SvgDefs } from '@/components/shell/Viewport';
import { Ray, AngleArc } from '@/components/instruments/Instruments';
import { traceSlab } from '@/physics-engine/optics';
import { degToRad } from '@/physics-engine/units';
import { col, num, ro, singleSeriesGraph } from './_shared';
import { Knob, type StageApi } from '@/components/controls/StageKit';
import { chainRays, makeRayScene } from '@/lab/scenes/rays';

import { meta } from './glass-slab.meta';

export { meta };

const definition: ExperimentDefinition = {
  id: meta.id, slug: meta.slug, title: meta.title, shortTitle: meta.shortTitle, aim: meta.aim,
  unit: meta.unit, chapter: meta.chapter, kind: meta.kind, difficulty: meta.difficulty,
  thumbLabel: meta.shortTitle, accent: '#6ee7ff', practicalNo: meta.practicalNo,
  controls: [
    { kind: 'slider', key: 'i', label: 'Angle of incidence', symbol: 'i', unit: '°', min: 0, max: 80, step: 0.5, initial: 45, precision: 1 },
    { kind: 'slider', key: 't', label: 'Slab thickness', symbol: 't', unit: 'cm', min: 0.5, max: 4, step: 0.1, initial: 1.5, precision: 1 },
    { kind: 'slider', key: 'n', label: 'Refractive index of glass', symbol: 'n', unit: '—', min: 1.3, max: 2, step: 0.01, initial: 1.52 }
  ],
  defaults: { i: 45, t: 1.5, n: 1.52 }
};

const education: EducationPack = {
  theory: [
    'A ray entering a rectangular slab is bent towards the normal, travels through the glass, and is bent away from the normal as it leaves. Because the two faces are parallel the emergent ray is parallel to the incident ray.',
    'The ray is therefore not deviated in direction, only displaced sideways. This perpendicular distance between the incident and emergent rays is the lateral shift.',
    'The shift grows with the thickness of the slab and with the angle of incidence, and vanishes at normal incidence. Measuring it for a known thickness and angle gives the refractive index of the glass.'
  ],
  formulas: [
    { tex: 'n = \\frac{\\sin i}{\\sin r}', caption: 'Snell’s law at the first face.' },
    { tex: 'd = \\frac{t \\sin(i - r)}{\\cos r}', caption: 'Lateral shift through a parallel slab.' },
    { tex: 'e = i', caption: 'The angle of emergence equals the angle of incidence.' }
  ],
  variables: [
    { symbol: 'd', name: 'Lateral shift', unit: 'm' },
    { symbol: 't', name: 'Slab thickness', unit: 'm' },
    { symbol: 'i', name: 'Angle of incidence', unit: '°' },
    { symbol: 'r', name: 'Angle of refraction', unit: '°' },
    { symbol: 'n', name: 'Refractive index', unit: '—' }
  ],
  procedure: [
    'Fix the slab on the paper and trace its outline.',
    'Draw an incident ray at a known angle and fix two pins on it.',
    'Looking through the slab, fix two more pins so that all four appear in one straight line; these mark the emergent ray.',
    'Remove the slab, join the points and measure the lateral shift with a ruler.',
    'Repeat for at least five angles of incidence and plot d against sin(i − r)/cos r; the slope is the thickness.'
  ],
  precautions: ['The slab faces must be parallel and its edges sharp.', 'Pins must be vertical and at least 5 cm apart.', 'Measure the angle from the normal, not the surface.'],
  tips: ['At normal incidence the lateral shift is exactly zero — check it with the slider at 0°.'],
  viva: [
    { q: 'Why is the emergent ray parallel to the incident ray?', a: 'Because the two faces are parallel, the refraction at the second face exactly undoes the angular change made at the first.' },
    { q: 'When is the lateral shift maximum?', a: 'For a given slab, at the largest angle of incidence; for a given angle, for the thickest slab.' },
    { q: 'What is the lateral shift at normal incidence?', a: 'Zero. At i = 0 the ray meets the surface along the normal, so there is no refraction at either face and nothing to displace it.' },
    { q: 'Does the lateral shift depend on the colour of light?', a: 'Yes, because the refractive index depends on wavelength, so different colours shift by different amounts.' }
  ],
  resultTemplate: 'The measured lateral shift agrees with d = t sin(i − r)/cos r, and the refractive index obtained from sin i / sin r matches the glass used.'
};

function compute(params: ParamValues): ModelOutput {
  const i = num(params, 'i', 45);
  const t = num(params, 't', 1.5);
  const n = num(params, 'n', 1.52);
  const trace = traceSlab(t / 100, i, n);
  const shift = trace.shift * 100;
  const r = trace.refractedDeg;
  const points: { x: number; y: number }[] = [];
  for (let a = 0; a <= 80; a += 0.5) points.push({ x: a, y: traceSlab(t / 100, a, n).shift * 100 });
  return {
    readouts: [
      ro('shift', 'Lateral shift d', shift, 'cm', 3),
      ro('r', 'Angle of refraction r', r, '°', 2),
      ro('e', 'Angle of emergence e', i, '°', 2, { sub: 'equals i' }),
      ro('n', 'Refractive index', Math.sin(degToRad(i)) / Math.sin(degToRad(r || 1e-9)), '—', 3),
      ro('ratio', 'd / t', shift / t, '—', 3)
    ],
    graph: singleSeriesGraph({
      title: 'Lateral shift against angle of incidence', xLabel: 'i (°)', yLabel: 'd (cm)',
      seriesLabel: 'd', points, live: { x: i, y: shift }
    }),
    description: `A ray enters a glass slab of thickness ${t.toFixed(1)} centimetre and refractive index ${n.toFixed(2)} at ${i.toFixed(1)} degrees. The emergent ray is parallel to the incident ray but displaced by ${shift.toFixed(3)} centimetre.`,
    result: `For t = ${t.toFixed(1)} cm, i = ${i.toFixed(1)}° and n = ${n.toFixed(2)}, the refraction angle is ${r.toFixed(2)}° and the lateral shift is ${shift.toFixed(3)} cm, confirming d = t sin(i − r)/cos r.`
  };
}

/** Stage pixels per centimetre of glass — the 4 cm slab fills the bench. */
const PX_PER_CM = 50;

type Pt = { x: number; y: number };

/**
 * The slab construction in stage coordinates (y down), from the same
 * `traceSlab` the readouts use — so the shift drawn is the shift computed.
 *
 * Light arrives from the upper left, meets the top face at P, crosses the
 * glass at the refraction angle r and leaves the bottom face at E travelling
 * parallel to where it started. The lateral shift d is the perpendicular gap
 * between the emergent ray and the undeviated continuation of the incident one.
 */
function slabGeometry(params: ParamValues) {
  const i = num(params, 'i', 45);
  const t = num(params, 't', 1.5);
  const n = num(params, 'n', 1.52);
  const trace = traceSlab(t / 100, i, n);
  const r = Number.isFinite(trace.refractedDeg) ? trace.refractedDeg : 0;
  const iRad = degToRad(i);
  const rRad = degToRad(r);

  const top = 170;
  const tPx = t * PX_PER_CM;
  const slab = { x: 190, y: top, w: 460, h: tPx };
  const P: Pt = { x: 330, y: top };
  const u: Pt = { x: Math.sin(iRad), y: Math.cos(iRad) }; // incident direction
  const E: Pt = { x: P.x + tPx * Math.tan(rRad), y: top + tPx };
  const lead = 150;
  const inStart: Pt = { x: P.x - u.x * lead, y: P.y - u.y * lead };
  const outEnd: Pt = { x: E.x + u.x * 120, y: E.y + u.y * 120 };
  const undeviatedEnd: Pt = { x: P.x + u.x * (tPx / Math.max(u.y, 0.2) + 120), y: P.y + u.y * (tPx / Math.max(u.y, 0.2) + 120) };
  // Foot of the perpendicular from E onto the undeviated line.
  const along = (E.x - P.x) * u.x + (E.y - P.y) * u.y;
  const foot: Pt = { x: P.x + u.x * along, y: P.y + u.y * along };

  return { i, t, n, r, shiftCm: trace.shift * 100, slab, P, E, inStart, outEnd, undeviatedEnd, foot, tPx };
}

function Stage({ params, set, control }: StageApi) {
  const g = slabGeometry(params);
  const { i, t, n, r, slab, P, E, inStart, outEnd, undeviatedEnd, foot } = g;
  const shiftPx = Math.hypot(E.x - foot.x, E.y - foot.y);

  return (
    <svg viewBox="0 0 820 470" className="svg-lab" preserveAspectRatio="xMidYMid meet">
      <SvgDefs />
      <text x={410} y={40} textAnchor="middle" fontSize={13} fill="#eaf1f8" fontWeight={600}>
        Rectangular glass slab · n = {n.toFixed(2)} · t = {t.toFixed(1)} cm
      </text>
      <text x={410} y={60} textAnchor="middle" fontSize={11} fill="#8497ad" fontFamily="ui-monospace, monospace">
        the emergent ray is parallel to the incident ray, shifted sideways by d
      </text>

      <rect x={slab.x} y={slab.y} width={slab.w} height={slab.h} fill="url(#lab-glass)" stroke="#8fc7e8" strokeWidth={1.2} />
      <text x={slab.x + slab.w - 8} y={slab.y + 16} textAnchor="end" fontSize={10} fill="#8fc7e8">glass · n = {n.toFixed(2)}</text>
      <text x={slab.x + 8} y={slab.y - 8} fontSize={10} fill="#8497ad">air · n = 1</text>

      {/* Normals at the two points where the ray crosses a face. */}
      <line x1={P.x} y1={P.y - 70} x2={P.x} y2={P.y + 60} className="normal-line" />
      <line x1={E.x} y1={E.y - 60} x2={E.x} y2={E.y + 70} className="normal-line" />

      {/* Where the light would have gone without the glass. */}
      <line x1={P.x} y1={P.y} x2={undeviatedEnd.x} y2={undeviatedEnd.y} className="dim-line" />

      <Ray from={inStart} to={P} color="#ffd257" width={2} />
      <Ray from={P} to={E} color="#6ee7ff" width={2} />
      <Ray from={E} to={outEnd} color="#ffd257" width={2} />

      {/* Thickness caliper. */}
      <line x1={slab.x - 18} y1={slab.y} x2={slab.x - 18} y2={slab.y + slab.h} stroke="#8497ad" strokeWidth={1.2} />
      <line x1={slab.x - 24} y1={slab.y} x2={slab.x - 12} y2={slab.y} stroke="#8497ad" strokeWidth={1.2} />
      <line x1={slab.x - 24} y1={slab.y + slab.h} x2={slab.x - 12} y2={slab.y + slab.h} stroke="#8497ad" strokeWidth={1.2} />
      <text x={slab.x - 28} y={slab.y + slab.h / 2 + 4} textAnchor="end" fontSize={10} className="measure-text">
        t = {t.toFixed(1)} cm
      </text>

      {/* The lateral shift, drawn as the perpendicular it is. */}
      {shiftPx > 1.5 ? (
        <g>
          <line x1={E.x} y1={E.y} x2={foot.x} y2={foot.y} stroke="#ff6b7d" strokeWidth={1.6} strokeDasharray="4 3" />
          <text x={Math.max(E.x, foot.x) + 10} y={(E.y + foot.y) / 2 + 4} fontSize={11} fill="#ff6b7d">
            d = {g.shiftCm.toFixed(2)} cm
          </text>
        </g>
      ) : null}

      <AngleArc centre={P} fromAngleDeg={-90} toAngleDeg={-90 - i} radius={50} label={`i = ${i.toFixed(1)}°`} />
      {r > 0.5 ? <AngleArc centre={P} fromAngleDeg={90} toAngleDeg={90 - r} radius={44} label={`r = ${r.toFixed(1)}°`} color="#6ee7ff" /> : null}
      <AngleArc centre={E} fromAngleDeg={90} toAngleDeg={90 - i} radius={46} label={`e = ${i.toFixed(1)}°`} />

      <text x={560} y={420} textAnchor="middle" fontSize={10.5} fill="#5e7189">
        d = t sin(i − r)/cos r = {g.shiftCm.toFixed(3)} cm
      </text>

      <Knob
        spec={control('i', 'slider')}
        params={params}
        onChange={(key, value) => set(key, value)}
        x={120}
        y={404}
        radius={18}
        label="Angle of incidence i — turn the ray table"
      />
      <Knob
        spec={control('t', 'slider')}
        params={params}
        onChange={(key, value) => set(key, value)}
        x={250}
        y={404}
        radius={18}
        label="Slab thickness t"
      />
    </svg>
  );
}

/** Packets slow to c/n inside the glass and leave at their original speed. */
const scene = makeRayScene({
  glow: true,
  speed: 150,
  spacing: 54,
  label: (params) => {
    const g = slabGeometry(params);
    return `Light enters the slab at ${g.i.toFixed(1)} degrees, slows to c over ${g.n.toFixed(2)} inside, and leaves parallel to its original path, shifted by ${g.shiftCm.toFixed(2)} centimetre.`;
  },
  rays: (params) => {
    const g = slabGeometry(params);
    return chainRays(
      [g.inStart, g.P, g.E, g.outEnd],
      [
        { index: 1, color: '#ffd257' },
        { index: g.n, color: '#6ee7ff' },
        { index: 1, color: '#ffd257' }
      ]
    ).rays;
  },
  disclosure: 'Light packets are a visual construct — inside the glass they slow to c/n and crowd to λ/n; the speed on screen is chosen to be readable.'
});

export default function GlassSlabExperiment() {
  return (
    <PhysicsExperiment
      definition={definition} education={education} compute={compute} scene={scene}
      renderStage={(api) => <Stage {...api} />}
      notebook={({ params: p }) => {
        const i = num(p, 'i', 45);
        const t = num(p, 't', 1.5);
        const n = num(p, 'n', 1.52);
        const tr = traceSlab(t / 100, i, n);
        return {
          title: 'Observation table — lateral shift',
          columns: [col('i', 'i', '°', 1), col('r', 'r', '°', 2), col('d', 'd', 'cm', 3), col('n', 'n = sin i/sin r', '—', 3, true)],
          capture: () => ({ i, r: tr.refractedDeg, d: tr.shift * 100, n: 0 }),
          derive: (row) => {
            const r = degToRad(Number(row.r));
            return { ...row, n: Math.abs(Math.sin(r)) < 1e-9 ? Number.NaN : Math.sin(degToRad(Number(row.i))) / Math.sin(r) };
          },
          comparison: { label: 'refractive index', unit: '—', experimental: Math.sin(degToRad(i)) / Math.sin(degToRad(tr.refractedDeg)), theoretical: n, precision: 3 }
        };
      }}
    />
  );
}

/**
 * Exported for the NCERT alignment audit, which reads the write-up and the
 * control list without mounting the apparatus.
 */
export { definition, education };
