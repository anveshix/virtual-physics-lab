import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { BRAND, documentTitle } from "@/app/branding/brand";
import { UNITS } from "@/data/units";
import { EXPERIMENTS, byUnit } from "@/experiments/registry";
import { ExperimentCard, UnitTile } from "@/components/common/Catalogue";
import { Icons } from "@/components/common/Icons";
import { usePreferences } from "@/app/providers/PreferencesProvider";
import { useT } from "@/i18n";
import { FieldHero } from "@/lab/fx/FieldHero";
import {
  motionAllowed,
  useCountUp,
  useHeadline,
  useReveal,
} from "@/lab/fx/motion";

const FEATURED = [
  "coulombs-law",
  "cyclotron",
  "prism-dispersion",
  "photoelectric-effect",
  "wave-optics",
  "ohms-law",
  "total-internal-reflection",
  "sonometer",
];

function Stat({ value, label }: { value: number; label: string }) {
  const ref = useRef<HTMLElement>(null);
  useCountUp(ref, value);
  return (
    <div className="hero-stat">
      <b ref={ref}>{value}</b>
      <span>{label}</span>
    </div>
  );
}

export default function HomePage() {
  const t = useT();
  const page = useRef<HTMLDivElement>(null);
  const h1 = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    document.title = documentTitle();
  }, []);
  useHeadline(h1);
  useReveal(page);

  const practicalCount = EXPERIMENTS.filter(
    (e) => e.meta.kind === "practical",
  ).length;
  const featured = FEATURED.map((slug) =>
    EXPERIMENTS.find((e) => e.meta.slug === slug),
  ).filter((e): e is (typeof EXPERIMENTS)[number] => e !== undefined);
  const words = t("home.title").split(" ");
  const units = UNITS.filter((u) => byUnit(u.slug).length > 0);

  return (
    <div ref={page}>
      <section className="hero">
        <div className="shell-width hero-inner">
          <div className="hero-copy">
            <span className="hero-chip">
              <span className="live-dot" aria-hidden="true" />{" "}
              {BRAND.curriculum} · {BRAND.year}
            </span>
            <h1 ref={h1}>
              {words.map((w, i) => (
                <span
                  key={i}
                  className={`hw${i === words.length - 1 ? " hw-em" : ""}`}
                >
                  {w}
                  {i < words.length - 1 ? " " : ""}
                </span>
              ))}
            </h1>
            <p className="hero-lede">
              <b>{EXPERIMENTS.length}</b> {t("home.tagline")}
            </p>
            <div className="hero-cta">
              <Link to="/simulators" className="btn btn-primary btn-lg">
                {t("home.start")} <Icons.ChevronRight width={16} height={16} />
              </Link>
              <Link to="/practicals" className="btn btn-glass btn-lg">
                <Icons.Flask width={15} height={15} /> {t("home.practicals")}
              </Link>
            </div>
            <div className="hero-stats">
              <Stat value={EXPERIMENTS.length} label={t("home.experiments")} />
              <Stat value={practicalCount} label={t("home.practicals")} />
              <Stat value={units.length} label={t("home.units")} />
            </div>
          </div>
          <div className="hero-visual glass" data-reveal>
            <FieldHero
              fallback={<HeroApparatus />}
              legend={
                <div className="hero-visual-bar">
                  <span className="field-hint">{t("home.fieldHint")}</span>
                  <ul className="field-legend">
                    <li>
                      <i className="lg-field" aria-hidden="true" />
                      {t("home.lgField")}
                    </li>
                    <li>
                      <i className="lg-equi" aria-hidden="true" />
                      {t("home.lgEqui")}
                    </li>
                  </ul>
                </div>
              }
            />
          </div>
        </div>
      </section>

      <ContinueWhereYouLeftOff />

      <section className="section">
        <div className="shell-width">
          <div className="section-head" data-reveal>
            <h2>{t("home.popular")}</h2>
            <Link to="/simulators" className="link-arrow">
              {t("home.viewAll")} {EXPERIMENTS.length}{" "}
              <Icons.ChevronRight width={14} height={14} />
            </Link>
          </div>
          <div className="catalogue-grid">
            {featured.map((e) => (
              <ExperimentCard key={e.meta.id} meta={e.meta} />
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell-width">
          <div className="section-head" data-reveal>
            <h2>{t("home.explore")}</h2>
          </div>
          <div className="unit-grid">
            {units.map((u) => (
              <UnitTile key={u.slug} unit={u} />
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell-width">
          <div className="section-head" data-reveal>
            <h2>{t("home.how")}</h2>
          </div>
          <ol className="how-steps">
            {(
              [
                [<Icons.Sliders key="i" />, "home.step1", "home.step1b"],
                [<Icons.Atom key="i" />, "home.step2", "home.step2b"],
                [<Icons.Target key="i" />, "home.step3", "home.step3b"],
                [<Icons.Notebook key="i" />, "home.step4", "home.step4b"],
              ] as const
            ).map(([icon, title, body], i) => (
              <li key={title} className="how-step glass-lite" data-reveal>
                <span className="how-step-icon">{icon}</span>
                <span className="how-step-no">0{i + 1}</span>
                <b>{t(title)}</b>
                <span>{t(body)}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}

function ContinueWhereYouLeftOff() {
  const prefs = usePreferences();
  const t = useT();
  const recent = prefs.recent
    .map((slug) => EXPERIMENTS.find((e) => e.meta.slug === slug))
    .filter((e): e is (typeof EXPERIMENTS)[number] => e !== undefined)
    .slice(0, 4);
  if (recent.length === 0) return null;
  return (
    <section className="section section-tight">
      <div className="shell-width">
        <div className="recent glass-lite">
          <span className="recent-title">
            <Icons.Clock width={14} height={14} /> {t("home.recent")}
          </span>
          <div className="wrap-row">
            {recent.map((e) => (
              <Link
                key={e.meta.id}
                to={`/simulators/physics/${e.meta.slug}`}
                className="fchip"
              >
                {e.meta.shortTitle}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Ambient hero animation: an RC charging transient with a live trace. It is a
 * genuine model evaluation, drawn once per frame, so the landing page shows the
 * same engine that drives the experiments.
 */
/** Corner screws on the chassis, in viewBox units. */
const SCREWS: [number, number][] = [
  [40, 44],
  [520, 44],
  [40, 254],
  [520, 254],
];

function HeroApparatus() {
  const pathRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);
  const readoutRef = useRef<SVGTextElement>(null);
  const gridRef = useRef<SVGLineElement>(null);

  useEffect(() => {
    let raf = 0;
    let start = performance.now();
    /** Plot area inside the instrument screen, in viewBox units. */
    const LEFT = 70;
    const RIGHT = 498;
    const TOP = 74;
    const BASE = 232;
    const tau = 1.2;
    const points: string[] = [];
    const frame = (now: number): void => {
      const time = (now - start) / 1000;
      if (time > 5 * tau) {
        start = now;
        points.length = 0;
      }
      const tt = Math.min(time, 5 * tau);
      const v = 1 - Math.exp(-tt / tau);
      const x = LEFT + (tt / (5 * tau)) * (RIGHT - LEFT);
      const y = BASE - v * (BASE - TOP);
      points.push(
        `${points.length === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`,
      );
      if (pathRef.current) pathRef.current.setAttribute("d", points.join(" "));
      if (gridRef.current) gridRef.current.setAttribute("x1", x.toFixed(1));
      if (gridRef.current) gridRef.current.setAttribute("x2", x.toFixed(1));
      if (dotRef.current) {
        dotRef.current.setAttribute("cx", x.toFixed(1));
        dotRef.current.setAttribute("cy", y.toFixed(1));
      }
      if (readoutRef.current)
        readoutRef.current.textContent = `${(v * 12).toFixed(2)} V`;
      if (motionAllowed()) raf = requestAnimationFrame(frame);
    };
    // With motion off the recorder shows the finished trace, drawn once.
    if (!motionAllowed()) {
      for (let k = 0; k <= 60; k++) frame(start + (k / 60) * 5 * tau * 1000);
      return;
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <svg
      viewBox="0 0 560 300"
      role="img"
      aria-label="A bench chart recorder tracing a capacitor charging through a resistor towards 12 volts"
    >
      <defs>
        <linearGradient id="hero-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1d2c3c" />
          <stop offset="62%" stopColor="#131e2a" />
          <stop offset="100%" stopColor="#0b131c" />
        </linearGradient>
        <linearGradient id="hero-bench" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5a3d26" />
          <stop offset="30%" stopColor="#3a2718" />
          <stop offset="100%" stopColor="#1a1109" />
        </linearGradient>
        <linearGradient id="hero-case" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#33455a" />
          <stop offset="8%" stopColor="#22303f" />
          <stop offset="100%" stopColor="#121a24" />
        </linearGradient>
        <linearGradient id="hero-brass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe6a8" />
          <stop offset="45%" stopColor="#d3a24a" />
          <stop offset="100%" stopColor="#8a6522" />
        </linearGradient>
        <radialGradient id="hero-screen" cx="50%" cy="20%" r="90%">
          <stop offset="0%" stopColor="#0c2a20" />
          <stop offset="60%" stopColor="#05130e" />
          <stop offset="100%" stopColor="#020a07" />
        </radialGradient>
        <radialGradient id="hero-lamp" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="35%" stopColor="#5df2b0" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#5df2b0" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hero-pool" cx="50%" cy="0%" r="70%">
          <stop offset="0%" stopColor="#a3cdf0" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#a3cdf0" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* The room. */}
      <rect width="560" height="300" fill="url(#hero-wall)" />
      <rect width="560" height="300" fill="url(#hero-pool)" />
      <rect y="256" width="560" height="44" fill="url(#hero-bench)" />
      <rect y="256" width="560" height="2" fill="#a3763f" opacity="0.5" />

      {/* Instrument chassis. */}
      <rect
        x="26"
        y="30"
        width="508"
        height="238"
        rx="16"
        fill="#000000"
        opacity="0.5"
        transform="translate(4 9)"
      />
      <rect
        x="26"
        y="30"
        width="508"
        height="238"
        rx="16"
        fill="url(#hero-case)"
        stroke="#405974"
        strokeWidth="1.2"
      />
      <rect
        x="28"
        y="32"
        width="504"
        height="6"
        rx="3"
        fill="#ffffff"
        opacity="0.1"
      />
      {SCREWS.map(([sx, sy], i) => (
        <g key={i}>
          <circle
            cx={sx}
            cy={sy}
            r={4.4}
            fill="#93a7ba"
            stroke="#26303c"
            strokeWidth="0.8"
          />
          <line
            x1={sx - 2.6}
            y1={sy}
            x2={sx + 2.6}
            y2={sy}
            stroke="#222c37"
            strokeWidth="1.2"
          />
        </g>
      ))}

      {/* Power indicator and nameplate. */}
      <circle cx="60" cy="62" r="10" fill="url(#hero-lamp)" opacity="0.55" />
      <circle
        cx="60"
        cy="62"
        r="4.4"
        fill="#5df2b0"
        stroke="#1d3b31"
        strokeWidth="0.9"
      />
      <text x="76" y="58" fontSize="9" fill="#8fa3b8" letterSpacing="0.16em">
        VIRTUAL PHYSICS LAB
      </text>
      <rect
        x="76"
        y="63"
        width="132"
        height="12"
        rx="2"
        fill="url(#hero-brass)"
        stroke="#6d4c17"
        strokeWidth="0.7"
      />
      <text
        x="142"
        y="72"
        fontSize="7.4"
        fontWeight="700"
        letterSpacing="0.1em"
        fill="#2c1d05"
        textAnchor="middle"
      >
        CHART RECORDER · CH 1
      </text>

      {/* Screen bezel and LCD. */}
      <rect
        x="56"
        y="86"
        width="448"
        height="158"
        rx="9"
        fill="#0a1219"
        stroke="#33475d"
        strokeWidth="1.4"
      />
      <rect
        x="62"
        y="92"
        width="436"
        height="146"
        rx="6"
        fill="url(#hero-screen)"
      />
      <g stroke="#1d4a3a" strokeWidth="0.8" opacity="0.7">
        {Array.from({ length: 11 }, (_, i) => (
          <line
            key={`v${i}`}
            x1={70 + i * 42.8}
            y1={74}
            x2={70 + i * 42.8}
            y2={232}
          />
        ))}
        {Array.from({ length: 5 }, (_, i) => (
          <line
            key={`h${i}`}
            x1={70}
            y1={74 + i * 39.5}
            x2={498}
            y2={74 + i * 39.5}
          />
        ))}
      </g>
      {/* Scanlines. */}
      <g opacity="0.14">
        {Array.from({ length: 48 }, (_, i) => (
          <line
            key={`s${i}`}
            x1={62}
            y1={92 + i * 3}
            x2={498}
            y2={92 + i * 3}
            stroke="#ffffff"
            strokeWidth="0.6"
          />
        ))}
      </g>

      <line
        x1={70}
        y1={232}
        x2={498}
        y2={232}
        stroke="#2c5a48"
        strokeWidth="1.2"
      />
      <line
        x1={70}
        y1={74}
        x2={70}
        y2={232}
        stroke="#2c5a48"
        strokeWidth="1.2"
      />
      <line
        x1={70}
        y1={74}
        x2={498}
        y2={74}
        stroke="#ffc65c"
        strokeDasharray="4 3"
        opacity="0.5"
      />
      <text x="494" y="70" fontSize="9" fill="#ffc65c" textAnchor="end">
        12 V
      </text>
      <text x="66" y="70" fontSize="9" fill="#5f7d72" textAnchor="end">
        V
      </text>
      <text x="498" y="246" fontSize="9" fill="#5f7d72" textAnchor="end">
        t (s) — τ = 1.2 s
      </text>

      {/* The live trace. */}
      <line
        ref={gridRef}
        x1="70"
        y1="74"
        x2="70"
        y2="232"
        stroke="#ffc65c"
        strokeWidth="0.7"
        opacity="0.25"
      />
      <path
        ref={pathRef}
        d=""
        fill="none"
        stroke="#5df2b0"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <circle
        ref={dotRef}
        r="4.6"
        fill="#c9ffe9"
        stroke="#5df2b0"
        strokeWidth="2"
      />

      {/* Digital readout window. */}
      <rect
        x="330"
        y="94"
        width="160"
        height="30"
        rx="5"
        fill="#020a07"
        stroke="#1d3b31"
        strokeWidth="1"
      />
      <text x="340" y="113" fontSize="10" fill="#6d8a80" letterSpacing="0.1em">
        V
      </text>
      <text
        ref={readoutRef}
        x="482"
        y="114"
        fontSize="17"
        fill="#ffc46b"
        textAnchor="end"
        fontFamily="ui-monospace, monospace"
        letterSpacing="0.02em"
      >
        0.00 V
      </text>
      <text x="76" y="256" fontSize="9" fill="#5f7d72">
        V(t) = V₀ (1 − e^(−t/RC))
      </text>

      {/* Panel furniture: a knurled knob and two binding posts. */}
      <g transform="translate(486 250)">
        <circle
          r="13"
          fill="#000000"
          opacity="0.45"
          transform="translate(1 3)"
        />
        <circle r="13" fill="#1b242f" stroke="#4a5c70" strokeWidth="1.2" />
        {Array.from({ length: 20 }, (_, i) => {
          const a = (i * 18 * Math.PI) / 180;
          return (
            <line
              key={i}
              x1={Math.cos(a) * 12}
              y1={Math.sin(a) * 12}
              x2={Math.cos(a) * 8.5}
              y2={Math.sin(a) * 8.5}
              stroke="#ffffff"
              strokeWidth="0.9"
              opacity="0.13"
            />
          );
        })}
        <circle r="9.4" fill="#26374a" stroke="#2c3e52" />
        <rect
          x="-1.6"
          y="-8.4"
          width="3.2"
          height="5.6"
          rx="1.6"
          fill="#ffc65c"
          transform="rotate(38)"
        />
      </g>
      {[
        [58, 250, "#a8313c", "+"],
        [86, 250, "#1d2530", "−"],
      ].map(([px, py, cap, sign], i) => (
        <g key={i}>
          <circle
            cx={px as number}
            cy={py as number}
            r="9"
            fill="url(#hero-brass)"
            stroke="#5e4314"
            strokeWidth="0.9"
          />
          <circle
            cx={px as number}
            cy={py as number}
            r="5.6"
            fill={cap as string}
            stroke="#ffffff"
            strokeOpacity="0.25"
          />
          <text
            x={px as number}
            y={(py as number) + 3}
            textAnchor="middle"
            fontSize="8"
            fontWeight="700"
            fill="#ffffff"
            opacity="0.9"
          >
            {sign as string}
          </text>
        </g>
      ))}
    </svg>
  );
}
