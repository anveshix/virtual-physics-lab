import { useEffect } from "react";
import { CatalogueShell } from "@/components/common/Catalogue";
import { EXPERIMENTS } from "@/experiments/registry";
import { documentTitle } from "@/app/branding/brand";

export default function SectionPage({ section }: { section: "a" | "b" }) {
  const unit = section === "a" ? "practical-a" : "practical-b";
  const items = EXPERIMENTS.filter((e) => e.meta.unit === unit).map(
    (e) => e.meta,
  );
  const title =
    section === "a"
      ? "Section A — Electricity and Magnetism"
      : "Section B — Optics";

  useEffect(() => {
    document.title = documentTitle(title);
  }, [title]);

  return (
    <CatalogueShell
      title={title}
      lede={
        section === "a"
          ? "CBSE practical list · electricity and magnetism"
          : "CBSE practical list · optics and the diode"
      }
      unit={unit}
      items={items}
    />
  );
}
