// The Cable Part: a rubber patch cord lying on the panel between two plugs. One cubic path, drawn as
// layered strokes (a soft shadow, the rubber body, its darker underside, a sheen along its top), the
// same on both platforms and cheap enough to move every frame. A cord with a length hangs by the
// parabola of a hanging cable: pull its ends apart and it goes taut, bring them together and it
// droops. Canvas units; drawn by the React Part, the gadget renderer and SwiftUI (MetalCable) from the
// same numbers (tokens gadgets.cable).
import { GADGETS } from '../gadgets.generated';
import { pigment } from '../color';
import type { Tier } from '../light';
import { SPRINGS } from '../../motion/springs.generated';

type Pt = [number, number];
export interface CableSpec {
  from: Pt;
  to: Pt;
  /** Droop at the middle, units. Leave it out to have it follow the length, or the distance. */
  sag?: number;
  /** The cord's length, units: its droop follows from how far apart its ends are. */
  length?: number;
  /** The rubber's pigment (OKLCH); default black rubber. */
  color?: { L: number; C: number; H: number };
}

const K = GADGETS.cable;
const n = (x: number) => +x.toFixed(2);
// A cubic whose two handles both drop k reaches 3/4·k at its middle.
const MID = 0.75;

/** How far a cord droops at its middle. With a length, the parabola of a hanging cable (arc ≈ d + 8s²/3d),
 *  or, when the ends are close, half the spare length hanging in a U; without one, a share of the distance. */
export function cableSag(from: Pt, to: Pt, o: { sag?: number; length?: number } = {}): number {
  if (o.sag !== undefined) return Math.max(0, o.sag);
  const d = Math.hypot(to[0] - from[0], to[1] - from[1]);
  if (o.length !== undefined) {
    const spare = Math.max(0, o.length - d);
    return Math.max(Math.sqrt((3 * d * spare) / 8), spare / 2);
  }
  const [share, lo, hi] = K.sag;
  return Math.min(hi, Math.max(lo, share * d));
}

/** The two handles of the cord's cubic: they leave the ends along the run and drop under gravity. */
export function cableControls(from: Pt, to: Pt, sag: number): [Pt, Pt] {
  const dx = to[0] - from[0], k = sag / MID;
  return [[from[0] + K.handle * dx, from[1] + k], [to[0] - K.handle * dx, to[1] + k]];
}

export function cablePath(from: Pt, to: Pt, [c1, c2]: [Pt, Pt]): string {
  return `M${n(from[0])},${n(from[1])} C${n(c1[0])},${n(c1[1])} ${n(c2[0])},${n(c2[1])} ${n(to[0])},${n(to[1])}`;
}

export interface CableDraw { defs: string; shadow: string; body: string; sag: number; d: string }

/** The cord's shadow (its own layer, under the plugs) and its body. Every path carries `data-cable`,
 *  so a player can move the cord by rewriting one `d` on each. */
export function drawCable(id: string, s: CableSpec, o: { tier?: Tier; width?: number } = {}): CableDraw {
  const tier = o.tier ?? 'full', w = o.width ?? K.width;
  const H = (GADGETS.materials.rubber as unknown as { sample: number }).sample;
  const c = s.color ?? { L: K.rubber[0], C: K.rubber[1], H };
  const body = pigment(c.L, c.C, c.H), under = pigment(c.L - K.shade[0], c.C, c.H);
  const sag = cableSag(s.from, s.to, s), d = cablePath(s.from, s.to, cableControls(s.from, s.to, sag));
  const [sb, sdx, sdy, sa] = K.shadow, [, uw, udx, udy] = K.shade, [hw, hdx, hdy, ha] = K.sheen;
  const flat = tier === 'flat';
  const defs = flat ? '' : `<filter id="${id}-soft" x="-20%" y="-20%" width="140%" height="160%"><feGaussianBlur stdDeviation="${n(w * sb)}"/></filter>`;
  const stroke = (color: string, width: number, dx: number, dy: number, extra = '') =>
    `<path data-cable d="${d}" fill="none" stroke="${color}" stroke-width="${n(width)}" stroke-linecap="round"${dx || dy ? ` transform="translate(${n(dx)} ${n(dy)})"` : ''}${extra}/>`;
  const shadow = `<g data-part="cable.shadow">${stroke(`rgba(30,26,22,${flat ? sa / 2 : sa})`, w, w * sdx, w * sdy, flat ? '' : ` filter="url(#${id}-soft)"`)}</g>`;
  const lit = `<g data-part="cable" data-sag="${n(sag)}">${stroke(body.srgb, w, 0, 0)}`
    + (flat ? '' : stroke(under.srgb, w * uw, w * udx, w * udy))
    + stroke(`rgba(255,255,255,${ha})`, w * hw, w * hdx, w * hdy) + '</g>';
  return { defs, shadow, body: lit, sag, d };
}

export interface CableSwing {
  /** Moves the cord: its ends go at once (a hand or a plug holds them), its belly follows on the spring. */
  set(s: CableSpec): void;
  setReduced(reduced: boolean): void;
  readonly moving: boolean;
  destroy(): void;
}

/** Drives drawn cable paths (everything under `root` with `data-cable`) as the ends move. The belly
 *  keeps its velocity when the ends move again, so a flicked end swings the cord and it settles. */
export function createCableSwing(root: Element, start: CableSpec, o: { reduced?: boolean; onSettle?: () => void } = {}): CableSwing {
  const SP = SPRINGS[K.spring as keyof typeof SPRINGS];
  let reduced = !!o.reduced, raf = 0, last = 0, moving = false;
  let from = start.from, to = start.to;
  let goal = cableControls(from, to, cableSag(from, to, start)).flat();
  const now = [...goal], vel = [0, 0, 0, 0];
  const paint = () => {
    const d = cablePath(from, to, [[now[0], now[1]], [now[2], now[3]]]);
    root.querySelectorAll('[data-cable]').forEach((p) => p.setAttribute('d', d));
  };
  const frame = () => {
    const t = performance.now(), dt = Math.min(0.032, last ? (t - last) / 1000 : 1 / 60);
    last = t;
    let still = true;
    for (let i = 0; i < 4; i++) {
      for (let k = 0; k < 4; k++) {       // four substeps: stable at any frame rate
        const h = dt / 4, a = -SP.stiffness * (now[k] - goal[k]) - SP.damping * vel[k];
        vel[k] += a * h; now[k] += vel[k] * h;
      }
    }
    for (let k = 0; k < 4; k++) if (Math.abs(now[k] - goal[k]) > 0.05 || Math.abs(vel[k]) > 0.1) still = false;
    if (still) { now.splice(0, 4, ...goal); vel.fill(0); }
    paint();
    moving = !still;
    if (moving) raf = requestAnimationFrame(frame); else { last = 0; o.onSettle?.(); }
  };
  return {
    set(s) {
      from = s.from; to = s.to;
      goal = cableControls(from, to, cableSag(from, to, s)).flat();
      if (reduced) { now.splice(0, 4, ...goal); vel.fill(0); paint(); return; }
      paint();
      if (!moving) { moving = true; raf = requestAnimationFrame(frame); }
    },
    setReduced(r) { reduced = r; },
    get moving() { return moving; },
    destroy() { cancelAnimationFrame(raf); moving = false; },
  };
}
