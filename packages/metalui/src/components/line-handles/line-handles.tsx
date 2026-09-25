'use client';

import * as React from 'react';

/* ─────────────────────────────────────────────────────────
 * LINE HANDLES: the presence of a drawn line or arrow (DRAWING.md §6)
 *
 * A box-like shape (rectangle, ellipse, a stroke) uses SelectionFrame's eight handles. A line
 * or arrow is its two ends, so it gets two:
 *   rest      nothing
 *   hover     a soft green halo along the line and a hollow dot at each end (part spring)
 *   selected  the halo stays; each end is a handle: drag it to move that end (the host
 *             snaps it to blocks and guides and redraws the line in the same frame)
 * The same halo and handles as a connector, so the canvas has one selection language.
 * World coordinates inside the transformed world; sizes keep their screen size.
 * ───────────────────────────────────────────────────────── */

export interface LineHandlesProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  state: 'rest' | 'hover' | 'selected';
  /** The canvas scale (1 at 100 %). */
  scale?: number;
  /** An end handle was pressed (selected only). */
  onHandlePointerDown?: (end: 'from' | 'to', event: React.PointerEvent<SVGCircleElement>) => void;
  className?: string;
}

const LAYER = 'mu-line-handles connector-layer';
const CHROME = 'connector-chrome';
const HALO = 'connector-halo';
const DOT = 'connector-end-free';
const HANDLE = 'mu-line-handle connector-handle';

function cssPx(name: string, fallback: number) {
  if (typeof window === 'undefined') return fallback;
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)) || fallback;
}

/** The two ends of a selected line or arrow. */
export function LineHandles({ from, to, state, scale = 1, onHandlePointerDown, className }: LineHandlesProps) {
  const dotR = React.useMemo(() => cssPx('--mu-r-connector-end-size', 4.5), []) / scale;
  const handleR = React.useMemo(() => cssPx('--mu-r-connector-handle-size', 5), []) / scale;
  return (
    <svg aria-hidden width={1} height={1} data-state={state} className={className ? `${LAYER} ${className}` : LAYER} style={{ '--mu-canvas-scale': scale } as React.CSSProperties}>
      <g className={CHROME}>
        <path className={HALO} d={`M${from.x} ${from.y}L${to.x} ${to.y}`} />
        {(['from', 'to'] as const).map((k) => {
          const e = k === 'from' ? from : to;
          return state === 'selected'
            ? <circle key={k} className={HANDLE} cx={e.x} cy={e.y} r={handleR} onPointerDown={(ev) => onHandlePointerDown?.(k, ev)} />
            : <circle key={k} className={DOT} cx={e.x} cy={e.y} r={dotR} />;
        })}
      </g>
    </svg>
  );
}
