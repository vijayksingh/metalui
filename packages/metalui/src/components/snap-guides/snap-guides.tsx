'use client';

import * as React from 'react';

/* ─────────────────────────────────────────────────────────
 * SNAP GUIDES (the native reference's guides overlay)
 *
 * While a person moves or resizes, the canvas snaps to its neighbours' edges and centres.
 * Each guide is the explanation of one snap.
 *
 *   rest      nothing
 *   snapping  a 1 pt intent-green line per alignment, spanning every aligned object plus
 *             8 pt at each end; solid for edges, 3 / 3 dashed for centres. The same width
 *             and dash at every zoom (the host passes the canvas scale). Guides appear and
 *             move with the snap in the same frame, never animated: a guide that lagged
 *             would contradict the snap it explains.
 *   release   the drag ends: the last guides fade on the release spring, then clear
 *   graphite  the lighter green, so the line reads on the dark world
 *   haptic    onEngage fires once when a snap catches a new line; staying on a line, or
 *             letting go, is silent (the native reference's gate). The Mac plays the
 *             trackpad's alignment tap on it; browsers on a Mac or an iPhone have no
 *             haptics, so the web host may only vibrate where the browser allows it.
 * Drawn in world coordinates, inside the transformed world, as one path for edges and one
 * for centres. Not interactive and hidden from assistive tech: the snap is the fact.
 * ───────────────────────────────────────────────────────── */

export interface SnapGuide {
  /** vertical: a line at x = position from y = start to end. horizontal: at y = position. */
  axis: 'vertical' | 'horizontal';
  /** World coordinate of the line. */
  position: number;
  /** World extent of the aligned objects along the line (the overshoot is added here). */
  start: number;
  end: number;
  /** edge: aligned edges (solid). center: aligned centres (dashed). */
  kind: 'edge' | 'center';
}

export interface SnapGuidesProps {
  /** The guides for this frame; an empty list ends the drag and lets the last ones fade. */
  guides: SnapGuide[];
  /** The canvas scale (1 at 100 %), so lines keep their screen width, dash and overshoot. */
  scale?: number;
  /** Fires once when a snap catches a new line (for the haptic). Staying on a line, or letting go, is silent. */
  onEngage?: () => void;
  className?: string;
}

/** The identity of an engaged line: its axis and position to a hundredth. */
const keyOf = (g: SnapGuide) => `${g.axis}:${Math.round(g.position * 100) / 100}`;

const LAYER = 'mu-snap-guides pointer-events-none absolute left-0 top-0 overflow-visible';
const LINE = 'presence-guide-line';
const CENTER = 'presence-guide-line presence-guide-center';

/** The overshoot in screen points, from the theme (8 by default). */
function overshoot() {
  if (typeof window === 'undefined') return 8;
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--mu-presence-guide-overshoot')) || 8;
}

function pathOf(guides: SnapGuide[], kind: SnapGuide['kind'], over: number) {
  let d = '';
  for (const g of guides) {
    if (g.kind !== kind) continue;
    const a = Math.min(g.start, g.end) - over, b = Math.max(g.start, g.end) + over;
    d += g.axis === 'vertical' ? `M${g.position} ${a}V${b}` : `M${a} ${g.position}H${b}`;
  }
  return d;
}

/** The snap guides of one drag, drawn inside the canvas world. */
export function SnapGuides({ guides, scale = 1, onEngage, className }: SnapGuidesProps) {
  // The haptic gate: a line that was not engaged in the last frame is a new catch.
  const engaged = React.useRef<Set<string>>(new Set());
  React.useLayoutEffect(() => {
    const keys = new Set(guides.map(keyOf));
    if (onEngage && [...keys].some((k) => !engaged.current.has(k))) onEngage();
    engaged.current = keys;
  }, [guides, onEngage]);
  // Keep the last guides while they fade out after the drag ends.
  const [shown, setShown] = React.useState<SnapGuide[]>(guides);
  const leaving = guides.length === 0 && shown.length > 0;
  React.useLayoutEffect(() => {
    if (guides.length) setShown(guides);
  }, [guides]);
  // After the fade (or at once under Reduce Motion, where nothing fades), the guides are gone.
  React.useEffect(() => {
    if (!leaving) return;
    const t = window.setTimeout(() => setShown([]), 400);
    return () => window.clearTimeout(t);
  }, [leaving]);
  const over = React.useMemo(overshoot, []) / scale;
  const draw = guides.length ? guides : shown;
  if (!draw.length) return null;
  return (
    <svg
      aria-hidden
      width={1}
      height={1}
      data-state={leaving ? 'leaving' : 'snapping'}
      className={[LAYER, 'presence-guide-leave data-[state=leaving]:opacity-0 data-[state=snapping]:transition-none reduced-motion:transition-none', className].filter(Boolean).join(' ')}
      style={{ '--mu-canvas-scale': scale } as React.CSSProperties}
    >
      <path className={LINE} d={pathOf(draw, 'edge', over)} />
      <path className={CENTER} d={pathOf(draw, 'center', over)} />
    </svg>
  );
}
