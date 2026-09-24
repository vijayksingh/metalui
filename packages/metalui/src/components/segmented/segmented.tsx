'use client';

import * as React from 'react';
import { RadioGroup } from '@base-ui/react/radio-group';
import { Radio } from '@base-ui/react/radio';
import { SlidingIndicator } from '../../motion/indicator';
import './segmented.css';

/* ─────────────────────────────────────────────────────────
 * SEGMENTED CONTROL (KAMUI-04) on Base UI RadioGroup
 *
 *   rest      a well track; segments in ink2, the selected one a raised thumb in ink
 *   hover     the label turns ink (settle)
 *   select    the thumb glides to the new segment on the part spring (a track with
 *             ends, so it may overshoot against the stop); labels recolour on settle
 *   focus     a 1.5 ring with no offset (a dense strip); arrows move the selection
 *   disabled  40 %
 * First paint and resizing place the thumb without motion. Reduce Motion: it moves at once.
 * ───────────────────────────────────────────────────────── */

export interface SegmentedOption<V extends string = string> {
  value: V;
  label: React.ReactNode;
  /** A leading glyph at the size the height gives (12 in 24, 14 in 28). */
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SegmentedProps<V extends string = string> {
  options: SegmentedOption<V>[];
  value?: V;
  defaultValue?: V;
  onValueChange?: (value: V) => void;
  /** compact is 24 tall (in a lens bar, a strip), regular 28. */
  size?: 'compact' | 'regular';
  disabled?: boolean;
  'aria-label': string;
  className?: string;
}

/** A pill of pills: one of a few views or modes, always visible. */
export function Segmented<V extends string = string>({ options, value, defaultValue, onValueChange, size = 'regular', disabled, className, ...props }: SegmentedProps<V>) {
  return (
    <RadioGroup
      value={value}
      defaultValue={defaultValue}
      onValueChange={(v) => onValueChange?.(v as V)}
      disabled={disabled}
      aria-label={props['aria-label']}
      data-size={size}
      className={className ? `mu-segmented ${className}` : 'mu-segmented'}
    >
      <SlidingIndicator className="mu-segmented-thumb" />
      {options.map((o) => (
        <Radio.Root key={o.value} value={o.value} disabled={o.disabled} className="mu-segment type-ui">
          {o.icon}
          {o.label}
        </Radio.Root>
      ))}
    </RadioGroup>
  );
}
