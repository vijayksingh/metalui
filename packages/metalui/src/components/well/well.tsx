'use client';

import * as React from 'react';

/* WELL: a sunk field or track. field (inputs), track (switchers, sliders), region (a drawn
 * region on a canvas; `over` lights it as a drop target) and graphite (a well in a dark strip).
 * Styled with the theme's utilities (the well recipe); the look cross-fades on settle. */

export type WellVariant = 'field' | 'track' | 'region' | 'graphite';
export type WellRadius = 'pill' | 'field' | 'region' | 'strip' | 'row';

export interface WellProps extends React.HTMLAttributes<HTMLElement> {
  variant: WellVariant;
  radius?: WellRadius;
  /** A region well lit as a drop target. */
  over?: boolean;
  /** A region unfolded from a folder is washed in the folder's colour (neutral, red, amber, green, blue, violet). */
  hue?: 'neutral' | 'red' | 'amber' | 'green' | 'blue' | 'violet';
  as?: 'div' | 'span' | 'label';
}

const VARIANTS: Record<WellVariant, string> = {
  field: 'recipe-well-field',
  track: 'recipe-well-track',
  region: 'recipe-well-region',
  graphite: 'recipe-well-graphite',
};
const OVER = 'recipe-well-region-over';
const RADII: Record<WellRadius, string> = {
  pill: 'rounded-well-radius-pill',
  field: 'rounded-well-radius-field',
  region: 'rounded-well-radius-region',
  strip: 'rounded-well-radius-strip',
  row: 'rounded-well-radius-row',
};

export const Well = React.forwardRef<HTMLElement, WellProps>(function Well({ variant, radius, over, hue, as = 'div', className, ...props }, ref) {
  const Tag = as as React.ElementType;
  const look = variant === 'region' && over ? OVER : VARIANTS[variant];
  const placed = /(^|\s)(fixed|absolute|sticky|static)(\s|$)/.test(typeof className === 'string' ? className : '');
  const tint = variant === 'region' && hue && hue !== 'neutral' ? ' region-hue' : '';
  const own = `mu-well box-border${placed ? '' : ' relative'} transition-well ${look}${radius ? ` ${RADII[radius]}` : ''}${tint}`;
  return <Tag ref={ref} data-variant={variant} data-radius={radius} data-over={over ? '' : undefined} data-hue={tint ? hue : undefined} className={className ? `${own} ${className}` : own} {...props} />;
});
