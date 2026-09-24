'use client';

import * as React from 'react';
import './icon-button.css';

/* ICON BUTTON: a pressable cap with only a glyph.
 *   tool    a graphite cap (38, radius 15); pressed sinks 1 into a dark well; latched (pressed={true})
 *           stays down with a 4 pt green LED top right
 *   ghost   a flat round button (28) that fills on hover
 *   mini    a small flat pill (18 × 16) inside a chip; `accept` greens its glyph on hover
 * It renders a <button>; pass `render` through Base UI parts (Toolbar.Button) to join their focus. */

export interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: 'tool' | 'ghost' | 'mini';
  /** The accessible name (and the tooltip, when the host adds one). */
  label: string;
  icon: React.ReactNode;
  /** Latched: the tool stays pressed with its LED. Omit for a momentary button. */
  pressed?: boolean;
  /** mini: an accept action (✓), green on hover. */
  accept?: boolean;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { variant = 'ghost', label, icon, pressed, accept, className, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      aria-pressed={pressed === undefined ? undefined : pressed}
      data-variant={variant}
      data-pressed={pressed ? '' : undefined}
      data-accept={accept ? '' : undefined}
      className={className ? `mu-icon-button mu-icon-trigger ${className}` : 'mu-icon-button mu-icon-trigger'}
      {...props}
    >
      {icon}
    </button>
  );
});
