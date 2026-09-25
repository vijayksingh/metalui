'use client';

import * as React from 'react';
import { createCableSwing, drawCable, type CableSpec, type CableSwing } from '../../gadgets/parts/cable';
import { tierFor } from '../../gadgets/light';

/* Cable (a Part): a rubber patch cord between two plugs, drooping under gravity. Give it a length and
 * it hangs like a real cord: taut when its ends are pulled apart, slack when they come together. When
 * its ends move they go at once and its belly swings after them on the hinge spring (at once with
 * reduced motion). Geometry is canvas units on a 400-unit square; `size` is drawn pixels. */

export interface CableProps extends Omit<React.SVGProps<SVGSVGElement>, 'color' | 'children' | 'from' | 'to'> {
  from: CableSpec['from'];
  to: CableSpec['to'];
  sag?: number;
  length?: number;
  color?: CableSpec['color'];
  size?: number;
}

const reducedQuery = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function Cable({ from, to, sag, length, color, size = 160, ...props }: CableProps) {
  const root = React.useRef<SVGGElement>(null);
  const swing = React.useRef<CableSwing | null>(null);
  const uid = React.useId().replace(/:/g, '');
  const tier = tierFor(size);
  // Drawn once per look; after that the swing moves the paths, so React never rewrites them mid-swing.
  const first = React.useRef<CableSpec>({ from, to, sag, length });
  const d = React.useMemo(() => drawCable(`cable-${uid}`, { ...first.current, color }, { tier }),
    [uid, tier, color?.L, color?.C, color?.H]); // eslint-disable-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    if (!root.current) return;
    const s = createCableSwing(root.current, first.current, { reduced: reducedQuery() });
    swing.current = s;
    return () => s.destroy();
  }, [d]);
  React.useEffect(() => { swing.current?.setReduced(reducedQuery()); swing.current?.set({ from, to, sag, length }); }, [from[0], from[1], to[0], to[1], sag, length]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <svg viewBox="0 0 400 400" width={size} height={size} role="img" aria-label="cable" data-tier={tier} className="overflow-visible" {...props}>
      <defs dangerouslySetInnerHTML={{ __html: d.defs }} />
      <g ref={root} dangerouslySetInnerHTML={{ __html: d.shadow + d.body }} />
    </svg>
  );
}
