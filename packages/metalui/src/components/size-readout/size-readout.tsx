'use client';

import * as React from 'react';
import './size-readout.css';

/* ─────────────────────────────────────────────────────────
 * SIZE READOUT (the KAMUI-14 readout, Kamui 04 §10)
 *   reads   ● 320 × 214 · ● 3 · 540 × 180 · ● COPIED · PNG 130 × 215 · or any short value (● 100 %)
 *   always  the measured value, never a constant; tabular figures (the readout role)
 * The Selection frame places one under its object; use this one on its own for zoom and other readouts.
 * ───────────────────────────────────────────────────────── */

export interface SizeReadoutProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  width?: number;
  height?: number;
  /** Blocks in a multi-selection. */
  count?: number;
  /** A copy just happened, in this format: "PNG". */
  copied?: string | null;
  /** Any other short value in place of the size: "100 %". */
  value?: React.ReactNode;
  /** Hide the LED (a readout that is not live). */
  led?: boolean;
}

/** A graphite pill that reads a measured value: a size, a count, a zoom. */
export const SizeReadout = React.forwardRef<HTMLSpanElement, SizeReadoutProps>(function SizeReadout(
  { width = 0, height = 0, count, copied, value, led = true, className, ...props },
  ref,
) {
  const w = Math.round(width), h = Math.round(height);
  const X = <span className="mu-readout-x">×</span>;
  const dot = <span className="mu-readout-x">·</span>;
  return (
    <span ref={ref} className={['mu-readout', 'mu-type-readout', className].filter(Boolean).join(' ')} {...props}>
      {led && <span aria-hidden className="mu-readout-led" />}
      {value !== undefined ? value : copied ? (
        <>COPIED {dot} {copied} {w} {X} {h}</>
      ) : count && count > 1 ? (
        <>{count} {dot} {w} {X} {h}</>
      ) : (
        <>{w} {X} {h}</>
      )}
    </span>
  );
});
