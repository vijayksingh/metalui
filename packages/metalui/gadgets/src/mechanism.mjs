// Mechanisms as data: how a gadget moves when it acts. A mechanism is an icon study (one clock, one
// track per moving part, keyframes at absolute ms; icons/src/motion.mjs) plus the things a physical
// object also does while it moves: sound cues (a part of its material struck, at the moment it
// lands), lamp cues, named held poses a state may rest in, and what survives reduced motion.
// scripts/build-gadgets.mjs validates every mechanism against the contract below and compiles it
// for the web player and SwiftUI.
import tokens from '../../../../tokens/tokens.json' with { type: 'json' };
import { T, spring, end, ease, pose, light, actor, parsePose, SPRINGS } from '../../icons/src/motion.mjs';

export { T, spring, end, ease, pose, light, actor };

/** A part of `slot` struck at `at` ms: level relative to the act level; pitch multiplies its fundamental. */
export const strike = (at, slot, { level = 1, pitch = 1 } = {}) => ({ at, kind: 'strike', slot, level, pitch });
/** A part sliding across [at, until]: its material's contact noise, low, repeated. */
export const friction = (at, until, slot, level) => ({ at, until, kind: 'friction', slot, level });
/** A detent passed: fires per detent crossed by a held mechanism, so it has no time. */
export const detent = (slot, level) => ({ kind: 'detent', slot, level });
/** The state's own earcon on the beeper, at `at`. Never a fixed tone. */
export const beep = (at) => ({ at, kind: 'beep' });
/** A lamp gesture at `at` (status.gestures). */
export const lamp = (at, gesture) => ({ at, kind: 'lamp', gesture });

/**
 * When a spring of `kind` released at `from` first reaches its target: the moment a part lands.
 * Sound belongs there, so a strike is never placed by eye.
 */
export function landing(kind = 'part') {
  const sp = SPRINGS[kind], w = Math.sqrt(sp.stiffness), z = sp.damping / (2 * w), wd = w * Math.sqrt(1 - z * z);
  // x(t) = 1 - e^(-zwt)(cos wd t + (zw/wd) sin wd t) first reaches 1 where cos + (zw/wd) sin = 0.
  const t = (Math.PI - Math.atan(wd / (z * w))) / wd;
  return Math.round(t * 1000);
}

export const mechanism = (name, def) => ({ name, ...def });

const GESTURES = Object.keys(tokens.status.gestures).filter((k) => !k.startsWith('$') && k !== 'dim');
const SPRING_NAMES = Object.keys(SPRINGS);

/** The build contract (engine LLD §6.1). Returns a list of problems; empty means sound. */
export function validateMechanism(m) {
  const bad = [], at = (x) => `${m.name}: ${x}`;
  const declared = (tokens.gadgets.mechanisms ?? {})[m.name];
  if (!declared) return [at('not declared in tokens gadgets.mechanisms')];
  if (m.mode !== declared.mode) bad.push(at(`mode is ${m.mode}; tokens say ${declared.mode}`));
  const slots = Object.keys(declared.slots);
  const own = Object.keys(m.slots ?? {});
  if (own.sort().join() !== [...slots].sort().join()) bad.push(at(`slots ${own.join(', ')} differ from tokens ${slots.join(', ')}`));
  if (!m.caption) bad.push(at('caption is required'));
  if (m.stages?.length !== 3) bad.push(at('stages must be three beats'));
  if (m.mode === 'momentary') {
    if (!(m.duration > 0)) bad.push(at('duration must be positive'));
    if (m.held) bad.push(at('a momentary mechanism has no held drive'));
    for (const t of m.tracks ?? []) {
      const w = `${m.name}/${t.part}`, f = t.frames, base = t.part.split('.')[0];
      if (!slots.includes(base)) bad.push(`${w}: "${base}" is not a slot`);
      if (f[0]?.at !== 0) bad.push(`${w}: first frame must be at 0`);
      if (f[f.length - 1]?.at !== m.duration) bad.push(`${w}: last frame must be at ${m.duration}`);
      for (let i = 1; i < f.length; i++) if (!(f[i].at > f[i - 1].at)) bad.push(`${w}: frame ${i} is not after frame ${i - 1}`);
      const lists = new Set(f.filter((x) => x.transform).map((x) => parsePose(x.transform).fns.join(' ')));
      if (lists.size > 1) bad.push(`${w}: every transform uses the same functions`);
      const a = f.find((x) => x.transform)?.transform, b = [...f].reverse().find((x) => x.transform)?.transform;
      if (a !== b) bad.push(`${w}: transform starts ${a} and ends ${b}; an act returns exactly`);
      const oa = f.find((x) => x.opacity !== undefined)?.opacity, ob = [...f].reverse().find((x) => x.opacity !== undefined)?.opacity;
      if (oa !== ob) bad.push(`${w}: opacity starts ${oa} and ends ${ob}; an act returns exactly`);
    }
  } else if (!m.held) bad.push(at('a held mechanism names its drive'));
  let beeps = 0;
  for (const c of m.cues ?? []) {
    if (c.kind === 'beep') beeps++;
    if (c.at !== undefined && (c.at < 0 || (m.duration && c.at > m.duration))) bad.push(at(`cue ${c.kind} at ${c.at} lies outside the act`));
    if (c.slot && !slots.includes(c.slot)) bad.push(at(`cue ${c.kind} names "${c.slot}", not a slot`));
    if (c.kind === 'lamp' && !GESTURES.includes(c.gesture)) bad.push(at(`lamp gesture "${c.gesture}" is not one of ${GESTURES.join(', ')}`));
  }
  if (beeps > 1) bad.push(at('a beep appears at most once'));
  if (m.held?.detents && !(m.cues ?? []).some((c) => c.kind === 'detent')) bad.push(at('held detents need a detent cue'));
  for (const [s, h] of Object.entries(m.states ?? {})) if (!slots.includes(h.hold)) bad.push(at(`state pose "${s}" holds "${h.hold}", not a slot`));
  if (m.spring && !SPRING_NAMES.includes(m.spring)) bad.push(at(`spring "${m.spring}" is not a mass class`));
  for (const r of m.reduced ?? []) if (!['lamp', 'sound', 'press'].includes(r)) bad.push(at(`reduced keeps "${r}"; it may keep lamp, sound and press`));
  return bad;
}

/** A transform string as numbers: { x, y, r, sx, sy }. */
export function poseOf(transform) {
  const p = { x: 0, y: 0, r: 0, sx: 1, sy: 1 };
  if (!transform || transform === 'none') return p;
  const num = (s) => parseFloat(s);
  const tr = transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/), ro = transform.match(/rotate\(([-\d.]+)deg\)/), sc = transform.match(/scale\(([-\d.]+),\s*([-\d.]+)\)/);
  if (tr) { p.x = num(tr[1]); p.y = num(tr[2]); }
  if (ro) p.r = num(ro[1]);
  if (sc) { p.sx = num(sc[1]); p.sy = num(sc[2]); }
  return p;
}

/** The runtime record: poses as numbers, easings as cubic-bezier control points. */
export function compileMechanism(m) {
  const bezier = (e) => {
    if (!e || e === 'linear') return [0, 0, 1, 1];
    const mm = e.match(/cubic-bezier\(([^)]+)\)/);
    if (!mm) throw new Error(`${m.name}: easing "${e}" is not a cubic-bezier`);
    return mm[1].split(',').map(Number);
  };
  let lastPose = null;
  return {
    name: m.name, mode: m.mode, duration: m.duration ?? 0, caption: m.caption, stages: m.stages,
    spring: m.spring ?? 'part',
    slots: m.slots,
    tracks: (m.tracks ?? []).map((t) => ({
      part: t.part,
      origin: t.origin,
      frames: t.frames.map((f) => {
        if (f.transform) lastPose = poseOf(f.transform);
        return { at: f.at, pose: f.transform ? poseOf(f.transform) : lastPose ?? poseOf('none'), opacity: f.opacity ?? null, ease: bezier(f.easing) };
      }),
    })),
    cues: m.cues ?? [],
    states: m.states ?? {},
    reduced: m.reduced ?? [],
    held: m.held ?? null,
  };
}
