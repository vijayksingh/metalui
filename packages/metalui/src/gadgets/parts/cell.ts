// The Cell Part: raised blocks of translucent resin in a grid, lit from behind. Dark, a cell is the
// resin's own colour, deeper toward its foot, shaded by the material's light. Lit, the light comes
// through: the cell fills with the glow colour, hottest at its core and thinner at its rim (the resin
// lets the material's translucency through there), and spills a halo onto the slab around it. Each
// cell is lit by a share, so the one filling now glows part way; cells light from the bottom row up,
// left to right. Canvas units; drawn by the React Part, the gadget renderer and SwiftUI (MetalCell)
// from the same numbers (tokens gadgets.cell).
import { GADGETS } from '../gadgets.generated';
import { pigment } from '../color';
import { materialFilter, type Host, type Tier } from '../light';
import { roundedRect } from './slab';

export interface CellSpec {
  /** The grid's centre. */
  at: [number, number];
  cols: number;
  rows: number;
  /** Between cells, units. */
  gap?: number;
  /** One cell's side, units (default the Part's). */
  size?: number;
  /** How many cells are lit, a real number from 0 to cols × rows (the last one part way). */
  lit?: number;
  /** The resin's pigment (OKLCH). */
  color: { L: number; C: number; H: number };
}

const K = GADGETS.cell;
const n = (x: number) => +x.toFixed(2);
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** Each cell's place in the lighting order, cells in reading order: the bottom row first, left to right. */
export const cellOrder = (cols: number, rows: number) =>
  Array.from({ length: cols * rows }, (_, i) => (rows - 1 - Math.floor(i / cols)) * cols + (i % cols));

/** How lit each cell is (reading order) when `lit` cells are. */
export const cellShares = (lit: number, cols: number, rows: number) => cellOrder(cols, rows).map((k) => clamp01(lit - k));

/** The light a cell glows with: the resin lifted, richer and warmer; its core brighter and yellower. */
export function cellGlow(c: CellSpec['color']) {
  const [ll, lg, lh] = K.lit, [, cl, ch, cg] = K.core;
  return { lit: pigment(Math.min(0.97, c.L + ll), Math.min(0.37, c.C * lg), c.H + lh), core: pigment(Math.min(0.99, c.L + cl), Math.min(0.37, c.C * cg), c.H + ch) };
}

/** Where each cell's centre is (reading order). */
export function cellCentres(s: Pick<CellSpec, 'at' | 'cols' | 'rows' | 'gap' | 'size'>): [number, number][] {
  const S = s.size ?? GADGETS.parts.cell.size[0], g = s.gap ?? GADGETS.parts.cell.params.gap[1];
  const w = s.cols * S + (s.cols - 1) * g, h = s.rows * S + (s.rows - 1) * g;
  return Array.from({ length: s.cols * s.rows }, (_, i) => [s.at[0] - w / 2 + S / 2 + (i % s.cols) * (S + g), s.at[1] - h / 2 + S / 2 + Math.floor(i / s.cols) * (S + g)]);
}

export interface CellDraw { defs: string; shadow: string; halo: string; body: string; glow: string }

export function drawCells(id: string, s: CellSpec, o: { tier?: Tier; host?: Host } = {}): CellDraw {
  const tier = o.tier ?? 'full', host = o.host ?? 'bone', S = s.size ?? GADGETS.parts.cell.size[0], r = S * K.radius;
  const { L, C, H } = s.color, dark = pigment(L - K.drop, C, H), { lit, core } = cellGlow(s.color);
  const through = (GADGETS.materials.resin as unknown as { translucency: number }).translucency;
  const centres = cellCentres(s), shares = cellShares(s.lit ?? 0, s.cols, s.rows);
  const [ds, da] = K.depth, [cs] = K.core, [hb, ha] = K.halo, [sb, sdx, sdy, sa] = K.shadow;
  let defs = `<linearGradient id="${id}-depth" x1="0" y1="0" x2="0" y2="1"><stop offset="${n(1 - ds)}" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${da}"/></linearGradient>`
    + `<radialGradient id="${id}-glow" cx=".5" cy=".46" r=".62"><stop offset="0" stop-color="${core.srgb}" style="stop-color: ${core.p3}"/><stop offset="${cs}" stop-color="${lit.srgb}" style="stop-color: ${lit.p3}"/>`
    + `<stop offset="1" stop-color="${lit.srgb}" stop-opacity="${through}" style="stop-color: ${lit.p3}"/></radialGradient>`;
  if (tier !== 'flat') defs += `<filter id="${id}-soft" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="${n(S * sb)}"/></filter>`
    + `<filter id="${id}-halo" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="${n(S * hb)}"/></filter>`
    + materialFilter(`${id}-light`, 'resin', { tier: 'lite', host, part: true });
  const box = (c: [number, number]) => roundedRect(c, [S, S], r);
  const each = (f: (c: [number, number], i: number) => string) => centres.map(f).join('');
  const shadow = tier === 'flat' ? '' : `<g data-part="cell.shadow" filter="url(#${id}-soft)" fill="rgba(30,26,22,${sa})">${each(([x, y]) => `<path d="${box([x + S * sdx, y + S * sdy])}"/>`)}</g>`;
  const halo = tier === 'flat' ? '' : `<g data-part="cell.halo" filter="url(#${id}-halo)">${each((c, i) => `<path data-cell="${i}" d="${box(c)}" fill="${lit.srgb}" opacity="${n(shares[i] * ha)}"/>`)}</g>`;
  const light = tier === 'flat' ? '' : ` filter="url(#${id}-light)"`;
  const body = `<g data-part="cell" data-cols="${s.cols}" data-rows="${s.rows}" data-lit="${n(s.lit ?? 0)}"><g${light} fill="${dark.srgb}">${each((c) => `<path d="${box(c)}"/>`)}</g>`
    + (tier === 'flat' ? '' : `<g fill="url(#${id}-depth)">${each((c) => `<path d="${box(c)}"/>`)}</g>`) + '</g>';
  const glow = `<g data-part="cell.glow">${each((c, i) => `<path data-cell="${i}" d="${box(c)}" fill="url(#${id}-glow)" opacity="${n(shares[i])}"/>`)}</g>`;
  return { defs, shadow, halo, body, glow };
}

/** Lights a drawn grid (anything under `root`) for `lit` cells, without redrawing it: what the glow
 *  mechanism moves every frame. The halo follows each cell's light. */
export function lightCells(root: Element, lit: number) {
  const grid = root.querySelector('[data-part="cell"]');
  if (!grid) return;
  const shares = cellShares(lit, Number(grid.getAttribute('data-cols')), Number(grid.getAttribute('data-rows')));
  grid.setAttribute('data-lit', String(n(lit)));
  root.querySelectorAll('[data-part="cell.glow"] [data-cell]').forEach((el) => el.setAttribute('opacity', String(n(shares[Number(el.getAttribute('data-cell'))]))));
  root.querySelectorAll('[data-part="cell.halo"] [data-cell]').forEach((el) => el.setAttribute('opacity', String(n(shares[Number(el.getAttribute('data-cell'))] * K.halo[1]))));
}
