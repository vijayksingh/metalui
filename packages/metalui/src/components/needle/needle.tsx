'use client';

import * as React from 'react';
import { GADGETS } from '../../gadgets/gadgets.generated';
import { drawNeedle, type NeedleSpec } from '../../gadgets/parts/needle';

/* Needle (a Part): a tapered pointer on a pivot cap over a printed scale. Its scale is printed on
 * glass, so it is SVG content for a Bezel (its children), on the 400-unit canvas; the glass colour
 * inks the scale. `value` (0 to 1) turns it; in a gadget the swing mechanism does. */

export interface NeedleProps extends Omit<NeedleSpec, 'at' | 'color'> {
  at?: [number, number];
  /** The needle's pigment; defaults to the accent. */
  color?: NeedleSpec['color'];
}

export function Needle({ at = [200, 222], color, ...spec }: NeedleProps) {
  const uid = React.useId().replace(/:/g, '');
  const [wL, wC, wH] = GADGETS.accent.warm;
  const d = drawNeedle(`needle-${uid}`, { at, color: color ?? { L: wL, C: wC, H: wH }, ...spec });
  return <g data-value={spec.value}><defs dangerouslySetInnerHTML={{ __html: d.defs }} /><g dangerouslySetInnerHTML={{ __html: d.scale + d.needle + d.cap }} /></g>;
}
