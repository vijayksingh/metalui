'use client';

import * as React from 'react';
import { Tooltip } from '../tooltip/tooltip';
import { Led, type LedKind } from '../led/led';

/* STATUS BADGE (the reference design's .pill.status): an LED part and the state in words.
 * The badge is not pressable; its hint (the command that fixes it) shows as a tooltip on hover and focus.
 * Styled with the theme's utilities (the status recipe). */

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
