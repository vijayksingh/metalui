'use client';

import * as React from 'react';
import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';

/* ─────────────────────────────────────────────────────────
 * TOOLTIP (the brief; the reference design's #tip and .tb[data-tip]) on Base UI Tooltip
 *   rest      nothing
 *   120 ms    hovered or focused: a graphite label chip fades in on settle, 10 from the trigger
 *   group     inside one TooltipProvider, moving to the next trigger shows the next at once
 *   edge      flips to the other side near the edge (Base UI collision avoidance)
 *   leave     fades out on settle; a press hides it
 * "SELECT · V": the name, then the key dimmed. Never interactive: pointer passes through.
 * wrap: a longer note (where a thing came from) wraps at 280, its detail in Tooltip.Dim.
 * ───────────────────────────────────────────────────────── */

const delayMs = () => {
  if (typeof window === 'undefined') return 120;
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--mu-tooltip-delay-ms')) || 120;
};
const gap = () => {
  if (typeof window === 'undefined') return 10;
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--mu-tooltip-gap')) || 10;
};

export interface TooltipProps {
  /** What the control is: "Select", or a note with a Tooltip.Dim detail. The trigger still needs its own accessible name (aria-label). */
  label: React.ReactNode;
  /** The key, shown dimmed after the name: "V", "⌘Z". */
  shortcut?: string;
  /** Where it sits. Default top; it flips near the edge. */
  side?: 'top' | 'bottom' | 'left' | 'right';
  /** The trigger. It must accept a ref and props (a button, a ToolButton's cap). */
  children: React.ReactElement;
  /** Controlled open state (a docs still, a test). */
  open?: boolean;
  /** A note that wraps at the max width instead of one line. */
  wrap?: boolean;
  /** Its own hover delay in ms (a note waits longer than a name); default the provider's. */
  delay?: number;
  /** Its own distance from the trigger (clear a chip the trigger shows on hover); default 10. */
  offset?: number;
  /** A class on the popup (a block's hook). */
  className?: string;
}

/* Styled with the theme's utilities (the tooltip recipe): the graphite chip fades in and out on settle. */
const POSITIONER = 'mu-tooltip-positioner z-tooltip-z';
const POPUP = 'mu-tooltip max-w-tooltip-max-width py-tooltip-pad-y px-tooltip-pad-x rounded-tooltip-radius pointer-events-none type-tooltip text-tooltip-ink recipe-tooltip transition-tooltip data-starting-style:opacity-0 data-ending-style:opacity-0 data-instant:transition-none';
const KEY = 'mu-tooltip-key text-tooltip-key-ink';

/** Names an icon-only control and its key, one hover away. */
function TooltipRoot({ label, shortcut, side = 'top', children, open, wrap, delay, offset, className }: TooltipProps) {
  return (
    <BaseTooltip.Root open={open}>
      <BaseTooltip.Trigger delay={delay} render={children} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner className={POSITIONER} side={side} sideOffset={offset ?? gap()} collisionPadding={8}>
          <BaseTooltip.Popup className={`${POPUP} ${wrap ? 'whitespace-normal' : 'whitespace-nowrap'}${className ? ` ${className}` : ''}`} data-wrap={wrap ? '' : undefined}>
            {label}
            {shortcut && <span className={KEY}> · {shortcut}</span>}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}

/** The dimmed part of a tooltip: a key, or a note's detail ("· 14:10 · confident"). */
function Dim({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={className ? `${KEY} ${className}` : KEY} {...props} />;
}

export const Tooltip = Object.assign(TooltipRoot, { Root: TooltipRoot, Dim });

/** Groups tooltips: after one shows, the next trigger shows its own at once. Wrap a toolbar or a panel. */
export function TooltipProvider({ children, delay }: { children: React.ReactNode; delay?: number }) {
  return <BaseTooltip.Provider delay={delay ?? delayMs()}>{children}</BaseTooltip.Provider>;
}
