'use client';

import * as React from 'react';

/* LED (the reference design's .led-*): a tiny lamp lit from the top left that says one state by colour.
 * A part: it never stands alone, it sits beside words (a status badge, a readout, an engraving).
 * Styled with the theme's utilities (the status recipe). */

export type LedKind = 'live' | 'waiting' | 'failed' | 'link' | 'off';

export interface LedProps extends React.HTMLAttributes<HTMLSpanElement> {
  kind: LedKind;
  /** 5 (default) or 4 (small). */
  size?: 'default' | 'small';
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

/** A tiny lamp, lit from the top left. Decorative: pair it with words. */
export function Led({ kind, size = 'default', className, ...props }: LedProps) {
  const own = `${LED} ${LED_SIZES[size]} ${LED_KINDS[kind]}`;
  return <span aria-hidden data-kind={kind} data-size={size} className={className ? `${own} ${className}` : own} {...props} />;
}
