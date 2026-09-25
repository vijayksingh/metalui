'use client';

import * as React from 'react';
import { GADGETS } from '../../gadgets/gadgets.generated';
import { drawBeeper, playBeeper, type BeeperSpec } from '../../gadgets/parts/beeper';
import { tierFor, type Host } from '../../gadgets/light';
import { useHost } from '../../gadgets/host';
import type { Earcon } from '../../sound/recipes.generated';

/* Beeper (a Part): a grille plate over a brass piezo disc, the only source of tones in a gadget. Each
 * time `beat` changes with an `earcon` set, it plays that earcon's notes: the disc catches the light
 * and the plate lifts a hair (not with reduced motion). The sound is the caller's (`sound.beep`), so
 * the Part can show a beep that was muted. Geometry is canvas units; `size` is drawn pixels. */

export interface BeeperProps extends Omit<React.SVGProps<SVGSVGElement>, 'color' | 'children'> {
  slots?: number;
  material?: BeeperSpec['material'];
  color?: BeeperSpec['color'];
  earcon?: Earcon | null;
  /** Change it to play `earcon` again. */
  beat?: number;
  size?: number;
  host?: Host;
}

export function Beeper({ slots, material = 'metal', color, earcon = null, beat = 0, size = 96, host: forced, ...props }: BeeperProps) {
  const ref = React.useRef<SVGSVGElement>(null);
  const { host } = useHost(ref, forced);
  const uid = React.useId().replace(/:/g, '');
  const tier = tierFor(size);
  const d = React.useMemo(() => drawBeeper(`beeper-${uid}`, { at: [200, 200], size: GADGETS.beeper.alone, slots, material, color }, { tier, host }),
    [uid, slots, material, color?.L, color?.C, color?.H, tier, host]); // eslint-disable-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    if (!earcon || !beat || !ref.current) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const played = playBeeper(ref.current, earcon, { reduced, width: GADGETS.beeper.alone });
    return () => played.forEach((a) => a.cancel());
  }, [beat]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <svg ref={ref} viewBox="0 0 400 400" width={size} height={size} role="img" aria-label={earcon && beat ? `beeper: ${earcon}` : 'beeper'}
      data-tier={tier} data-host={host} data-material={material} className="overflow-visible" {...props}>
      <defs dangerouslySetInnerHTML={{ __html: d.defs }} />
      <g dangerouslySetInnerHTML={{ __html: d.body }} />
    </svg>
  );
}
