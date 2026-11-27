import type { EducationPack, ExperimentDefinition, ParamValues } from '@/types/lab';
import type { ModelOutput } from '@/components/shell/PhysicsExperiment';
import { PhysicsExperiment } from '@/components/shell/PhysicsExperiment';
import { ViewPill, SvgDefs } from '@/components/shell/Viewport';
import { AngleArc, Ray } from '@/components/instruments/Instruments';
import { criticalAngle, fresnelReflectance, snellRefraction } from '@/physics-engine/optics';
import { degToRad } from '@/physics-engine/units';
import { mergeIssues, validatePositive, validateRange } from '@/physics-engine/validation';
import { col, num, ro, str, singleSeriesGraph } from './_shared';
import { Knob, StageSegmented, StageSwitch, type StageApi } from '@/components/controls/StageKit';
import { chainRays, makeRayScene, type SceneRay } from '@/lab/scenes/rays';

import { meta } from './reflection-refraction.meta';

export { meta };

const MEDIA = [
  { value: 'water', label: 'Water', n: 1.333 },
  { value: 'glass', label: 'Crown glass', n: 1.52 },
  { value: 'diamond', label: 'Diamond', n: 2.417 },
  { value: 'oil', label: 'Cedar oil', n: 1.516 }
] as const;

const mediumOf = (key: string) => MEDIA.find((m) => m.value === key) ?? MEDIA[1];

const definition: ExperimentDefinition = {
  id: meta.id, slug: meta.slug, title: meta.title, shortTitle: meta.shortTitle, aim: meta.aim,
  unit: meta.unit, chapter: meta.chapter, kind: meta.kind, difficulty: meta.difficulty,
  thumbLabel: meta.shortTitle, accent: '#ffd257',
  controls: [
    { kind: 'slider', key: 'incidence', label: 'Angle of incidence', symbol: 'i', unit: '°', min: 0, max: 89, step: 0.5, initial: 40, precision: 1, onStage: true },
    { kind: 'segmented', key: 'medium', label: 'Denser medium', initial: 'glass', options: MEDIA.map((m) => ({ value: m.value, label: m.label })) },
    { kind: 'toggle', key: 'reversed', label: 'Send the ray from the denser side', initial: false, onStage: true },
    { kind: 'toggle', key: 'showReflected', label: 'Show the reflected ray', initial: true, onStage: true }
  ],
  defaults: { incidence: 40, medium: 'glass', reversed: false, showReflected: true }
};

const education: EducationPack = {
  theory: [
    'When light meets the boundary between two transparent media, part of it is reflected back and part passes through. Both processes obey simple geometrical laws referred to the normal — the line drawn perpendicular to the surface at the point where the ray strikes it.',
    'The law of reflection states that the angle of reflection equals the angle of incidence, and that the incident ray, the reflected ray and the normal all lie in one plane. This holds whatever the two media are.',
    'The law of refraction, Snell’s law, states that the ratio of the sine of the angle of incidence to the sine of the angle of refraction is a constant for a given pair of media. That constant is the relative refractive index. Going from a rarer to a denser medium the ray bends towards the normal; the other way round it bends away.',
    'Because the sine of an angle cannot exceed one, there is a limit when the ray travels from denser to rarer. Beyond the critical angle no refracted ray exists at all and the light is totally internally reflected — the same physics, pushed to its geometrical limit.'
  ],
  formulas: [
    { tex: '\\angle i = \\angle r', caption: 'Law of reflection.' },
    { tex: 'n_1\\sin i = n_2\\sin r', caption: 'Snell’s law in its symmetric form.' },
    { tex: '{}^{1}n_{2} = \\frac{\\sin i}{\\sin r} = \\frac{v_1}{v_2}', caption: 'Relative refractive index, also the ratio of the speeds.' },
    { tex: '\\sin i_c = \\frac{n_2}{n_1}', caption: 'Critical angle for total internal reflection.' }
  ],
  variables: [
    { symbol: 'i', name: 'Angle of incidence', unit: '°' },
    { symbol: 'r', name: 'Angle of refraction', unit: '°' },
    { symbol: 'n_1', name: 'Refractive index of the first medium', unit: '—' },
    { symbol: 'n_2', name: 'Refractive index of the second medium', unit: '—' },
    { symbol: 'i_c', name: 'Critical angle', unit: '°' },
    { symbol: 'v', name: 'Speed of light in the medium', unit: 'm/s' }
  ],
  procedure: [
    'Place the semicircular glass block on a sheet of paper and draw its outline and the normal at the centre of its flat face.',
    'Direct a narrow beam at the flat face along a chosen angle of incidence.',
    'Mark the incident, reflected and refracted rays with pins and complete the paths after removing the block.',
    'Measure the angles of incidence, reflection and refraction with a protractor.',
    'Repeat for angles of incidence from 10° to 80° in steps of 10°.',
    'Plot sin i against sin r; the graph is a straight line whose slope is the refractive index.'
  ],
  precautions: [
    'Draw the normal accurately — every angle is measured from it.',
    'Use a narrow beam; a broad beam makes the ray direction uncertain.',
    'Do not move the block once its outline has been drawn.',
    'Measure the angles from the normal, never from the surface.'
  ],
  sourcesOfError: [
    'Error in drawing the normal, which propagates into every angle.',
    'The beam has a finite width, so its axis must be judged.',
    'Slight movement of the block while the pins are being fixed.',
    'The protractor is read to only half a degree.'
  ],
  tips: [
    'Set the angle of incidence to zero: the ray passes straight through, undeviated but slowed.',
    'Send the ray from the denser side and increase the angle past the critical value to watch the refracted ray vanish.'
  ],
  viva: [
    { q: 'State Snell’s law.', a: 'For a given pair of media the ratio of the sine of the angle of incidence to the sine of the angle of refraction is a constant, equal to the relative refractive index.' },
    { q: 'What happens when light enters a denser medium?', a: 'It slows down and bends towards the normal; its frequency is unchanged and its wavelength shortens.' },
    { q: 'Is any light reflected at the boundary even below the critical angle?', a: 'Yes. Partial reflection always occurs; only above the critical angle does it become total.' },
    { q: 'What is the angle of refraction for normal incidence?', a: 'Zero — the ray passes straight through without bending, though its speed still changes.' },
    { q: 'Why does the refractive index have no unit?', a: 'It is a ratio of two sines, or equivalently of two speeds.' }
  ],
  resultTemplate:
    'The angle of reflection equals the angle of incidence, and the graph of sin i against sin r is a straight line whose slope gives the refractive index of the medium.'
};

function model(params: ParamValues) {
  const medium = mediumOf(str(params, 'medium', 'glass'));
  const i = num(params, 'incidence', 40);
  const reversed = params.reversed === true;

  const n1 = reversed ? medium.n : 1;
  const n2 = reversed ? 1 : medium.n;
  const r = snellRefraction(i, n1, n2);
  const ic = criticalAngle(n1, n2);
  const tir = reversed && Number.isFinite(ic) && i > ic;
  const ratio = Number.isFinite(r) && Math.sin(degToRad(r)) !== 0
    ? Math.sin(degToRad(i)) / Math.sin(degToRad(r))
    : Number.NaN;

  return { medium, i, reversed, n1, n2, r, ic, tir, ratio };
}

function compute(params: ParamValues): ModelOutput {
  const m = model(params);

  const issues = mergeIssues(
    validateRange('incidence', 'Angle of incidence', m.i, 0, 89),
    validatePositive('medium', 'Refractive index', m.medium.n)
  );
  if (m.tir) {
    issues.push({
      field: 'incidence',
      severity: 'info',
      message: `Past the critical angle of ${m.ic.toFixed(2)}° there is no refracted ray — the light is totally internally reflected.`
    });
  }

  // sin i against sin r, the graph the experiment is actually plotted as.
  const points: { x: number; y: number }[] = [];
  for (let a = 0; a <= 89; a += 0.5) {
    const rr = snellRefraction(a, m.n1, m.n2);
    if (Number.isFinite(rr)) points.push({ x: Math.sin(degToRad(rr)), y: Math.sin(degToRad(a)) });
  }

  return {
    readouts: [
      ro('i', 'Angle of incidence i', m.i, '°', 2),
      ro('refl', 'Angle of reflection', m.i, '°', 2, { sub: 'equal to i' }),
      ro('r', 'Angle of refraction r', m.r, '°', 2, { text: m.tir ? 'none' : undefined, tone: m.tir ? 'alert' : 'normal' }),
      ro('n', 'Refractive index sin i / sin r', m.ratio, '—', 4, { text: m.tir ? '—' : undefined }),
      ro('rel', 'n₁ → n₂', m.n2 / m.n1, '—', 4, { sub: `${m.n1.toFixed(3)} → ${m.n2.toFixed(3)}` }),
      ro('ic', 'Critical angle', m.ic, '°', 2, { text: Number.isFinite(m.ic) ? undefined : 'n/a', sub: m.reversed ? 'denser → rarer' : 'rarer → denser: none' })
    ],
    graph: singleSeriesGraph({
      title: 'sin i against sin r',
      xLabel: 'sin r',
      yLabel: 'sin i',
      seriesLabel: `slope = n = ${(m.n2 / m.n1).toFixed(3)}`,
      color: '#ffd257',
      points,
      live: Number.isFinite(m.r) ? { x: Math.sin(degToRad(m.r)), y: Math.sin(degToRad(m.i)) } : undefined
    }),
    issues,
    description: `A ray strikes the boundary at ${m.i.toFixed(1)} degrees, travelling from ${m.reversed ? `${m.medium.label.toLowerCase()} into air` : `air into ${m.medium.label.toLowerCase()}`}. ${m.tir ? 'The angle is past the critical value, so the light is totally internally reflected.' : `It is refracted at ${m.r.toFixed(2)} degrees.`}`,
    result: m.tir
      ? `At i = ${m.i.toFixed(1)}°, beyond the critical angle of ${m.ic.toFixed(2)}°, no refracted ray emerges; all the light is reflected back into the ${m.medium.label.toLowerCase()}.`
      : `The angle of reflection equals the angle of incidence at ${m.i.toFixed(2)}°, and sin i / sin r = sin ${m.i.toFixed(1)}° / sin ${m.r.toFixed(2)}° = ${m.ratio.toFixed(4)}, the refractive index for this pair of media.`
  };
}

/**
 * The construction, in stage coordinates — one function so the SVG rays and
 * the light packets riding them are the same lines.
 */
function rayGeometry(params: ParamValues) {
  const m = model(params);
  const cx = 410;
  const cy = 250;
  const L = 190;
  // The denser medium fills the lower half unless the ray comes from inside it.
  const iRad = degToRad(m.i);
  const inFrom = m.reversed
    ? { x: cx - Math.sin(iRad) * L, y: cy + Math.cos(iRad) * L }
    : { x: cx - Math.sin(iRad) * L, y: cy - Math.cos(iRad) * L };
  const reflected = m.reversed
    ? { x: cx + Math.sin(iRad) * L, y: cy + Math.cos(iRad) * L }
    : { x: cx + Math.sin(iRad) * L, y: cy - Math.cos(iRad) * L };
  const rRad = Number.isFinite(m.r) ? degToRad(m.r) : 0;
  const refracted = m.reversed
    ? { x: cx + Math.sin(rRad) * L, y: cy - Math.cos(rRad) * L }
    : { x: cx + Math.sin(rRad) * L, y: cy + Math.cos(rRad) * L };
  return { m, cx, cy, L, inFrom, reflected, refracted };
}

function Stage({ params, set, control }: StageApi) {
  const { m, cx, cy, inFrom, reflected, refracted } = rayGeometry(params);
  const showReflected = params.showReflected !== false;

  return (
    <svg viewBox="0 0 820 470" className="svg-lab" preserveAspectRatio="xMidYMid meet">
      <SvgDefs />
      <text x={410} y={36} textAnchor="middle" fontSize={12.5} fontWeight={600} fill="#eaf1f8">
        {m.reversed ? `${m.medium.label} → air` : `Air → ${m.medium.label}`} · n = {m.medium.n.toFixed(3)}
      </text>

      <rect x={60} y={cy} width={700} height={170} fill="url(#lab-glass)" />
      <line x1={60} y1={cy} x2={760} y2={cy} stroke="#8fc7e8" strokeWidth={1.6} />
      <text x={72} y={cy - 10} fontSize={10.5} fill="#8497ad">{m.reversed ? `air · n = 1` : 'air · n = 1'}</text>
      <text x={72} y={cy + 20} fontSize={10.5} fill="#8fc7e8">{m.medium.label} · n = {m.medium.n.toFixed(3)}</text>

      {/* The normal at the point of incidence. */}
      <line x1={cx} y1={cy - 150} x2={cx} y2={cy + 150} className="normal-line" />
      <text x={cx + 6} y={cy - 154} fontSize={10} fill="#8497ad">normal</text>

      <Ray from={inFrom} to={{ x: cx, y: cy }} color="#ffd257" width={2} />
      {showReflected ? (
        <Ray from={{ x: cx, y: cy }} to={reflected} color={m.tir ? '#ffd257' : '#ffb454'} width={m.tir ? 2 : 1.4} />
      ) : null}
      {!m.tir && Number.isFinite(m.r) ? <Ray from={{ x: cx, y: cy }} to={refracted} color="#6ee7ff" width={2} /> : null}

      <AngleArc
        centre={{ x: cx, y: cy }}
        fromAngleDeg={m.reversed ? 90 : -90}
        toAngleDeg={m.reversed ? 90 + m.i : -90 - m.i}
        radius={58}
        label={`i = ${m.i.toFixed(1)}°`}
      />
      {!m.tir && Number.isFinite(m.r) ? (
        <AngleArc
          centre={{ x: cx, y: cy }}
          fromAngleDeg={m.reversed ? -90 : 90}
          toAngleDeg={m.reversed ? -90 + m.r : 90 - m.r}
          radius={78}
          label={`r = ${m.r.toFixed(1)}°`}
          color="#6ee7ff"
        />
      ) : null}

      <text x={410} y={444} textAnchor="middle" fontSize={10.5} fill="#5e7189">
        {m.tir
          ? `total internal reflection · i = ${m.i.toFixed(1)}° > i_c = ${m.ic.toFixed(2)}°`
          : `n₁ sin i = n₂ sin r → ${m.n1.toFixed(3)} × sin ${m.i.toFixed(1)}° = ${m.n2.toFixed(3)} × sin ${m.r.toFixed(2)}°`}
      </text>

      <Knob spec={control('incidence', 'slider')} params={params} onChange={set} x={120} y={92} radius={22} label="Angle of incidence — turn the dial" />
      <StageSegmented spec={control('medium', 'segmented')} params={params} onChange={set} x={620} y={92} segmentWidth={76} label="Denser medium" />
      <StageSwitch spec={control('reversed', 'toggle')} params={params} onChange={set} x={700} y={150} label="Send the ray from the denser side" states={{ on: 'DENSER → RARER', off: 'RARER → DENSER' }} />
      <StageSwitch spec={control('showReflected', 'toggle')} params={params} onChange={set} x={700} y={212} label="Show the reflected ray" states={{ on: 'ON', off: 'OFF' }} />
    </svg>
  );
}

/**
 * Packets ride the incident, reflected and refracted rays. In the denser
 * medium they slow to c/n and crowd to λ/n, and the reflected ray is as bright
 * as the Fresnel reflectance says — faint at normal incidence, all of the
 * light past the critical angle.
 */
const scene = makeRayScene({
  glow: true,
  speed: 150,
  spacing: 54,
  label: (params) => {
    const { m } = rayGeometry(params);
    const R = fresnelReflectance(m.i, m.n1, m.n2);
    return m.tir
      ? `Total internal reflection: all the light is reflected back into the ${m.medium.label.toLowerCase()}.`
      : `Light crosses from n = ${m.n1.toFixed(2)} to n = ${m.n2.toFixed(2)}, changing speed by a factor ${(m.n1 / m.n2).toFixed(3)}; about ${(R * 100).toFixed(1)} per cent is reflected.`;
  },
  rays: (params) => {
    const { m, cx, cy, inFrom, reflected, refracted } = rayGeometry(params);
    const centre = { x: cx, y: cy };
    const incident = chainRays([inFrom, centre], [{ index: m.n1, color: '#ffd257' }]);
    const out: SceneRay[] = incident.rays.map((r) => ({ ...r, terminal: false }));
    const R = fresnelReflectance(m.i, m.n1, m.n2);
    if (params.showReflected !== false || m.tir) {
      // Displayed brightness follows R, lifted so a 4 % reflection is still visible.
      out.push(...chainRays([centre, reflected], [{ index: m.n1, color: '#ffb454', weight: m.tir ? 1 : 0.25 + 0.75 * Math.sqrt(R) }], incident.opticalLength).rays);
    }
    if (!m.tir && Number.isFinite(m.r)) {
      out.push(...chainRays([centre, refracted], [{ index: m.n2, color: '#6ee7ff', weight: 0.35 + 0.65 * (1 - R) }], incident.opticalLength).rays);
    }
    return out;
  },
  disclosure: 'Light packets are a visual construct — in the denser medium they slow to c/n and crowd to λ/n; reflected brightness follows the Fresnel reflectance.'
});

export default function ReflectionRefractionExperiment() {
  return (
    <PhysicsExperiment
      definition={definition}
      education={education}
      compute={compute}
      scene={scene}
      renderStage={(api) => <Stage {...api} />}
      viewportOverlay={(params) => {
        const m = model(params);
        return (
          <>
            <ViewPill label="i" value={m.i.toFixed(1)} unit="°" />
            <ViewPill label="r" value={m.tir ? 'TIR' : m.r.toFixed(2)} unit={m.tir ? undefined : '°'} />
          </>
        );
      }}
      notebook={({ params: p }) => {
        const m = model(p);
        return {
          title: 'Observation table — angles of incidence and refraction',
          columns: [
            col('i', 'i', '°', 1),
            col('r', 'r', '°', 2),
            col('si', 'sin i', '—', 4, true),
            col('sr', 'sin r', '—', 4, true),
            col('n', 'sin i / sin r', '—', 4, true)
          ],
          capture: () => ({ i: m.i, r: m.r, si: 0, sr: 0, n: 0 }),
          derive: (row) => {
            const si = Math.sin(degToRad(Number(row.i)));
            const sr = Math.sin(degToRad(Number(row.r)));
            return { ...row, si, sr, n: sr === 0 ? Number.NaN : si / sr };
          },
          comparison: {
            label: 'refractive index',
            unit: '—',
            experimental: m.ratio,
            theoretical: m.n2 / m.n1,
            precision: 4
          },
          captureEnabled: !m.tir,
          captureHint: 'Step the angle of incidence in tens of degrees and record each pair.'
        };
      }}
    />
  );
}

export { definition, education };
