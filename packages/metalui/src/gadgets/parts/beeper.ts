// The Beeper Part: a grille plate over a brass piezo disc, the only source of tones in a gadget. It
// never glows. While a note plays, the disc flexes and catches the light, and the plate lifts a hair.
// Both follow the earcon's own notes (sound.beeper.earcons), so what you see lands with what you hear.
// Canvas units; drawn by the React Part, the gadget renderer and SwiftUI (MetalBeeper) from the same
// numbers (tokens gadgets.beeper).
import { GADGETS, type GadgetMaterial } from '../gadgets.generated';
import { SOUND, type Earcon } from '../../sound/recipes.generated';
import { pigment } from '../color';
import { holeFilter, materialFilter, type Host, type Tier } from '../light';
import { roundedRect } from './slab';

export interface BeeperSpec {
  at: [number, number];
  /** The plate's width, units (default the Part's width); its height keeps the Part's aspect. */
  size?: number;
  slots?: number;
  material?: Extract<GadgetMaterial, 'metal' | 'clay'>;
  /** The plate's pigment (OKLCH); default satin steel, or pale clay. */
  color?: { L: number; C: number; H: number };
}

const B = GADGETS.beeper;
const [PW, PH] = GADGETS.parts.beeper.size;
const n = (x: number) => +x.toFixed(2);

export interface BeeperDraw { defs: string; body: string }

/** The disc (under the plate, with a lit copy a player crossfades in) and the plate with its slots. */
export function drawBeeper(id: string, s: BeeperSpec, o: { tier?: Tier; host?: Host } = {}): BeeperDraw {
  const tier = o.tier ?? 'full', host = o.host ?? 'bone', material = s.material ?? 'metal';
  const [cx, cy] = s.at, W = s.size ?? PW, H = (W * PH) / PW, k = s.slots ?? B.slots;
  const J = GADGETS.jack.metal, clay = (GADGETS.materials.clay as unknown as { sample: number }).sample;
  const c = s.color ?? (material === 'metal' ? { L: J[0], C: J[1], H: J[2] } : { L: GADGETS.plug.faceClay, C: GADGETS.plug.faceC, H: clay });
  const plate = pigment(c.L, c.C, c.H), brass = pigment(B.brass[0], B.brass[1], B.brass[2]), lit = pigment(B.litL, B.brass[1], B.brass[2]);
  // More slots, narrower ones: a slot is never wider than the gap between two.
  const sw = W * Math.min(B.slot[0], B.span / (2 * k - 1)), sh = H * B.slot[1], span = W * B.span;
  const slots = Array.from({ length: k }, (_, i) => roundedRect([cx - span / 2 + (k === 1 ? span / 2 : (i * span) / (k - 1)), cy], [sw, sh], sw / 2));
  const floors = (fill: string) => slots.map((d) => `<path d="${d}" fill="${fill}"/>`).join('');
  let defs = '';
  if (tier !== 'flat') defs += materialFilter(`${id}-light`, material, { tier: 'lite', host, part: true }) + holeFilter(`${id}-wall`);
  const wall = tier === 'flat' ? '' : ` filter="url(#${id}-wall)"`, light = tier === 'flat' ? '' : ` filter="url(#${id}-light)"`;
  const body = `<g data-part="beeper" data-slots="${k}">`
    + `<g${wall}><g data-part="beeper.disc">${floors(brass.srgb)}</g><g data-part="beeper.flex" opacity="0">${floors(lit.srgb)}</g></g>`
    + `<g data-part="beeper.grille"${light}><path fill-rule="evenodd" fill="${plate.srgb}" d="${roundedRect([cx, cy], [W, H], H * B.radius)} ${slots.join(' ')}"/></g>`
    + '</g>';
  return { defs, body };
}

/** How much the disc is flexing (0..1) through an earcon, sampled every sample-ms: each note rises in
 *  rise-ms to its level, holds for its length and falls in fall-ms; overlapping notes take the larger. */
export function beeperEnvelope(earcon: Earcon): { at: number; v: number }[] {
  const notes = SOUND.beeper.earcons[earcon].notes as readonly (readonly number[])[];
  const end = Math.max(...notes.map(([, at, len]) => at + len)) + B.fallMs;
  const env = (t: number) => Math.max(0, ...notes.map(([, at, len, level]) => {
    const top = Math.min(1, level);
    if (t < at) return 0;
    if (t < at + B.riseMs) return (top * (t - at)) / B.riseMs;
    if (t <= at + len) return top;
    return Math.max(0, top * (1 - (t - at - len) / B.fallMs));
  }));
  const out: { at: number; v: number }[] = [];
  for (let t = 0; t <= end + B.sampleMs / 2; t += B.sampleMs) out.push({ at: Math.min(t, end), v: +env(Math.min(t, end)).toFixed(4) });
  return out;
}

/** Plays an earcon on a drawn beeper (anything under `root`): the disc catches the light and, unless
 *  motion is reduced, the plate lifts. Sound is the caller's: call `sound.beep(earcon)` with it. */
export function playBeeper(root: Element, earcon: Earcon, o: { reduced?: boolean; width?: number } = {}): Animation[] {
  const env = beeperEnvelope(earcon), total = env[env.length - 1].at || 1;
  const flex = root.querySelector('[data-part="beeper.flex"]'), part = root.querySelector('[data-part="beeper"]');
  const lift = (o.width ?? PW) * B.lift;
  const played: Animation[] = [];
  if (flex) played.push(flex.animate(env.map((e) => ({ offset: e.at / total, opacity: e.v })), { duration: total, fill: 'forwards' }));
  if (part && !o.reduced) played.push(part.animate(env.map((e) => ({ offset: e.at / total, transform: `translateY(${n(-lift * e.v)}px)` })), { duration: total }));
  return played;
}
