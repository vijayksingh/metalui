'use client';

import * as React from 'react';
import { GADGETS } from '../../gadgets/gadgets.generated';
import { drawDrum, type DrumSpec } from '../../gadgets/parts/drum';
import { tierFor } from '../../gadgets/light';

/* Drum (a Part): a numbered wheel seen through a window, shaded where it turns away, with a glint on
 * its upper curve. `value` is the digit in the window, a real number from 0 to 10 that wraps, so it can
 * stand between two digits while it rolls (the roll mechanism turns it in a gadget). The drum you would
 * read first wears the accent. Geometry is canvas units; `size` is drawn pixels. */

export interface DrumProps extends Omit<React.SVGProps<SVGSVGElement>, 'color' | 'children'> {
  value?: number;
  accent?: boolean;
  face?: 'ceramic' | 'clay';
  color?: DrumSpec['color'];
  glyphs?: DrumSpec['glyphs'];
  size?: number;
}

export function Drum({ value = 0, accent = false, face = 'ceramic', color, glyphs, size = 96, ...props }: DrumProps) {
  const uid = React.useId().replace(/:/g, '');
  const tier = tierFor(size);
  const [wL, wC, wH] = GADGETS.accent.warm;
  const hue = (GADGETS.materials.clay as unknown as { sample: number }).sample;
  const c = color ?? (accent ? { L: wL, C: wC, H: wH } : face === 'ceramic' ? { L: GADGETS.cap.ceramic[0], C: GADGETS.cap.ceramic[1], H: hue } : { L: GADGETS.plug.faceClay, C: GADGETS.plug.faceC, H: hue });
  const [pw, ph] = GADGETS.parts.drum.size, W = GADGETS.drum.alone, H = (W * ph) / pw;
  const d = drawDrum(`drum-${uid}`, { at: [200, 200], size: [W, H], value, color: c, glyphs }, { tier });
  return (
    <svg viewBox="0 0 400 400" width={size} height={size} role="img" aria-label={`drum showing ${Math.round(((value % 10) + 10) % 10) % 10}`}
      data-tier={tier} className="overflow-visible" {...props}>
      <defs dangerouslySetInnerHTML={{ __html: d.defs }} />
      <g dangerouslySetInnerHTML={{ __html: d.body }} />
    </svg>
  );
}
