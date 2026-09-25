// The Slab Part on the gadget canvas: a thick panel with rolled edges, and the cuts made into it
// (slot, hole, tray, well). Geometry is in canvas units (400 per gadget). A cut is a hole through
// the body: under it lies a floor, the slab's own material in shadow, darker by the cut's depth;
// its top wall hides the light (holeFilter) and its lower lip catches it. Drawn the same way by the
// React Part, the gadget renderer and SwiftUI (MetalSlab).
import { GADGETS, type GadgetMaterial } from '../gadgets.generated';
import { pigment } from '../color';
import { bodyFill, holeFilter, materialFilter, type Host, type Tier } from '../light';

export type CutKind = 'slot' | 'hole' | 'tray' | 'well';
export interface Cut { kind: CutKind; at: [number, number]; size: [number, number]; depth?: number; radius?: number }
export interface SlabSpec {
  at?: [number, number];
  size?: [number, number];
  radius?: number;
  material: GadgetMaterial;
  /** The body's pigment (OKLCH). */
  color: { L: number; C: number; H: number };
  cuts?: Cut[];
}

const H = GADGETS.hole;
const n = (x: number) => +x.toFixed(2);

/** A rounded rectangle, centre and size, as a path. */
export function roundedRect([cx, cy]: [number, number], [w, h]: [number, number], r: number): string {
  const x = cx - w / 2, y = cy - h / 2, rr = Math.min(r, w / 2, h / 2);
  return `M${n(x + rr)},${n(y)} H${n(x + w - rr)} A${n(rr)},${n(rr)} 0 0 1 ${n(x + w)},${n(y + rr)} V${n(y + h - rr)} A${n(rr)},${n(rr)} 0 0 1 ${n(x + w - rr)},${n(y + h)} H${n(x + rr)} A${n(rr)},${n(rr)} 0 0 1 ${n(x)},${n(y + h - rr)} V${n(y + rr)} A${n(rr)},${n(rr)} 0 0 1 ${n(x + rr)},${n(y)} Z`;
}

/** The outline of a cut: a slot is a capsule along its long side, a hole a circle, a tray or well a rounded rect. */
export function cutPath(c: Cut): string {
  const [w, h] = c.size;
  if (c.kind === 'hole') { const r = Math.min(w, h) / 2; return `M${n(c.at[0] - r)},${n(c.at[1])} a${n(r)},${n(r)} 0 1 0 ${n(2 * r)},0 a${n(r)},${n(r)} 0 1 0 ${n(-2 * r)},0 Z`; }
  if (c.kind === 'slot') return roundedRect(c.at, c.size, Math.min(w, h) / 2);
  return roundedRect(c.at, c.size, c.radius ?? (c.kind === 'tray' ? H.trayRadius : H.trayRadius * 1.4));
}

/** The body with its cuts through it (even-odd). */
export function slabPath(s: SlabSpec): string {
  const at = s.at ?? [200, 196], size = s.size ?? [GADGETS.canvas.body[2], GADGETS.canvas.body[3]];
  const r = s.radius ?? (GADGETS.canvas.radius * Math.min(size[0], size[1])) / 320;
  return [roundedRect(at, size, r), ...(s.cuts ?? []).map(cutPath)].join(' ');
}

/** A cut's floor: the slab's pigment in shadow, darker the deeper it goes. */
export function floorColor(s: SlabSpec, c: Cut) {
  const depth = c.depth ?? H.depths[c.kind];
  const L = s.color.L - H.floor.drop - (H.floor.depthDrop * depth) / 24;
  return { top: pigment(L - 0.03, s.color.C * H.floor.chroma, s.color.H), bottom: pigment(L + 0.04, s.color.C * H.floor.chroma, s.color.H) };
}

export interface SlabDraw { defs: string; floors: string; body: string; lips: string }

/**
 * The slab as SVG, in three layers so actors can sit between them: floors (under the body, seen
 * through the cuts), the lit body, and the lips (a light edge on each cut's lower wall).
 */
export function drawSlab(id: string, s: SlabSpec, o: { tier?: Tier; host?: Host; contrast?: boolean } = {}): SlabDraw {
  const tier = o.tier ?? 'full', host = o.host ?? 'bone';
  const cuts = s.cuts ?? [];
  let defs = bodyFill(`${id}-fill`, s.material, s.color.L, s.color.C, s.color.H, host) + materialFilter(`${id}-light`, s.material, { tier, host, contrast: o.contrast });
  const walls = cuts.length > 0 && tier !== 'flat';       // flat means no filters at all
  if (walls) defs += holeFilter(`${id}-hole`);
  const floors = cuts.map((c, i) => {
    const f = floorColor(s, c);
    defs += `<linearGradient id="${id}-floor${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${f.top.srgb}" style="stop-color: ${f.top.p3}"/><stop offset="1" stop-color="${f.bottom.srgb}" style="stop-color: ${f.bottom.p3}"/></linearGradient>`;
    return `<path d="${cutPath(c)}" fill="url(#${id}-floor${i})" data-cut="${c.kind}"/>`;
  }).join('');
  const body = tier === 'flat'
    ? `<path d="${slabPath(s)}" fill-rule="evenodd" fill="url(#${id}-fill)" data-part="slab"/>`
    : `<path d="${slabPath(s)}" fill-rule="evenodd" fill="url(#${id}-fill)" filter="url(#${id}-light)" data-part="slab"/>`;
  // The lower lip of each cut catches the light: the cut's outline, stroked light, clipped to its lower half.
  const lips = tier === 'flat' ? '' : cuts.map((c, i) => {
    const [cx, cy] = c.at, [w, h] = c.size;
    defs += `<clipPath id="${id}-lip${i}"><rect x="${n(cx - w / 2 - 2)}" y="${n(cy + h * 0.15)}" width="${n(w + 4)}" height="${n(h / 2 + 4)}"/></clipPath>`;
    return `<path d="${cutPath(c)}" fill="none" stroke="#fff" stroke-opacity="${H.lipAlpha}" stroke-width="${H.lip}" clip-path="url(#${id}-lip${i})"/>`;
  }).join('');
  return { defs, floors: floors ? (walls ? `<g filter="url(#${id}-hole)">${floors}</g>` : `<g>${floors}</g>`) : '', body, lips };
}
