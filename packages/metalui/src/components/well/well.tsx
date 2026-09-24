'use client';

import * as React from 'react';
import './well.css';

/* WELL: a sunk field or track. field (inputs), track (segmented controls, sliders), region (a drawn
 * region on a canvas; `over` lights it as a drop target) and graphite (a well in a dark strip). */

export type WellVariant = 'field' | 'track' | 'region' | 'graphite';
export type WellRadius = 'pill' | 'field' | 'region' | 'strip' | 'row';

export interface WellProps extends React.HTMLAttributes<HTMLElement> {
  variant: WellVariant;
  radius?: WellRadius;
  /** A region well lit as a drop target. */
  over?: boolean;
  as?: 'div' | 'span' | 'label';
}

export const Well = React.forwardRef<HTMLElement, WellProps>(function Well({ variant, radius, over, as = 'div', className, ...props }, ref) {
  const Tag = as as React.ElementType;
  return <Tag ref={ref} data-variant={variant} data-radius={radius} data-over={over ? '' : undefined} className={className ? `mu-well ${className}` : 'mu-well'} {...props} />;
});
