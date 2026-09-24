'use client';

import * as React from 'react';
import { Switch as BaseSwitch } from '@base-ui/react/switch';

/* ─────────────────────────────────────────────────────────
 * SWITCH (the reference design's .tog) on Base UI Switch
 *
 * A setting that is on or off and takes effect at once.
 *
 *   off       a sunk pill track (the track well) with a raised round thumb at the left
 *   on        the thumb slides right on the part spring (a track with ends, so it may
 *             overshoot against the stop) and the track fills with a soft green
 *   pressed   the thumb stretches toward where it is going (4 pt), so the press already
 *             points at the result; releasing lets it travel
 *   focus     the green ring at offset 2 (keyboard only); Space toggles
 *   disabled  40 %
 * Two sizes: regular 40 × 24 (settings rows), small 32 × 20 (dense cards).
 * Reduce Motion: the thumb moves at once; the colour still fades.
 * ───────────────────────────────────────────────────────── */

export interface SwitchProps extends Omit<BaseSwitch.Root.Props, 'className' | 'render'> {
  size?: 'regular' | 'small';
  /** Its accessible name, when no visible label names it. */
  'aria-label'?: string;
  className?: string;
}

const ROOT = 'mu-switch group/sw relative box-border inline-flex flex-none items-center p-switch-pad rounded-pill border-0 cursor-pointer outline-none recipe-switch data-checked:recipe-switch-on transition-switch-track focus-visible:focus-ring data-disabled:opacity-switch-disabled data-disabled:cursor-default tap-highlight-none';
const SIZE = {
  regular: 'w-switch-width h-switch-height',
  small: 'w-switch-small-width h-switch-small-height',
};
const THUMB_BASE = 'mu-switch-thumb block rounded-pill recipe-switch-thumb transition-switch-thumb reduced-motion:transition-none';
const THUMB = {
  regular: 'h-switch-thumb-size w-switch-thumb-size group-data-checked/sw:switch-thumb-on group-active/sw:switch-thumb-pressed group-active/sw:group-data-checked/sw:switch-thumb-on-pressed',
  small: 'h-switch-small-thumb w-switch-small-thumb group-data-checked/sw:switch-small-thumb-on group-active/sw:switch-small-thumb-pressed group-active/sw:group-data-checked/sw:switch-small-thumb-on-pressed',
};

/** A setting that is on or off, taking effect at once. */
export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(function Switch({ size = 'regular', className, ...props }, ref) {
  return (
    <BaseSwitch.Root ref={ref} data-size={size} className={[ROOT, SIZE[size], className].filter(Boolean).join(' ')} {...props}>
      <BaseSwitch.Thumb className={`${THUMB_BASE} ${THUMB[size]}`} />
    </BaseSwitch.Root>
  );
});
