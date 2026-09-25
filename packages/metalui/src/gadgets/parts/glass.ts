// A glass face as a gadget draws it: light, icy glass in the face colour, sunk in a bezel. The glass
// is drawn in two layers so light can sit inside it: the glass itself (lighter at the centre, darker
// toward the rim), then, over whatever glows in it, its surface: engraved rings and a crosshair, a
// rim shade and a glare up toward the light. Canvas units (tokens gadgets.glass).
import { GADGETS } from '../gadgets.generated';
import { pigment } from '../color';
import type { Tier } from '../light';
import { roundedRect } from './slab';

export interface GlassSpec {
  at: [number, number];
  /** Diameter (round) or side (square), units. */
  size: number;
  shape?: 'round' | 'square';
  /** The face colour (OKLCH): resolve's `face`. */
  color: { L: number; C: number; H: number };
  rings?: boolean;
}

const G = GADGETS.glass, B = GADGETS.bezel, C = GADGETS.cap;
const n = (x: number) => +x.toFixed(2);

export interface GlassDraw { defs: string; glass: string; surface: string; clip: string }

/** The outline of a face: a circle or a rounded square. */
export function glassPath(s: Pick<GlassSpec, 'at' | 'size' | 'shape'>): string {
  const [cx, cy] = s.at, r = s.size / 2;
  return s.shape === 'square' ? roundedRect(s.at, [s.size, s.size], s.size * B.openingRadius)
    : `M${n(cx - r)},${n(cy)} a${n(r)},${n(r)} 0 1 0 ${n(2 * r)},0 a${n(r)},${n(r)} 0 1 0 ${n(-2 * r)},0 Z`;
}

export function drawGlass(id: string, s: GlassSpec, o: { tier?: Tier } = {}): GlassDraw {
  const tier = o.tier ?? 'full', [cx, cy] = s.at, R = s.size / 2, { L, C: c, H } = s.color;
  const centre = pigment(Math.min(1, L + G.depth[0]), c * 0.8, H), rim = pigment(L - G.depth[1], Math.min(0.14, c * 1.2), H);
  const [gd, gf, gg, ga, gm] = C.grooveInk, ink = pigment(Math.max(gf, L - gd), Math.min(gm, c * gg + ga), H);
  const path = glassPath(s);
  let defs = `<radialGradient id="${id}-glass" cx=".44" cy=".4" r=".62"><stop offset="0" stop-color="${centre.srgb}" style="stop-color: ${centre.p3}"/><stop offset="1" stop-color="${rim.srgb}" style="stop-color: ${rim.p3}"/></radialGradient>`
    + `<clipPath id="${id}-clip"><path d="${path}"/></clipPath>`;
  const glass = `<path d="${path}" fill="url(#${id}-glass)" data-part="glass"/>`;
  let surface = '';
  if (tier !== 'flat') {
    const [lw, la] = G.line;
    if (s.rings !== false) {
      const rings = G.rings.map((k) => `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(R * k)}" fill="none"/>`).join('');
      surface += `<g stroke="${ink.srgb}" stroke-opacity="${la}" stroke-width="${lw}" data-part="glass.rings">${rings}`
        + `<path d="M${n(cx - R)},${n(cy)}H${n(cx + R)}M${n(cx)},${n(cy - R)}V${n(cy + R)}" stroke-opacity="${G.cross}"/></g>`;
    }
    const [rw, ra] = G.rim, [gx, gy, gw, gh, gal] = G.glare;
    defs += `<radialGradient id="${id}-rim" cx=".5" cy=".5" r=".5"><stop offset="${n(1 - rw * 2)}" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${ra}"/></radialGradient>`
      + `<radialGradient id="${id}-glare" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff" stop-opacity="${gal}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`;
    surface += `<path d="${path}" fill="url(#${id}-rim)"/>`
      + `<ellipse cx="${n(cx - R + 2 * R * gx)}" cy="${n(cy - R + 2 * R * gy)}" rx="${n(R * gw)}" ry="${n(R * gh)}" fill="url(#${id}-glare)" clip-path="url(#${id}-clip)" data-part="glass.glare"/>`;
  }
  return { defs, glass, surface, clip: `${id}-clip` };
}
