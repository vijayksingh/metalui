'use client';

import * as React from 'react';
import { GADGETS, type GadgetMaterial } from '../../gadgets/gadgets.generated';
import { drawBezel } from '../../gadgets/parts/bezel';
import { drawGlass } from '../../gadgets/parts/glass';
import { tierFor, type Host } from '../../gadgets/light';
import { useHost } from '../../gadgets/host';

/* Bezel (a Part): an inset gadget's body. A frame in the body's material around an opening, where a
 * glass face sits sunk below it, shaded by the frame's inner wall. Anything that glows in the glass
 * (children: a Backlight's light) sits between the glass and its surface (rings, rim, glare), so it
 * reads as inside it. Geometry is on the 400-unit canvas; `size` is drawn pixels. */

export interface BezelProps extends Omit<React.SVGProps<SVGSVGElement>, 'color'> {
  material?: Extract<GadgetMaterial, 'stone' | 'metal' | 'clay'>;
  /** The frame's pigment, OKLCH. Defaults to the material's own sample. */
  color?: { L: number; C: number; H: number };
  /** The glass's colour, OKLCH (a gadget's resolved face). Defaults to plain icy glass. */
  glass?: { L: number; C: number; H: number };
  opening?: 'round' | 'square';
  /** The frame at its narrowest, units. */
  width?: number;
  rings?: boolean;
  size?: number;
  host?: Host;
  /** Light inside the glass, drawn on the 400-unit canvas. */
  children?: React.ReactNode;
}

const sample = (m: GadgetMaterial) => {
  const f = GADGETS.materials[m] as unknown as { L: readonly [number, number]; CCap: number; sample: number };
  return { L: Math.min(f.L[1], Math.max(f.L[0], 0.72)), C: Math.min(f.CCap, 0.06), H: f.sample };
};
const plainGlass = () => {
  const g = GADGETS.materials.glass as unknown as { faceL: readonly [number, number]; faceCCap: number; sample: number };
  return { L: (g.faceL[0] + g.faceL[1]) / 2, C: g.faceCCap / 2, H: g.sample };
};

export function Bezel({ material = 'stone', color, glass, opening = 'round', width, rings = true, size = 160, host: forced, children, ...props }: BezelProps) {
  const ref = React.useRef<SVGSVGElement>(null);
  const { host } = useHost(ref, forced);
  const uid = React.useId().replace(/:/g, '');
  const tier = tierFor(size);
  const frame = color ?? sample(material), face = glass ?? plainGlass();
  const d = React.useMemo(() => {
    const b = drawBezel(`bezel-${uid}`, { material, color: frame, opening, width }, { tier, host });
    const g = drawGlass(`glass-${uid}`, { at: b.opening.at, size: b.opening.size, shape: b.opening.shape, color: face, rings }, { tier });
    return { b, g };
  }, [uid, material, frame.L, frame.C, frame.H, face.L, face.C, face.H, opening, width, rings, tier, host]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <svg ref={ref} viewBox="0 0 400 400" width={size} height={size} role="img" aria-label={`${material} bezel with a glass face`}
      data-material={material} data-tier={tier} data-host={host} data-opening={opening} className="overflow-visible" {...props}>
      <defs dangerouslySetInnerHTML={{ __html: d.b.defs + d.g.defs }} />
      {/* The face, sunk: the glass, the light in it, its surface, all under the frame's wall shadow. */}
      <g filter={d.b.wall ? `url(#${d.b.wall})` : undefined} data-part="bezel.face">
        <g dangerouslySetInnerHTML={{ __html: d.g.glass }} />
        <g clipPath={`url(#${d.g.clip})`} data-part="bezel.light">{children}</g>
        <g dangerouslySetInnerHTML={{ __html: d.g.surface }} />
      </g>
      <g dangerouslySetInnerHTML={{ __html: d.b.frame }} />
    </svg>
  );
}
