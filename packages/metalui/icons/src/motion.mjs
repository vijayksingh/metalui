// Icon motion as data: one act per icon, played once through on hover, focus or click.
// The format is dither-icons' (docs/ICON-MOTION.md): a study is a shared clock and one track
// per moving part; each track is keyframes at absolute ms. The same data is compiled to CSS
// keyframes (standalone SVGs), to Web Animations keyframes (React) and to SwiftUI.
//
//   Frame  { at, transform?, opacity?, draw?, easing? }   easing = the curve leaving this frame
//   Track  { part, origin, frames }                        part = data-part in the body; origin in grid px
//   Study  { duration, caption, stages: [3], tracks }
//
// transform: CSS transform list (translate/rotate/scale) about `origin`, in grid units.
// draw:      how much of the part's stroke is drawn, 0–1 (its paths carry pathLength="1").

import tokens from '../../../../tokens/tokens.json' with { type: 'json' };

/* ── Physics ─────────────────────────────────────────────────
 * MetalUI is hardware, so an icon's parts move like objects: they have a mass class, and
 * the mass class is the same spring the rest of the system uses (tokens.json springs:
 * part, object, hinge, surface, settle, release, refusal). spring() writes that spring's
 * real turning points as keyframes, so a recoil or a settle is the physics of a key, a lid
 * or a card, not a curve picked by eye. Poses are numbers (T), so they can be sprung.
 * ────────────────────────────────────────────────────────── */
export const SPRINGS = Object.fromEntries(Object.entries(tokens.springs).filter(([k]) => !k.startsWith('$')));
const n4 = (v) => +v.toFixed(4);
const REST = { x: 0, y: 0, r: 0, sx: 1, sy: 1 };
/** A pose in grid units and degrees, always written in one canonical order so any two interpolate. */
export const T = (p = {}) => {
  const q = { ...REST, ...p };
  return `translate(${n4(q.x)}px,${n4(q.y)}px) rotate(${n4(q.r)}deg) scale(${n4(q.sx)},${n4(q.sy)})`;
};
const SWING = 'cubic-bezier(.37,0,.63,1)'; // between two turning points a spring moves like a sine
/**
 * The frames of a spring of `kind` carrying a part from pose `from` (at `at` ms) to pose `to`,
 * one frame per turning point until the motion is under `still` (grid units or degrees),
 * then exact rest. The first frame is `from` at `at`: don't author a frame there as well.
 */
export function spring(at, from, to = REST, kind = 'part', { still = 0.1 } = {}) {
  const sp = SPRINGS[kind];
  if (!sp) throw new Error(`spring: no mass class "${kind}"`);
  const w = Math.sqrt(sp.stiffness), z = sp.damping / (2 * w), wd = w * Math.sqrt(1 - z * z);
  const A = { ...REST, ...from }, B = { ...REST, ...to };
  const travel = Math.max(...Object.keys(REST).map((k) => Math.abs(A[k] - B[k]) * (k === 'sx' || k === 'sy' ? 20 : 1)));
  const x = (t) => 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t));
  const frames = [{ at, transform: T(A), easing: SWING }];
  let i = 1;
  for (; travel * Math.exp(-z * w * (i * Math.PI) / wd) > still && i < 12; i++) {
    const t = (i * Math.PI) / wd, k = x(t);
    frames.push({ at: Math.round(at + t * 1000), transform: T(Object.fromEntries(Object.keys(REST).map((c) => [c, A[c] + (B[c] - A[c]) * k]))), easing: SWING });
  }
  frames.push({ at: Math.round(at + ((i * Math.PI) / wd) * 1000), transform: T(B) });
  return frames;
}
/** When a list of frames ends: the study's duration when it is the last track to settle. */
export const end = (frames) => frames[frames.length - 1].at;

export const ease = {
  settle: 'cubic-bezier(.22,1,.36,1)',       // arrive and come to rest
  smooth: 'cubic-bezier(.4,0,.2,1)',         // between two poses
  accelerate: 'cubic-bezier(.55,0,.85,.45)', // leave rest, gathering speed
  strike: 'cubic-bezier(.16,.75,.3,.95)',    // a fast committed move that lands
  linear: 'linear',
};

export const pose = (at, transform, easing = ease.smooth) => ({ at, transform, easing });
export const light = (at, opacity, transform = 'none', easing) => ({ at, opacity, transform, ...(easing ? { easing } : {}) });
export const trace = (at, draw, easing = ease.smooth) => ({ at, draw, easing });
export const actor = (part, origin, frames) => ({ part, origin, frames });
export const motion = (duration, caption, stages, tracks) => ({ duration, caption, stages, tracks });

const PROPS = ['at', 'transform', 'opacity', 'draw', 'easing'];
const NONE = (t) => !t || /^(none|translate\(0(px)?,\s*0(px)?\)|rotate\(0(deg)?\)|scale\(1(,\s*1)?\))(\s+(translate\(0(px)?,\s*0(px)?\)|rotate\(0(deg)?\)|scale\(1(,\s*1)?\)))*$/.test(t.trim());

/**
 * A transform as numbers { fns, x, y, r, sx, sy }. Only translate, rotate and scale, each at most
 * once and in that order, so web (which interpolates function by function when two lists match)
 * and SwiftUI (which interpolates the numbers) move identically.
 */
export function parsePose(transform) {
  const out = { fns: [], x: 0, y: 0, r: 0, sx: 1, sy: 1 };
  if (!transform || transform.trim() === 'none') return out;
  const order = ['translate', 'rotate', 'scale'];
  let last = -1;
  for (const [, fn, args] of transform.matchAll(/(\w+)\(([^)]*)\)/g)) {
    const v = args.split(/[\s,]+/).filter(Boolean).map((a) => parseFloat(a));
    const base = fn.replace(/[XY]$/, '');
    const at = order.indexOf(base);
    if (at < 0) throw new Error(`transform "${transform}": ${fn} is not translate, rotate or scale`);
    if (at <= last) throw new Error(`transform "${transform}": use translate, then rotate, then scale, each once`);
    last = at;
    out.fns.push(fn);
    if (fn === 'translate') { out.x = v[0]; out.y = v[1] ?? 0; }
    else if (fn === 'translateX') out.x = v[0];
    else if (fn === 'translateY') out.y = v[0];
    else if (fn === 'rotate') out.r = v[0];
    else if (fn === 'scale') { out.sx = v[0]; out.sy = v[1] ?? v[0]; }
    else if (fn === 'scaleX') out.sx = v[0];
    else if (fn === 'scaleY') out.sy = v[0];
  }
  return out;
}

/** Build-time contract for one study against its body. Throws with every problem at once. */
export function validateStudy(name, study, body, defs = '') {
  const bad = [];
  if (!(study.duration > 0)) bad.push('duration must be positive');
  if (study.stages?.length !== 3) bad.push('stages must be three beats');
  if (!study.caption) bad.push('caption is required');
  for (const t of study.tracks) {
    const where = `${name}/${t.part}`;
    // One visible element per part; its occluders in defs (a mask's knockout) carry the same name
    // and move on the same track (MOT-07).
    const count = (body.match(new RegExp(`data-part="${t.part}"`, 'g')) || []).length;
    if (count !== 1) bad.push(`${where}: binds to ${count} data-part elements in the body, needs exactly one`);
    if (!/^-?[\d.]+px -?[\d.]+px$/.test(t.origin)) bad.push(`${where}: origin "${t.origin}" must be "Xpx Ypx"`);
    const f = t.frames;
    if (f[0]?.at !== 0) bad.push(`${where}: first frame must be at 0`);
    if (f[f.length - 1]?.at !== study.duration) bad.push(`${where}: last frame must be at ${study.duration}`);
    for (let i = 1; i < f.length; i++) if (!(f[i].at > f[i - 1].at)) bad.push(`${where}: frame ${i} is not after frame ${i - 1}`);
    for (const fr of f) for (const k of Object.keys(fr)) if (!PROPS.includes(k)) bad.push(`${where}: "${k}" is not animatable (transform, opacity, draw)`);
    const lists = new Set();
    for (const fr of f) if (fr.transform !== undefined) {
      try { const p = parsePose(fr.transform); if (p.fns.length) lists.add(p.fns.join(' ')); } catch (e) { bad.push(`${where}: ${e.message}`); }
    }
    if (lists.size > 1) bad.push(`${where}: every transform in a track uses the same functions (${[...lists].join(' | ')})`);
    // Return exactly (MOT-10): the act ends where it began, so nothing snaps when it is released.
    const first = f[0], last = f[f.length - 1];
    for (const k of ['transform', 'opacity', 'draw']) {
      const a = f.find((x) => x[k] !== undefined)?.[k], b = [...f].reverse().find((x) => x[k] !== undefined)?.[k];
      if (k === 'transform' ? !(NONE(a) && NONE(b)) && a !== b : a !== b) bad.push(`${where}: ${k} starts ${a} and ends ${b}; it must return exactly`);
    }
    // Accents (class "ac") are hidden at rest and explain a response (MOT-08).
    const el = body.match(new RegExp(`<[^>]*data-part="${t.part}"[^>]*>`))?.[0] || '';
    const accent = /\sclass="[^"]*\bac\b/.test(el);
    // A visible part rests in its drawn pose; an accent is unseen at rest, so it may wait anywhere.
    if (!accent && first.transform !== undefined && !NONE(first.transform)) bad.push(`${where}: rest transform must be none, not ${first.transform}`);
    if (accent) {
      if (!/\sopacity="0"/.test(el)) bad.push(`${where}: an accent is opacity="0" in the body`);
      if (first.opacity !== 0 || last.opacity !== 0) bad.push(`${where}: an accent starts and ends at opacity 0`);
      if (!el.endsWith('/>')) bad.push(`${where}: an accent is one self-closing element`);
    } else if (f.some((x) => x.opacity !== undefined && x.opacity < 1) && first.opacity === undefined) {
      bad.push(`${where}: a visible part that fades must say its rest opacity`);
    }
    if (f.some((x) => x.draw !== undefined) && !/pathLength="1"/.test(body)) bad.push(`${where}: draw needs pathLength="1" on the part's paths`);
  }
  if (bad.length) throw new Error(`icon motion ${name}:\n  ${bad.join('\n  ')}`);
}

const css = (fr) => {
  const out = [];
  if (fr.transform !== undefined) out.push(`transform:${fr.transform}`);
  if (fr.opacity !== undefined) out.push(`opacity:${fr.opacity}`);
  if (fr.draw !== undefined) out.push(`stroke-dashoffset:${+(1 - fr.draw).toFixed(4)}`);
  return out;
};

/** Rest geometry for every part: its pivot, and a dash for parts that draw. */
export function studyBaseCss(study, root) {
  return study.tracks.map((t) => {
    const draws = t.frames.some((f) => f.draw !== undefined);
    return `${root} [data-part="${t.part}"]{transform-origin:${t.origin}${draws ? ';stroke-dasharray:1 1' : ''}}`;
  }).join('');
}

/** The act as CSS keyframes, for players without script (standalone SVG, the page before hydration). */
export function studyCss(name, study, trigger) {
  return study.tracks.map((t) => {
    const kf = `mu-${name}-${t.part}`;
    const frames = t.frames.map((fr) => `${+(100 * fr.at / study.duration).toFixed(3)}%{${[...css(fr), ...(fr.easing ? [`animation-timing-function:${fr.easing}`] : [])].join(';')}}`).join('');
    return `${trigger} [data-part="${t.part}"]{animation:${kf} ${study.duration}ms linear both}@keyframes ${kf}{${frames}}`;
  }).join('');
}

/** The act as Web Animations keyframes, one list per part (what the React player runs). */
export function studyKeyframes(study) {
  return study.tracks.map((t) => ({
    part: t.part,
    keyframes: t.frames.map((fr) => {
      const k = { offset: +(fr.at / study.duration).toFixed(5) };
      if (fr.transform !== undefined) k.transform = fr.transform;
      if (fr.opacity !== undefined) k.opacity = fr.opacity;
      if (fr.draw !== undefined) k.strokeDashoffset = +(1 - fr.draw).toFixed(4);
      if (fr.easing) k.easing = fr.easing;
      return k;
    }),
  }));
}
