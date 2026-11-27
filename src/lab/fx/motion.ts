import { useEffect, type RefObject } from "react";
import { animate, stagger } from "animejs";

/**
 * Page-level motion, powered by anime.js.
 *
 * This is chrome, not apparatus: it introduces a page and its cards once, and
 * then gets out of the way. Apparatus motion keeps its own vocabulary in
 * `lab/motion/tokens.ts`. Everything here is skipped when the student has
 * asked for less motion — in the OS or with the header's Motion switch — and
 * in environments with no layout (tests, print), where elements simply stay
 * where they are, fully visible.
 */
export function motionAllowed(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined")
    return false;
  if (document.documentElement.dataset.motion === "off") return false;
  if (!window.matchMedia || typeof IntersectionObserver === "undefined")
    return false;
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Reveals every `[data-reveal]` element inside `root` as it scrolls into view:
 * a short rise and fade, staggered across whatever enters together. Elements
 * are only hidden once we know they can be revealed, so nothing is ever left
 * invisible by a missing observer.
 */
export function useReveal(
  root: RefObject<HTMLElement>,
  deps: readonly unknown[] = [],
): void {
  useEffect(() => {
    const host = root.current;
    if (!host || !motionAllowed()) return;
    const items = Array.from(
      host.querySelectorAll<HTMLElement>("[data-reveal]:not([data-revealed])"),
    );
    if (items.length === 0) return;
    for (const el of items) {
      el.style.opacity = "0";
      el.style.transform = "translateY(10px)";
    }
    const io = new IntersectionObserver(
      (entries) => {
        const entering = entries
          .filter((e) => e.isIntersecting)
          .map((e) => e.target as HTMLElement);
        if (entering.length === 0) return;
        for (const el of entering) {
          io.unobserve(el);
          el.dataset.revealed = "";
        }
        animate(entering, {
          opacity: [0, 1],
          translateY: [10, 0],
          duration: 520,
          delay: stagger(40),
          ease: "outExpo",
          onComplete: () => {
            for (const el of entering) el.style.transform = "";
          },
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    items.forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
      // A re-render may replace these nodes; never leave one hidden.
      for (const el of items) {
        if (el.dataset.revealed === undefined) {
          el.style.opacity = "";
          el.style.transform = "";
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** Counts a number up from zero once, the first time it is on screen. */
export function useCountUp(ref: RefObject<HTMLElement>, value: number): void {
  useEffect(() => {
    const el = ref.current;
    if (!el || !motionAllowed()) return;
    const state = { n: 0 };
    el.textContent = "0";
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      animate(state, {
        n: value,
        duration: 1400,
        ease: "outExpo",
        modifier: (v: number) => Math.round(v),
        onUpdate: () => {
          el.textContent = String(state.n);
        },
      });
    });
    io.observe(el);
    return () => {
      io.disconnect();
      el.textContent = String(value);
    };
  }, [ref, value]);
}

/** The hero headline: each word lifts into place in turn. */
export function useHeadline(ref: RefObject<HTMLElement>): void {
  useEffect(() => {
    const el = ref.current;
    if (!el || !motionAllowed()) return;
    const words = el.querySelectorAll<HTMLElement>(".hw");
    if (words.length === 0) return;
    animate(words, {
      opacity: [0, 1],
      translateY: ["0.6em", "0em"],
      filter: ["blur(10px)", "blur(0px)"],
      duration: 900,
      delay: stagger(70, { start: 120 }),
      ease: "outExpo",
    });
  }, [ref]);
}
