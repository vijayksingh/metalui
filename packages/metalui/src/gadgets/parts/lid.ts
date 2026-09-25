// The Lid Part: a hinged flap over a bin's mouth, seen from above. Opened by an angle about its hinge
// (the back edge, or the left), it foreshortens toward the hinge and, lifted, casts its shadow further
// out; the mouth under it is dark. Armed, its underside is red (the failed signal) and glows into the
// gap as it opens: red belongs to the lamp and to the lid's underside, never to a body. Canvas units;
// drawn by the React Part, the gadget renderer and SwiftUI (MetalLid) from the same numbers (tokens
// gadgets.lid).
import { GADGETS } from '../gadgets.generated';
import { pigment } from '../color';
import { materialFilter, type Host, type Tier } from '../light';
import { roundedRect } from './slab';

export type LidHinge = 'back' | 'left';
export interface LidSpec {
  /** The closed lid's centre. */
  at: [number, number];
  /** [width, length], units: the length runs away from the hinge. */
  size?: [number, number];
  hinge?: LidHinge;
  /** How far open, degrees about the hinge (0 closed). */
  open?: number;
  /** Its underside red: opening it shows the red. */
  armed?: boolean;
  /** The lid's pigment (OKLCH). */
  color: { L: number; C: number; H: number };
  material?: 'rubber' | 'clay';
}

const K = GADGETS.lid;
const n = (x: number) => +x.toFixed(3);
const rad = (deg: number) => (deg * Math.PI) / 180;

/** The lid's transform and its shadow's, open by `deg`: foreshortened toward the hinge; the shadow
 *  falls further out as the free edge rises. */
export function lidPose(s: Pick<LidSpec, 'at' | 'size' | 'hinge'>, deg: number) {
  const [w, h] = s.size ?? (GADGETS.parts.lid.size as unknown as [number, number]), left = s.hinge === 'left';
  const L = left ? w : h, short = Math.min(w, h), c = Math.cos(rad(deg)), rise = L * Math.sin(rad(deg)) * K.lift;
  const [, dx, dy] = K.shadow;
  const hx = s.at[0] - w / 2, hy = s.at[1] - h / 2;
  const fold = left ? `translate(${n(hx)} 0) scale(${n(c)} 1) translate(${n(-hx)} 0)` : `translate(0 ${n(hy)}) scale(1 ${n(c)}) translate(0 ${n(-hy)})`;
  // The shadow moves with the light (down and right), further the higher the free edge stands.
  const k = rise / Math.hypot(dx, dy);
  // The red under an armed lid starts at its free edge, wherever that has risen to.
  const under = left ? `translate(${n(L * c)} 0)` : `translate(0 ${n(L * c)})`;
  return { body: fold, shadow: `translate(${n(short * dx + dx * k)} ${n(short * dy + dy * k)}) ${fold}`, under };
}

/** Drawn in order: shadow (on what is around), mouth (dark already, so the shadow stays off it), body. */
export interface LidDraw { defs: string; mouth: string; shadow: string; body: string }

export function drawLid(id: string, s: LidSpec, o: { tier?: Tier; host?: Host } = {}): LidDraw {
  const tier = o.tier ?? 'full', host = o.host ?? 'bone', [w, h] = s.size ?? (GADGETS.parts.lid.size as unknown as [number, number]);
  const short = Math.min(w, h), r = short * K.radius, left = s.hinge === 'left', { L: tone, C, H } = s.color;
  const box = roundedRect(s.at, [w, h], r), pose = lidPose(s, s.open ?? 0);
  const [ml, mc] = K.mouth, [ur, ua] = K.under, [sb, , , sa] = K.shadow, [gw, gh, ga] = K.grip;
  const red = GADGETS.lamp.failed[1];
  // The mouth: dark rubber, and under an armed lid, red glowing into the gap from its free edge.
  const L = left ? w : h, x0 = s.at[0] - w / 2, y0 = s.at[1] - h / 2;
  let defs = `<linearGradient id="${id}-under" x1="0" y1="0" x2="${left ? 1 : 0}" y2="${left ? 0 : 1}"><stop offset="0" stop-color="${red}" stop-opacity="${ua}"/><stop offset="1" stop-color="${red}" stop-opacity="0"/></linearGradient>`
    + `<clipPath id="${id}-mouth"><path d="${box}"/></clipPath>`;
  const band = left ? `x="${n(x0)}" y="${n(y0)}" width="${n(L * ur)}" height="${n(h)}"` : `x="${n(x0)}" y="${n(y0)}" width="${n(w)}" height="${n(L * ur)}"`;
  const mouth = `<g data-part="lid.mouth"><path d="${box}" fill="${pigment(ml, C * mc, H).srgb}"/>`
    + `<g clip-path="url(#${id}-mouth)"><rect data-part="lid.under" ${band} fill="url(#${id}-under)" opacity="${s.armed ? 1 : 0}" transform="${pose.under}"/></g></g>`;
  if (tier !== 'flat') defs += `<filter id="${id}-soft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="${n(short * sb)}"/></filter>`
    + materialFilter(`${id}-light`, s.material ?? 'rubber', { tier: 'lite', host, part: true });
  const shadow = tier === 'flat' ? '' : `<g data-part="lid.shadow" transform="${pose.shadow}"><path d="${box}" fill="rgba(30,26,22,${sa})" filter="url(#${id}-soft)"/></g>`;
  // The grip: a finger slot near the free edge.
  const [cx, cy] = s.at, gx = left ? cx + w / 2 - short * gh * 2.2 : cx, gy = left ? cy : cy + h / 2 - short * gh * 2.2;
  const gs: [number, number] = left ? [short * gh, h * gw] : [w * gw, short * gh];
  const grip = `<path data-part="lid.grip" d="${roundedRect([gx, gy], gs, Math.min(...gs) / 2)}" fill="rgba(0,0,0,${ga})"/>`;
  const light = tier === 'flat' ? '' : ` filter="url(#${id}-light)"`;
  const body = `<g data-part="lid" data-hinge="${left ? 'left' : 'back'}" data-open="${n(s.open ?? 0)}" data-armed="${!!s.armed}" transform="${pose.body}">`
    + `<g${light}><path d="${box}" fill="${pigment(tone, C, H).srgb}"/></g>${grip}</g>`;
  return { defs, mouth, shadow, body };
}

/** Opens a drawn lid (anything under `root`) to `deg` without redrawing it: what the flip mechanism
 *  moves every frame. */
export function poseLid(root: Element, s: Pick<LidSpec, 'at' | 'size' | 'hinge'>, deg: number) {
  const p = lidPose(s, deg);
  const lid = root.querySelector('[data-part="lid"]');
  lid?.setAttribute('transform', p.body);
  lid?.setAttribute('data-open', String(n(deg)));
  root.querySelector('[data-part="lid.shadow"]')?.setAttribute('transform', p.shadow);
  root.querySelector('[data-part="lid.under"]')?.setAttribute('transform', p.under);
}
