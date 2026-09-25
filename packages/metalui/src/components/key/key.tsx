'use client';

import * as React from 'react';
import { GADGETS } from '../../gadgets/gadgets.generated';
import { drawKey, pressKey, type KeySpec } from '../../gadgets/parts/key';
import { tierFor, type Host } from '../../gadgets/light';
import { useHost } from '../../gadgets/host';

/* Key (a Part): a big key standing on its skirt, the Keycap as a gadget draws it. A lit face on a
 * darker skirt with a glyph engraved into it, and its own shadow. `pressed` drops the face into the
 * skirt on the release spring (at once with reduced motion). The key you would press wears the
 * accent. Not the inline Keycap (Kbd), which is a readout and never pressed. */

export interface KeyProps extends Omit<React.SVGProps<SVGSVGElement>, 'color' | 'children'> {
  glyph?: string;
  /** Wear the accent: the key you would press. Otherwise pale clay, or white ceramic. */
  accent?: boolean;
  material?: KeySpec['material'];
  color?: KeySpec['color'];
  pressed?: boolean;
  size?: number;
  host?: Host;
}

export function Key({ glyph, accent = false, material = 'clay', color, pressed = false, size = 96, host: forced, ...props }: KeyProps) {
  const ref = React.useRef<SVGSVGElement>(null);
  const { host } = useHost(ref, forced);
  const uid = React.useId().replace(/:/g, '');
  const tier = tierFor(size);
  const [wL, wC, wH] = GADGETS.accent.warm;
  const hue = (GADGETS.materials.clay as unknown as { sample: number }).sample;
  const face = color ?? (accent ? { L: wL, C: wC, H: wH } : material === 'ceramic' ? { L: GADGETS.cap.ceramic[0], C: GADGETS.cap.ceramic[1], H: hue } : { L: GADGETS.plug.faceClay, C: GADGETS.plug.faceC, H: hue });
  const d = React.useMemo(() => drawKey(`key-${uid}`, { at: [200, 200], size: GADGETS.key.alone, glyph, color: face, material }, { tier, host }),
    [uid, glyph, face.L, face.C, face.H, material, tier, host]); // eslint-disable-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    if (ref.current) pressKey(ref.current, pressed, { reduced: matchMedia('(prefers-reduced-motion: reduce)').matches });
  }, [pressed, d]);
  return (
    <svg ref={ref} viewBox="0 0 400 400" width={size} height={size} role="img" aria-label={`key${glyph ? ` ${glyph}` : ''}${accent ? ' (accent)' : ''}`}
      data-tier={tier} data-host={host} data-pressed={pressed || undefined} className="overflow-visible" {...props}>
      <defs dangerouslySetInnerHTML={{ __html: d.defs }} />
      <g dangerouslySetInnerHTML={{ __html: d.shadow + d.body }} />
    </svg>
  );
}
