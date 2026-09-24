'use client';

import * as React from 'react';

/* SURFACE: a raised plate or card from a material recipe. The primitive every floating or raised
 * object is built on: pills, cards, panels, popovers, strips. It draws the material and its radius
 * and nothing else; content and layout are the caller's.
 *   graphite         the dock's graphite, over a blur(22) saturate(1.6) backdrop
 *   graphite-plain   the same fill with no backdrop (a banner, a tip, a chip)
 *   graphite-strip   the same fill over a plain blur(22) (a tool strip over a selection)
 * Styled with the theme's utilities (the surface recipe); frosted materials turn opaque under
 * Reduce Transparency. */

export type SurfaceMaterial = 'raise' | 'raise-lite' | 'raise-sm' | 'frost' | 'plate' | 'panel' | 'pop' | 'tip' | 'lens' | 'graphite' | 'graphite-plain' | 'graphite-strip' | 'graphite-deep' | 'graphite-glass';
export type SurfaceRadius = 'pill' | 'hero' | 'card' | 'plate' | 'strip' | 'region' | 'tip' | 'row';

export interface SurfaceProps extends React.HTMLAttributes<HTMLElement> {
  material: SurfaceMaterial;
  radius?: SurfaceRadius;
  /** The element to render (default div). */
  as?: 'div' | 'span' | 'section' | 'nav' | 'header' | 'aside';
}

const OPAQUE = 'reduce-transparency:opaque-frost';
const MATERIALS: Record<SurfaceMaterial, string> = {
  raise: 'recipe-surface-raise',
  'raise-lite': 'recipe-surface-raise-lite',
  'raise-sm': 'recipe-surface-raise-sm',
  frost: `recipe-surface-frost backdrop-surface-blur-frost ${OPAQUE}`,
  plate: `recipe-surface-plate backdrop-surface-blur-plate ${OPAQUE}`,
  panel: `recipe-surface-panel backdrop-surface-blur-panel ${OPAQUE}`,
  pop: `recipe-surface-pop backdrop-surface-blur-pop ${OPAQUE}`,
  tip: `recipe-surface-tip backdrop-surface-blur-tip ${OPAQUE}`,
  lens: `recipe-surface-lens backdrop-surface-blur-lens ${OPAQUE}`,
  graphite: 'recipe-surface-graphite backdrop-surface-blur-graphite',
  'graphite-plain': 'recipe-surface-graphite',
  'graphite-strip': 'recipe-surface-graphite backdrop-surface-blur-graphite-strip',
  'graphite-deep': 'recipe-surface-graphite-deep',
  'graphite-glass': 'recipe-surface-graphite-glass backdrop-surface-blur-graphite-glass',
};
const RADII: Record<SurfaceRadius, string> = {
  pill: 'rounded-surface-radius-pill',
  hero: 'rounded-surface-radius-hero',
  card: 'rounded-surface-radius-card',
  plate: 'rounded-surface-radius-plate',
  strip: 'rounded-surface-radius-strip',
  region: 'rounded-surface-radius-region',
  tip: 'rounded-surface-radius-tip',
  row: 'rounded-surface-radius-row',
};

export const Surface = React.forwardRef<HTMLElement, SurfaceProps>(function Surface({ material, radius, as = 'div', className, ...props }, ref) {
  const Tag = as as React.ElementType;
  // relative, unless the host places the surface itself (a dialog is fixed, an engraving absolute)
  const placed = /(^|\s)(fixed|absolute|sticky|static)(\s|$)/.test(typeof className === 'string' ? className : '');
  const own = `mu-surface box-border${placed ? '' : ' relative'} ${MATERIALS[material]}${radius ? ` ${RADII[radius]}` : ''}`;
  return <Tag ref={ref} data-material={material} data-radius={radius} className={className ? `${own} ${className}` : own} {...props} />;
});
