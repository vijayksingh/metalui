'use client';

import * as React from 'react';
import { Surface } from '../../components/surface/surface';
import { Label } from '../../components/label/label';
import { Chip } from '../../components/chip/chip';
import { Led } from '../../components/status/status';

/* ─────────────────────────────────────────────────────────
 * HOVER ENGRAVING (the reference design's .meta): a composition
 *   Surface(tip, pill) › Label(engraved) <b>kind</b> · details + Chip(tag) × n + Label(engraved) Led status
 *
 *   pass      the pointer crosses the block: nothing
 *   dwell     the block stays hovered 420 ms: the engraving fades in on settle,
 *             sliding 3 in from the block (beside) or 2 down (below)
 *   leave     it goes at once, on settle, no delay
 *   selected  hidden, and hidden while writing (the host passes open={false})
 * Reduce Motion: settle resolves to a crossfade, so it fades in place.
 * ───────────────────────────────────────────────────────── */

/* Layout and timing from the engraving group. Hidden until a dwell; leaving is immediate (the delay
 * only applies on the way in). A dwell, not a pass: the host must stay hovered for 420 ms. */
const PILL = 'mu-engraving absolute z-2 flex items-center gap-engraving-gap h-engraving-height px-engraving-pad whitespace-nowrap pointer-events-none opacity-0 engraving-motion [.mu-icon-trigger:hover>&]:not-data-[open=false]:engraving-shown data-[open=true]:engraving-shown data-[open=true]:data-immediate:delay-0';
/* Beside the first line of a text block, so a stacked list below stays readable; under a material block. */
const PLACEMENT = {
  beside: 'left-full ml-engraving-beside-gap top-engraving-beside-top engraving-beside-out',
  below: 'left-0 top-full mt-engraving-below-gap engraving-below-out',
};
const TAGS = 'mu-engraving-tags flex gap-engraving-tag-gap';
const STATUS = 'mu-engraving-status [&>.mu-led]:inline-block [&>.mu-led]:mr-engraving-led-gap [&>.mu-led]:engraving-led-lift';

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

/** A block's identity on a dwell: what it is, when, and where it came from. */
export const HoverEngraving = React.forwardRef<HTMLSpanElement, HoverEngravingProps>(function HoverEngraving(
  { kind, details = [], tags = [], status, placement = 'beside', open, immediate, className, ...props },
  ref,
) {
  return (
    <Surface
      ref={ref}
      as="span"
      material="tip"
      radius="pill"
      role="note"
      data-placement={placement}
      data-open={open === undefined ? undefined : String(open)}
      data-immediate={immediate ? '' : undefined}
      className={className ? `${PILL} ${PLACEMENT[placement]} ${className}` : `${PILL} ${PLACEMENT[placement]}`}
      {...props}
    >
      <Label variant="engraved">
        <b>{kind}</b>
        {details.map((d) => ` · ${d}`).join('')}
      </Label>
      {tags.length > 0 && (
        <span className={TAGS}>
          {tags.map((t) => <Chip key={t} variant="tag">#{t}</Chip>)}
        </span>
      )}
      {status && (
        <Label variant="engraved" className={STATUS}>
          <Led kind={status.led} />
          {status.text}
        </Label>
      )}
    </Surface>
  );
});
