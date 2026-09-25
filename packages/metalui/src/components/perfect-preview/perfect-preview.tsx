'use client';

import * as React from 'react';

/* ─────────────────────────────────────────────────────────
 * PERFECT PREVIEW: hold to perfect (DRAWING.md DR-05)
 *
 *   idle     nothing
 *   holding  the pen is still at the end of a rough stroke: the clean shape the core fitted
 *            (shape_recognize) draws itself round as a faint green outline over 450 ms. The
 *            outline is the timer: when it closes, the hold is done.
 *   done     the host morphs the stroke into the clean shape (180 ms, settle spring) while
 *            the outline fades over the same time
 *   cancel   moving again or Escape: back to idle at once, the hand-drawn stroke stays
 *   tuning   still holding after the morph, the shape is in the hand: the host turns and
 *            resizes it around its centre as the pointer moves. Here: a centre dot, a dashed
 *            guide from the centre to the pointer, and a readout of the angle and size
 *            (the host catches the angle at 0°, 45° and 90°). Letting go places it.
 * Reduce Motion: no trace; the outline shows whole for the hold, then goes.
 * Drawn in world coordinates inside the transformed world.
 * ───────────────────────────────────────────────────────── */

export interface PerfectPreviewProps {
  /** The fitted shape's outline path in world coordinates. */
  d: string;
  phase: 'idle' | 'holding' | 'done' | 'tuning';
  /** While tuning: the shape's centre, the pointer (world), the turn in degrees and the size as a factor. */
  tune?: { centre: { x: number; y: number }; pointer: { x: number; y: number }; angle: number; scale: number };
  /** The canvas scale (1 at 100 %), so the line keeps its screen width. */
  scale?: number;
  /** The outline closed: the hold is complete. The host starts the morph. */
  onHeld?: () => void;
  className?: string;
}

const LAYER = 'mu-perfect-preview perfect-layer';
const GUIDE = 'mu-perfect-guide perfect-guide';
const CENTRE = 'mu-perfect-centre perfect-centre';
const READOUT = 'mu-perfect-readout perfect-readout';
const OUTLINE = {
  holding: 'mu-perfect-outline perfect-outline perfect-holding reduced-motion:animate-none',
  done: 'mu-perfect-outline perfect-outline perfect-done',
};

/** The fitted shape, tracing itself while the pen is held still. */
export function PerfectPreview({ d, phase, tune, scale = 1, onHeld, className }: PerfectPreviewProps) {
  if (phase === 'idle') return null;
  const vars = { '--mu-canvas-scale': scale } as React.CSSProperties;
  if (phase === 'tuning') {
    if (!tune) return null;
    const { centre: c, pointer: p } = tune;
    const r = 3 / scale;
    return (
      <>
        <svg aria-hidden width={1} height={1} className={className ? `${LAYER} ${className}` : LAYER} style={vars}>
          <path className={GUIDE} d={`M${c.x} ${c.y}L${p.x} ${p.y}`} />
          <circle className={CENTRE} cx={c.x} cy={c.y} r={r} />
        </svg>
        <span className={READOUT} style={{ ...vars, left: p.x, top: p.y }}>
          {`${Math.round(tune.angle)}° · ${Math.round(tune.scale * 100)} %`}
        </span>
      </>
    );
  }
  return (
    <svg aria-hidden width={1} height={1} className={className ? `${LAYER} ${className}` : LAYER} style={vars}>
      <path
        key={phase}
        className={OUTLINE[phase]}
        d={d}
        pathLength={1}
        onAnimationEnd={phase === 'holding' ? () => onHeld?.() : undefined}
      />
    </svg>
  );
}
