import { useEffect, useRef } from "react";
import { useReveal } from "@/lab/fx/motion";
import { Link } from "react-router-dom";
import { EXPERIMENTS } from "@/experiments/registry";
import { CatalogueRail, ExperimentCard } from "@/components/common/Catalogue";
import { documentTitle } from "@/app/branding/brand";
import { Icons } from "@/components/common/Icons";

export default function PracticalsPage() {
  useEffect(() => {
    document.title = documentTitle("Practicals");
  }, []);
  const practicals = EXPERIMENTS.filter((e) => e.meta.kind === "practical");
  const sectionA = practicals.filter((e) => e.meta.unit === "practical-a");
  const sectionB = practicals.filter((e) => e.meta.unit === "practical-b");

  const page = useRef<HTMLDivElement>(null);
  useReveal(page);

  return (
    <div className="lab-shell">
      <CatalogueRail />
      <div className="page" ref={page}>
        <header className="page-head catalogue-head">
          <div className="page-head-text">
            <h1>CBSE practicals</h1>
            <p className="lede">
              Set up · take readings · plot · compare with theory
            </p>
          </div>
          <span className="count-pill">{practicals.length} practicals</span>
        </header>

        {[
          {
            title: "Section A",
            sub: "Electricity and magnetism",
            list: sectionA,
            href: "/practicals/section-a",
          },
          {
            title: "Section B",
            sub: "Optics",
            list: sectionB,
            href: "/practicals/section-b",
          },
        ].map((section) => (
          <section key={section.title} className="section section-tight">
            <div className="section-head" data-reveal>
              <h2>
                {section.title}{" "}
                <span className="section-sub">{section.sub}</span>
              </h2>
              <Link to={section.href} className="link-arrow">
                {section.list.length}{" "}
                <Icons.ChevronRight width={14} height={14} />
              </Link>
            </div>
            <div className="catalogue-grid">
              {section.list.map((e) => (
                <ExperimentCard key={e.meta.id} meta={e.meta} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
