'use client';

import * as React from 'react';
import { RadioGroup } from '@base-ui/react/radio-group';
import { Radio } from '@base-ui/react/radio';
import { SlidingIndicator } from '../../motion/indicator';

/* ─────────────────────────────────────────────────────────
 * SEGMENTED CONTROL (object sheet) on Base UI RadioGroup
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

/* Styled with the theme's utilities (the segmented recipe): a track well, a raised thumb that glides
 * to the chosen segment, and segments that ink up on hover and when chosen. */
const TRACK = 'mu-segmented relative inline-flex p-segmented-pad rounded-pill recipe-segmented data-disabled:opacity-segmented-segment-disabled';
const THUMB = 'mu-segmented-thumb rounded-pill recipe-segmented-thumb';
const SEGMENT = {
  compact: 'mu-segment relative z-1 inline-flex items-center gap-segmented-gap h-segmented-segment-height px-segmented-segment-pad-x m-0 border-0 rounded-pill bg-transparent whitespace-nowrap type-segmented-segment text-segmented-segment-ink cursor-pointer tap-highlight-none transition-segmented-segment hover:text-segmented-segment-ink-on data-checked:text-segmented-segment-ink-on focus-visible:segment-focus data-disabled:opacity-segmented-segment-disabled data-disabled:cursor-default',
  regular: 'mu-segment relative z-1 inline-flex items-center gap-segmented-gap h-segmented-segment-height-regular px-segmented-segment-pad-x m-0 border-0 rounded-pill bg-transparent whitespace-nowrap type-segmented-segment text-segmented-segment-ink cursor-pointer tap-highlight-none transition-segmented-segment hover:text-segmented-segment-ink-on data-checked:text-segmented-segment-ink-on focus-visible:segment-focus data-disabled:opacity-segmented-segment-disabled data-disabled:cursor-default',
};

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
      className={className ? `${TRACK} ${className}` : TRACK}
    >
      <SlidingIndicator className={THUMB} />
      {options.map((o) => (
        <Radio.Root key={o.value} value={o.value} disabled={o.disabled} className={SEGMENT[size]}>
          {o.icon}
          {o.label}
        </Radio.Root>
      ))}
    </RadioGroup>
  );
}
