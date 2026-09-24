'use client';

import * as React from 'react';
import './label.css';

/* LABEL: text in a set role. engraved (the mono label with a lip, uppercase), small (the same at
 * 8.5), title (an object's name), heading (a page title), count (a mono number), readout (mono on
 * graphite), dark (an engraving on dark chrome). */

export type LabelVariant = 'engraved' | 'small' | 'title' | 'heading' | 'count' | 'readout' | 'dark';

export interface LabelProps extends React.HTMLAttributes<HTMLElement> {
  variant?: LabelVariant;
  as?: 'span' | 'b' | 'div' | 'h2' | 'h3' | 'p';
}

export const Label = React.forwardRef<HTMLElement, LabelProps>(function Label({ variant = 'engraved', as = 'span', className, ...props }, ref) {
  const Tag = as as React.ElementType;
  return <Tag ref={ref} data-variant={variant} className={className ? `mu-label ${className}` : 'mu-label'} {...props} />;
});
