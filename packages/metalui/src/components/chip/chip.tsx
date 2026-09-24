'use client';

import * as React from 'react';
import './chip.css';

/* CHIP: a small pill with an optional leading LED or glyph and trailing actions.
 *   suggestion     frosted with a green hairline (a question with its confidence and ✓ ×)
 *   glass          a dark tag on a glass screen (an LED and a kind)
 *   glass-action   a light cap on glass (OPEN ↗), brighter on hover
 * Slots: Chip.Root, Chip.Lead, Chip.Text, Chip.Actions. */

export interface ChipRootProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'suggestion' | 'glass' | 'glass-action';
  as?: 'span' | 'div' | 'a' | 'button';
  href?: string;
  target?: string;
  rel?: string;
}

const Root = React.forwardRef<HTMLElement, ChipRootProps>(function ChipRoot({ variant = 'suggestion', as = 'span', className, ...props }, ref) {
  const Tag = as as React.ElementType;
  return <Tag ref={ref} data-variant={variant} className={className ? `mu-chip ${className}` : 'mu-chip'} {...props} />;
});

/** The leading LED (`led="link" | "code"`) or a glyph (children). */
function Lead({ led, children, className, ...props }: React.HTMLAttributes<HTMLSpanElement> & { led?: 'link' | 'code' }) {
  return (
    <span aria-hidden data-led={led} className={className ? `mu-chip-lead ${className}` : 'mu-chip-lead'} {...props}>
      {children}
    </span>
  );
}
function Text({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={className ? `mu-chip-text ${className}` : 'mu-chip-text'} {...props} />;
}
function Actions({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={className ? `mu-chip-actions ${className}` : 'mu-chip-actions'} {...props} />;
}

export const Chip = Object.assign(Root, { Root, Lead, Text, Actions });
export type ChipProps = ChipRootProps;
