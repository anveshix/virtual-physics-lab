import { useEffect, useState } from "react";

/**
 * Tracks a media query. Returns false where matchMedia is missing (tests,
 * very old browsers), so anything gated on it is an enhancement, never a
 * requirement.
 */
export function useMedia(query: string): boolean {
  const get = () =>
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia(query).matches
      : false;
  const [on, setOn] = useState(get);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia(query);
    const update = () => setOn(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, [query]);
  return on;
}
