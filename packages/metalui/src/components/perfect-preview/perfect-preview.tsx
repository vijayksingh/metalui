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
 * Reduce Motion: no trace; the outline shows whole for the hold, then goes.
 * Drawn in world coordinates inside the transformed world.
 * ───────────────────────────────────────────────────────── */

export interface PerfectPreviewProps {
  /** The fitted shape's outline path in world coordinates. */
  d: string;
  phase: 'idle' | 'holding' | 'done';
  /** The canvas scale (1 at 100 %), so the line keeps its screen width. */
  scale?: number;
  /** The outline closed: the hold is complete. The host starts the morph. */
  onHeld?: () => void;
  className?: string;
}

const LAYER = 'mu-perfect-preview perfect-layer';
const OUTLINE = {
  holding: 'mu-perfect-outline perfect-outline perfect-holding reduced-motion:animate-none',
  done: 'mu-perfect-outline perfect-outline perfect-done',
};

/** The fitted shape, tracing itself while the pen is held still. */
export function PerfectPreview({ d, phase, scale = 1, onHeld, className }: PerfectPreviewProps) {
  if (phase === 'idle') return null;
  return (
    <svg aria-hidden width={1} height={1} className={className ? `${LAYER} ${className}` : LAYER} style={{ '--mu-canvas-scale': scale } as React.CSSProperties}>
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
