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
 *   eraser   a dashed ring the size of what it will remove; dark on Bone, light on Graphite
 *   motion   it follows the pointer in the same frame and its size changes at once: a brush
 *            that eased would lie about the stroke you are about to make
 * Screen space: the host hides the system cursor over the canvas and passes the pointer
 * position. Hidden from assistive tech.
 * ───────────────────────────────────────────────────────── */

export interface BrushCursorProps {
  /** pen draws, eraser removes. */
  mode: 'pen' | 'eraser';
  /** The pointer, in viewport coordinates. Null hides the brush (the pointer left the canvas). */
  at: { x: number; y: number } | null;
  /** The brush diameter in screen points: stroke width × zoom (× pressure while drawing). */
  size: number;
  /** The ink colour (pen). */
  color?: string;
  className?: string;
}

const ROOT = 'mu-brush-cursor pointer-events-none fixed left-0 top-0 z-50 overflow-visible';

function minimum() {
  if (typeof window === 'undefined') return 6;
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--mu-r-brush-self-min')) || 6;
}

/** The brush under the pointer while drawing or erasing. */
export function BrushCursor({ mode, at, size, color = 'currentColor', className }: BrushCursorProps) {
  const min = React.useMemo(minimum, []);
  if (!at) return null;
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
      {mode === 'pen' ? (
        <>
          <circle r={r} fill={color} />
          <circle r={r} className="brush-ring" />
          <circle r={r + 0.5} className="brush-edge" />
        </>
      ) : (
        <circle r={r} className="brush-eraser" />
      )}
    </svg>
  );
}
