'use client';

import * as React from 'react';
import { RadioGroup } from '@base-ui/react/radio-group';
import { Radio } from '@base-ui/react/radio';
import { SlidingIndicator } from '../../motion/indicator';

/* ─────────────────────────────────────────────────────────
 * SWITCHER (object sheet) on Base UI RadioGroup
 *
 *   rest      a well track; options in ink2, the selected one a raised thumb in ink
 *   hover     the label turns ink (settle)
 *   select    the thumb glides to the new option on the part spring (a track with
 *             ends, so it may overshoot against the stop); labels recolour on settle
 *   focus     a 1.5 ring with no offset (a dense strip); arrows move the selection
 *   disabled  40 %
 * First paint and resizing place the thumb without motion. Reduce Motion: it moves at once.
 * ───────────────────────────────────────────────────────── */

export interface SwitcherOption<V extends string = string> {
  value: V;
  label: React.ReactNode;
  /** A leading glyph at the size the height gives (12 in 24, 14 in 28). */
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SwitcherProps<V extends string = string> {
  options: SwitcherOption<V>[];
  value?: V;
  defaultValue?: V;
  onValueChange?: (value: V) => void;
  /** compact is 24 tall (in a lens bar, a strip), regular 28. */
  size?: 'compact' | 'regular';
  disabled?: boolean;
  'aria-label': string;
  className?: string;
}

/* Styled with the theme's utilities (the switcher recipe): a track well, a raised thumb that glides
 * to the chosen option, and options that ink up on hover and when chosen. */
const TRACK = 'mu-switcher relative inline-flex p-switcher-pad rounded-pill recipe-switcher data-disabled:opacity-switcher-option-disabled';
const THUMB = 'mu-switcher-thumb rounded-pill recipe-switcher-thumb';
const OPTION = {
  compact: 'mu-switcher-option relative z-1 inline-flex items-center gap-switcher-gap h-switcher-option-height px-switcher-option-pad-x m-0 border-0 rounded-pill bg-transparent whitespace-nowrap type-switcher-option text-switcher-option-ink cursor-pointer tap-highlight-none transition-switcher-option hover:text-switcher-option-ink-on data-checked:text-switcher-option-ink-on data-active:text-switcher-option-ink-on focus-visible:switcher-option-focus data-disabled:opacity-switcher-option-disabled data-disabled:cursor-default',
  regular: 'mu-switcher-option relative z-1 inline-flex items-center gap-switcher-gap h-switcher-option-height-regular px-switcher-option-pad-x m-0 border-0 rounded-pill bg-transparent whitespace-nowrap type-switcher-option text-switcher-option-ink cursor-pointer tap-highlight-none transition-switcher-option hover:text-switcher-option-ink-on data-checked:text-switcher-option-ink-on data-active:text-switcher-option-ink-on focus-visible:switcher-option-focus data-disabled:opacity-switcher-option-disabled data-disabled:cursor-default',
};

/** The track, thumb and option looks, shared with Tabs: one look for "one of a few", two behaviours. */
export const trackParts = { TRACK, THUMB, OPTION } as const;

/** A pill of pills: one of a few views or modes, always visible. */
export function Switcher<V extends string = string>({ options, value, defaultValue, onValueChange, size = 'regular', disabled, className, ...props }: SwitcherProps<V>) {
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
        <Radio.Root key={o.value} value={o.value} disabled={o.disabled} className={OPTION[size]}>
          {o.icon}
          {o.label}
        </Radio.Root>
      ))}
    </RadioGroup>
  );
}

/** @deprecated Renamed to Switcher. */
export const Segmented = Switcher;
/** @deprecated Renamed to SwitcherProps. */
export type SegmentedProps<V extends string = string> = SwitcherProps<V>;
/** @deprecated Renamed to SwitcherOption. */
export type SegmentedOption<V extends string = string> = SwitcherOption<V>;
