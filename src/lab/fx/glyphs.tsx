import type { ReactNode } from "react";

/**
 * Small line illustrations for the catalogue cards, one per kind of
 * apparatus. Drawn in `currentColor` (the unit accent) on a 160×96 box; parts
 * classed `g-flow` carry a dash that runs while the card is hovered or
 * focused, so a card hints at what moves in its experiment.
 */
type GlyphKind =
  | "charges"
  | "potential"
  | "cage"
  | "capacitor"
  | "rc"
  | "circuit"
  | "bridge"
  | "meter"
  | "coil"
  | "spiral"
  | "beam"
  | "induction"
  | "string"
  | "spectrum"
  | "wave"
  | "lens"
  | "lens-concave"
  | "mirror"
  | "mirror-convex"
  | "prism"
  | "slab"
  | "refract"
  | "fibre"
  | "liquid"
  | "fringes"
  | "diffraction"
  | "polariser"
  | "telescope"
  | "eye"
  | "photon"
  | "atom"
  | "diode";

const BY_SLUG: Record<string, GlyphKind> = {
  "coulombs-law": "charges",
  "electric-field-charges": "charges",
  "potential-difference": "potential",
  "faraday-cage": "cage",
  "parallel-plate-capacitor": "capacitor",
  "rc-transient": "rc",
  "rl-transient": "rc",
  "ohms-law": "circuit",
  "resistance-series-parallel": "circuit",
  "battery-series-parallel": "circuit",
  "internal-resistance": "circuit",
  "emf-comparison": "bridge",
  "resistivity-vi-graph": "circuit",
  "resistivity-temperature": "circuit",
  "meter-bridge-resistivity": "bridge",
  "galvanometer-conversion": "meter",
  "galvanometer-half-deflection": "meter",
  "helmholtz-coil": "coil",
  "anti-helmholtz-coil": "coil",
  "solenoid-field": "coil",
  cyclotron: "spiral",
  "force-on-wire": "beam",
  "magnetic-force-charge": "beam",
  "charge-to-mass": "beam",
  "lenzs-law": "induction",
  sonometer: "string",
  "em-spectrum-explorer": "spectrum",
  "speed-of-light": "wave",
  "convex-lens": "lens",
  "concave-lens": "lens-concave",
  "concave-mirror": "mirror",
  "convex-mirror": "mirror-convex",
  "prism-dispersion": "prism",
  "glass-slab": "slab",
  "refractive-index-glass-slab": "slab",
  "reflection-refraction": "refract",
  "total-internal-reflection": "fibre",
  "refractive-index-liquid-lens": "liquid",
  "refractive-index-water": "liquid",
  "wave-optics": "fringes",
  "single-slit-diffraction": "diffraction",
  "malus-law": "polariser",
  telescope: "telescope",
  myopia: "eye",
  hypermetropia: "eye",
  "photoelectric-effect": "photon",
  "bohr-hydrogen-spectrum": "atom",
  "pn-junction-rectifier": "diode",
  "iv-characteristic": "diode",
};

const S = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;
const W = { ...S, stroke: "#eaf4ff", strokeOpacity: 0.85 } as const;

function Charge({ x, y, sign }: { x: number; y: number; sign: "+" | "−" }) {
  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r={9}
        fill={sign === "+" ? "#ff6b7d" : "#5aa9ff"}
        fillOpacity={0.9}
      />
      <circle
        cx={x}
        cy={y}
        r={14}
        fill={sign === "+" ? "#ff6b7d" : "#5aa9ff"}
        fillOpacity={0.18}
      />
      <text
        x={x}
        y={y + 4}
        textAnchor="middle"
        fontSize={12}
        fontWeight={700}
        fill="#fff"
      >
        {sign}
      </text>
    </g>
  );
}

const ART: Record<GlyphKind, () => ReactNode> = {
  charges: () => (
    <>
      {[-22, -10, 0, 10, 22].map((k) => (
        <path
          key={k}
          {...S}
          className="g-flow"
          d={`M56 48 C 70 ${48 + k * 1.6}, 90 ${48 + k * 1.6}, 104 48`}
          opacity={0.75}
        />
      ))}
      <Charge x={50} y={48} sign="+" />
      <Charge x={110} y={48} sign="−" />
    </>
  ),
  potential: () => (
    <>
      {[12, 22, 32, 42].map((r) => (
        <circle
          key={r}
          {...S}
          cx={80}
          cy={48}
          r={r}
          opacity={1 - r / 60}
          strokeDasharray="3 4"
          className="g-flow"
        />
      ))}
      <Charge x={80} y={48} sign="+" />
    </>
  ),
  cage: () => (
    <>
      {[20, 34, 48, 62, 76].map((y) => (
        <path
          key={y}
          {...S}
          className="g-flow"
          opacity={0.7}
          d={`M8 ${y} C 40 ${y}, 46 ${y < 48 ? 14 : 82}, 80 ${y < 48 ? 14 : 82} S 120 ${y}, 152 ${y}`}
        />
      ))}
      <rect
        x={58}
        y={26}
        width={44}
        height={44}
        rx={6}
        {...W}
        strokeDasharray="2 3"
      />
    </>
  ),
  capacitor: () => (
    <>
      <line {...W} x1={58} y1={18} x2={58} y2={78} strokeWidth={3} />
      <line {...W} x1={102} y1={18} x2={102} y2={78} strokeWidth={3} />
      {[28, 40, 52, 64].map((y) => (
        <path
          key={y}
          {...S}
          className="g-flow"
          d={`M64 ${y} H96`}
          markerEnd="url(#g-arrow)"
        />
      ))}
      <text x={50} y={16} fill="#ff6b7d" fontSize={11} fontWeight={700}>
        +
      </text>
      <text x={106} y={16} fill="#5aa9ff" fontSize={11} fontWeight={700}>
        −
      </text>
    </>
  ),
  rc: () => (
    <>
      <path {...W} opacity={0.35} d="M24 80 H140 M24 80 V14" />
      <path
        {...S}
        className="g-draw"
        strokeWidth={2.4}
        d="M24 80 C 44 30, 64 22, 140 18"
      />
      <path {...S} opacity={0.35} strokeDasharray="3 4" d="M24 18 H140" />
    </>
  ),
  circuit: () => (
    <>
      <path {...W} opacity={0.5} d="M30 24 H130 V72 H30 Z" />
      <path
        {...S}
        strokeWidth={2.2}
        d="M62 24 l5 -7 l7 14 l7 -14 l7 14 l7 -14 l5 7"
      />
      <line {...W} x1={74} y1={64} x2={74} y2={80} strokeWidth={2.4} />
      <line {...W} x1={84} y1={68} x2={84} y2={76} strokeWidth={2.4} />
      <path
        {...S}
        className="g-flow"
        strokeDasharray="2 8"
        strokeWidth={3}
        d="M30 24 H130 V72 H30 Z"
      />
    </>
  ),
  bridge: () => (
    <>
      <rect
        x={18}
        y={56}
        width={124}
        height={8}
        rx={2}
        fill="currentColor"
        opacity={0.18}
      />
      <line {...W} x1={18} y1={56} x2={142} y2={56} />
      {Array.from({ length: 11 }, (_, i) => (
        <line
          key={i}
          {...W}
          opacity={0.4}
          x1={18 + i * 12.4}
          y1={60}
          x2={18 + i * 12.4}
          y2={64}
        />
      ))}
      <path {...S} strokeWidth={2.2} d="M90 22 L96 54" className="g-swing" />
      <circle cx={96} cy={56} r={3} fill="currentColor" />
      <path {...W} opacity={0.5} d="M18 56 V30 H90" />
    </>
  ),
  meter: () => (
    <>
      <path {...W} opacity={0.5} d="M34 70 A 46 46 0 0 1 126 70" />
      {Array.from({ length: 11 }, (_, i) => {
        const a = Math.PI + (i * Math.PI) / 10;
        return (
          <line
            key={i}
            {...W}
            opacity={0.6}
            x1={80 + Math.cos(a) * 40}
            y1={70 + Math.sin(a) * 40}
            x2={80 + Math.cos(a) * 46}
            y2={70 + Math.sin(a) * 46}
          />
        );
      })}
      <line
        {...S}
        strokeWidth={2.4}
        x1={80}
        y1={70}
        x2={104}
        y2={36}
        className="g-swing"
      />
      <circle cx={80} cy={70} r={4} fill="currentColor" />
    </>
  ),
  coil: () => (
    <>
      {[50, 64, 78, 92, 106].map((x) => (
        <ellipse key={x} {...W} cx={x} cy={48} rx={6} ry={24} opacity={0.75} />
      ))}
      {[-14, 0, 14].map((k) => (
        <path
          key={k}
          {...S}
          className="g-flow"
          d={`M12 ${48 + k} C 40 ${48 + k * 0.4}, 120 ${48 + k * 0.4}, 148 ${48 + k}`}
        />
      ))}
    </>
  ),
  spiral: () => (
    <>
      <path
        {...W}
        opacity={0.3}
        d="M77 10 A 38 38 0 0 0 77 86 Z M83 10 A 38 38 0 0 1 83 86 Z"
      />
      <path
        {...S}
        className="g-draw"
        strokeWidth={1.8}
        d="M80 48 m-3 0 a 6 6 0 0 1 12 0 a 10 10 0 0 1 -20 0 a 15 15 0 0 1 30 0 a 20 20 0 0 1 -40 0 a 26 26 0 0 1 52 0 a 32 32 0 0 1 -64 0"
      />
      <circle cx={80} cy={48} r={2.5} fill="currentColor" />
    </>
  ),
  beam: () => (
    <>
      {Array.from({ length: 12 }, (_, i) => (
        <g key={i} opacity={0.45}>
          <circle
            {...W}
            cx={30 + (i % 4) * 32}
            cy={22 + Math.floor(i / 4) * 26}
            r={3.4}
          />
          <circle
            cx={30 + (i % 4) * 32}
            cy={22 + Math.floor(i / 4) * 26}
            r={1}
            fill="#eaf4ff"
          />
        </g>
      ))}
      <path
        {...S}
        strokeWidth={2.4}
        className="g-flow"
        d="M10 80 C 60 80, 110 60, 130 18"
      />
      <circle cx={130} cy={18} r={4} fill="currentColor" />
    </>
  ),
  induction: () => (
    <>
      <rect
        x={20}
        y={38}
        width={22}
        height={20}
        rx={2}
        fill="#ff6b7d"
        opacity={0.85}
        className="g-slide"
      />
      <rect
        x={42}
        y={38}
        width={22}
        height={20}
        rx={2}
        fill="#5aa9ff"
        opacity={0.85}
        className="g-slide"
      />
      {[94, 106, 118, 130].map((x) => (
        <ellipse key={x} {...W} cx={x} cy={48} rx={5} ry={20} opacity={0.75} />
      ))}
      <path
        {...S}
        className="g-flow"
        d="M94 72 C 94 86, 130 86, 130 72"
        markerEnd="url(#g-arrow)"
      />
    </>
  ),
  string: () => (
    <>
      <path {...W} d="M14 48 H146" opacity={0.25} />
      <path
        {...S}
        strokeWidth={2.2}
        className="g-wobble"
        d="M14 48 Q 36 20, 58 48 T 102 48 T 146 48"
      />
      <path {...S} opacity={0.35} d="M14 48 Q 36 76, 58 48 T 102 48 T 146 48" />
      <path {...W} d="M14 40 V56 M146 40 V56" strokeWidth={3} />
    </>
  ),
  spectrum: () => (
    <>
      <defs>
        <linearGradient id="g-rainbow" x1="0" x2="1">
          {[
            "#8b5cf6",
            "#3b82f6",
            "#22d3ee",
            "#4ade80",
            "#facc15",
            "#fb923c",
            "#ef4444",
          ].map((c, i) => (
            <stop key={c} offset={`${(i / 6) * 100}%`} stopColor={c} />
          ))}
        </linearGradient>
      </defs>
      <path
        fill="none"
        stroke="url(#g-rainbow)"
        strokeWidth={2.4}
        strokeLinecap="round"
        className="g-flow-solid"
        d="M10 48 q 4 -26 8 0 t 8 0 t 9 0 t 10 0 t 11 0 t 13 0 t 15 0 t 18 0 t 22 0 t 26 0"
      />
    </>
  ),
  wave: () => (
    <>
      <circle {...W} cx={36} cy={48} r={14} opacity={0.6} />
      <path {...W} d="M28 40 L44 56" />
      <path
        {...S}
        strokeWidth={2.4}
        className="g-flow"
        d="M50 48 H150"
        strokeDasharray="10 8"
      />
      <path {...W} opacity={0.5} d="M150 30 V66" />
    </>
  ),
  lens: () => (
    <>
      <path
        d="M80 12 C 92 32, 92 64, 80 84 C 68 64, 68 32, 80 12 Z"
        fill="#9fd8f2"
        fillOpacity={0.22}
        stroke="#bfe8ff"
        strokeOpacity={0.8}
      />
      {[30, 48, 66].map((y) => (
        <path
          key={y}
          {...S}
          className="g-flow"
          d={`M10 ${y} H80 L146 ${96 - y - 1}`}
          opacity={0.9}
        />
      ))}
    </>
  ),
  "lens-concave": () => (
    <>
      <path
        d="M70 12 H90 C 82 32, 82 64, 90 84 H70 C 78 64, 78 32, 70 12 Z"
        fill="#9fd8f2"
        fillOpacity={0.22}
        stroke="#bfe8ff"
        strokeOpacity={0.8}
      />
      {[34, 48, 62].map((y) => (
        <path
          key={y}
          {...S}
          className="g-flow"
          d={`M10 ${y} H80 L146 ${48 + (y - 48) * 2.4}`}
        />
      ))}
    </>
  ),
  mirror: () => (
    <>
      <path {...W} strokeWidth={3} d="M118 10 C 104 32, 104 64, 118 86" />
      {[30, 48, 66].map((y) => (
        <path
          key={y}
          {...S}
          className="g-flow"
          d={`M10 ${y} H${108 + Math.abs(y - 48) * 0.3} L60 48`}
        />
      ))}
    </>
  ),
  "mirror-convex": () => (
    <>
      <path {...W} strokeWidth={3} d="M104 10 C 118 32, 118 64, 104 86" />
      {[34, 48, 62].map((y) => (
        <path
          key={y}
          {...S}
          className="g-flow"
          d={`M10 ${y} H${112 - Math.abs(y - 48) * 0.25} L40 ${48 + (y - 48) * 3}`}
        />
      ))}
    </>
  ),
  prism: () => (
    <>
      <path
        d="M80 14 L112 76 H48 Z"
        fill="#9fd8f2"
        fillOpacity={0.18}
        stroke="#bfe8ff"
        strokeOpacity={0.8}
      />
      <path {...W} strokeWidth={2} d="M8 58 L66 46" />
      {["#ef4444", "#facc15", "#4ade80", "#3b82f6", "#8b5cf6"].map((c, i) => (
        <path
          key={c}
          fill="none"
          stroke={c}
          strokeWidth={1.8}
          strokeLinecap="round"
          className="g-flow"
          d={`M94 48 L152 ${52 + i * 8}`}
        />
      ))}
    </>
  ),
  slab: () => (
    <>
      <rect
        x={52}
        y={14}
        width={56}
        height={68}
        rx={3}
        fill="#9fd8f2"
        fillOpacity={0.18}
        stroke="#bfe8ff"
        strokeOpacity={0.8}
      />
      <path
        {...S}
        strokeWidth={2}
        className="g-flow"
        d="M14 18 L52 34 L108 54 L148 70"
      />
      <path {...W} opacity={0.35} strokeDasharray="3 4" d="M52 34 L148 74" />
    </>
  ),
  refract: () => (
    <>
      <rect
        x={0}
        y={48}
        width={160}
        height={48}
        fill="#9fd8f2"
        fillOpacity={0.14}
      />
      <line {...W} x1={0} y1={48} x2={160} y2={48} opacity={0.6} />
      <line
        {...W}
        x1={80}
        y1={6}
        x2={80}
        y2={90}
        opacity={0.3}
        strokeDasharray="3 4"
      />
      <path
        {...S}
        strokeWidth={2}
        className="g-flow"
        d="M30 10 L80 48 L104 92"
      />
      <path {...S} opacity={0.45} d="M80 48 L130 10" />
    </>
  ),
  fibre: () => (
    <>
      <path
        d="M8 30 H152 V66 H8 Z"
        fill="#9fd8f2"
        fillOpacity={0.14}
        stroke="#bfe8ff"
        strokeOpacity={0.6}
      />
      <path
        {...S}
        strokeWidth={2}
        className="g-flow"
        d="M8 60 L32 30 L58 66 L84 30 L110 66 L136 30 L152 50"
      />
    </>
  ),
  liquid: () => (
    <>
      <path {...W} strokeWidth={2.6} d="M30 74 H130" />
      <path
        d="M50 74 C 60 60, 100 60, 110 74 Z"
        fill="#7dd3fc"
        fillOpacity={0.4}
        stroke="#bfe8ff"
        strokeOpacity={0.7}
      />
      <path {...S} className="g-flow" d="M80 12 V66" />
      <path {...S} opacity={0.6} d="M64 14 L80 66 M96 14 L80 66" />
    </>
  ),
  fringes: () => (
    <>
      <path {...W} strokeWidth={2.6} d="M40 10 V40 M40 46 V50 M40 56 V86" />
      {[14, 26, 38].map((r) => (
        <path
          key={r}
          {...S}
          opacity={0.5}
          className="g-flow"
          d={`M40 43 m0 ${-r} a ${r} ${r} 0 0 1 0 ${2 * r} M40 53 m0 ${-r} a ${r} ${r} 0 0 1 0 ${2 * r}`}
        />
      ))}
      {Array.from({ length: 9 }, (_, i) => (
        <rect
          key={i}
          x={132}
          y={8 + i * 9.4}
          width={12}
          height={5}
          rx={1}
          fill="currentColor"
          opacity={1 - Math.abs(i - 4) * 0.2}
        />
      ))}
    </>
  ),
  diffraction: () => (
    <>
      <path {...W} strokeWidth={2.6} d="M40 10 V42 M40 54 V86" />
      {[10, 20, 30, 40].map((r) => (
        <path
          key={r}
          {...S}
          opacity={0.6}
          className="g-flow"
          d={`M40 48 m0 ${-r} a ${r} ${r} 0 0 1 0 ${2 * r}`}
        />
      ))}
      <path
        fill="currentColor"
        opacity={0.75}
        d="M132 48 C 132 20, 146 20, 146 48 C 146 76, 132 76, 132 48 Z"
      />
      <path
        fill="currentColor"
        opacity={0.3}
        d="M134 18 C 134 10, 144 10, 144 18 Z M134 78 C 134 86, 144 86, 144 78 Z"
      />
    </>
  ),
  polariser: () => (
    <>
      <circle {...W} cx={60} cy={48} r={26} opacity={0.6} />
      {[-12, -4, 4, 12].map((d) => (
        <line
          key={d}
          {...W}
          opacity={0.5}
          x1={60 + d}
          y1={26}
          x2={60 + d}
          y2={70}
        />
      ))}
      <circle {...W} cx={108} cy={48} r={26} opacity={0.6} />
      <g className="g-rotate" style={{ transformOrigin: "108px 48px" }}>
        {[-12, -4, 4, 12].map((d) => (
          <line key={d} {...S} x1={108 + d} y1={26} x2={108 + d} y2={70} />
        ))}
      </g>
    </>
  ),
  telescope: () => (
    <>
      <path {...W} d="M24 56 L120 34 L124 50 L28 72 Z" opacity={0.8} />
      <path {...W} d="M120 36 L140 31 L142 41 L122 46" />
      <path {...S} className="g-flow" d="M2 40 L24 56 M2 72 L28 72" />
      <path {...W} opacity={0.5} d="M72 64 L60 90 M72 64 L86 90" />
    </>
  ),
  eye: () => (
    <>
      <path
        {...W}
        d="M40 48 C 60 18, 110 18, 130 48 C 110 78, 60 78, 40 48 Z"
        opacity={0.8}
      />
      <circle cx={85} cy={48} r={14} fill="currentColor" opacity={0.35} />
      <circle cx={85} cy={48} r={6} fill="currentColor" />
      <path {...S} className="g-flow" d="M2 36 L62 44 M2 60 L62 52" />
    </>
  ),
  photon: () => (
    <>
      <rect
        x={104}
        y={14}
        width={10}
        height={68}
        rx={2}
        fill="#cfdcea"
        opacity={0.7}
      />
      <path
        fill="none"
        stroke="#8b5cf6"
        strokeWidth={2}
        strokeLinecap="round"
        className="g-flow-solid"
        d="M8 30 q 6 -8 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0"
      />
      {[36, 52, 66].map((y, i) => (
        <circle
          key={y}
          cx={96 - i * 18}
          cy={y + 6}
          r={3.4}
          fill="#5aa9ff"
          className="g-pop"
        />
      ))}
    </>
  ),
  atom: () => (
    <>
      {[14, 26, 38].map((r) => (
        <circle key={r} {...W} cx={80} cy={48} r={r} opacity={0.45} />
      ))}
      <circle cx={80} cy={48} r={5} fill="#ff8a5c" />
      <g className="g-rotate" style={{ transformOrigin: "80px 48px" }}>
        <circle cx={118} cy={48} r={3.6} fill="currentColor" />
      </g>
      <path
        {...S}
        className="g-flow"
        d="M100 26 L124 10"
        markerEnd="url(#g-arrow)"
      />
    </>
  ),
  diode: () => (
    <>
      <path {...W} opacity={0.6} d="M10 48 H62 M98 48 H150" />
      <path d="M62 30 L94 48 L62 66 Z" fill="currentColor" opacity={0.7} />
      <path {...W} strokeWidth={3} d="M96 30 V66" />
      <path
        {...S}
        className="g-flow"
        strokeDasharray="2 8"
        strokeWidth={3}
        d="M10 48 H150"
      />
    </>
  ),
};

export function glyphKind(slug: string): GlyphKind {
  return BY_SLUG[slug] ?? "wave";
}

export function ExperimentGlyph({
  slug,
  accent,
}: {
  slug: string;
  accent: string;
}) {
  const draw = ART[glyphKind(slug)];
  return (
    <svg
      className="glyph"
      viewBox="0 0 160 96"
      style={{ color: accent }}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <marker
          id="g-arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto"
        >
          <path d="M0 0 L10 5 L0 10 z" fill="currentColor" />
        </marker>
      </defs>
      {draw()}
    </svg>
  );
}
