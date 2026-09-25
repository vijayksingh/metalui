'use client';

import * as React from 'react';

/* LED (the reference design's .led-*): a tiny lamp lit from the top left that says one state by colour.
 * A part: it never stands alone, it sits beside words (a status badge, a readout, an engraving).
 * Styled with the theme's utilities (the status recipe). */

export type LedKind = 'live' | 'waiting' | 'failed' | 'link' | 'off';
/** How the lamp behaves over time (tokens status.gestures). */
export type LedGesture = 'steady' | 'flicker' | 'breathe' | 'blink2' | 'rise';

export interface LedProps extends React.HTMLAttributes<HTMLSpanElement> {
  kind: LedKind;
  /** 5 (default) or 4 (small). */
  size?: 'default' | 'small';
  /**
   * How it behaves over time: steady (default); flicker, a burst of activity that settles on;
   * breathe, a loop while something is in progress; blink2, two flashes for a failure; rise, coming
   * on slowly. Changing the gesture plays it again. Reduced motion holds the lamp steady.
   */
  gesture?: LedGesture;
}

const LED = 'mu-led inline-block flex-none rounded-round';
const LED_SIZES = {
  default: 'size-status-led-size',
  small: 'size-status-led-size-small',
};
const LED_KINDS: Record<LedKind, string> = {
  live: 'recipe-status-led-live',
  waiting: 'recipe-status-led recipe-status-led-waiting',
  failed: 'recipe-status-led recipe-status-led-failed',
  link: 'recipe-status-led recipe-status-led-link',
  off: 'recipe-status-led-off',
};

const LED_GESTURES: Record<LedGesture, string> = {
  steady: '',
  flicker: 'animate-led-flicker',
  breathe: 'animate-led-breathe',
  blink2: 'animate-led-blink2',
  rise: 'animate-led-rise',
};

/** A tiny lamp, lit from the top left. Decorative: pair it with words. */
export function Led({ kind, size = 'default', gesture = 'steady', className, ...props }: LedProps) {
  const own = `${LED} ${LED_SIZES[size]} ${LED_KINDS[kind]} ${LED_GESTURES[gesture]} reduced-motion:animate-none`;
  // A new gesture (or a new state with the same gesture) remounts the lamp so the gesture plays again.
  return <span key={`${kind}-${gesture}`} aria-hidden data-kind={kind} data-size={size} data-gesture={gesture} className={className ? `${own} ${className}` : own} {...props} />;
}
