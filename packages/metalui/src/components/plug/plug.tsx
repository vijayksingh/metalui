'use client';

import * as React from 'react';
import { GADGETS } from '../../gadgets/gadgets.generated';
import { drawPlug, type PlugSpec } from '../../gadgets/parts/plug';
import { tierFor, type Host } from '../../gadgets/light';
import { useHost } from '../../gadgets/host';

/* Plug (a Part): a knurled cap that seats in a Jack. A round face on its darker skirt, six grip knurls,
 * a centre boss, maybe a cable stub, and its own shadow (a separate layer, so a lift can open it).
 * The plug you would touch wears the accent. Geometry is canvas units; `size` is drawn pixels. */

export interface PlugProps extends Omit<React.SVGProps<SVGSVGElement>, 'color' | 'children'> {
  /** Wear the accent: the plug you would touch. Otherwise it is clay in the material's own colour. */
  accent?: boolean;
  /** The face's pigment, OKLCH; overrides accent. */
  color?: PlugSpec['color'];
  stub?: PlugSpec['stub'];
  size?: number;
  host?: Host;
}

export function Plug({ accent = false, color, stub = 'none', size = 96, host: forced, ...props }: PlugProps) {
  const ref = React.useRef<SVGSVGElement>(null);
  const { host } = useHost(ref, forced);
  const uid = React.useId().replace(/:/g, '');
  const tier = tierFor(size);
  const [wL, wC, wH] = GADGETS.accent.warm;
  const clay = GADGETS.materials.clay as unknown as { sample: number };
  const face = color ?? (accent ? { L: wL, C: wC, H: wH } : { L: GADGETS.plug.faceClay, C: GADGETS.plug.faceC, H: clay.sample });
  const d = React.useMemo(() => drawPlug(`plug-${uid}`, { at: [200, GADGETS.plug.centreY], size: GADGETS.plug.alone, color: face, stub }, { tier, host }),
    [uid, face.L, face.C, face.H, stub, tier, host]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <svg ref={ref} viewBox="0 0 400 400" width={size} height={size} role="img" aria-label={accent ? 'plug (accent)' : 'plug'} data-tier={tier} data-host={host} data-accent={accent || undefined} className="overflow-visible" {...props}>
      <defs dangerouslySetInnerHTML={{ __html: d.defs }} />
      <g dangerouslySetInnerHTML={{ __html: d.shadow + d.body }} />
    </svg>
  );
}
