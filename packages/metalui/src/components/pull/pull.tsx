'use client';

import * as React from 'react';
import { GADGETS } from '../../gadgets/gadgets.generated';
import { drawPull, type PullSpec } from '../../gadgets/parts/pull';
import { pigment } from '../../gadgets/color';
import { materialFilter, tierFor, type Host } from '../../gadgets/light';
import { useHost } from '../../gadgets/host';
import { roundedRect } from '../../gadgets/parts/slab';

/* Pull (a Part): a drawer's handle, seen from above, drawn with the drawer front it sits on. A bar is
 * a metal capsule standing out in front of the front on two posts; a recess is a finger slot cut into
 * it. It has no state of its own: in a gadget the drawer moves it. Geometry is canvas units; `size` is
 * drawn pixels. */

export interface PullProps extends Omit<React.SVGProps<SVGSVGElement>, 'color' | 'children' | 'style'> {
  style?: PullSpec['style'];
  /** The drawer front's pigment; pale clay by default. */
  front?: { L: number; C: number; H: number };
  size?: number;
  host?: Host;
}

export function Pull({ style = 'bar', front, size = 96, host: forced, ...props }: PullProps) {
  const ref = React.useRef<SVGSVGElement>(null);
  const { host } = useHost(ref, forced);
  const uid = React.useId().replace(/:/g, '');
  const tier = tierFor(size);
  const hue = (GADGETS.materials.clay as unknown as { sample: number }).sample;
  const f = front ?? { L: GADGETS.plug.faceClay, C: GADGETS.plug.faceC, H: hue };
  const [pw, ph] = GADGETS.pull.panel, [w, h] = GADGETS.parts.pull.size, k = GADGETS.pull.alone / w, W = w * k, H = h * k;
  // The front, and the pull on it: a bar stands out below its front edge, a recess is cut into it.
  const top = 200 - (ph + reach(style, H)) / 2, edge = top + ph;
  const at: [number, number] = style === 'recess' ? [200, top + ph / 2] : [200, edge + GADGETS.pull.standoff + H / 2];
  const d = drawPull(`pull-${uid}`, { at, size: [W, H], style, color: style === 'recess' ? f : undefined }, { tier });
  const panel = roundedRect([200, top + ph / 2], [pw, ph], ph * GADGETS.lid.radius);
  const light = tier === 'flat' ? '' : materialFilter(`pull-${uid}-light`, 'clay', { tier: 'lite', host, part: true });
  return (
    <svg ref={ref} viewBox="0 0 400 400" width={size} height={size} role="img" aria-label={`pull, ${style}`} data-tier={tier} data-host={host} className="overflow-visible" {...props}>
      <defs dangerouslySetInnerHTML={{ __html: d.defs + light }} />
      <g dangerouslySetInnerHTML={{ __html: `<g${light ? ` filter="url(#pull-${uid}-light)"` : ''}><path data-part="pull.front" d="${panel}" fill="${pigment(f.L, f.C, f.H).srgb}"/></g>` + d.shadow + d.body }} />
    </svg>
  );
}

/** How far a pull reaches below the front's edge: a bar stands out; a recess does not. */
function reach(style: PullSpec['style'], H: number) { return style === 'recess' ? 0 : GADGETS.pull.standoff + H; }
