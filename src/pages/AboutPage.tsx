import { useEffect, useRef, type ReactNode } from "react";
import { BRAND, documentTitle } from "@/app/branding/brand";
import { EXPERIMENT_COUNT, EXPERIMENTS } from "@/experiments/registry";
import { UNITS } from "@/data/units";
import { UnitTile } from "@/components/common/Catalogue";
import { Icons } from "@/components/common/Icons";
import { useReveal } from "@/lab/fx/motion";

const PRINCIPLES: [ReactNode, string, string][] = [
  [
    <Icons.Atom key="i" />,
    "Real equations",
    "Every reading, ray and graph is computed in SI units — nothing is a canned animation.",
  ],
  [
    <Icons.Flask key="i" />,
    "Real instruments",
    "Meters deflect by the current that actually flows; a bridge balances only where it should.",
  ],
  [
    <Icons.Warning key="i" />,
    "Honest limits",
    "If a setup cannot work — a weak cell, an overloaded diode — the lab tells you instead of faking a number.",
  ],
  [
    <Icons.Notebook key="i" />,
    "Your notebook",
    "Record trials, plot them and export a CSV for your practical file. Saved in this browser only.",
  ],
];

export default function AboutPage() {
  useEffect(() => {
    document.title = documentTitle("About");
  }, []);
  const page = useRef<HTMLDivElement>(null);
  useReveal(page);
  const practicals = EXPERIMENTS.filter(
    (e) => e.meta.kind === "practical",
  ).length;

  return (
    <div className="page page-narrow" ref={page}>
      <header className="about-hero glass" data-reveal>
        <h1>{BRAND.name}</h1>
        <p className="lede">
          An interactive laboratory for {BRAND.curriculum}.
        </p>
        <dl className="about-stats">
          <div>
            <dt>Experiments</dt>
            <dd>{EXPERIMENT_COUNT}</dd>
          </div>
          <div>
            <dt>CBSE practicals</dt>
            <dd>{practicals}</dd>
          </div>
          <div>
            <dt>Units</dt>
            <dd>{UNITS.filter((u) => u.marks).length}</dd>
          </div>
        </dl>
      </header>

      <section className="section section-tight" aria-labelledby="about-how">
        <div className="section-head" data-reveal>
          <h2 id="about-how">How the lab works</h2>
        </div>
        <ul className="how-steps">
          {PRINCIPLES.map(([icon, title, body]) => (
            <li key={title} className="how-step glass-lite" data-reveal>
              <span className="how-step-icon" aria-hidden="true">
                {icon}
              </span>
              <b>{title}</b>
              <span>{body}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="section section-tight" aria-labelledby="about-units">
        <div className="section-head" data-reveal>
          <h2 id="about-units">Browse by unit</h2>
        </div>
        <div className="unit-grid">
          {UNITS.filter((u) =>
            EXPERIMENTS.some((e) => e.meta.unit === u.slug),
          ).map((u) => (
            <UnitTile key={u.slug} unit={u} />
          ))}
        </div>
      </section>

      <p className="footnote">
        Keyboard operable, screen-reader labelled and reduced-motion aware. All
        code, artwork and text are original.
      </p>
    </div>
  );
}
