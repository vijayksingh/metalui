'use client';

import * as React from 'react';
import './row.css';

/* ROW: a row in a list.
 *   list     a compact row of a pinned query (5 / 8, radius 12, 13 pt); hover raises it
 *   panel    a row of a gathered panel (8 / 12, radius 14, 14 pt); hover raises it
 *   option   a palette row (36 tall, radius 12); the active one raises with a green rail
 * checked strikes the text in ink3; maybe fades a weak match. Slots: Row.Root, Row.Lead, Row.Text, Row.Trail. */

export interface RowRootProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'list' | 'panel' | 'option';
  checked?: boolean;
  /** option: the active row. */
  active?: boolean;
  /** a weak match, faded. */
  maybe?: boolean;
  as?: 'div' | 'li' | 'tr' | 'button';
}

const Root = React.forwardRef<HTMLElement, RowRootProps>(function RowRoot({ variant = 'list', checked, active, maybe, as = 'div', className, ...props }, ref) {
  const Tag = as as React.ElementType;
  return (
    <Tag
      ref={ref}
      data-variant={variant}
      data-checked={checked ? '' : undefined}
      data-active={active ? '' : undefined}
      data-maybe={maybe ? '' : undefined}
      className={className ? `mu-row ${className}` : 'mu-row'}
      {...props}
    />
  );
});
function Lead({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={className ? `mu-row-lead ${className}` : 'mu-row-lead'} {...props} />;
}
function Text({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={className ? `mu-row-text ${className}` : 'mu-row-text'} {...props} />;
}
function Trail({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={className ? `mu-row-trail ${className}` : 'mu-row-trail'} {...props} />;
}

export const Row = Object.assign(Root, { Root, Lead, Text, Trail });
export type RowProps = RowRootProps;
