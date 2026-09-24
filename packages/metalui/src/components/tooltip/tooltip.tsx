'use client';

import * as React from 'react';
import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';
import './tooltip.css';

/* ─────────────────────────────────────────────────────────
 * TOOLTIP (the brief; the reference design's #tip and .tb[data-tip]) on Base UI Tooltip
 *   rest      nothing
 *   120 ms    hovered or focused: a graphite label chip fades in on settle, 10 from the trigger
 *   group     inside one TooltipProvider, moving to the next trigger shows the next at once
 *   edge      flips to the other side near the edge (Base UI collision avoidance)
 *   leave     fades out on settle; a press hides it
 * "SELECT · V": the name, then the key dimmed. Never interactive: pointer passes through.
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
  /** What the control is: "Select". The trigger still needs its own accessible name (aria-label). */
  label: string;
  /** The key, shown dimmed after the name: "V", "⌘Z". */
  shortcut?: string;
  /** Where it sits. Default top; it flips near the edge. */
  side?: 'top' | 'bottom' | 'left' | 'right';
  /** The trigger. It must accept a ref and props (a button, a ToolButton's cap). */
  children: React.ReactElement;
  /** Controlled open state (a docs still, a test). */
  open?: boolean;
}

/** Names an icon-only control and its key, one hover away. */
export function Tooltip({ label, shortcut, side = 'top', children, open }: TooltipProps) {
  return (
    <BaseTooltip.Root open={open}>
      <BaseTooltip.Trigger render={children} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner className="mu-tooltip-positioner" side={side} sideOffset={gap()} collisionPadding={8}>
          <BaseTooltip.Popup className="mu-tooltip">
            {label}
            {shortcut && <span className="mu-tooltip-key"> · {shortcut}</span>}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}

/** Groups tooltips: after one shows, the next trigger shows its own at once. Wrap a toolbar or a panel. */
export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <BaseTooltip.Provider delay={delayMs()}>{children}</BaseTooltip.Provider>;
}
