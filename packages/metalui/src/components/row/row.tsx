'use client';

import * as React from 'react';

/* ROW: a row in a list.
 *   list     a compact row of a pinned query (5 / 8, radius 12, 13 pt); hover raises it
 *   panel    a row of a gathered panel (8 / 12, radius 14, 14 pt); hover raises it
 *   option   a palette row (36 tall, radius 12); the active one raises with a green rail
 * checked strikes the text in ink3; maybe fades a weak match. Slots: Row.Root, Row.Lead, Row.Text, Row.Trail.
 * Styled with the theme's utilities (the row recipe). */

export interface RowRootProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'list' | 'panel' | 'option';
  checked?: boolean;
  /** option: the active row. */
  active?: boolean;
  /** a weak match, faded. */
  maybe?: boolean;
  as?: 'div' | 'li' | 'tr' | 'button';
}

const FRAME = 'group/row relative box-border flex text-ink cursor-pointer outline-none data-maybe:opacity-row-maybe';
const VARIANTS = {
  list: 'items-start gap-row-list-gap py-row-list-pad-y px-row-list-pad-x rounded-row-list-radius type-row-list transition-row hover:recipe-row-list-hover focus-visible:recipe-row-list-hover',
  panel: 'items-start gap-row-panel-gap py-row-panel-pad-y px-row-panel-pad-x rounded-row-panel-radius type-row-panel transition-row hover:recipe-row-panel-hover focus-visible:recipe-row-panel-hover',
  option: `items-center gap-row-option-gap h-row-option-height px-row-option-pad-x rounded-row-option-radius type-row-option [&>svg]:size-row-option-glyph [&>svg]:flex-none [&>svg]:text-ink2 [&>.mu-row-lead>svg]:size-row-option-glyph [&>.mu-row-lead>svg]:text-ink2 data-active:recipe-row-option-on data-highlighted:recipe-row-option-on data-active:before:absolute data-active:before:left-row-rail-offset data-active:before:top-row-rail-inset data-active:before:bottom-row-rail-inset data-active:before:w-row-rail-w data-active:before:rounded-row-rail-radius data-active:before:bg-row-rail-color data-highlighted:before:absolute data-highlighted:before:left-row-rail-offset data-highlighted:before:top-row-rail-inset data-highlighted:before:bottom-row-rail-inset data-highlighted:before:w-row-rail-w data-highlighted:before:rounded-row-rail-radius data-highlighted:before:bg-row-rail-color`,
};
const LEAD = 'mu-row-lead inline-flex flex-none';
const TEXT = 'mu-row-text flex-1 min-w-0 group-data-checked/row:text-row-text-checked group-data-checked/row:line-through';
const TRAIL = 'mu-row-trail inline-flex items-center gap-row-option-gap ml-auto';

const Root = React.forwardRef<HTMLElement, RowRootProps>(function RowRoot({ variant = 'list', checked, active, maybe, as = 'div', className, ...props }, ref) {
  const Tag = as as React.ElementType;
  const own = `mu-row ${FRAME} ${VARIANTS[variant]}`;
  return (
    <Tag
      ref={ref}
      data-variant={variant}
      data-checked={checked ? '' : undefined}
      data-active={active ? '' : undefined}
      data-maybe={maybe ? '' : undefined}
      className={className ? `${own} ${className}` : own}
      {...props}
    />
  );
});
function Lead({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={className ? `${LEAD} ${className}` : LEAD} {...props} />;
}
function Text({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={className ? `${TEXT} ${className}` : TEXT} {...props} />;
}
function Trail({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={className ? `${TRAIL} ${className}` : TRAIL} {...props} />;
}

export const Row = Object.assign(Root, { Root, Lead, Text, Trail });
export type RowProps = RowRootProps;
