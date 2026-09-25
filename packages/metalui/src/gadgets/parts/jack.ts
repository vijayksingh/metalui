// The Jack Part: a knurled metal nut around a socket. The socket is a cut: its floor is dark metal in
// shadow, its top wall hides the light. Lit, a lamp glows at the bottom of the socket (a link or a
// live state, seen through the hole). Canvas units; drawn by the React Part, the gadget renderer and
// SwiftUI (MetalJack) from the same numbers (tokens gadgets.parts.jack, gadgets.jack).
import { GADGETS } from '../gadgets.generated';
import { pigment } from '../color';
import { LAMP_COLORS as LAMP } from './led';
import { holeFilter, materialFilter, type Host, type Tier } from '../light';

export interface JackSpec {
  at: [number, number];
  /** Outer diameter of the nut, units (default the Part's size). */
  size?: number;
  knurls?: number;
  /** A lamp glowing in the socket: its signal colour, or none. */
  lit?: 'live' | 'link' | 'waiting' | 'failed' | null;
}

const J = GADGETS.jack;
const n = (x: number) => +x.toFixed(2);
const circle = (cx: number, cy: number, r: number) => `M${n(cx - r)},${n(cy)} a${n(r)},${n(r)} 0 1 0 ${n(2 * r)},0 a${n(r)},${n(r)} 0 1 0 ${n(-2 * r)},0 Z`;

export interface JackDraw { defs: string; socket: string; nut: string }

/** The socket (under everything that sits in it) and the nut (over the slab). */
export function drawJack(id: string, s: JackSpec, o: { tier?: Tier; host?: Host } = {}): JackDraw {
  const tier = o.tier ?? 'full', host = o.host ?? 'bone';
  const [cx, cy] = s.at, R = (s.size ?? GADGETS.parts.jack.size[0]) / 2, r = R * J.hole, k = s.knurls ?? J.knurls;
  const metal = { L: J.metal[0], C: J.metal[1], H: J.metal[2] };
  const hi = pigment(metal.L + 0.12, metal.C, metal.H), mid = pigment(metal.L - 0.06, metal.C, metal.H), lo = pigment(metal.L + 0.04, metal.C, metal.H);
  const floor = pigment(J.floor, metal.C, metal.H);
  let defs = `<linearGradient id="${id}-nut" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${hi.srgb}"/><stop offset=".5" stop-color="${mid.srgb}"/><stop offset="1" stop-color="${lo.srgb}"/></linearGradient>`
    + `<radialGradient id="${id}-floor" cx=".45" cy=".4" r=".7"><stop offset="0" stop-color="${floor.srgb}"/><stop offset="1" stop-color="${pigment(J.floor - 0.08, metal.C, metal.H).srgb}"/></radialGradient>`;
  if (tier !== 'flat') defs += materialFilter(`${id}-light`, 'metal', { tier: tier === 'full' ? 'lite' : tier, host, part: true }) + holeFilter(`${id}-wall`);
  let lamp = '';
  if (s.lit) {
    const [l0, l1] = LAMP[s.lit];
    defs += `<radialGradient id="${id}-lamp" cx=".45" cy=".4" r=".6"><stop offset="0" stop-color="${l0}"/><stop offset=".55" stop-color="${l1}"/><stop offset="1" stop-color="${l1}" stop-opacity="0"/></radialGradient>`;
    lamp = `<circle cx="${n(cx)}" cy="${n(cy + r * 0.12)}" r="${n(r * J.glow)}" fill="url(#${id}-lamp)" data-lit="${s.lit}"/>`;
  }
  const wall = tier === 'flat' ? '' : ` filter="url(#${id}-wall)"`;
  const socket = `<g${wall}><path d="${circle(cx, cy, r)}" fill="url(#${id}-floor)" data-part="socket"/></g>${lamp}`;
  // The knurls: short grooves around the rim, each dark with a lit lower edge (engraved into metal).
  const knurls = tier === 'flat' ? '' : Array.from({ length: k }, (_, i) => {
    const a = (i / k) * 2 * Math.PI, c = Math.cos(a), sn = Math.sin(a), r0 = R * J.knurl[0], r1 = R * J.knurl[1];
    return `<path d="M${n(cx + c * r0)},${n(cy + sn * r0)} L${n(cx + c * r1)},${n(cy + sn * r1)}" stroke="rgba(0,0,0,${J.knurlAlpha})" stroke-width="${n(R * J.knurlWidth)}" stroke-linecap="round"/>`;
  }).join('');
  const light = tier === 'flat' ? '' : ` filter="url(#${id}-light)"`;
  const nut = `<g${light} data-part="jack"><path fill-rule="evenodd" fill="url(#${id}-nut)" d="${circle(cx, cy, R)} ${circle(cx, cy, r)}"/>${knurls}</g>`;
  return { defs, socket, nut };
}
