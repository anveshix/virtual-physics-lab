import { Suspense, type ReactNode } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { AuroraBackdrop } from "@/lab/fx/AuroraBackdrop";
import { BRAND } from "@/app/branding/brand";
import { Icons } from "@/components/common/Icons";
import { usePreferences } from "@/app/providers/PreferencesProvider";
import { useT } from "@/i18n";
import { useAudioUnlock } from "@/lab/audio";

/** Shown while a code-split route or experiment module is loading. */
export function RouteFallback() {
  return (
    <div className="route-fallback" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>Loading apparatus…</span>
    </div>
  );
}

const NAV = [
  { to: "/", label: "nav.home", end: true },
  { to: "/class-12", label: "nav.class12", end: false },
  { to: "/simulators", label: "nav.simulators", end: false },
  { to: "/practicals", label: "nav.practicals", end: false },
  { to: "/about", label: "nav.about", end: false },
] as const;

/** The animated brand mark: a nucleus with two tilted orbits. */
function BrandMark() {
  return (
    <svg className="vpl-mark" viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id="bm-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5ef0ff" />
          <stop offset="100%" stopColor="#9d8cff" />
        </linearGradient>
      </defs>
      {[0, 60, -60].map((tilt, i) => (
        <g key={tilt} transform={`rotate(${tilt} 16 16)`}>
          <ellipse
            className={`bm-orbit bm-orbit-${i + 1}`}
            cx="16"
            cy="16"
            rx="13"
            ry="5.2"
            fill="none"
            stroke="url(#bm-g)"
            strokeWidth="1.6"
          />
        </g>
      ))}
      <circle cx="16" cy="16" r="2.8" fill="#ffd257" />
    </svg>
  );
}

export function AppLayout({ children }: { children?: ReactNode }) {
  const prefs = usePreferences();
  const t = useT();
  const { pathname } = useLocation();
  // Browsers refuse to start an AudioContext outside a gesture, so the shell
  // arms it once rather than every control that might make a noise.
  useAudioUnlock(prefs.sound, prefs.volume);
  // On an experiment the GPU and the student's attention belong to the
  // apparatus: no animated backdrop at all, just a calm, flat dark bench.
  const onExperiment = /\/simulators\/physics\/[^/]+/.test(pathname);

  return (
    <div className={`app${onExperiment ? " is-experiment" : ""}`}>
      {/* High contrast means nothing glowing behind the text, either. */}
      {onExperiment || prefs.contrast ? null : <AuroraBackdrop />}
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="app-header">
        <div className="shell-width header-inner glass">
          <Link to="/" className="brand" aria-label={`${BRAND.name} — home`}>
            <BrandMark />
            <span className="brand-text">
              <b>{BRAND.name}</b>
              <i>Class XII · {BRAND.year}</i>
            </span>
          </Link>
          <nav className="app-nav" aria-label="Main">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `nav-link${isActive ? " is-active" : ""}`
                }
              >
                {t(n.label as Parameters<typeof t>[0])}
              </NavLink>
            ))}
          </nav>
          <div className="header-actions">
            <button
              type="button"
              className="hbtn"
              onClick={() => prefs.setLang(prefs.lang === "en" ? "hi" : "en")}
              aria-label={
                prefs.lang === "en" ? "Switch to Hindi" : "अंग्रेज़ी में देखें"
              }
              title={prefs.lang === "en" ? "हिन्दी" : "English"}
            >
              <Icons.Globe width={15} height={15} />
              <span className="hbtn-text">
                {prefs.lang === "en" ? "हि" : "EN"}
              </span>
            </button>
            <button
              type="button"
              className="hbtn"
              aria-pressed={prefs.sound}
              // Sound is off until it is asked for: a lab that makes noise on
              // load is a lab a student mutes for good. The first click is also
              // the gesture the browser needs before an AudioContext may start.
              onClick={() => prefs.setSound(!prefs.sound)}
              aria-label={
                prefs.sound
                  ? "Turn apparatus sound off"
                  : "Turn apparatus sound on"
              }
              title={prefs.sound ? "Sound on" : "Sound off"}
            >
              {prefs.sound ? (
                <Icons.Speaker width={15} height={15} />
              ) : (
                <Icons.SpeakerMute width={15} height={15} />
              )}
            </button>
            <button
              type="button"
              className="hbtn"
              aria-pressed={prefs.contrast}
              aria-label={
                prefs.contrast
                  ? "High contrast on — press for the standard look"
                  : "High contrast off — press for bright rooms and projectors"
              }
              title={prefs.contrast ? "High contrast on" : "High contrast off"}
              onClick={() => prefs.setContrast(!prefs.contrast)}
            >
              <Icons.Contrast width={15} height={15} />
            </button>
            <button
              type="button"
              className="hbtn"
              aria-pressed={!prefs.motion}
              aria-label={
                prefs.motion
                  ? "Motion on — press to reduce motion"
                  : "Motion off — press to allow motion"
              }
              title={prefs.motion ? "Motion on" : "Motion off"}
              onClick={() => prefs.setMotion(!prefs.motion)}
            >
              {prefs.motion ? (
                <Icons.PlayCircle width={15} height={15} />
              ) : (
                <Icons.PauseCircle width={15} height={15} />
              )}
            </button>
          </div>
        </div>
      </header>

      <main id="main">
        <Suspense fallback={<RouteFallback />}>
          {children ?? <Outlet />}
        </Suspense>
      </main>

      <footer className="app-footer">
        <div className="shell-width footer-inner">
          <span className="footer-brand">
            <BrandMark /> {BRAND.name}
          </span>
          <span className="muted">CBSE Class XII Physics · {BRAND.year}</span>
          <nav aria-label="Footer" className="footer-links">
            <Link to="/simulators">Experiments</Link>
            <Link to="/practicals">Practicals</Link>
            <Link to="/about">About</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
