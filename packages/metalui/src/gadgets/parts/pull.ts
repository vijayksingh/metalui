// The Pull Part: a drawer's handle on its front, seen from above. A bar is a metal capsule standing off
// the front on two posts, lit on its upper curve and casting a shadow onto the front; a recess is a
// finger slot cut into the front instead, dark inside with a lit lower lip. It has no state of its own:
// the drawer it is on moves it. Canvas units; drawn by the React Part, the gadget renderer and SwiftUI
// (MetalPull) from the same numbers (tokens gadgets.pull).
import { GADGETS } from '../gadgets.generated';
import { pigment } from '../color';
import type { Tier } from '../light';
import { roundedRect } from './slab';

export type PullStyle = 'bar' | 'recess';
export interface PullSpec {
  /** The bar's centre (or the recess's). */
  at: [number, number];
  /** [width, height], units (default the Part's 96 × 14). */
  size?: [number, number];
  style?: PullStyle;
  /** A bar's metal, or the front a recess is cut into (OKLCH). */
  color?: { L: number; C: number; H: number };
}

const K = GADGETS.pull;
const n = (x: number) => +x.toFixed(2);

export interface PullDraw { defs: string; shadow: string; body: string }

export function drawPull(id: string, s: PullSpec, o: { tier?: Tier } = {}): PullDraw {
  const tier = o.tier ?? 'full', [cx, cy] = s.at, [W, H] = s.size ?? (GADGETS.parts.pull.size as unknown as [number, number]);
  const [ml, mc, mh] = GADGETS.jack.metal, c = s.color ?? { L: ml, C: mc, H: mh };
  const bar = roundedRect([cx, cy], [W, H], H / 2);
  if (s.style === 'recess') {
    // A finger slot: the cut's own dark, and the lower lip catching the light.
    const [lw, la] = K.lip;
    const body = `<g data-part="pull" data-style="recess"><path d="${bar}" fill="rgba(20,16,12,${K.recess})"/>`
      + `<path d="M${n(cx - W / 2 + H / 2)},${n(cy + H / 2)} H${n(cx + W / 2 - H / 2)}" stroke="#fff" stroke-opacity="${la}" stroke-width="${lw}" stroke-linecap="round"/></g>`;
    return { defs: '', shadow: '', body };
  }
  // The bar: on two posts from the front (above it on the canvas), lit on its upper curve.
  const crown = pigment(Math.min(1, c.L + K.crown), c.C, c.H), metal = pigment(c.L, c.C, c.H), foot = pigment(c.L - K.foot, c.C, c.H);
  const [pw, pi] = K.posts, [sa, sal] = K.sheen, [sb, sdx, sdy, shA] = K.shadow;
  let defs = `<linearGradient id="${id}-bar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${crown.srgb}"/><stop offset=".45" stop-color="${metal.srgb}"/><stop offset="1" stop-color="${foot.srgb}"/></linearGradient>`;
  if (tier !== 'flat') defs += `<filter id="${id}-soft" x="-30%" y="-100%" width="160%" height="300%"><feGaussianBlur stdDeviation="${sb}"/></filter>`;
  const shadow = tier === 'flat' ? '' : `<g data-part="pull.shadow"><path d="${bar}" fill="rgba(30,26,22,${shA})" transform="translate(${sdx} ${sdy})" filter="url(#${id}-soft)"/></g>`;
  const post = (x: number) => `<rect x="${n(x - pw / 2)}" y="${n(cy - H / 2 - K.standoff)}" width="${pw}" height="${n(K.standoff + H / 2)}" fill="${foot.srgb}"/>`;
  const body = `<g data-part="pull" data-style="bar">${post(cx - W / 2 + pi)}${post(cx + W / 2 - pi)}<path d="${bar}" fill="url(#${id}-bar)"/>`
    + (tier === 'flat' ? '' : `<path d="M${n(cx - W / 2 + H / 2)},${n(cy - H / 2 + H * sa)} H${n(cx + W / 2 - H / 2)}" stroke="#fff" stroke-opacity="${sal}" stroke-width="1.2" stroke-linecap="round"/>`) + '</g>';
  return { defs, shadow, body };
}
