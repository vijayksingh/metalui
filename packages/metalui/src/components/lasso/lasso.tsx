'use client';

import * as React from 'react';
import { SizeReadout } from '../size-readout/size-readout';

/* ─────────────────────────────────────────────────────────
 * LASSO (the native reference's lasso overlay)
 *
 * Dragging on empty canvas draws a box; everything it touches will be selected.
 *
 *   rest      nothing
 *   drawing   a 1 pt intent-green hairline over a faint intent fill (no ants, no glow),
 *             following the pointer in the same frame; under it, centred, a graphite
 *             readout counts what the box holds: ● 3 blocks. No readout while it holds
 *             nothing: a count is the one thing the box cannot show by its shape.
 *   release   the box fades on the release spring; the selection it made takes over
 *   graphite  the lighter green and a slightly stronger fill
 * The line and the readout keep their screen size at every zoom (pass the canvas scale).
 * Drawn in world coordinates inside the transformed world; hidden from assistive tech:
 * the selection it makes is announced, not the box.
 * ───────────────────────────────────────────────────────── */

export interface LassoRect { x: number; y: number; width: number; height: number }

export interface LassoProps {
  /** The box in world coordinates, from where the drag began to the pointer; null when not drawing. */
  rect: LassoRect | null;
  /** How many objects the box touches now. */
  count: number;
  /** The canvas scale (1 at 100 %). */
  scale?: number;
  /** The unit after the count. Default "block" / "blocks". */
  unit?: (count: number) => string;
  className?: string;
}

const BOX = 'mu-lasso pointer-events-none absolute presence-lasso presence-guide-leave data-[state=leaving]:opacity-0 data-[state=drawing]:transition-none reduced-motion:transition-none';
const READOUT = 'presence-lasso-readout';

const blocks = (n: number) => (n === 1 ? 'block' : 'blocks');

/** The box a drag on empty canvas draws, with the count it will select. */
export function Lasso({ rect, count, scale = 1, unit = blocks, className }: LassoProps) {
  // Keep the last box while it fades after the drag ends.
  const [last, setLast] = React.useState<{ rect: LassoRect; count: number } | null>(rect ? { rect, count } : null);
  React.useLayoutEffect(() => { if (rect) setLast({ rect, count }); }, [rect, count]);
  const leaving = !rect && !!last;
  React.useEffect(() => {
    if (!leaving) return;
    const t = window.setTimeout(() => setLast(null), 400);
    return () => window.clearTimeout(t);
  }, [leaving]);
  const draw = rect ? { rect, count } : last;
  if (!draw) return null;
  const r = draw.rect;
  // A drag up or left gives a negative size; the box is the same either way.
  const x = r.width < 0 ? r.x + r.width : r.x, y = r.height < 0 ? r.y + r.height : r.y;
  return (
    <div
      aria-hidden
      data-state={leaving ? 'leaving' : 'drawing'}
      className={className ? `${BOX} ${className}` : BOX}
      style={{ left: x, top: y, width: Math.abs(r.width), height: Math.abs(r.height), '--mu-canvas-scale': scale } as React.CSSProperties}
    >
      {draw.count > 0 && <SizeReadout className={READOUT} value={draw.count} unit={unit(draw.count)} />}
    </div>
  );
}
