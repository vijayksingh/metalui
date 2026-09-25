// The Backlight Part: light behind a translucent part (inside a bezel's glass, behind cells), in its
// own colour, fading to nothing at its edge. (Not a screen blend: the gadget glass is light, and
// screening light onto it washes the colour out.) A glow is a soft radial light;
// a beam is a radar wedge from the centre with a bright leading edge that fades behind it (drawn as
// slices, which every renderer can do); a dot is a blip with a hot core. Canvas units (tokens
// gadgets.backlight).
import { GADGETS } from '../gadgets.generated';
import { pigment } from '../color';
import { LAMP_COLORS, type LampSignal } from './led';

export type BacklightShape = 'glow' | 'beam' | 'dot';
export interface BacklightSpec {
  at: [number, number];
  /** The part it lights: its diameter, units. */
  size: number;
  shape?: BacklightShape;
  /** A signal, the accent, or the glass's own colour lifted: pass the glass colour for 'glass'. */
  color: { signal: LampSignal } | { accent: true } | { glass: { L: number; C: number; H: number } };
  alpha?: number;
  /** A beam's heading, degrees clockwise from up (a player turns it). */
  heading?: number;
}

const K = GADGETS.backlight;
const n = (x: number) => +x.toFixed(2);

export function backlightColor(c: BacklightSpec['color']): string {
  if ('signal' in c) return LAMP_COLORS[c.signal][1];
  if ('accent' in c) { const [L, C, H] = GADGETS.accent.warm; return pigment(L, C, H).srgb; }
  return pigment(Math.min(1, c.glass.L + K.glassLift), c.glass.C * K.glassChroma, c.glass.H).srgb;
}

export function drawBacklight(id: string, s: BacklightSpec): { defs: string; body: string } {
  const [cx, cy] = s.at, R = s.size / 2, shape = s.shape ?? 'glow', a = s.alpha ?? K.alpha, col = backlightColor(s.color);
  if (shape === 'glow' || shape === 'dot') {
    const r = shape === 'glow' ? R * K.glow * 2 : R * K.dot, core = shape === 'dot' ? K.core : 0;
    const defs = `<radialGradient id="${id}-g" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff" stop-opacity="${n(a)}"/>`
      + `<stop offset="${n(core)}" stop-color="${col}" stop-opacity="${n(a)}"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></radialGradient>`;
    return { defs, body: `<g data-part="backlight" data-shape="${shape}"><circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="url(#${id}-g)"/></g>` };
  }
  // The beam: slices from the leading edge back, each fainter; the edge itself a bright line.
  const slice = K.spread / K.slices, pt = (deg: number) => { const t = ((deg - 90) * Math.PI) / 180; return `${n(cx + R * Math.cos(t))},${n(cy + R * Math.sin(t))}`; };
  let wedges = '';
  for (let i = 0; i < K.slices; i++) {
    const a0 = -i * slice, a1 = -(i + 1) * slice, fade = a * (1 - i / K.slices);
    wedges += `<path d="M${n(cx)},${n(cy)} L${pt(a0)} A${n(R)},${n(R)} 0 0 0 ${pt(a1)} Z" fill="${col}" fill-opacity="${n(fade * K.sliceAlpha)}"/>`;
  }
  const [lw, la] = K.lead;
  wedges += `<path d="M${n(cx)},${n(cy)} L${pt(0)}" stroke="${col}" stroke-opacity="${n(la * a)}" stroke-width="${lw}" stroke-linecap="round"/>`;
  const turn = s.heading ? ` transform="rotate(${n(s.heading)} ${n(cx)} ${n(cy)})"` : '';
  return { defs: '', body: `<g data-part="backlight" data-shape="beam"${turn}>${wedges}</g>` };
}
