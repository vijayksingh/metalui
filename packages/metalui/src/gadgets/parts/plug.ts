// The Plug Part: a knurled cap that seats in a Jack. Seen from above it is a round face on a darker
// skirt (its side), six grip knurls and a centre boss; a short cable stub may leave it. Its shadow is
// its own layer (the seat mechanism opens it as the plug lifts). Canvas units; drawn by the React
// Part, the gadget renderer and SwiftUI (MetalPlug) from the same numbers (tokens gadgets.plug).
import { GADGETS, type GadgetMaterial } from '../gadgets.generated';
import { pigment } from '../color';
import { materialFilter, type Host, type Tier } from '../light';

export interface PlugSpec {
  at: [number, number];
  /** Diameter, units (default the Part's size). */
  size?: number;
  /** The face's pigment (OKLCH): the accent for the plug you would touch, else the material's. */
  color: { L: number; C: number; H: number };
  material?: GadgetMaterial;
  stub?: 'up' | 'left' | 'right' | 'none';
}

const P = GADGETS.plug;
const n = (x: number) => +x.toFixed(2);
const DIR = { up: [0, -1], left: [-1, 0], right: [1, 0] } as const;

export interface PlugDraw { defs: string; shadow: string; body: string }

export function drawPlug(id: string, s: PlugSpec, o: { tier?: Tier; host?: Host } = {}): PlugDraw {
  const tier = o.tier ?? 'full', host = o.host ?? 'bone';
  const [cx, cy] = s.at, R = (s.size ?? GADGETS.parts.plug.size[0]) / 2, { L, C, H } = s.color;
  const face0 = pigment(L + 0.05, C * 0.9, H - 6), face1 = pigment(L - 0.02, C, H + 4), skirt = pigment(L - P.skirt, C * 0.95, H + 6), boss = pigment(L - P.bossDrop, C, H);
  let defs = `<radialGradient id="${id}-face" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="${face0.srgb}" style="stop-color: ${face0.p3}"/><stop offset="1" stop-color="${face1.srgb}" style="stop-color: ${face1.p3}"/></radialGradient>`;
  if (tier !== 'flat') defs += `<filter id="${id}-soft" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="${n(R * P.shadow[0])}"/></filter>`
    + materialFilter(`${id}-light`, s.material ?? 'clay', { tier: 'lite', host, part: true });
  // Its shadow on the surface below, a layer of its own: down-right of the plug, soft (hard-edged when flat).
  const soft = tier === 'flat' ? '' : ` filter="url(#${id}-soft)"`;
  const shadow = `<g data-part="plug.shadow"><circle cx="${n(cx + R * P.shadow[1])}" cy="${n(cy + R * P.shadow[2])}" r="${n(R * 1.05)}" fill="rgba(30,26,22,${P.shadow[3]})"${soft}/></g>`;
  const stub = s.stub && s.stub !== 'none' ? (() => {
    const [dx, dy] = DIR[s.stub], len = R * P.stub[0], w = R * P.stub[1];
    const rubber = pigment(P.stubL, P.stubC, H);
    return `<path d="M${n(cx + dx * R * P.stubFrom)},${n(cy + dy * R * P.stubFrom)} L${n(cx + dx * (R + len))},${n(cy + dy * (R + len))}" stroke="${rubber.srgb}" stroke-width="${n(w)}" stroke-linecap="round" data-stub="${s.stub}"/>`;
  })() : '';
  const knurls = tier === 'flat' ? '' : Array.from({ length: P.knurls }, (_, i) => {
    const a = (i / P.knurls) * 360;
    return `<path d="M${n(cx)},${n(cy - R * P.knurl[1])} v${n(R * (P.knurl[1] - P.knurl[0]))}" transform="rotate(${a} ${n(cx)} ${n(cy)})" stroke="rgba(0,0,0,${P.knurlAlpha})" stroke-width="${n(R * P.knurlWidth)}" stroke-linecap="round"/>`;
  }).join('');
  const light = tier === 'flat' ? '' : ` filter="url(#${id}-light)"`;
  const body = `<g data-part="plug">${stub}<g${light}>`
    + `<circle cx="${n(cx)}" cy="${n(cy + R * P.side)}" r="${n(R)}" fill="${skirt.srgb}"/>`
    + `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(R * P.face)}" fill="url(#${id}-face)"/>${knurls}`
    + `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(R * P.boss)}" fill="${boss.srgb}"/></g></g>`;
  return { defs, shadow, body };
}
