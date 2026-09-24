'use client';

import * as React from 'react';
import { Tooltip } from '../tooltip/tooltip';

/* LED and STATUS BADGE (the reference design's .led-*, .pill.status).
 * An LED says one state by colour and never alone: it sits beside words (a badge, a readout, an engraving).
 * The badge is not pressable; its hint (the command that fixes it) shows as a tooltip on hover and focus.
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

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  led: LedKind;
  /** The state, short, uppercase in the label role: "SYNC LIVE", "OFFLINE · ADD KEY TO KEYCHAIN". */
  children: React.ReactNode;
  /** What fixes it, shown on hover and focus: "security add-generic-password -s example-service …". */
  hint?: string;
}

const BADGE = 'mu-badge inline-flex items-center gap-status-badge-gap h-status-badge-height px-status-badge-pad rounded-pill whitespace-nowrap type-status-badge uppercase text-ink2 recipe-status-badge cursor-default focus-visible:focus-ring';

/** A state the system is in, with its LED. Not a button. */
export const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(function StatusBadge({ led, children, hint, className, ...props }, ref) {
  const badge = (
    <span ref={ref} role="status" tabIndex={hint ? 0 : undefined} aria-description={hint} className={className ? `${BADGE} ${className}` : BADGE} {...props}>
      <Led kind={led} />
      {children}
    </span>
  );
  if (!hint) return badge;
  return (
    <Tooltip label={hint} side="bottom" offset={8} wrap>
      {badge}
    </Tooltip>
  );
});
