'use client';

import * as React from 'react';
import './label.css';

/* LABEL: text in a set role.
 *   engraved, small   the mono label with a lip, uppercase (small at 8.5)
 *   title, heading    an object's name, a page title
 *   query             a pinned query's words
 *   count, cell       a mono number; a mono table cell
 *   value, value-small  a measured value in mono (22, 12)
 *   display, display-quiet  a large line and its quieter continuation
 *   readout, readout-dim  mono on graphite and its dim part
 *   on-graphite       sans text on graphite chrome
 *   dark              an engraving on dark chrome
 * as="input" makes an editable label that keeps the look. */

export type LabelVariant =
  | 'engraved' | 'small' | 'title' | 'heading' | 'query' | 'count' | 'cell' | 'value' | 'value-small'
  | 'display' | 'display-quiet' | 'readout' | 'readout-dim' | 'on-graphite' | 'dark';

export interface LabelProps extends React.HTMLAttributes<HTMLElement> {
  variant?: LabelVariant;
  as?: 'span' | 'b' | 'i' | 'small' | 'div' | 'h2' | 'h3' | 'p' | 'td' | 'th' | 'input';
  /** as="input" only. */
  value?: string;
  placeholder?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

export const Label = React.forwardRef<HTMLElement, LabelProps>(function Label({ variant = 'engraved', as = 'span', className, ...props }, ref) {
  const Tag = as as React.ElementType;
  return <Tag ref={ref} data-variant={variant} className={className ? `mu-label ${className}` : 'mu-label'} {...props} />;
});
