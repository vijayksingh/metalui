// The Needle Part: a tapered pointer on a pivot cap, over a printed scale. The pointer is the accent,
// standing just above the glass (it casts a small shadow); its scale is printed on the glass in the
// glass's own ink, with a zone past the threshold in the waiting signal's colour. A value turns it:
// 0 at the left end of the arc, 1 at the right, straight up in the middle. Canvas units; drawn by the
// React Part, the gadget renderer and SwiftUI (MetalNeedle) from the same numbers (tokens gadgets.needle).
import { GADGETS } from '../gadgets.generated';
import { pigment } from '../color';
import type { Tier } from '../light';

export interface NeedleSpec {
  /** The pivot. */
  at: [number, number];
  /** Pivot to tip, units (default the Part's length). */
  length?: number;
  /** The scale's sweep, degrees (default 120). */
  arc?: number;
  ticks?: number;
  /** Where the zone begins, 0 to 1 (none if left out). */
  threshold?: number;
  /** Where the needle points, 0 to 1. */
  value?: number;
  /** The needle's pigment (the accent). */
  color: { L: number; C: number; H: number };
  /** The scale's ink: the glass it is printed on. */
  glass: { L: number; C: number; H: number };
}

const K = GADGETS.needle, C = GADGETS.cap;
const n = (x: number) => +x.toFixed(2);

/** The needle's rotation for a value: the arc's left end at 0, straight up at a half, its right end at 1. */
export const needleAngle = (value: number, arc: number) => (value - 0.5) * arc;

export interface NeedleDraw { defs: string; scale: string; needle: string; cap: string }

export function drawNeedle(id: string, s: NeedleSpec, o: { tier?: Tier } = {}): NeedleDraw {
  const tier = o.tier ?? 'full', [cx, cy] = s.at, L = s.length ?? GADGETS.parts.needle.size[0], arc = s.arc ?? 120, ticks = s.ticks ?? 9;
  const k = L / GADGETS.parts.needle.size[0];
  const [gd, gf, gg, ga, gm] = C.grooveInk, g = s.glass, ink = pigment(Math.max(gf, g.L - gd), Math.min(gm, g.C * gg + ga), g.H);
  const pt = (deg: number, r: number) => { const a = ((deg - 90) * Math.PI) / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
  // The scale: ticks along the arc, every major-th one longer; a zone band past the threshold.
  const [si, so, sm] = K.scale, [lw, la] = K.line;
  let scale = '';
  for (let i = 0; i < ticks; i++) {
    const deg = needleAngle(i / (ticks - 1), arc), major = i % K.major === 0;
    const [x0, y0] = pt(deg, L * (major ? sm : si)), [x1, y1] = pt(deg, L * so);
    scale += `<path d="M${n(x0)},${n(y0)}L${n(x1)},${n(y1)}" stroke-width="${n(lw * k * (major ? K.majorWidth : 1))}"/>`;
  }
  scale = `<g data-part="needle.scale" stroke="${ink.srgb}" stroke-opacity="${la}" stroke-linecap="round">${scale}</g>`;
  if (s.threshold !== undefined) {
    const [zi, zo, za] = K.zone, a0 = needleAngle(s.threshold, arc), a1 = needleAngle(1, arc), r = L * (zi + zo) / 2, w = L * (zo - zi);
    const [x0, y0] = pt(a0, r), [x1, y1] = pt(a1, r);
    scale += `<path data-part="needle.zone" d="M${n(x0)},${n(y0)} A${n(r)},${n(r)} 0 0 1 ${n(x1)},${n(y1)}" fill="none" stroke="${GADGETS.lamp.waiting[1]}" stroke-opacity="${za}" stroke-width="${n(w)}"/>`;
  }
  // The pointer, drawn straight up from the pivot, tapered, with a short tail; its shadow its own layer.
  const { L: nl, C: nc, H: nh } = s.color, body = pigment(nl, nc, nh), bw = K.base * k / 2, tw = K.tip * k / 2, tail = L * K.tail;
  const shape = `M${n(cx - bw)},${n(cy + tail)} L${n(cx - tw)},${n(cy - L)} L${n(cx + tw)},${n(cy - L)} L${n(cx + bw)},${n(cy + tail)} Z`;
  const [sb, sdx, sdy, sa] = K.shadow, turn = ` transform="rotate(${n(needleAngle(s.value ?? 0.5, arc))} ${n(cx)} ${n(cy)})"`;
  let defs = tier === 'flat' ? '' : `<filter id="${id}-soft" x="-50%" y="-10%" width="200%" height="120%"><feGaussianBlur stdDeviation="${n(sb * k)}"/></filter>`;
  const soft = tier === 'flat' ? '' : ` filter="url(#${id}-soft)"`;
  const needle = `<g data-part="needle" data-moves${turn}>`
    + (tier === 'flat' ? '' : `<path d="${shape}" fill="rgba(30,26,22,${sa})" transform="translate(${n(sdx * k)} ${n(sdy * k)})"${soft}/>`)
    + `<path d="${shape}" fill="${body.srgb}"/></g>`;
  // The pivot cap: a metal disc with a lit crown, over the needle (it does not turn visibly).
  const [ml, mc, mh] = GADGETS.jack.metal, metal = pigment(ml, mc, mh), crown = pigment(Math.min(1, ml + K.crown), mc, mh), r = K.cap * k;
  defs += `<radialGradient id="${id}-cap" cx=".38" cy=".32" r=".7"><stop offset="0" stop-color="${crown.srgb}"/><stop offset="1" stop-color="${metal.srgb}"/></radialGradient>`;
  const cap = `<g data-part="needle.cap"><circle cx="${n(cx + sdx * k * K.capShadow)}" cy="${n(cy + sdy * k * K.capShadow)}" r="${n(r)}" fill="rgba(30,26,22,${sa})"${soft}/><circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="url(#${id}-cap)"/></g>`;
  return { defs, scale, needle, cap };
}
