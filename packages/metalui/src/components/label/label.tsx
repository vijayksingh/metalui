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
 *   readout, readout-dim  mono on graphite, and the same in its dim ink
 *   on-graphite       sans text on graphite chrome
 *   dark              an engraving on dark chrome
 * tone="accent" turns it green without a lip (a rule that says what a drop will do).
 * placeholder shows in ink3 at 500 while the label is empty; as="input" makes an editable label that keeps the look. */

export type LabelVariant =
  | 'engraved' | 'small' | 'title' | 'heading' | 'query' | 'count' | 'cell' | 'value' | 'value-small'
  | 'display' | 'display-quiet' | 'readout' | 'readout-dim' | 'on-graphite' | 'dark';

export interface LabelProps extends React.HTMLAttributes<HTMLElement> {
  variant?: LabelVariant;
  /** accent: green, no lip. */
  tone?: 'accent';
  as?: 'span' | 'b' | 'i' | 'small' | 'div' | 'h2' | 'h3' | 'p' | 'td' | 'th' | 'input';
  /** Shown in ink3 at 500 while the label is empty (a span), or the input's placeholder. */
  placeholder?: string;
  /** as="input" only. */
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

export const Label = React.forwardRef<HTMLElement, LabelProps>(function Label({ variant = 'engraved', tone, as = 'span', placeholder, className, ...props }, ref) {
  const Tag = as as React.ElementType;
  const hint = as === 'input' ? { placeholder } : { 'data-placeholder': placeholder };
  return <Tag ref={ref} data-variant={variant} data-tone={tone} className={className ? `mu-label ${className}` : 'mu-label'} {...hint} {...props} />;
});
