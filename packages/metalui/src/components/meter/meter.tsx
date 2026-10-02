'use client';

import * as React from 'react';
import { Meter as BaseMeter } from '@base-ui/react/meter';

/* ─────────────────────────────────────────────────────────
 * METER, a level in a range, on Base UI Meter
 *
 *   rest      a row of LED segments (16); lit up to the value, dark (the off lamp) above it
 *   colour    by where a segment sits, not by the value: green, amber from 75 %, red from 90 %
 *             toward the bad end (the top; the bottom for bad="low", like a battery)
 *   change    the level sweeps from its old edge to its new one, one segment every 16 ms, each
 *             lamp fading 90 ms: rising lights upward, falling darkens downward
 *   text      an optional label at the left above, the value at the right
 * Reduce Motion: every segment changes at once (the stagger is scaled by the part travel).
 * The lamps are the LED part's looks; the meter recipe adds the segments and the sweep.
 * ───────────────────────────────────────────────────────── */

const ROOT = 'mu-meter grid min-w-meter-min-width gap-meter-head-gap';
const HEAD = 'mu-meter-head flex items-baseline justify-between gap-meter-head-gap';
const LABEL = 'mu-meter-label type-ui text-ink';
const VALUE = 'mu-meter-value type-meta tabular-nums text-ink2';
const TRACK = 'mu-meter-track flex gap-meter-gap h-meter-height';
const SEGMENT = 'mu-meter-segment relative flex-1 rounded-meter-radius recipe-status-socket';
const kindForZone = { ok: 'live', warn: 'waiting', danger: 'failed' };

export interface MeterProps extends Omit<BaseMeter.Root.Props, 'className' | 'children'> {
  /** What is measured: "Storage". Shown above, and names it. */
  label?: React.ReactNode;
  /** Show the value (a percentage by default) at the right above the segments. */
  showValue?: boolean;
  /** How many segments (16). */
  segments?: number;
  /** Where amber and red begin, as shares of the range measured from the bad end (0.75 and 0.9). */
  warn?: number;
  danger?: number;
  /** Which end of the scale is the problem: high (storage, the default) or low (battery). */
  bad?: 'high' | 'low';
  className?: string;
}

/** A level in a range, as lit segments. */
export function Meter({ label, showValue, segments = 16, warn = 0.75, danger = 0.9, bad = 'high', value, min = 0, max = 100, className, ...props }: MeterProps) {
  const lit = Math.round(((value - min) / (max - min || 1)) * segments);
  const before = React.useRef(lit);
  const from = before.current;
  React.useEffect(() => { before.current = lit; }, [lit]);
  return (
    <BaseMeter.Root value={value} min={min} max={max} className={className ? `${ROOT} ${className}` : ROOT} {...props}>
      {(label != null || showValue) && (
        <span className={HEAD}>
          {label != null ? <BaseMeter.Label className={LABEL}>{label}</BaseMeter.Label> : <span />}
          {showValue && <BaseMeter.Value className={VALUE} />}
        </span>
      )}
      <BaseMeter.Track className={TRACK}>
        {Array.from({ length: segments }, (_, i) => {
          const share = bad === 'low' ? (segments - i) / segments : (i + 1) / segments;
          const zone = share > danger ? 'danger' : share > warn ? 'warn' : 'ok';
          // Segments between the old edge and the new one change in order, away from the old edge.
          const step = lit >= from ? i - from : from - 1 - i;
          return (
            <span key={i} aria-hidden data-mu-self="" className={SEGMENT} data-lit={i < lit ? '' : undefined} data-zone={zone} style={{ '--mu-meter-step': Math.max(0, step), '--mu-self': 'var(--mu-r-status-ink-off)' } as React.CSSProperties}>
              <span data-mu-self="" className="mu-meter-lamp meter-lamp recipe-status-lamp" style={{ '--mu-self': `var(--mu-r-status-ink-${kindForZone[zone]})` } as React.CSSProperties} />
            </span>
          );
        })}
      </BaseMeter.Track>
    </BaseMeter.Root>
  );
}
