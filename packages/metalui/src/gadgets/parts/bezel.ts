// The Bezel Part: an inset gadget's body. A frame (the body outline, in the body's material) around an
// opening, where the face sits sunk below it; the frame's inner wall shades the face as any cut does.
// It is a slab with one cut, whose floor is the face instead of the slab's own shadow. Canvas units;
// drawn by the React Part, the gadget renderer and SwiftUI (MetalBezel) (tokens gadgets.bezel).
import { GADGETS, type GadgetMaterial } from '../gadgets.generated';
import { drawSlab } from './slab';
import { holeFilter, type Host, type Tier } from '../light';

export interface BezelSpec {
  at?: [number, number];
  size?: [number, number];
  material: GadgetMaterial;
  color: { L: number; C: number; H: number };
  opening?: 'round' | 'square';
  /** The frame at its narrowest, units. */
  width?: number;
}

export interface BezelDraw {
  defs: string;
  /** Wrap the face (and what glows in it) in this, so the frame's wall shades it. */
  sunk: (inside: string) => string;
  /** The wall shadow's filter id (none at the flat tier), for a caller that builds its own group. */
  wall: string | null;
  frame: string;
  /** Where the face goes: its centre and size. */
  opening: { at: [number, number]; size: number; shape: 'round' | 'square' };
}

export function drawBezel(id: string, s: BezelSpec, o: { tier?: Tier; host?: Host } = {}): BezelDraw {
  const tier = o.tier ?? 'full', B = GADGETS.bezel;
  const at = s.at ?? [200, 196], size = s.size ?? [320, 320], shape = s.opening ?? 'round';
  const side = Math.min(size[0], size[1]) - 2 * (s.width ?? B.width);
  const cut = shape === 'round'
    ? { kind: 'hole' as const, at, size: [side, side] as [number, number], depth: B.depth }
    : { kind: 'tray' as const, at, size: [side, side] as [number, number], depth: B.depth, radius: side * B.openingRadius };
  const slab = drawSlab(`${id}-frame`, { at, size, material: s.material, color: s.color, cuts: [cut] }, { tier, host: o.host });
  const flat = tier === 'flat';
  const defs = slab.defs + (flat ? '' : holeFilter(`${id}-wall`));
  return {
    defs,
    wall: flat ? null : `${id}-wall`,
    sunk: (inside) => (flat ? `<g data-part="bezel.face">${inside}</g>` : `<g data-part="bezel.face" filter="url(#${id}-wall)">${inside}</g>`),
    frame: `<g data-part="bezel">${slab.body}${slab.lips}</g>`,
    opening: { at, size: side, shape },
  };
}
