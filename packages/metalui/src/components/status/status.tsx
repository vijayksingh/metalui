'use client';

import * as React from 'react';
import { Tooltip } from '../tooltip/tooltip';
import './status.css';

/* LED and STATUS BADGE (the reference design's .led-*, .pill.status).
 * An LED says one state by colour and never alone: it sits beside words (a badge, a readout, an engraving).
 * The badge is not pressable; its hint (the command that fixes it) shows as a tooltip on hover and focus. */

export type LedKind = 'live' | 'waiting' | 'failed' | 'link' | 'off';

export interface LedProps extends React.HTMLAttributes<HTMLSpanElement> {
  kind: LedKind;
  /** 5 (default) or 4 (small). */
  size?: 'default' | 'small';
}

/** A tiny lamp, lit from the top left. Decorative: pair it with words. */
export function Led({ kind, size = 'default', className, ...props }: LedProps) {
  return <span aria-hidden data-kind={kind} data-size={size} className={className ? `mu-led ${className}` : 'mu-led'} {...props} />;
}

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  led: LedKind;
  /** The state, short, uppercase in the label role: "SYNC LIVE", "OFFLINE · ADD KEY TO KEYCHAIN". */
  children: React.ReactNode;
  /** What fixes it, shown on hover and focus: "security add-generic-password -s example-service …". */
  hint?: string;
}

/** A state the system is in, with its LED. Not a button. */
export const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(function StatusBadge({ led, children, hint, className, ...props }, ref) {
  const badge = (
    <span ref={ref} role="status" tabIndex={hint ? 0 : undefined} aria-description={hint} className={['mu-badge', 'mu-type-label', className].filter(Boolean).join(' ')} {...props}>
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
