'use client';

import * as React from 'react';

/* ─────────────────────────────────────────────────────────
 * CONNECTOR (DRAWING.md DR-07): the look around ink whose ends sit on two blocks
 *
 * The host draws the ink itself; this is everything around it.
 *   rest      nothing but the label chip, if it has one
 *   hover     a soft green halo along the path, and a dot at each end: solid where the end
 *             is attached to a block, hollow where it is free (fades in on the part spring)
 *   selected  the halo stays; the ends become handles to drag and re-attach
 *   moving    a block moves and the host re-routes the path (the core's connector_route) in
 *             the same frame; nothing here animates the path
 *   label     a small chip at the middle of the path, the same size on screen at every zoom
 * Drawn in world coordinates inside the transformed world; sizes are divided by the scale.
 * ───────────────────────────────────────────────────────── */

export interface ConnectorEnd {
  x: number;
  y: number;
  /** On a block (solid dot) or free (hollow dot). */
  attached: boolean;
}

export interface ConnectorProps {
  /** The path's centre line in world coordinates (for the halo). */
  d: string;
  from: ConnectorEnd;
  to: ConnectorEnd;
  state?: 'rest' | 'hover' | 'selected';
  /** The label text, drawn at `labelAt` (the core's label anchor). */
  label?: string;
  labelAt?: { x: number; y: number };
  /** The canvas scale (1 at 100 %), so sizes stay the same on screen. */
  scale?: number;
  /** An end handle was pressed (selected only). The host drags it and re-attaches. */
  onEndPointerDown?: (end: 'from' | 'to', event: React.PointerEvent<SVGCircleElement>) => void;
  className?: string;
}

const LAYER = 'mu-connector connector-layer';
const HALO = 'mu-connector-halo connector-halo';
const CHROME = 'mu-connector-chrome connector-chrome';
const END = { attached: 'connector-end', free: 'connector-end-free' };
const HANDLE = 'mu-connector-handle connector-handle';
const LABEL = 'mu-connector-label connector-label';

/** A size in screen points from the theme. */
function cssPx(name: string, fallback: number) {
  if (typeof window === 'undefined') return fallback;
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)) || fallback;
}

/** The chrome of one connector, drawn inside the canvas world. */
export function Connector({ d, from, to, state = 'rest', label, labelAt, scale = 1, onEndPointerDown, className }: ConnectorProps) {
  const endR = React.useMemo(() => cssPx('--mu-r-connector-end-size', 4.5), []) / scale;
  const handleR = React.useMemo(() => cssPx('--mu-r-connector-handle-size', 5), []) / scale;
  const vars = { '--mu-canvas-scale': scale } as React.CSSProperties;
  const selected = state === 'selected';
  return (
    <>
      <svg aria-hidden width={1} height={1} data-state={state} className={className ? `${LAYER} ${className}` : LAYER} style={vars}>
        <g className={CHROME}>
          <path className={HALO} d={d} />
          {(['from', 'to'] as const).map((k) => {
            const e = k === 'from' ? from : to;
            return selected ? (
              <circle key={k} className={HANDLE} cx={e.x} cy={e.y} r={handleR} onPointerDown={(ev) => onEndPointerDown?.(k, ev)} />
            ) : (
              <circle key={k} className={END[e.attached ? 'attached' : 'free']} cx={e.x} cy={e.y} r={endR} />
            );
          })}
        </g>
      </svg>
      {label && labelAt && (
        <span className={LABEL} style={{ ...vars, left: labelAt.x, top: labelAt.y }}>
          {label}
        </span>
      )}
    </>
  );
}
