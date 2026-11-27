import type { CSSProperties, KeyboardEvent } from "react";
import type {
  ControlSpec,
  ParamValue,
  ParamValues,
  SliderControl,
} from "@/types/lab";
import { Tex } from "@/components/math/Tex";

interface ControlsProps {
  specs: ControlSpec[];
  params: ParamValues;
  onChange: (key: string, value: ParamValue) => void;
  /** Accessible name of the dock. */
  label?: string;
  className?: string;
}

const display = (spec: SliderControl, v: number) =>
  v.toFixed(spec.precision ?? (spec.step >= 1 ? 0 : 2));

/** How far along its range a slider sits, for the filled part of the track. */
const fill = (spec: SliderControl, v: number) =>
  `${(((v - spec.min) / (spec.max - spec.min || 1)) * 100).toFixed(1)}%`;

/** Arrow keys move the choice within a radio group, as they do for native radios. */
function onRadioKeys(e: KeyboardEvent<HTMLDivElement>) {
  const keys: Record<string, number> = {
    ArrowRight: 1,
    ArrowDown: 1,
    ArrowLeft: -1,
    ArrowUp: -1,
  };
  const step = keys[e.key];
  if (!step) return;
  const radios = [
    ...e.currentTarget.querySelectorAll<HTMLButtonElement>(
      '[role="radio"]:not(:disabled)',
    ),
  ];
  const at = radios.findIndex((r) => r.getAttribute("aria-checked") === "true");
  const next = radios[(at + step + radios.length) % radios.length];
  if (!next) return;
  e.preventDefault();
  next.focus();
  next.click();
}

/** The bench strip: native controls for anything not pinned to the apparatus. */
export function Controls({
  specs,
  params,
  onChange,
  label = "Apparatus controls",
  className,
}: ControlsProps) {
  if (specs.length === 0) return null;
  return (
    <section
      className={`panel control-dock${className ? ` ${className}` : ""}`}
      aria-label={label}
    >
      <div className="panel-body control-grid">
        {specs.map((spec) => {
          const disabled = spec.disabledIf?.(params) ?? false;
          const id = `ctl-${spec.key}`;
          return (
            <div
              key={spec.key}
              className={`control${disabled ? " is-disabled" : ""}`}
            >
              <label htmlFor={id} id={`${id}-label`}>
                <span className="control-label">
                  {spec.label}
                  {spec.symbol ? (
                    <em>
                      {" "}
                      <Tex>{spec.symbol}</Tex>
                    </em>
                  ) : null}
                </span>
                {spec.kind === "slider" ? (
                  <span className="readout control-value">
                    {display(spec, Number(params[spec.key] ?? spec.initial))}
                    {spec.unit ? ` ${spec.unit}` : ""}
                  </span>
                ) : null}
              </label>

              {spec.kind === "slider" ? (
                <>
                  <input
                    id={id}
                    type="range"
                    min={spec.min}
                    max={spec.max}
                    step={spec.step}
                    value={Number(params[spec.key] ?? spec.initial)}
                    disabled={disabled}
                    style={
                      {
                        "--fill": fill(
                          spec,
                          Number(params[spec.key] ?? spec.initial),
                        ),
                      } as CSSProperties
                    }
                    onChange={(e) => onChange(spec.key, Number(e.target.value))}
                  />
                  {/* The ends of the scale, so a student can predict before dragging. */}
                  <span className="control-range" aria-hidden="true">
                    <span>{display(spec, spec.min)}</span>
                    <span>
                      {display(spec, spec.max)}
                      {spec.unit ? ` ${spec.unit}` : ""}
                    </span>
                  </span>
                </>
              ) : null}

              {spec.kind === "toggle" ? (
                <button
                  id={id}
                  type="button"
                  role="switch"
                  aria-checked={Boolean(params[spec.key] ?? spec.initial)}
                  className={`switch-btn${(params[spec.key] ?? spec.initial) ? " is-on" : ""}`}
                  disabled={disabled}
                  onClick={() =>
                    onChange(spec.key, !(params[spec.key] ?? spec.initial))
                  }
                >
                  <span className="switch-knob" aria-hidden="true" />
                  <span className="switch-text">
                    {(params[spec.key] ?? spec.initial) ? "On" : "Off"}
                  </span>
                </button>
              ) : null}

              {spec.kind === "select" ? (
                <select
                  id={id}
                  value={String(params[spec.key] ?? spec.initial)}
                  disabled={disabled}
                  onChange={(e) => onChange(spec.key, e.target.value)}
                >
                  {spec.options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : null}

              {spec.kind === "segmented" ? (
                <div
                  className="segmented"
                  role="radiogroup"
                  aria-labelledby={`${id}-label`}
                  onKeyDown={onRadioKeys}
                >
                  {spec.options.map((o) => {
                    const active =
                      String(params[spec.key] ?? spec.initial) === o.value;
                    return (
                      <button
                        key={o.value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        tabIndex={active ? 0 : -1}
                        className={`segmented-btn${active ? " is-active" : ""}`}
                        disabled={disabled}
                        onClick={() => onChange(spec.key, o.value)}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {spec.hint ? (
                <p className="control-hint muted">{spec.hint}</p>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
