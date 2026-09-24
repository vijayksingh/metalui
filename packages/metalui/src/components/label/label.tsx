'use client';

import * as React from 'react';

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
 * placeholder shows in ink3 at 500 while the label is empty; as="input" makes an editable label that keeps the look.
 * Styled with the theme's utilities (the label recipe). */

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

const ENGRAVED = 'type-label-engraved';
const EMPHASIS = '[&_b]:weight-label-emphasis-weight [&_b]:text-label-emphasis-color';
const ROLES: Record<LabelVariant, string> = {
  engraved: `${ENGRAVED} text-label-engraved-color recipe-label-engraved ${EMPHASIS}`,
  small: `type-label-small text-label-engraved-color recipe-label-engraved ${EMPHASIS}`,
  dark: `${ENGRAVED} text-label-dark-color recipe-label-dark`,
  title: 'type-label-title text-label-title-color',
  heading: 'type-label-heading text-label-heading-color',
  query: 'type-label-query text-label-query-color',
  count: 'type-label-count text-label-count-color',
  cell: 'type-label-cell text-label-cell-color',
  value: 'type-label-value text-label-value-color',
  'value-small': 'type-label-value-small text-label-value-small-color',
  display: 'type-label-display text-label-display-color whitespace-normal',
  'display-quiet': 'type-label-display-quiet text-label-display-quiet-color whitespace-normal',
  readout: 'type-label-readout text-label-readout-color',
  'readout-dim': 'type-label-readout not-italic text-label-readout-dim-color',
  'on-graphite': 'type-label-on-graphite text-label-on-graphite-color',
};
const ACCENT: Partial<Record<LabelVariant, string>> = {
  engraved: `${ENGRAVED} text-label-accent-color text-shadow-none ${EMPHASIS}`,
  small: `type-label-small text-label-accent-color text-shadow-none ${EMPHASIS}`,
};
/* An editable label: an input that keeps the look and draws no field of its own. */
const INPUT = 'box-content min-w-0 p-0 m-0 border-0 outline-none bg-transparent caret-green-deep cursor-text field-sizing-content';

export const Label = React.forwardRef<HTMLElement, LabelProps>(function Label({ variant = 'engraved', tone, as = 'span', placeholder, className, ...props }, ref) {
  const Tag = as as React.ElementType;
  const role = tone === 'accent' ? ACCENT[variant] ?? `${ROLES[variant]} text-label-accent-color text-shadow-none` : ROLES[variant];
  const own = `mu-label whitespace-nowrap transition-label ${role}${placeholder !== undefined ? ' label-placeholder' : ''}${as === 'input' ? ` ${INPUT}` : ''}`;
  const hint = as === 'input' ? { placeholder } : { 'data-placeholder': placeholder };
  return <Tag ref={ref} data-variant={variant} data-tone={tone} className={className ? `${own} ${className}` : own} {...hint} {...props} />;
});
