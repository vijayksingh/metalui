'use client';

import * as React from 'react';
import { drawBacklight, type BacklightSpec } from '../../gadgets/parts/backlight';

/* Backlight (a Part): light behind a translucent part, in its own colour fading to nothing at its edge.
 * A glow, a radar beam with a bright leading edge, or a blip. It is SVG content, not a picture on its
 * own: place it inside a Bezel (its children), on the 400-unit canvas. */

export interface BacklightProps extends Omit<BacklightSpec, 'at' | 'size'> {
  at?: [number, number];
  /** The part it lights: its diameter, units (default a bezel's glass). */
  size?: number;
}

export function Backlight({ at = [200, 196], size = 276, ...spec }: BacklightProps) {
  const uid = React.useId().replace(/:/g, '');
  const d = drawBacklight(`backlight-${uid}`, { at, size, ...spec });
  return <g><defs dangerouslySetInnerHTML={{ __html: d.defs }} /><g dangerouslySetInnerHTML={{ __html: d.body }} /></g>;
}
