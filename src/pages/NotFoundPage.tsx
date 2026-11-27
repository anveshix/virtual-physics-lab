import { useEffect } from "react";
import { Link } from "react-router-dom";
import { documentTitle } from "@/app/branding/brand";
import { Icons } from "@/components/common/Icons";
import { ExperimentGlyph } from "@/lab/fx/glyphs";

export default function NotFoundPage() {
  useEffect(() => {
    document.title = documentTitle("Page not found");
  }, []);
  return (
    <div className="page">
      <div className="lost glass">
        <span className="lost-art" aria-hidden="true">
          <ExperimentGlyph slug="total-internal-reflection" accent="#3ee6ff" />
        </span>
        <p className="lost-code">404</p>
        <h1>No apparatus on this bench</h1>
        <p className="lede">This page does not exist.</p>
        <div className="lost-actions">
          <Link to="/simulators" className="btn btn-primary">
            All experiments <Icons.ChevronRight width={14} height={14} />
          </Link>
          <Link to="/" className="btn">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
