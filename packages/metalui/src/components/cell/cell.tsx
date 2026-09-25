'use client';

import * as React from 'react';
import { GADGETS } from '../../gadgets/gadgets.generated';
import { drawCells, type CellSpec } from '../../gadgets/parts/cell';
import { tierFor, type Host } from '../../gadgets/light';
import { useHost } from '../../gadgets/host';

/* Cell (a Part): raised blocks of translucent resin in a grid, lit from behind. `lit` is how many are
 * lit, a real number, so the cell filling now glows part way; they light from the bottom row up, left
 * to right. Dark, a cell is the resin's own colour; lit, the light comes through it, hottest at its
 * core, and spills onto the slab around it. Resin in the accent by default. Geometry is canvas units;
 * `size` is drawn pixels. */

export interface CellProps extends Omit<React.SVGProps<SVGSVGElement>, 'color' | 'children'> {
  cols?: number;
  rows?: number;
  gap?: number;
  lit?: number;
  /** The resin's pigment; defaults to the accent. */
  color?: CellSpec['color'];
  size?: number;
  host?: Host;
}

export function Cell({ cols = 4, rows = 4, gap = GADGETS.cell.alone[1], lit = 0, color, size = 96, host: forced, ...props }: CellProps) {
  const ref = React.useRef<SVGSVGElement>(null);
  const { host } = useHost(ref, forced);
  const uid = React.useId().replace(/:/g, '');
  const tier = tierFor(size);
  const [wL, wC, wH] = GADGETS.accent.warm;
  const c = color ?? { L: wL, C: wC, H: wH };
  // Drawn alone, a cell is the Part's `alone` side, shrunk so a big grid fits the body with a gap all round.
  const m = Math.max(cols, rows), side = Math.min(GADGETS.cell.alone[0], (GADGETS.canvas.body[2] - (m + 1) * gap) / m);
  const d = drawCells(`cell-${uid}`, { at: [200, 200], cols, rows, gap, size: side, lit, color: c }, { tier, host });
  return (
    <svg ref={ref} viewBox="0 0 400 400" width={size} height={size} role="img" aria-label={`${cols} by ${rows} cells, ${Math.floor(lit)} lit`}
      data-tier={tier} data-host={host} className="overflow-visible" {...props}>
      <defs dangerouslySetInnerHTML={{ __html: d.defs }} />
      <g dangerouslySetInnerHTML={{ __html: d.shadow + d.halo + d.body + d.glow }} />
    </svg>
  );
}
