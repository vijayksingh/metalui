'use client';

import * as React from 'react';
import { GADGETS } from '../../gadgets/gadgets.generated';
import { drawCap, pressCap, type CapShape, type CapSpec } from '../../gadgets/parts/cap';
import { tierFor, type Host } from '../../gadgets/light';
import { useHost } from '../../gadgets/host';

/* Cap (a Part): the fader or knob cap a person moves. A face on its darker side wall, grip ribs (a
 * fader) or a pointer groove (a knob), and its own shadow. `pressed` sinks the face toward the body
 * and draws its shadow in, on the release spring (at once with reduced motion). The cap you would
 * touch wears the accent. Geometry is canvas units; `size` is drawn pixels. */

export interface CapProps extends Omit<React.SVGProps<SVGSVGElement>, 'color' | 'children'> {
  shape?: CapShape;
  ribs?: number;
  /** Wear the accent: the cap you would touch. Otherwise pale clay, or white ceramic. */
  accent?: boolean;
  material?: CapSpec['material'];
  /** The face's pigment, OKLCH; overrides accent and material. */
  color?: CapSpec['color'];
  pressed?: boolean;
  size?: number;
  host?: Host;
}

export function Cap({ shape = 'fader', ribs, accent = false, material = 'clay', color, pressed = false, size = 96, host: forced, ...props }: CapProps) {
  const ref = React.useRef<SVGSVGElement>(null);
  const { host } = useHost(ref, forced);
  const uid = React.useId().replace(/:/g, '');
  const tier = tierFor(size);
  const [wL, wC, wH] = GADGETS.accent.warm;
  const clay = GADGETS.materials.clay as unknown as { sample: number };
  const face = color ?? (accent ? { L: wL, C: wC, H: wH } : material === 'ceramic' ? { L: GADGETS.cap.ceramic[0], C: GADGETS.cap.ceramic[1], H: clay.sample } : { L: GADGETS.plug.faceClay, C: GADGETS.plug.faceC, H: clay.sample });
  // Drawn alone, the face is `alone` units wide on the canvas; its height keeps the Part's aspect.
  const [pw, ph] = GADGETS.parts.cap.size;
  const W = GADGETS.cap.alone, Hh = (W * ph) / pw;
  const d = React.useMemo(() => drawCap(`cap-${uid}`, { at: [200, 200], size: [W, Hh], shape, ribs, color: face, material }, { tier, host }),
    [uid, shape, ribs, face.L, face.C, face.H, material, tier, host, W, Hh]); // eslint-disable-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    if (!ref.current) return;
    pressCap(ref.current, pressed, { reduced: matchMedia('(prefers-reduced-motion: reduce)').matches });
  }, [pressed, d]);
  return (
    <svg ref={ref} viewBox="0 0 400 400" width={size} height={size} role="img" aria-label={`${shape} cap${accent ? ' (accent)' : ''}`}
      data-tier={tier} data-host={host} data-pressed={pressed || undefined} className="overflow-visible" {...props}>
      <defs dangerouslySetInnerHTML={{ __html: d.defs }} />
      <g dangerouslySetInnerHTML={{ __html: d.shadow + d.body }} />
    </svg>
  );
}
