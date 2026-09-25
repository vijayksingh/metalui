'use client';

import * as React from 'react';

/* ─────────────────────────────────────────────────────────
 * BRUSH CURSOR (the native reference's brush cursor)
 *
 * While the draw tool (P) or the eraser (E) is on, the pointer is the brush itself, so you
 * see exactly how wide the stroke will be before you touch the canvas.
 *
 *   pen      a disc in the ink colour, the stroke width times the zoom (never under 6),
 *            with a hairline light ring and a hairline dark edge, so it reads on any ink
 *            and on both colorways; while drawing it grows with the pressure
 *   pencil   the pen's disc a little lighter (80 %)
 *   marker   a flat chisel at 40 % ink, as wide as the band it lays, tilted like the tip
 *   eraser   a dashed ring the size of what it will remove; dark on Bone, light on Graphite
 *   shape    line, arrow, rectangle, ellipse: a thin crosshair with a gap at the centre (the
 *            point the shape starts from), on a light halo so it reads on any ink, and a
 *            small sign of the shape at its lower right
 *   motion   it follows the pointer in the same frame and its size changes at once: a brush
 *            that eased would lie about the stroke you are about to make
 * Screen space: the host hides the system cursor over the canvas and passes the pointer
 * position. Hidden from assistive tech.
 * ───────────────────────────────────────────────────────── */

export type BrushMode = 'pen' | 'pencil' | 'marker' | 'eraser' | 'line' | 'arrow' | 'rectangle' | 'ellipse';

export interface BrushCursorProps {
  /** The tool: pen, pencil and marker draw, eraser removes, the shapes start from a point. */
  mode: BrushMode;
  /** The pointer, in viewport coordinates. Null hides the brush (the pointer left the canvas). */
  at: { x: number; y: number } | null;
  /** The brush diameter in screen points: stroke width × zoom (× pressure while drawing). Unused for shapes. */
  size: number;
  /** The ink colour (pen). */
  color?: string;
  className?: string;
}

const ROOT = 'mu-brush-cursor pointer-events-none fixed left-0 top-0 z-50 overflow-visible';

/** A value from the theme. */
function css(name: string, fallback: number) {
  if (typeof window === 'undefined') return fallback;
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)) || fallback;
}
const SHAPES = new Set<BrushMode>(['line', 'arrow', 'rectangle', 'ellipse']);

/** The small sign of the shape, centred on (0, 0), h wide. */
function hint(mode: BrushMode, h: number) {
  const r = h / 2;
  switch (mode) {
    case 'line': return <path d={`M${-r} ${r}L${r} ${-r}`} />;
    case 'arrow': return <path d={`M${-r} ${r}L${r} ${-r}M${r * 0.1} ${-r}H${r}V${-r * 0.1}`} />;
    case 'rectangle': return <rect x={-r} y={-r * 0.75} width={h} height={h * 0.75} rx={1} />;
    default: return <ellipse rx={r} ry={r * 0.75} />;
  }
}

/** The brush under the pointer while drawing or erasing. */
export function BrushCursor({ mode, at, size, color = 'currentColor', className }: BrushCursorProps) {
  const t = React.useMemo(() => ({
    min: css('--mu-r-brush-self-min', 6), arm: css('--mu-r-brush-cross-arm', 7), hole: css('--mu-r-brush-cross-gap', 3),
    offset: css('--mu-r-brush-cross-hint-offset', 10), hint: css('--mu-r-brush-cross-hint-size', 7), ratio: css('--mu-r-brush-marker-ratio', 0.42),
  }), []);
  if (!at) return null;
  if (SHAPES.has(mode)) {
    const { arm, hole, offset, hint: h } = t, reach = hole + arm, box = (offset + h + 2) * 2;
    const cross = `M${-reach} 0H${-hole}M${hole} 0H${reach}M0 ${-reach}V${-hole}M0 ${hole}V${reach}`;
    return (
      <svg aria-hidden width={box} height={box} viewBox={`${-box / 2} ${-box / 2} ${box} ${box}`} className={className ? `${ROOT} ${className}` : ROOT} style={{ translate: `${at.x - box / 2}px ${at.y - box / 2}px` }} data-mode={mode}>
        <path d={cross} className="brush-cross-halo" />
        <g transform={`translate(${offset} ${offset})`} className="brush-cross-halo">{hint(mode, h)}</g>
        <path d={cross} className="brush-cross" />
        <g transform={`translate(${offset} ${offset})`} className="brush-cross">{hint(mode, h)}</g>
      </svg>
    );
  }
  const min = t.min;
  const d = Math.max(size, min), r = d / 2, pad = 2, box = d + pad * 2;
  return (
    <svg
      aria-hidden
      width={box}
      height={box}
      viewBox={`${-box / 2} ${-box / 2} ${box} ${box}`}
      className={className ? `${ROOT} ${className}` : ROOT}
      style={{ translate: `${at.x - box / 2}px ${at.y - box / 2}px` }}
      data-mode={mode}
    >
      {mode === 'eraser' ? (
        <circle r={r} className="brush-eraser" />
      ) : mode === 'marker' ? (
        <g transform="rotate(-35)">
          <rect x={-r} y={-r * t.ratio} width={d} height={d * t.ratio} rx={r * t.ratio * 0.5} fill={color} className="brush-marker" />
          <rect x={-r} y={-r * t.ratio} width={d} height={d * t.ratio} rx={r * t.ratio * 0.5} className="brush-edge" />
        </g>
      ) : (
        <>
          <circle r={r} fill={color} className={mode === 'pencil' ? 'brush-pencil' : undefined} />
          <circle r={r} className="brush-ring" />
          <circle r={r + 0.5} className="brush-edge" />
        </>
      )}
    </svg>
  );
}
