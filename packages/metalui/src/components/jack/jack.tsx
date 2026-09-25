'use client';

import * as React from 'react';
import { GADGETS } from '../../gadgets/gadgets.generated';
import { drawJack, type JackSpec } from '../../gadgets/parts/jack';
import { tierFor, type Host } from '../../gadgets/light';
import { useHost } from '../../gadgets/host';

/* Jack (a Part): a knurled satin-steel nut around a socket, on the gadget canvas. The socket is a cut,
 * dark at the bottom with its top wall in shadow; lit, a lamp glows down there in a signal colour.
 * A plug seats in it (the seat mechanism). Geometry is canvas units; `size` is drawn pixels. */

export interface JackProps extends Omit<React.SVGProps<SVGSVGElement>, 'children'> {
  /** A lamp glowing in the socket, in its signal colour. */
  lit?: JackSpec['lit'];
  knurls?: number;
  /** Drawn size in pixels of a 400-unit canvas; the jack sits at its centre. */
  size?: number;
  host?: Host;
}

export function Jack({ lit = null, knurls, size = 96, host: forced, ...props }: JackProps) {
  const ref = React.useRef<SVGSVGElement>(null);
  const { host } = useHost(ref, forced);
  const uid = React.useId().replace(/:/g, '');
  const tier = tierFor(size);
  const d = React.useMemo(() => drawJack(`jack-${uid}`, { at: [200, 200], size: GADGETS.jack.alone, knurls, lit }, { tier, host }), [uid, knurls, lit, tier, host]);
  return (
    <svg ref={ref} viewBox="0 0 400 400" width={size} height={size} role="img" aria-label={lit ? `jack, lit ${lit}` : 'jack'} data-tier={tier} data-host={host} data-lit={lit ?? undefined} className="overflow-visible" {...props}>
      <defs dangerouslySetInnerHTML={{ __html: d.defs }} />
      <g dangerouslySetInnerHTML={{ __html: d.socket + d.nut }} />
    </svg>
  );
}
