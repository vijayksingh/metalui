// The Drum Part: a numbered wheel seen through a window. A strip of the digits 0 to 9 on a cylinder,
// wrapping (9 runs on into 0), shaded where it turns away at the top and bottom, with a glint on its
// upper curve. Its value is the digit centred in the window, a real number, so it can stand between
// two digits while it rolls. Canvas units; drawn by the React Part, the gadget renderer and SwiftUI
// (MetalDrum) from the same numbers (tokens gadgets.drum).
import { GADGETS } from '../gadgets.generated';
import { pigment } from '../color';
import type { Tier } from '../light';
import { roundedRect } from './slab';

export interface DrumSpec {
  at: [number, number];
  /** [width, height], units (default the Part's 52 × 88). */
  size?: [number, number];
  /** The digit in the window, 0 to 10 (it wraps). */
  value?: number;
  /** The face's pigment (OKLCH). */
  color: { L: number; C: number; H: number };
  glyphs?: 'digits' | 'ticks';
}

const K = GADGETS.drum, C = GADGETS.cap;
const n = (x: number) => +x.toFixed(2);
/** The digits' face: the system's mono, as the readouts. */
export const DRUM_FONT = "ui-monospace, 'SF Mono', Menlo, monospace";

/** Where the strip sits for a value: the digit `value` centred in the window. */
export const stripOffset = (value: number, pitch: number) => -(((value % 10) + 10) % 10) * pitch;

export interface DrumDraw { defs: string; body: string }

export function drawDrum(id: string, s: DrumSpec, o: { tier?: Tier } = {}): DrumDraw {
  const tier = o.tier ?? 'full', [cx, cy] = s.at, [W, H] = s.size ?? (GADGETS.parts.drum.size as unknown as [number, number]);
  const k = H / GADGETS.parts.drum.size[1], P = K.pitch * k, { L, C: c, H: hue } = s.color;
  const face = pigment(L, c, hue), [gd, gf, gg, ga, gm] = C.grooveInk, ink = pigment(Math.max(gf, L - gd), Math.min(gm, c * gg + ga), hue);
  const box = roundedRect([cx, cy], [W, H], K.radius * k);
  // The strip: 0 to 9, with 8 and 9 above 0 and 0 and 1 below 9, so the wrap never shows an end.
  const glyph = (d: number) => (s.glyphs === 'ticks' ? '–' : String(d));
  const rows = Array.from({ length: 14 }, (_, i) => i - 2).map((i) => `<text x="${n(cx)}" y="${n(cy + i * P)}" text-anchor="middle" dominant-baseline="central" font-family="${DRUM_FONT}" font-weight="${K.weight}" font-size="${n(P * K.glyph)}" fill="${ink.srgb}">${glyph(((i % 10) + 10) % 10)}</text>`).join('');
  const [st, sb] = K.shade, e = K.edge, [ga0, gw, gal] = K.glint;
  let defs = `<clipPath id="${id}-clip"><path d="${box}"/></clipPath>`;
  let shade = '';
  if (tier !== 'flat') {
    defs += `<linearGradient id="${id}-shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="${st}"/><stop offset="${e}" stop-color="#000" stop-opacity="0"/>`
      + `<stop offset="${n(1 - e)}" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${sb}"/></linearGradient>`;
    shade = `<path d="${box}" fill="url(#${id}-shade)"/><rect x="${n(cx - W / 2)}" y="${n(cy - H / 2 + H * ga0)}" width="${n(W)}" height="${n(H * gw)}" fill="#fff" fill-opacity="${gal}" clip-path="url(#${id}-clip)"/>`;
  }
  const body = `<g data-part="drum" data-value="${n(s.value ?? 0)}">`
    + `<path d="${box}" fill="${face.srgb}"/>`
    + `<g clip-path="url(#${id}-clip)"><g data-part="drum.strip" data-moves transform="translate(0 ${n(stripOffset(s.value ?? 0, P))})">${rows}</g></g>`
    + shade + '</g>';
  return { defs, body };
}
