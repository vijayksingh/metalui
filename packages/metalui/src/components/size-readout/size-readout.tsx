'use client';

import * as React from 'react';
import { Surface } from '../surface/surface';
import { Led } from '../status/status';
import { Label } from '../label/label';

/* SIZE READOUT (the reference design's .readout): Surface(graphite-deep, pill) › Led(live) + Label(readout)
 * with its × and · in Label(readout-dim). A component, not a block: the Selection frame places one
 * under its object, and blocks never import blocks.
 *   ● 320 × 214     an object's size
 *   ● 3 · 540 × 180 a multi-selection
 *   ● COPIED · PNG 130 × 215   a copy, for 900 ms (the host times it)
 *   ● 100 %         any other short value */

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

const READOUT = 'mu-readout inline-flex items-center gap-presence-readout-gap-inner h-presence-readout-height pl-presence-readout-pad-start pr-presence-readout-pad-end whitespace-nowrap transition-opacity ease-settle duration-settle';

// Each figure and mark is its own flex item, 6 apart, as the reference's text runs are.
const V = ({ children }: { children: React.ReactNode }) => <Label variant="readout">{children}</Label>;
const Mark = ({ children }: { children: React.ReactNode }) => (
  <Label as="i" variant="readout-dim" className="mu-readout-x">{children}</Label>
);

export const SizeReadout = React.forwardRef<HTMLSpanElement, SizeReadoutProps>(function SizeReadout(
  { width = 0, height = 0, count, copied, value, led = true, className, ...props },
  ref,
) {
  const w = Math.round(width), h = Math.round(height);
  return (
    <Surface ref={ref} as="span" material="graphite-deep" radius="pill" className={className ? `${READOUT} ${className}` : READOUT} {...props}>
      {led && <Led kind="live" />}
      {value !== undefined ? <V>{value}</V> : copied ? (
        <><V>COPIED</V><Mark>·</Mark><V>{copied} {w}</V><Mark>×</Mark><V>{h}</V></>
      ) : count && count > 1 ? (
        <><V>{count}</V><Mark>·</Mark><V>{w}</V><Mark>×</Mark><V>{h}</V></>
      ) : (
        <><V>{w}</V><Mark>×</Mark><V>{h}</V></>
      )}
    </Surface>
  );
});
