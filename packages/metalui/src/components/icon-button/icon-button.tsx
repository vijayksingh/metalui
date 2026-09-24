'use client';

import * as React from 'react';

/* ICON BUTTON: a pressable cap with only a glyph.
 *   tool    a graphite cap (38, radius 15); pressed sinks 1 into a dark well; latched (pressed={true})
 *           stays down with a 4 pt green LED top right
 *   ghost   a flat round button (28) that fills on hover
 *   mini    a small flat pill (18 × 16) inside a chip; `accept` greens its glyph on hover
 * It renders a <button>; pass `render` through Base UI parts (Toolbar.Button) to join their focus.
 * Styled with the theme's utilities (the icon-button recipe). */

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

const FRAME = 'relative box-border inline-grid place-items-center flex-none p-0 border-0 bg-transparent cursor-pointer tap-highlight-none focus-visible:focus-ring-flush disabled:cursor-default disabled:opacity-button-disabled';
const VARIANTS = {
  tool: 'size-icon-button-tool-size rounded-icon-button-tool-radius text-icon-button-tool-ink recipe-icon-button-tool transition-icon-button-tool [&>svg]:size-icon-button-tool-glyph active:translate-y-icon-button-tool-press active:recipe-icon-button-tool-pressed data-pressed:translate-y-icon-button-tool-press data-pressed:recipe-icon-button-tool-pressed data-pressed:after:absolute data-pressed:after:top-icon-button-led-inset data-pressed:after:right-icon-button-led-inset data-pressed:after:size-icon-button-led-size data-pressed:after:rounded-full data-pressed:after:recipe-icon-button-led',
  ghost: 'size-icon-button-ghost-size rounded-pill text-icon-button-ghost-ink transition-icon-button [&>svg]:size-icon-button-ghost-glyph hover:recipe-icon-button-ghost-hover hover:text-icon-button-ghost-ink-hover',
  mini: 'w-icon-button-mini-w h-icon-button-mini-h rounded-pill type-icon-button-mini text-icon-button-mini-ink transition-icon-button hover:recipe-icon-button-mini-hover hover:text-icon-button-mini-ink-hover',
};
const ACCEPT = 'hover:text-icon-button-mini-accept-ink';

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { variant = 'ghost', label, icon, pressed, accept, className, type = 'button', ...props },
  ref,
) {
  const own = `mu-icon-button mu-icon-trigger ${FRAME} ${VARIANTS[variant]}${variant === 'mini' && accept ? ` ${ACCEPT}` : ''}`;
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      aria-pressed={pressed === undefined ? undefined : pressed}
      data-variant={variant}
      data-pressed={pressed ? '' : undefined}
      data-accept={accept ? '' : undefined}
      className={className ? `${own} ${className}` : own}
      {...props}
    >
      {icon}
    </button>
  );
});
