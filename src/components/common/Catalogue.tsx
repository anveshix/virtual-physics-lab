import {
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Link, NavLink } from "react-router-dom";
import type { ExperimentMeta } from "@/experiments/registry";
import { EXPERIMENTS, searchExperiments } from "@/experiments/registry";
import { UNITS, unitInfo } from "@/data/units";
import { ExperimentGlyph } from "@/lab/fx/glyphs";
import { useReveal } from "@/lab/fx/motion";
import type { UnitSlug } from "@/types/lab";
import { Icons } from "@/components/common/Icons";
import { Chip, EmptyState } from "@/components/common/UI";
import { usePreferences } from "@/app/providers/PreferencesProvider";
import { useLocalized } from "@/i18n";

const KIND_TONE = {
  practical: "primary",
  activity: "success",
  theory: "ghost",
} as const;

export function ExperimentCard({ meta }: { meta: ExperimentMeta }) {
  const { metaTitle, metaAim, difficulty, kind, unitLabel } = useLocalized();
  const prefs = usePreferences();
  const fav = prefs.isFavourite(meta.slug);
  const unit = unitInfo(meta.unit);
  const accent = unit?.accent ?? "#25d0ee";
  const aimId = `aim-${meta.slug}`;

  return (
    <article
      className="exp-card"
      style={{ "--accent": accent } as CSSProperties}
      data-reveal
    >
      <Link
        to={`/simulators/physics/${meta.slug}`}
        className="exp-card-link"
        aria-describedby={aimId}
      >
        <div className="exp-card-art">
          <ExperimentGlyph slug={meta.slug} accent={accent} />
          {meta.practicalNo ? (
            <span className="exp-card-no">{meta.practicalNo}</span>
          ) : null}
        </div>
        <div className="exp-card-body">
          <h3>{metaTitle(meta)}</h3>
          <p className="exp-card-meta">
            <span className="exp-card-unit">
              {unitLabel(meta.unit, unit?.label ?? meta.chapter)}
            </span>
          </p>
          <div className="exp-card-foot">
            <Chip tone={KIND_TONE[meta.kind]}>{kind(meta.kind)}</Chip>
            <span
              className={`level level-${meta.difficulty}`}
              title={difficulty(meta.difficulty)}
            >
              <i />
              <i />
              <i />
              <span className="level-text">{difficulty(meta.difficulty)}</span>
            </span>
          </div>
        </div>
        <span id={aimId} className="sr-only">
          {metaAim(meta)}
        </span>
      </Link>
      <button
        type="button"
        className={`icon-btn exp-card-fav${fav ? " is-on" : ""}`}
        aria-pressed={fav}
        aria-label={
          fav
            ? `Remove ${meta.shortTitle} from favourites`
            : `Add ${meta.shortTitle} to favourites`
        }
        onClick={() => prefs.toggleFavourite(meta.slug)}
      >
        <Icons.Star
          width={14}
          height={14}
          fill={fav ? "currentColor" : "none"}
        />
      </button>
    </article>
  );
}

/** A representative apparatus for each unit tile. */
export const UNIT_GLYPH: Record<string, string> = {
  electrostatics: "coulombs-law",
  "current-electricity": "ohms-law",
  magnetism: "helmholtz-coil",
  "emi-ac": "lenzs-law",
  "electromagnetic-waves": "em-spectrum-explorer",
  optics: "convex-lens",
  "dual-nature": "photoelectric-effect",
  "atoms-nuclei": "bohr-hydrogen-spectrum",
  "electronic-devices": "pn-junction-rectifier",
  "practical-a": "galvanometer-half-deflection",
  "practical-b": "prism-dispersion",
};

/** A unit of the syllabus as a tile: its apparatus, its name, how much is in it. */
export function UnitTile({
  unit,
  showMarks = false,
}: {
  unit: (typeof UNITS)[number];
  showMarks?: boolean;
}) {
  const { unitLabel } = useLocalized();
  const count = EXPERIMENTS.filter((e) => e.meta.unit === unit.slug).length;
  const marks = unit.marks
    ? `${unit.marks} marks${unit.sharesMarksWith?.length ? "*" : ""}`
    : "30 marks · practical";
  return (
    <Link
      to={unit.href}
      className="unit-card"
      style={{ "--accent": unit.accent } as CSSProperties}
      data-reveal
    >
      <span className="unit-art">
        <ExperimentGlyph
          slug={UNIT_GLYPH[unit.slug] ?? "convex-lens"}
          accent={unit.accent}
        />
      </span>
      <span className="unit-text">
        <em>{unit.ncert}</em>
        <b>{unitLabel(unit.slug, unit.label)}</b>
        {showMarks ? <span className="unit-marks">{marks}</span> : null}
      </span>
      <span className="unit-count" aria-label={`${count} experiments`}>
        {count}
        <Icons.ChevronRight width={14} height={14} />
      </span>
    </Link>
  );
}

/** The unit navigation rail shared by every catalogue page. */
export function CatalogueRail({
  activeUnit,
}: {
  activeUnit?: UnitSlug | "all";
}) {
  const { unitLabel } = useLocalized();
  return (
    <nav className="catalogue-rail" aria-label="Units">
      <NavLink
        to="/simulators"
        className={() => `rail-link${activeUnit === "all" ? " is-active" : ""}`}
        end
      >
        <Icons.Atom width={14} height={14} /> All experiments
        <b>{EXPERIMENTS.length}</b>
      </NavLink>
      {UNITS.filter((u) => EXPERIMENTS.some((e) => e.meta.unit === u.slug)).map(
        (u) => (
          <NavLink
            key={u.slug}
            to={u.href}
            className={({ isActive }) =>
              `rail-link${isActive || activeUnit === u.slug ? " is-active" : ""}`
            }
          >
            {unitLabel(u.slug, u.label)}
            <b>{EXPERIMENTS.filter((e) => e.meta.unit === u.slug).length}</b>
          </NavLink>
        ),
      )}
    </nav>
  );
}

export interface CatalogueShellProps {
  title: string;
  lede?: string;
  unit: UnitSlug | "all";
  items?: ExperimentMeta[];
  initialFavouritesOnly?: boolean;
  children?: ReactNode;
}

/** Search + filter surface over a list of experiments. */
export function CatalogueShell({
  title,
  lede,
  unit,
  items,
  initialFavouritesOnly = false,
  children,
}: CatalogueShellProps) {
  const prefs = usePreferences();
  const [query, setQuery] = useState("");
  const [favouritesOnly, setFavouritesOnly] = useState(initialFavouritesOnly);
  const [kindFilter, setKindFilter] = useState<"all" | "practical" | "theory">(
    "all",
  );

  const source = useMemo(
    () => items ?? EXPERIMENTS.map((e) => e.meta),
    [items],
  );

  const results = useMemo(() => {
    const searched = query
      ? searchExperiments(query)
          .map((e) => e.meta)
          .filter((m) => source.some((s) => s.slug === m.slug))
      : source;
    return searched
      .filter((m) =>
        favouritesOnly ? prefs.favourites.includes(m.slug) : true,
      )
      .filter((m) =>
        kindFilter === "all"
          ? true
          : kindFilter === "practical"
            ? m.kind === "practical"
            : m.kind !== "practical",
      );
  }, [query, source, favouritesOnly, prefs.favourites, kindFilter]);

  const grid = useRef<HTMLDivElement>(null);
  useReveal(grid, [results]);

  return (
    <div className="lab-shell">
      <CatalogueRail activeUnit={unit} />
      <div className="page">
        <header className="page-head catalogue-head">
          <div className="page-head-text">
            <h1>{title}</h1>
            {lede ? <p className="lede">{lede}</p> : null}
          </div>
          <span className="count-pill" aria-live="polite">
            <b>{results.length}</b>{" "}
            {results.length === 1 ? "experiment" : "experiments"}
          </span>
        </header>

        <div className="catalogue-tools glass">
          <label className="search-field">
            <Icons.Search width={15} height={15} />
            <input
              type="search"
              value={query}
              placeholder="Search — lens, cyclotron, B6…"
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search experiments"
            />
          </label>
          <div className="filter-chips" role="group" aria-label="Filters">
            {(["all", "practical", "theory"] as const).map((k) => (
              <button
                key={k}
                type="button"
                className={`fchip${kindFilter === k ? " is-on" : ""}`}
                aria-pressed={kindFilter === k}
                onClick={() => setKindFilter(k)}
              >
                {k === "all"
                  ? "All"
                  : k === "practical"
                    ? "Practicals"
                    : "Theory"}
              </button>
            ))}
            <button
              type="button"
              className={`fchip${favouritesOnly ? " is-on" : ""}`}
              aria-pressed={favouritesOnly}
              onClick={() => setFavouritesOnly((v) => !v)}
            >
              <Icons.Star width={13} height={13} /> Favourites
            </button>
          </div>
        </div>

        {children}

        {results.length === 0 ? (
          <EmptyState title="Nothing matches">
            Try another word, or clear the filters.
          </EmptyState>
        ) : (
          <div className="catalogue-grid" ref={grid}>
            {results.map((m) => (
              <ExperimentCard key={m.id} meta={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
