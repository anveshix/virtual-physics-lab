import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { THEORY_MARKS, THEORY_UNITS, UNITS } from "@/data/units";
import { byUnit } from "@/experiments/registry";
import { CatalogueRail, UnitTile } from "@/components/common/Catalogue";
import { useReveal } from "@/lab/fx/motion";
import { documentTitle } from "@/app/branding/brand";
import { Icons } from "@/components/common/Icons";

export default function Class12Page() {
  useEffect(() => {
    document.title = documentTitle("Class XII");
  }, []);
  const page = useRef<HTMLDivElement>(null);
  useReveal(page);
  const total = UNITS.reduce((a, u) => a + byUnit(u.slug).length, 0);
  return (
    <div className="lab-shell">
      <CatalogueRail activeUnit="all" />
      <div className="page" ref={page}>
        <header className="page-head catalogue-head">
          <div className="page-head-text">
            <h1>Class XII physics</h1>
            <p className="lede">
              {THEORY_UNITS.length} units · {THEORY_MARKS} theory marks · 30
              practical marks · {total} experiments
            </p>
          </div>
          <Link to="/simulators" className="btn btn-primary">
            All experiments <Icons.ChevronRight width={14} height={14} />
          </Link>
        </header>

        <div className="unit-grid">
          {UNITS.filter((u) => byUnit(u.slug).length > 0).map((u) => (
            <UnitTile key={u.slug} unit={u} showMarks />
          ))}
        </div>
        <p className="footnote">
          * Units marked with an asterisk share their marks with a neighbouring
          unit in the board paper.
        </p>
      </div>
    </div>
  );
}
