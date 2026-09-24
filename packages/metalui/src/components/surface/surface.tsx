'use client';

import * as React from 'react';
import './surface.css';

/* SURFACE: a raised plate or card from a material recipe. The primitive every floating or raised
 * object is built on: pills, cards, panels, popovers, strips. It draws the material and its radius
 * and nothing else; content and layout are the caller's.
 *   graphite         the dock's graphite, over a blur(22) saturate(1.6) backdrop
 *   graphite-plain   the same fill with no backdrop (a banner, a tip, a chip)
 *   graphite-strip   the same fill over a plain blur(22) (a tool strip over a selection) */

export type SurfaceMaterial = 'raise' | 'raise-lite' | 'raise-sm' | 'frost' | 'plate' | 'panel' | 'pop' | 'tip' | 'lens' | 'graphite' | 'graphite-plain' | 'graphite-strip' | 'graphite-deep' | 'graphite-glass';
export type SurfaceRadius = 'pill' | 'hero' | 'card' | 'plate' | 'strip' | 'region' | 'tip' | 'row';

export interface SurfaceProps extends React.HTMLAttributes<HTMLElement> {
  material: SurfaceMaterial;
  radius?: SurfaceRadius;
  /** The element to render (default div). */
  as?: 'div' | 'span' | 'section' | 'nav' | 'header' | 'aside';
}

export const Surface = React.forwardRef<HTMLElement, SurfaceProps>(function Surface({ material, radius, as = 'div', className, ...props }, ref) {
  const Tag = as as React.ElementType;
  return <Tag ref={ref} data-material={material} data-radius={radius} className={className ? `mu-surface ${className}` : 'mu-surface'} {...props} />;
});
