import { useCallback, useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { useRenderLoop, type Frame } from './useRenderLoop';

export interface CanvasPainter {
  /**
   * Draws one frame. The context is already scaled so that drawing happens in
   * the stage's logical coordinates (the same 820 × 470 space the SVG apparatus
   * uses), whatever the element's pixel size or the display's pixel ratio.
   */
  (ctx: CanvasRenderingContext2D, frame: Frame): void;
}

export interface CanvasStageProps {
  /** Logical drawing width — the same units the SVG apparatus is authored in. */
  width?: number;
  /** Logical drawing height. */
  height?: number;
  draw: CanvasPainter;
  /**
   * What the canvas shows, in words. The canvas is a picture: interaction and
   * live values live in real DOM elements beside it, which is what keeps the
   * apparatus usable by keyboard and readable by a screen reader.
   */
  label: string;
  /** Stops the loop — for a paused experiment. */
  paused?: boolean;
  /** Sits over an SVG apparatus, so pointer events must fall through. */
  overlay?: boolean;
  className?: string;
  style?: CSSProperties;
}

const DEFAULT_W = 820;
const DEFAULT_H = 470;

/**
 * A `<canvas>` with a 60 fps render loop, sized to its container and to the
 * display's pixel ratio.
 *
 * Physics entities are drawn here — never moved as DOM elements — so a hundred
 * charges, field vectors or wavefronts cost one draw call each instead of a
 * layout pass each. React renders this component once; everything after that
 * happens inside the loop, so no frame ever waits on a re-render.
 *
 * Degrades quietly. In jsdom, and in any browser that refuses a 2D context,
 * `getContext` returns null, the painter is simply never called, and the
 * apparatus underneath still tells the whole story.
 */
export function CanvasStage({
  width = DEFAULT_W,
  height = DEFAULT_H,
  draw,
  label,
  paused = false,
  overlay = false,
  className,
  style
}: CanvasStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  /** CSS pixel size of the element, tracked so a resize does not need a render. */
  const box = useRef({ w: 0, h: 0, dpr: 1 });

  /** Re-points the backing store at the element's real size and pixel ratio. */
  const measure = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 3); // 3× is past the eye's limit and costs 9× the fill
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    if (box.current.w === w && box.current.h === h && box.current.dpr === dpr) return;
    box.current = { w, h, dpr };
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      ctxRef.current = canvas.getContext('2d');
    } catch {
      ctxRef.current = null; // a locked-down or headless browser; the SVG still stands
    }
    measure();

    if (typeof ResizeObserver !== 'function') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    const ro = new ResizeObserver(measure);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [measure]);

  // A canvas nobody can see should not be painting: scrolled out of view, or in
  // a background tab, the loop stops and the next frame on return is drawn
  // from the live params as usual. Browsers without IntersectionObserver (and
  // jsdom) simply keep the loop running.
  const onScreen = useOnScreen(canvasRef);

  useRenderLoop(
    (frame) => {
      const ctx = ctxRef.current;
      if (!ctx) return;
      const { w, h, dpr } = box.current;
      if (w === 0 || h === 0) {
        measure();
        return;
      }

      // One transform does all three jobs: device pixels, letterboxing, and the
      // logical coordinate system the scene is authored in.
      const scale = Math.min(w / width, h / height);
      const offsetX = (w - width * scale) / 2;
      const offsetY = (h - height * scale) / 2;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);
      try {
        draw(ctx, frame);
      } finally {
        // A scene that throws must not leave the context transformed for the
        // next frame, or every later frame is drawn in the wrong place.
        ctx.restore();
      }
    },
    { active: !paused && onScreen }
  );

  return (
    <canvas
      ref={canvasRef}
      className={`canvas-stage${overlay ? ' is-overlay' : ''}${className ? ` ${className}` : ''}`}
      style={style}
      role="img"
      aria-label={label}
    />
  );
}

/**
 * True while the element is at least partly in the viewport and the page is
 * visible. Starts true, so the first frame is always painted.
 */
function useOnScreen(ref: RefObject<Element>): boolean {
  const [inView, setInView] = useState(true);
  const [pageVisible, setPageVisible] = useState(
    typeof document === 'undefined' || document.visibilityState !== 'hidden'
  );

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver !== 'function') return;
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (entry) setInView(entry.isIntersecting);
      },
      { rootMargin: '80px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const onChange = () => setPageVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);

  return inView && pageVisible;
}
