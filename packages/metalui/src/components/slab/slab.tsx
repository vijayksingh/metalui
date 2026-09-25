'use client';

import * as React from 'react';
import { GADGETS, type GadgetMaterial } from '../../gadgets/gadgets.generated';
import { drawSlab, type Cut } from '../../gadgets/parts/slab';
import { tierFor, type Host } from '../../gadgets/light';
import { useHost } from '../../gadgets/host';

/* Slab (a Part): the thick panel a gadget is cut from, lit by the one light, with its cuts (slot, hole,
 * tray, well). The floor of a cut is the slab's own material in shadow; its top wall is dark and its
 * lower lip catches the light. Geometry is on the gadget canvas (400 units); `size` is drawn pixels. */

export interface SlabProps extends Omit<React.SVGProps<SVGSVGElement>, 'color'> {
  material: GadgetMaterial;
  /** The body's pigment, OKLCH. Defaults to the material's own sample. */
  color?: { L: number; C: number; H: number };
  /** Cuts through the body, on the 400-unit canvas. */
  cuts?: Cut[];
  /** Drawn size in pixels; sets the detail tier (full ≥ 96, lite ≥ 48, flat below). */
  size?: number;
  /** Force a colorway's world; by default the nearest data-mu-colorway or the system's. */
  host?: Host;
  /** Anything drawn on the slab (actors), between the body and the lips. */
  children?: React.ReactNode;
}

const sample = (m: GadgetMaterial) => {
  const f = GADGETS.materials[m] as unknown as { L: readonly [number, number]; CCap: number; sample: number };
  return { L: Math.min(f.L[1], Math.max(f.L[0], 0.72)), C: Math.min(f.CCap, 0.06), H: f.sample };
};

export function Slab({ material, color, cuts, size = 160, host: forced, children, ...props }: SlabProps) {
  const ref = React.useRef<SVGSVGElement>(null);
  const { host, contrast } = useHost(ref, forced);
  const uid = React.useId().replace(/:/g, '');
  const tier = tierFor(size);
  const d = React.useMemo(() => drawSlab(`slab-${uid}`, { material, color: color ?? sample(material), cuts }, { tier, host, contrast }),
    [uid, material, color?.L, color?.C, color?.H, JSON.stringify(cuts), tier, host, contrast]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <svg ref={ref} viewBox="0 0 400 400" width={size} height={size} role="img" aria-label={`${material} slab`} data-material={material} data-tier={tier} data-host={host} className="overflow-visible" {...props}>
      <defs dangerouslySetInnerHTML={{ __html: d.defs }} />
      <g dangerouslySetInnerHTML={{ __html: d.floors }} />
      <g dangerouslySetInnerHTML={{ __html: d.body }} />
      {children}
      <g dangerouslySetInnerHTML={{ __html: d.lips }} />
    </svg>
  );
}
