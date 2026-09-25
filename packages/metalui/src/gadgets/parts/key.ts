// The Key Part: a big key standing on its skirt, the Keycap as a gadget draws it. A rounded skirt, a
// lit face on top of it, a glyph engraved into the face (a dark cut with a lit lower edge), and its
// own shadow. Pressed, the face drops into the skirt and spreads a little; the skirt stays. Canvas
// units; drawn by the React Part, the gadget renderer and SwiftUI (MetalKey) from the same numbers
// (tokens gadgets.key).
import { GADGETS, type GadgetMaterial } from '../gadgets.generated';
import { pigment } from '../color';
import { materialFilter, type Host, type Tier } from '../light';
import { roundedRect } from './slab';

export interface KeySpec {
  at: [number, number];
  /** The key's side, units (default the Part's). */
  size?: number;
  /** One glyph: ⌘ ⌥ ⇧ ⌃ ⎋ ↩ ⌫ or a letter. */
  glyph?: string;
  /** The face's pigment (OKLCH). */
  color: { L: number; C: number; H: number };
  material?: Extract<GadgetMaterial, 'clay' | 'ceramic'>;
}

const K = GADGETS.key, C = GADGETS.cap;
const n = (x: number) => +x.toFixed(2);
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
/** The face's own glyph typeface: the system's, as the Keycap. */
export const KEY_FONT = "-apple-system, 'SF Pro Display', system-ui, sans-serif";

export interface KeyDraw { defs: string; shadow: string; body: string }

export function drawKey(id: string, s: KeySpec, o: { tier?: Tier; host?: Host } = {}): KeyDraw {
  const tier = o.tier ?? 'full', host = o.host ?? 'bone';
  const [cx, cy] = s.at, S = s.size ?? GADGETS.parts.key.size[0], { L, C: c, H } = s.color;
  const F = S * K.face[0], fy = cy - S * K.faceLift;
  const face0 = pigment(L + 0.04, c * 0.9, H - 4), face1 = pigment(L - 0.03, c, H + 4), skirt = pigment(L - K.skirtDrop, c * 0.95, H + 6);
  const [gd, gf, gg, ga, gm] = C.grooveInk, [el, ec] = C.edgeInk;
  const ink = pigment(Math.max(gf, L - gd), Math.min(gm, c * gg + ga), H), lit = pigment(Math.min(1, L + el), c * ec, H);
  const [sb, sdx, sdy, sa] = K.shadow;
  let defs = `<linearGradient id="${id}-face" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${face0.srgb}" style="stop-color: ${face0.p3}"/><stop offset="1" stop-color="${face1.srgb}" style="stop-color: ${face1.p3}"/></linearGradient>`;
  if (tier !== 'flat') defs += `<filter id="${id}-soft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="${n(S * sb)}"/></filter>`
    + materialFilter(`${id}-light`, s.material ?? 'clay', { tier: 'lite', host, part: true });
  const soft = tier === 'flat' ? '' : ` filter="url(#${id}-soft)"`, light = tier === 'flat' ? '' : ` filter="url(#${id}-light)"`;
  const shadow = `<g data-part="key.shadow"><path d="${roundedRect([cx + S * sdx, cy + S * sdy], [S, S], S * K.radius)}" fill="rgba(30,26,22,${sa})"${soft}/></g>`;
  const size = F * K.glyph, text = (dy: number, fill: string, alpha: number) =>
    `<text x="${n(cx)}" y="${n(fy + dy)}" text-anchor="middle" dominant-baseline="central" font-family="${KEY_FONT}" font-weight="500" font-size="${n(size)}" fill="${fill}" fill-opacity="${alpha}">${esc(s.glyph ?? '')}</text>`;
  const glyph = s.glyph && tier !== 'flat' ? text(K.glyphEdge * (S / GADGETS.parts.key.size[0]), lit.srgb, K.glyphAlpha[1]) + text(0, ink.srgb, K.glyphAlpha[0]) : s.glyph ? text(0, ink.srgb, K.glyphAlpha[0]) : '';
  const body = `<g data-part="key" data-scale="${n(S / GADGETS.parts.key.size[0])}"${s.glyph ? ` data-glyph="${esc(s.glyph)}"` : ''}>`
    + `<g${light}><path d="${roundedRect([cx, cy], [S, S], S * K.radius)}" fill="${skirt.srgb}" data-part="key.skirt"/></g>`
    + `<g data-part="key.face"><g${light}><path d="${roundedRect([cx, fy], [F, F], F * K.face[1])}" fill="url(#${id}-face)"/></g>${glyph}</g>`
    + '</g>';
  return { defs, shadow, body };
}

/** Presses or releases a drawn key (anything under `root`): its face drops into the skirt and spreads,
 *  on the release spring; with reduced motion it still dips (at once), as the press mechanism keeps its travel. */
export function pressKey(root: Element, pressed: boolean, o: { reduced?: boolean } = {}) {
  const face = root.querySelector<SVGGElement>('[data-part="key.face"]');
  if (!face) return;
  const [dy, sx, sy] = K.press, k = Number(root.querySelector('[data-part="key"]')?.getAttribute('data-scale') ?? 1);
  face.style.transformBox = 'fill-box';
  face.style.transformOrigin = 'center';
  face.style.transition = o.reduced ? 'none' : 'transform var(--mu-spring-release-d, .3s) var(--mu-spring-release, ease-out)';
  face.style.transform = pressed ? `translateY(${n(dy * k)}px) scale(${sx}, ${sy})` : '';
}
