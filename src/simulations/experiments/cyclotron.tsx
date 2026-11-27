import { useMemo, useRef } from 'react';
import { useRafLoop, useReducedMotion } from '@/hooks/useAnimation';
import type { EducationPack, ExperimentDefinition, ParamValues } from '@/types/lab';
import type { ModelOutput } from '@/components/shell/PhysicsExperiment';
import { PhysicsExperiment } from '@/components/shell/PhysicsExperiment';
import { SvgDefs } from '@/components/shell/Viewport';
import { CONSTANTS } from '@/physics-engine/constants';
import { cyclotronFrequency, cyclotronMaxEnergy, gyroradius } from '@/physics-engine/magnetism';
import { jToEv } from '@/physics-engine/units';
import { formatSI } from '@/utils/format';
import { col, num, ro, singleSeriesGraph } from './_shared';
import { Knob, StageSwitch, type StageApi } from '@/components/controls/StageKit';

import { meta } from './cyclotron.meta';

export { meta };

const PARTICLES = [
  { value: 'proton', label: 'Proton', m: CONSTANTS.M_P, q: CONSTANTS.E_CHARGE },
  { value: 'deuteron', label: 'Deuteron', m: 2 * CONSTANTS.M_P, q: CONSTANTS.E_CHARGE },
  { value: 'alpha', label: 'Alpha particle', m: 4 * CONSTANTS.M_P, q: 2 * CONSTANTS.E_CHARGE },
  { value: 'electron', label: 'Electron (non-relativistic limit)', m: CONSTANTS.M_E, q: CONSTANTS.E_CHARGE }
];

const definition: ExperimentDefinition = {
  id: meta.id, slug: meta.slug, title: meta.title, shortTitle: meta.shortTitle, aim: meta.aim,
  unit: meta.unit, chapter: meta.chapter, kind: meta.kind, difficulty: meta.difficulty,
  thumbLabel: meta.shortTitle, accent: '#9d8cff',
  controls: [
    { kind: 'slider', key: 'b', label: 'Magnetic field', symbol: 'B', unit: 'T', min: 0.1, max: 3, step: 0.05, initial: 1, precision: 2 },
    { kind: 'slider', key: 'vGap', label: 'Gap voltage', symbol: 'V', unit: 'kV', min: 1, max: 100, step: 1, initial: 20 },
    { kind: 'slider', key: 'rDee', label: 'Dee radius', symbol: 'R', unit: 'cm', min: 10, max: 80, step: 1, initial: 40, stage: { x: 3, y: 17, length: 20 } },
    { kind: 'select', key: 'particle', label: 'Particle', initial: 'proton', options: PARTICLES.map((p) => ({ value: p.value, label: p.label })) },
    { kind: 'toggle', key: 'trail', label: 'Show spiral trajectory', initial: true }
  ],
  defaults: { b: 1, vGap: 20, rDee: 40, particle: 'proton', trail: true }
};

const education: EducationPack = {
  theory: [
    'A charged particle moving perpendicular to a uniform magnetic field travels in a circle. The magnetic force supplies the centripetal force, so mv²/r = qvB and the radius is r = mv/qB.',
    'The time for one complete revolution is T = 2πm/qB, which contains neither the speed nor the radius. This is the crucial fact: a faster particle travels a larger circle but takes exactly the same time.',
    'A cyclotron exploits this by placing the particle between two hollow D-shaped electrodes in a strong magnetic field. An alternating voltage across the gap reverses every half period, so the particle gains energy at each crossing while its orbit spirals outwards.',
    'Because the orbital frequency is fixed by B and q/m, the accelerating voltage can be a simple radio-frequency oscillator in resonance with the motion. The maximum energy is set by the dee radius: K = q²B²R²/2m.'
  ],
  formulas: [
    { tex: 'r = \\frac{mv}{qB}', caption: 'Radius of the circular path.' },
    { tex: 'f = \\frac{qB}{2\\pi m}', caption: 'Cyclotron frequency — independent of speed.' },
    { tex: 'K_{max} = \\frac{q^2 B^2 R^2}{2m}', caption: 'Maximum kinetic energy for dee radius R.' },
    { tex: 'v_{max} = \\frac{qBR}{m}', caption: 'Speed at the outer edge.' }
  ],
  variables: [
    { symbol: 'q', name: 'Charge of the particle', unit: 'C' },
    { symbol: 'm', name: 'Mass of the particle', unit: 'kg' },
    { symbol: 'B', name: 'Magnetic field', unit: 'T' },
    { symbol: 'R', name: 'Dee radius', unit: 'm' },
    { symbol: 'f', name: 'Cyclotron frequency', unit: 'Hz' },
    { symbol: 'K', name: 'Kinetic energy', unit: 'J' }
  ],
  procedure: [
    'Choose the particle and set the magnetic field.',
    'Note the cyclotron frequency — this is the frequency the oscillator must supply.',
    'Increase the gap voltage and watch the spiral widen faster; the frequency does not change.',
    'Increase the dee radius and note the rise in the maximum energy.',
    'Record readings for several magnetic fields and verify that f is proportional to B.'
  ],
  precautions: [
    'The non-relativistic treatment fails once the speed approaches a tenth of the speed of light; beyond that the mass increases and the particle falls out of resonance.',
    'A synchrocyclotron or an isochronous cyclotron is needed at relativistic energies.',
    'The electric field inside the metal dees is zero, so the particle gains energy only in the gap.'
  ],
  tips: ['Switch to the alpha particle: with twice the charge and four times the mass the frequency halves.'],
  viva: [
    { q: 'Why is the cyclotron frequency independent of speed?', a: 'Because T = 2πm/qB contains no v; a faster particle simply travels a proportionally larger circle.' },
    { q: 'What limits the maximum energy of a classical cyclotron?', a: 'Relativistic mass increase, which makes the particle lag behind the alternating voltage.' },
    { q: 'Why is there no electric field inside a dee?', a: 'The dees are hollow conductors, and the field inside a conductor in electrostatics is zero.' },
    { q: 'What is the resonance condition?', a: 'The oscillator frequency must equal qB/2πm.' },
    { q: 'Why can a cyclotron not accelerate neutrons?', a: 'Because they are uncharged, so neither the magnetic field nor the gap voltage acts on them.' }
  ],
  resultTemplate: 'The orbital frequency stays constant while the radius grows, and the maximum energy follows K = q²B²R²/2m.'
};

type Particle = { value: string; label: string; m: number; q: number };
const particleOf = (key: string): Particle =>
  PARTICLES.find((p) => p.value === key) ?? (PARTICLES[0] as Particle);

function compute(params: ParamValues): ModelOutput {
  const b = num(params, 'b', 1);
  const vGap = num(params, 'vGap', 20) * 1000;
  const rDee = num(params, 'rDee', 40) / 100;
  const p = particleOf(String(params.particle ?? 'proton'));
  const f = cyclotronFrequency(p.q, b, p.m);
  const eMax = cyclotronMaxEnergy(p.q, b, rDee, p.m);
  const vMax = (p.q * b * rDee) / p.m;
  const beta = vMax / CONSTANTS.C_LIGHT;
  // Each turn crosses the gap twice, so the energy gained per turn is 2qV joules.
  const revs = eMax / Math.max(2 * p.q * vGap, 1e-30);

  const points: { x: number; y: number }[] = [];
  for (let bb = 0.1; bb <= 3.0001; bb += 0.05) points.push({ x: bb, y: cyclotronFrequency(p.q, bb, p.m) / 1e6 });

  return {
    readouts: [
      ro('f', 'Cyclotron frequency', f, 'Hz', 4, { sub: `${(f / 1e6).toFixed(2)} MHz` }),
      ro('t', 'Period', 1 / f, 's', 4),
      ro('kmax', 'Max kinetic energy', eMax, 'J', 3, { sub: `${(jToEv(eMax) / 1e6).toFixed(3)} MeV` }),
      ro('vmax', 'Max speed', vMax, 'm/s', 4, { sub: `${(beta * 100).toFixed(1)}% of c` }),
      ro('r', 'Radius at 1 MeV', gyroradius(p.m, Math.sqrt((2 * 1e6 * CONSTANTS.EV) / p.m), p.q, b), 'm', 3),
      ro('vg', 'Gap voltage', vGap, 'V', 0),
      ro('rev', 'Revolutions to full energy', revs, '\u2014', 0, { sub: 'two gap crossings per turn' }),
      ro('tacc', 'Acceleration time', revs / f, 's', 6, { sub: formatSI(revs / f, 3) }),
      ro('rel', 'Relativity limit', beta > 0.1 ? 1 : 0, '', 0, { text: beta > 0.1 ? 'EXCEEDED' : 'SAFE', tone: beta > 0.1 ? 'alert' : 'normal' })
    ],
    graph: singleSeriesGraph({
      title: 'Cyclotron frequency against magnetic field', xLabel: 'B (T)', yLabel: 'f (MHz)',
      seriesLabel: 'f', color: '#9d8cff', points, live: { x: b, y: f / 1e6 }
    }),
    description: `A ${p.label.toLowerCase()} in a ${b.toFixed(2)} tesla field circles at ${formatSI(f, 4)} hertz. With dee radius ${(rDee * 100).toFixed(0)} centimetre it leaves with ${(jToEv(eMax) / 1e6).toFixed(3)} megaelectronvolt of kinetic energy.`,
    result: `For a ${p.label.toLowerCase()} in B = ${b.toFixed(2)} T the cyclotron frequency is ${formatSI(f, 4)} Hz, independent of speed. With R = ${(rDee * 100).toFixed(0)} cm the maximum energy is ${(jToEv(eMax) / 1e6).toFixed(3)} MeV at v = ${formatSI(vMax, 3)} m/s (${(beta * 100).toFixed(1)}% of c).`
  };
}

/** One sampled point of the drawn orbit: where the ion is, when, and how far along. */
export interface OrbitSample {
  x: number;
  y: number;
  /** Display time in seconds from injection. */
  t: number;
  /** Path length drawn so far, in px. */
  s: number;
  /** Which half-turn (0-based) the ion is on; -1 in the gap or the exit leg. */
  half: number;
}

export interface OrbitLayout {
  cx: number;
  cy: number;
  /** Radius of the last orbit, in px — the drawn dee radius. */
  maxR: number;
  gap: number;
  /** Half-turns drawn. */
  halves: number;
  /** Display seconds per half-turn; the same for every orbit. */
  halfTime: number;
  gapTime: number;
  exitLength: number;
}

/**
 * The cyclotron spiral, built honestly. The ion gains the same energy at
 * every gap crossing, so after k crossings K ∝ k and r = mv/qB ∝ √K ∝ √k.
 * Each half-turn is a true semicircle centred on the gap edge of its dee, and
 * successive centres drift so that each orbit begins where the last left the
 * gap. Every half-turn takes the same time — the cyclotron's central fact —
 * so a larger orbit is drawn faster, not slower. With B out of the page a
 * positive ion circulates clockwise on screen.
 */
export function cyclotronOrbit(o: OrbitLayout): OrbitSample[] {
  const n = Math.max(1, Math.round(o.halves));
  const radii = Array.from({ length: n }, (_, k) => o.maxR * Math.sqrt((k + 1) / n));
  // Centre heights, chained so the ends meet across the gap.
  const yc: number[] = [0];
  for (let k = 0; k < n - 1; k++) {
    const r0 = radii[k] as number;
    const r1 = radii[k + 1] as number;
    const prev = yc[k] as number;
    yc.push(k % 2 === 0 ? prev - r0 + r1 : prev + r0 - r1);
  }
  // Put the outermost orbit on the dee centre, so the ion leaves at R.
  const shift = o.cy - (yc[n - 1] as number);

  const out: OrbitSample[] = [];
  let t = 0;
  let s = 0;
  const push = (x: number, y: number, half: number): void => {
    const last = out[out.length - 1];
    if (last) s += Math.hypot(x - last.x, y - last.y);
    out.push({ x, y, t, s, half });
  };
  const STEPS = 40;
  for (let k = 0; k < n; k++) {
    const left = k % 2 === 0;
    const r = radii[k] as number;
    const cxk = o.cx + (left ? -o.gap / 2 : o.gap / 2);
    const cyk = (yc[k] as number) + shift;
    // Left dee: bottom → left → top (θ π/2 → 3π/2). Right: top → right → bottom.
    const a0 = left ? Math.PI / 2 : -Math.PI / 2;
    for (let i = 0; i <= STEPS; i++) {
      if (k > 0 && i === 0) continue;
      const th = a0 + (Math.PI * i) / STEPS;
      if (i > 0) t += o.halfTime / STEPS;
      push(cxk + r * Math.cos(th), cyk + r * Math.sin(th), k);
    }
    if (k < n - 1) {
      // Across the gap, where the RF field does its work.
      const last = out[out.length - 1] as OrbitSample;
      t += o.gapTime;
      push(left ? o.cx + o.gap / 2 : o.cx - o.gap / 2, last.y, -1);
    }
  }
  // Out along the tangent towards the target.
  const end = out[out.length - 1] as OrbitSample;
  const dir = (n - 1) % 2 === 0 ? 1 : -1;
  t += (o.exitLength / (Math.PI * o.maxR)) * o.halfTime;
  push(end.x + dir * o.exitLength, end.y, -1);
  return out;
}

/** The sample index reached at display time t (binary search on the timestamps). */
function sampleAt(orbit: OrbitSample[], t: number): number {
  let lo = 0;
  let hi = orbit.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if ((orbit[mid] as OrbitSample).t <= t) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

const CYC = { cx: 410, cy: 236, gap: 24 };
/** The largest drawable orbit; Dee radius R in cm is mapped onto 92–172 px. */
const deePx = (rDeeCm: number): number => 92 + ((rDeeCm - 10) / 70) * 80;
const MAX_HALVES = 30;

function Stage({ params, set, control }: StageApi) {
  const b = num(params, 'b', 1);
  const vGap = num(params, 'vGap', 20) * 1000;
  const rDeeCm = num(params, 'rDee', 40);
  const rDee = rDeeCm / 100;
  const p = particleOf(String(params.particle ?? 'proton'));
  const trail = Boolean(params.trail ?? true);
  const reduced = useReducedMotion();
  const f = cyclotronFrequency(p.q, b, p.m);
  const vMax = (p.q * b * rDee) / p.m;
  const eMax = 0.5 * p.m * vMax * vMax;
  // Real crossings to reach R; the drawing thins them to a countable number.
  const realCrossings = Math.max(1, Math.round(eMax / (p.q * vGap)));
  const halves = Math.min(realCrossings, MAX_HALVES);
  const R = deePx(rDeeCm);

  const orbit = useMemo(
    () =>
      cyclotronOrbit({ ...CYC, maxR: R, halves, halfTime: 0.36, gapTime: 0.05, exitLength: 150 }),
    [R, halves]
  );
  const total = (orbit[orbit.length - 1] as OrbitSample).s;
  const duration = (orbit[orbit.length - 1] as OrbitSample).t + 0.9;
  const d = useMemo(
    () => orbit.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(' '),
    [orbit]
  );

  const pathRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);
  const gapRef = useRef<SVGRectElement>(null);
  const polRef = useRef<[SVGTextElement | null, SVGTextElement | null]>([null, null]);

  useRafLoop((elapsed) => {
    const t = elapsed % duration;
    const i = sampleAt(orbit, t);
    const a = orbit[i] as OrbitSample;
    const bNext = orbit[Math.min(i + 1, orbit.length - 1)] as OrbitSample;
    const span = bNext.t - a.t;
    const u = span > 0 ? Math.min(1, (t - a.t) / span) : 0;
    const x = a.x + (bNext.x - a.x) * u;
    const y = a.y + (bNext.y - a.y) * u;
    const s = a.s + (bNext.s - a.s) * u;
    pathRef.current?.setAttribute('stroke-dashoffset', (total - s).toFixed(1));
    dotRef.current?.setAttribute('cx', x.toFixed(1));
    dotRef.current?.setAttribute('cy', y.toFixed(1));
    // The RF reverses every half-turn: the dee the ion is heading for is negative.
    const inGap = a.half === -1 && i < orbit.length - 2;
    gapRef.current?.setAttribute('opacity', inGap ? '0.55' : '0.08');
    const half = a.half === -1 ? (orbit[Math.max(0, i - 1)] as OrbitSample).half + 1 : a.half;
    const towardsRight = half % 2 === 1;
    const [l, r] = polRef.current;
    if (l) l.textContent = towardsRight ? '+' : '−';
    if (r) r.textContent = towardsRight ? '−' : '+';
  }, true);

  const left = `M${CYC.cx - CYC.gap / 2} ${CYC.cy - R} A${R} ${R} 0 0 0 ${CYC.cx - CYC.gap / 2} ${CYC.cy + R} Z`;
  const right = `M${CYC.cx + CYC.gap / 2} ${CYC.cy - R} A${R} ${R} 0 0 1 ${CYC.cx + CYC.gap / 2} ${CYC.cy + R} Z`;
  const exit = orbit[orbit.length - 1] as OrbitSample;
  const field = Array.from({ length: 12 }, (_, i) => ({ x: 640 + (i % 4) * 34, y: 104 + Math.floor(i / 4) * 30 }));

  return (
    <svg viewBox="0 0 820 470" className="svg-lab" preserveAspectRatio="xMidYMid meet">
      <SvgDefs />
      <defs>
        <radialGradient id="cyc-dee" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#9d8cff" stopOpacity={0.05} />
          <stop offset="100%" stopColor="#9d8cff" stopOpacity={0.2} />
        </radialGradient>
      </defs>
      {/* The pole piece of the magnet, behind the dees. */}
      <circle cx={CYC.cx} cy={CYC.cy} r={R + 14} fill="#0b1220" stroke="#3a4c60" strokeWidth={1.2} strokeDasharray="5 5" />
      <path d={left} fill="url(#cyc-dee)" stroke="#9d8cff" strokeOpacity={0.55} />
      <path d={right} fill="url(#cyc-dee)" stroke="#9d8cff" strokeOpacity={0.55} />
      <rect ref={gapRef} x={CYC.cx - CYC.gap / 2} y={CYC.cy - R} width={CYC.gap} height={2 * R} fill="#ffd257" opacity={0.08} />
      <text x={CYC.cx - R * 0.55} y={CYC.cy - R * 0.62} fontSize={11} fill="#9d8cff" textAnchor="middle">D₁</text>
      <text x={CYC.cx + R * 0.55} y={CYC.cy - R * 0.62} fontSize={11} fill="#9d8cff" textAnchor="middle">D₂</text>
      <text ref={(el) => { polRef.current[0] = el; }} x={CYC.cx - R * 0.55} y={CYC.cy + R * 0.7} fontSize={16} fill="#cfdcea" textAnchor="middle">−</text>
      <text ref={(el) => { polRef.current[1] = el; }} x={CYC.cx + R * 0.55} y={CYC.cy + R * 0.7} fontSize={16} fill="#cfdcea" textAnchor="middle">+</text>
      <circle cx={CYC.cx} cy={orbit[0]?.y ?? CYC.cy} r={4} fill="#25d0ee" opacity={0.8}>
        <title>Ion source</title>
      </circle>

      {/* B out of the page, beside the machine rather than on top of it. */}
      {field.map((pt, i) => (
        <g key={i}>
          <circle cx={pt.x} cy={pt.y} r={6} fill="none" stroke="#7dd3fc" strokeWidth={1.1} />
          <circle cx={pt.x} cy={pt.y} r={1.6} fill="#7dd3fc" />
        </g>
      ))}
      <text x={640} y={88} fontSize={9.5} fill="#7dd3fc">B out of the page</text>

      <path
        ref={pathRef}
        d={d}
        fill="none"
        stroke="#ffd257"
        strokeWidth={1.6}
        strokeLinejoin="round"
        opacity={trail ? 0.85 : 0}
        strokeDasharray={`${total.toFixed(1)} ${total.toFixed(1)}`}
        strokeDashoffset={reduced ? 0 : total}
      />
      <circle ref={dotRef} cx={exit.x} cy={exit.y} r={6} fill="#ffd257" style={{ filter: 'drop-shadow(0 0 8px #ffd25799)' }} />
      <text x={exit.x} y={exit.y + (exit.y < CYC.cy ? -10 : 18)} fontSize={9.5} textAnchor="middle" className="label-mono">to target</text>

      {/* The RF oscillator drives the two dees. */}
      <path d={`M${CYC.cx - CYC.gap / 2 - 6} ${CYC.cy + R - 4} V${CYC.cy + R + 30} M${CYC.cx + CYC.gap / 2 + 6} ${CYC.cy + R - 4} V${CYC.cy + R + 30}`} className="lead" stroke="#8497ad" />
      <text x={CYC.cx} y={CYC.cy + R + 44} textAnchor="middle" fontSize={9.5} className="label-mono">RF {(f / 1e6).toFixed(2)} MHz</text>

      <text x={410} y={30} textAnchor="middle" fontSize={13} fill="#eaf1f8" fontWeight={600}>
        {p.label} · f = {(f / 1e6).toFixed(3)} MHz · gap voltage {(vGap / 1000).toFixed(0)} kV
      </text>
      <text x={410} y={48} textAnchor="middle" fontSize={11} fill="#8497ad" fontFamily="ui-monospace, monospace">
        B = {b.toFixed(2)} T · R = {rDeeCm.toFixed(0)} cm · K max = {(jToEv(eMax) / 1e6).toFixed(2)} MeV
      </text>
      <text x={612} y={226} fontSize={10} fill="#8497ad">
        <tspan x={612}>{realCrossings} gap crossings to reach R</tspan>
        <tspan x={612} dy={14}>{realCrossings > MAX_HALVES ? `drawn as ${MAX_HALVES}, radii ∝ √crossings` : 'every crossing drawn'}</tspan>
        <tspan x={612} dy={14}>each half-turn takes T/2 = {formatSI(0.5 / f, 3)}s</tspan>
      </text>

      <Knob spec={control('b', 'slider')} params={params} onChange={(key, value) => set(key, value)} x={80} y={150} radius={19} label="Magnetic field B — turn the magnet supply" />
      <Knob spec={control('vGap', 'slider')} params={params} onChange={(key, value) => set(key, value)} x={80} y={270} radius={19} label="Gap voltage V — turn the oscillator" />
      <Knob spec={control('rDee', 'slider')} params={params} onChange={(key, value) => set(key, value)} x={80} y={390} radius={19} label="Dee radius R" />
      <StageSwitch
        spec={control('trail', 'toggle')} states={{ on: 'ON', off: 'OFF' }}
        params={params}
        onChange={(key, value) => set(key, value)}
        x={700}
        y={404}
        label="Show the spiral trajectory"
      />
    </svg>
  );
}

export default function CyclotronExperiment() {
  return (
    <PhysicsExperiment
      definition={definition} education={education} compute={compute}
      renderStage={(api) => <Stage {...api} />}
      notebook={({ params: p }) => {
        const b = num(p, 'b', 1);
        const rDee = num(p, 'rDee', 40) / 100;
        const pt = particleOf(String(p.particle ?? 'proton'));
        return {
          title: 'Observation table — cyclotron parameters',
          columns: [
            col('b', 'B', 'T', 2),
            col('f', 'f', 'MHz', 4),
            col('r', 'R', 'cm', 0),
            col('k', 'K max', 'MeV', 4),
            col('v', 'v max', '×10⁶ m/s', 3)
          ],
          capture: () => ({
            b,
            f: cyclotronFrequency(pt.q, b, pt.m) / 1e6,
            r: rDee * 100,
            k: jToEv(cyclotronMaxEnergy(pt.q, b, rDee, pt.m)) / 1e6,
            v: ((pt.q * b * rDee) / pt.m) / 1e6
          }),
          captureHint: 'Change the magnetic field or dee radius, then record.'
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
