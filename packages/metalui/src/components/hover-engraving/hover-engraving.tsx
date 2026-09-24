'use client';

import * as React from 'react';
import './hover-engraving.css';

/* ─────────────────────────────────────────────────────────
 * HOVER ENGRAVING (the brief, DS-31, the reference design's .meta)
 *
 *   pass      the pointer crosses the block: nothing
 *   dwell     the block stays hovered 420 ms: the engraving fades in on settle,
 *             sliding 3 in from the block (beside) or 2 down (below)
 *   leave     it goes at once, on settle, no delay
 *   selected  hidden, and hidden while writing (the host passes open={false})
 * Reduce Motion: settle resolves to a crossfade, so it fades in place.
 * ───────────────────────────────────────────────────────── */

export type EngravingStatus = 'live' | 'waiting' | 'failed' | 'off';

export interface HoverEngravingProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** The block's kind, emphasised first: "LOG", "TASK", "TITLE". */
  kind: string;
  /** Then time, edits, other life events: "07:40", "SLEEP 6 H", "ALSO TIRED". */
  details?: string[];
  /** Tags derived from a cluster title or region, as hollow pills: "poster". */
  tags?: string[];
  /** The recognizer's status, with its LED: { led: 'live', text: 'RECOGNIZER ✓' }. */
  status?: { led: EngravingStatus; text: string };
  /** beside the first line of a text block (default), or below a material block. */
  placement?: 'beside' | 'below';
  /** Controlled: true shows it (after the dwell), false hides it (selected, writing). Default: the host's hover. */
  open?: boolean;
  /** With open, skip the dwell (a keyboard focus, a docs still). */
  immediate?: boolean;
}

/**
 * The block's identity, on a dwell. Place it as a direct child of the block (position: relative, with the
 * class mu-icon-trigger), and point the block's aria-describedby at its id.
 */
export const HoverEngraving = React.forwardRef<HTMLSpanElement, HoverEngravingProps>(function HoverEngraving(
  { kind, details = [], tags = [], status, placement = 'beside', open, immediate, className, ...props },
  ref,
) {
  return (
    <span
      ref={ref}
      role="note"
      data-placement={placement}
      data-open={open === undefined ? undefined : String(open)}
      data-immediate={immediate ? '' : undefined}
      className={className ? `mu-engraving ${className}` : 'mu-engraving'}
      {...props}
    >
      <span className="mu-engraving-text mu-type-label">
        <b>{kind}</b>
        {details.map((d) => ` · ${d}`).join('')}
      </span>
      {tags.length > 0 && (
        <span className="mu-engraving-tags">
          {tags.map((t) => <span key={t}>#{t}</span>)}
        </span>
      )}
      {status && (
        <span className="mu-engraving-text mu-type-label">
          <span className="mu-engraving-led" data-led={status.led} aria-hidden />
          {status.text}
        </span>
      )}
    </span>
  );
});
