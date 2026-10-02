'use client';

import * as React from 'react';
import { Tooltip } from '../tooltip/tooltip';
import { Led, type LedKind, type LedGesture } from '../led/led';

export type StatusTone = 'default' | 'quiet' | 'strong';
export type StatusSurface = 'solid' | 'transparent' | 'frosted';
export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  led: LedKind;
  children: React.ReactNode;
  hint?: string;
  /** Quiet is words + lamp on a controlled ground. Strong tints an opaque plate. */
  tone?: StatusTone;
  /** Transparent = strong frost fill; frosted also adds the shared backdrop blur. */
  surface?: StatusSurface;
  /** Forces an opaque plate, even for quiet or an explicitly translucent surface. */
  solid?: boolean;
  gesture?: LedGesture;
}
const BADGE = 'mu-badge relative isolate inline-flex items-center gap-status-badge-gap h-status-badge-height rounded-pill whitespace-nowrap type-status-badge uppercase cursor-default focus-visible:focus-ring';

/** System state in words, beside its decorative lamp. A hint uses Base UI Tooltip. */
export const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(function StatusBadge({
  led, children, hint, tone = 'default', surface = 'solid', solid = false, gesture, className, style, ...props
}, ref) {
  const quiet = tone === 'quiet' && !solid;
  const material = quiet || solid || tone === 'strong' ? 'solid' : surface;
  const plate = !quiet;
  const own = `${BADGE} ${plate ? 'px-status-badge-pad recipe-status-badge status-surface' : ''} ${plate && material !== 'solid' ? 'text-ink' : 'text-ink2'}`;
  const badge = <span ref={ref} role="status" aria-atomic="true" tabIndex={hint ? 0 : undefined} aria-description={hint}
    data-tone={tone} data-surface={material} data-solid={solid || undefined} data-mu-self=""
    className={`${own} ${className ?? ''}`} style={{ '--mu-self': `var(--mu-r-status-ink-${led})`, ...style } as React.CSSProperties} {...props}>
    {tone === 'strong' && <span aria-hidden className="pointer-events-none absolute inset-0 -z-10 rounded-pill status-strong-tint" />}
    <Led kind={led} gesture={gesture} />{children}
  </span>;
  return hint ? <Tooltip label={hint} side="bottom" offset={8} wrap>{badge}</Tooltip> : badge;
});
