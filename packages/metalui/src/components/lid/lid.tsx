'use client';

import * as React from 'react';
import { GADGETS } from '../../gadgets/gadgets.generated';
import { drawLid, type LidSpec } from '../../gadgets/parts/lid';
import { tierFor, type Host } from '../../gadgets/light';
import { useHost } from '../../gadgets/host';

/* Lid (a Part): a hinged flap over a bin's mouth, seen from above. `open` is degrees about its hinge
 * (the back edge, or the left): it foreshortens toward the hinge and its shadow falls further out as it
 * rises. `armed` makes its underside red, which glows into the gap as it opens. Near-black rubber by
 * default. Geometry is canvas units; `size` is drawn pixels. */

export interface LidProps extends Omit<React.SVGProps<SVGSVGElement>, 'color' | 'children'> {
  open?: number;
  armed?: boolean;
  hinge?: LidSpec['hinge'];
  material?: LidSpec['material'];
  color?: LidSpec['color'];
  size?: number;
  host?: Host;
}

const RUBBER = GADGETS.materials.rubber as unknown as { L: readonly [number, number]; CCap: number; sample: number };

export function Lid({ open = 0, armed = false, hinge = 'back', material = 'rubber', color, size = 96, host: forced, ...props }: LidProps) {
  const ref = React.useRef<SVGSVGElement>(null);
  const { host } = useHost(ref, forced);
  const uid = React.useId().replace(/:/g, '');
  const tier = tierFor(size);
  const c = color ?? { L: (RUBBER.L[0] + RUBBER.L[1]) / 2, C: RUBBER.CCap, H: RUBBER.sample };
  const [w, l] = GADGETS.lid.alone, dims: [number, number] = hinge === 'left' ? [l, w] : [w, l];
  const d = drawLid(`lid-${uid}`, { at: [200, 200], size: dims, hinge, open, armed, color: c, material }, { tier, host });
  return (
    <svg ref={ref} viewBox="0 0 400 400" width={size} height={size} role="img" aria-label={`lid, ${open > 0 ? `open ${Math.round(open)}°` : 'closed'}${armed ? ', armed' : ''}`}
      data-tier={tier} data-host={host} className="overflow-visible" {...props}>
      <defs dangerouslySetInnerHTML={{ __html: d.defs }} />
      <g dangerouslySetInnerHTML={{ __html: d.shadow + d.mouth + d.body }} />
    </svg>
  );
}
