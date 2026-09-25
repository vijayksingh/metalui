// The gadget renderer: a spec and a state in, SVG out. Pure (no DOM, no clock), so the same strings
// serve the React component, the server and a build-time raster. It lays each Part out on the
// 400-unit canvas and draws them in the order a real object stacks: the body with its cuts (and what
// lies at the bottom of each cut), the trims standing on it, the cables lying over it, the plugs on
// top, and the lamp. It draws in three layers so a state change repaints only what changed: the body
// (its colour follows the state's feel), the parts (drawn once; the player moves them), the lamp.
import { GADGETS, type GadgetMaterial } from './gadgets.generated';
import type { GadgetSpec, PartPlacement } from './spec';
import { resolve, type ResolvedGadget, type Oklch } from './resolve';
import { tierFor, type Host, type Tier } from './light';
import { cutPath, drawSlab, drawTray, type Cut } from './parts/slab';
import { drawPull } from './parts/pull';
import { drawJack } from './parts/jack';
import { drawPlug } from './parts/plug';
import { drawCable } from './parts/cable';
import { drawBeeper } from './parts/beeper';
import { drawLamp, type LampSignal } from './parts/led';
import { drawCap } from './parts/cap';
import { drawKey } from './parts/key';
import { drawDrum } from './parts/drum';
import { drawNeedle } from './parts/needle';
import { drawCells } from './parts/cell';
import { drawLid } from './parts/lid';
import { digitOf } from './drive';
import { drawBezel } from './parts/bezel';
import { drawGlass } from './parts/glass';
import { drawBacklight, type BacklightShape } from './parts/backlight';
import { MECHANISMS } from './mechanisms.generated';

export interface DrawOptions { state?: string; tier?: Tier; host?: Host; id?: string; lamp?: [string, string]; value?: number }
export interface GadgetDraw {
  resolved: ResolvedGadget;
  state: string;
  body: { defs: string; html: string };
  parts: { defs: string; html: string };
  /** Over the parts: an inset gadget's glass surface and its frame (empty for a slab gadget). */
  top: { defs: string; html: string };
  lamp: { defs: string; html: string };
  /** The spoken description: the spec's `describe` with {title} and {state}, then the state's hint. */
  description: string;
}

const sizeOf = (p: PartPlacement): [number, number] =>
  (p.size ?? (GADGETS.parts[p.part] as unknown as { size: readonly [number, number] }).size) as [number, number];
const pointOf = (spec: GadgetSpec, ref: unknown): [number, number] | null => {
  const p = typeof ref === 'string' ? spec.parts.find((q) => q.id === ref) : null;
  return p ? p.at : null;
};
const clayFace = (): Oklch => ({ L: GADGETS.plug.faceClay, C: GADGETS.plug.faceC, H: (GADGETS.materials.clay as unknown as { sample: number }).sample });

/** The state a gadget shows: the one asked for if the spec has it, else its initial state. */
export function stateOf(spec: GadgetSpec, state?: string): string {
  if (state && spec.states[state]) return state;
  return spec.initial && spec.states[spec.initial] ? spec.initial : Object.keys(spec.states)[0];
}

export function describeGadget(spec: GadgetSpec, state: string, value?: number): string {
  const v = value ?? driveDefault(spec);
  const r = driveRange(spec);
  const text = (spec.describe ?? '{title}: {state}').replace('{title}', spec.title).replace('{state}', state).replace('{value}', String(Math.round(v)))
    .replace('{max}', String(r.max)).replace('{unit}', r.unit ?? '')
    .replace('{share}', `${Math.round(driveShare(spec, v) * 100)}%`).replace(/\s+$/, '');
  const hint = spec.states[state]?.hint;
  return hint ? `${text}, ${hint}` : text;
}

/** The pose a state holds each part in (its `form`), by part id. */
export function formPoses(spec: GadgetSpec, state: string): Record<string, { x?: number; y?: number; r?: number; sx?: number; sy?: number }> {
  const out: Record<string, { x?: number; y?: number; r?: number }> = {};
  for (const [id, f] of Object.entries(spec.states[state]?.form ?? {})) if ('pose' in f) out[id] = f.pose;
  return out;
}

type HeldDef = { slot: string; from?: { y?: number }; to?: { y?: number }; roll?: boolean };
/** A held mechanism with a travel (a slide): a roll turns round and round and has none. */
const heldOf = (spec: GadgetSpec) => { const h = (MECHANISMS as unknown as Record<string, { held: (HeldDef & { from: { y?: number }; to: { y?: number } }) | null }>)[spec.mechanism.name]?.held; return h && !h.roll ? h : null; };
const boundTo = (spec: GadgetSpec, slot: string): string[] => { const b = spec.mechanism.bind[slot]; return b === undefined ? [] : Array.isArray(b) ? b : [b]; };

/** The value a held gadget's drive port starts at: the port's default, else the middle. */
export function driveDefault(spec: GadgetSpec): number {
  const port = spec.mechanism.drive ?? Object.keys(spec.ports?.in ?? {})[0];
  const ch = port ? spec.ports?.in?.[port] : undefined;
  return ch && 'default' in ch && typeof ch.default === 'number' ? ch.default : ch && 'default' in ch && typeof ch.default === 'boolean' ? Number(ch.default) : 0.5;
}

/** Where each actor of a held gadget goes for a drive value: its own rest place (its `value`
 *  param), shifted by how far the value sits from the middle. Push the value up and the whole
 *  bank moves up, until caps meet the top of their slots. */
/** The drive port's range: [min, max] for a number, 0..max for a count, else 0..1. */
export function driveRange(spec: GadgetSpec): { min: number; max: number; unit?: string } {
  const port = spec.mechanism.drive ?? Object.keys(spec.ports?.in ?? {})[0];
  const ch = port ? (spec.ports?.in?.[port] as { kind: string; min?: number; max?: number; unit?: string } | undefined) : undefined;
  return { min: ch?.min ?? 0, max: ch?.max ?? 1, unit: ch?.unit };
}

/** A value as a share of the drive port's range, 0 to 1. */
export const driveShare = (spec: GadgetSpec, value: number) => { const r = driveRange(spec); return Math.min(1, Math.max(0, (value - r.min) / (r.max - r.min || 1))); };

/** The state a gadget shows for a value: a needle past its threshold makes it `over` (the value
 *  decides, not the host); back under, `over` falls back to rest. Other states are the host's. */
export function derivedState(spec: GadgetSpec, state: string, value?: number): string {
  // A drawer too full to close is full; opened by the host it is open. Emptied, back to rest.
  if (spec.parts.some((p) => p.part === 'slab' && p.role === 'actor') && spec.states.full && value !== undefined) {
    if (driveShare(spec, value) >= GADGETS.tray.full) return state === 'open' ? 'open' : 'full';
    return state === 'full' ? 'rest' : state;
  }
  // Cells that fill: none lit is rest, some filling, all full. A first run is the host's.
  if (spec.parts.some((p) => p.part === 'cell') && spec.states.filling && spec.states.full && value !== undefined && state !== 'first-run') {
    const u = driveShare(spec, value);
    return u <= 0 ? 'rest' : u >= 1 ? 'full' : 'filling';
  }
  // A switch that names a state: on, it is that state; off, back to rest. A state entered by an act
  // (a bin emptied) is the host's and stands.
  const port = spec.mechanism.drive, ch = port ? spec.ports?.in?.[port] : undefined;
  if (port && ch?.kind === 'boolean' && spec.states[port] && value !== undefined && spec.states[state]?.enter !== 'act') {
    return value >= 0.5 ? port : state === port ? 'rest' : state;
  }
  const needle = spec.parts.find((p) => p.part === 'needle'), t = needle?.params?.threshold;
  if (t === undefined || !spec.states.over || value === undefined) return state;
  if (driveShare(spec, value) >= Number(t)) return 'over';
  return state === 'over' ? stateOf(spec, undefined) === 'over' ? 'rest' : stateOf(spec, undefined) : state;
}

export function driveTargets(spec: GadgetSpec, value: number, state?: string): number[] {
  const held = heldOf(spec);
  if (!held) return [];
  // A lid goes where the state holds it (its form's turn, a share of the mechanism's full swing).
  if (boundTo(spec, held.slot).every((id) => spec.parts.find((p) => p.id === id)?.part === 'lid')) {
    const poses = formPoses(spec, state ?? stateOf(spec)), full = (held.to as { r?: number }).r ?? 1;
    return boundTo(spec, held.slot).map((id) => Math.min(1, Math.max(0, (poses[id]?.r ?? 0) / full)));
  }
  // Cells light to the value's share; on a first run the grid rises all the way.
  if (boundTo(spec, held.slot).every((id) => spec.parts.find((p) => p.id === id)?.part === 'cell')) return boundTo(spec, held.slot).map(() => (state === 'first-run' ? 1 : driveShare(spec, value)));
  // A needle points at the value's share of its range.
  if (boundTo(spec, held.slot).every((id) => spec.parts.find((p) => p.id === id)?.part === 'needle')) return boundTo(spec, held.slot).map(() => driveShare(spec, value));
  return boundTo(spec, held.slot).map((id) => {
    const rest = Number(spec.parts.find((p) => p.id === id)?.params?.value ?? 0.5);
    return Math.min(1, Math.max(0, rest + (value - 0.5)));
  });
}

/** How bright the light behind cells burns for a share lit: never quite dark, never quite white. */
export const backlightLevel = (share: number) => { const [a0, a1] = GADGETS.cell.backlight; return a0 + (a1 - a0) * Math.min(1, Math.max(0, share)); };

export function drawGadget(spec: GadgetSpec, o: DrawOptions = {}): GadgetDraw {
  const tier = o.tier ?? 'full', host = o.host ?? 'bone', id = o.id ?? `g-${spec.name}`;
  const resolved = resolve(spec), state = derivedState(spec, stateOf(spec, o.state), o.value ?? driveDefault(spec)), rs = resolved.states[state];
  const byId = Object.fromEntries(resolved.parts.map((p) => [p.id, p]));
  const poses = formPoses(spec, state);
  const bodyPart = spec.parts.find((p) => p.role === 'body');

  // The body, with a cut for everything that sits down into it: a jack's socket, the lamp's hole.
  const cuts: Cut[] = [];
  for (const p of spec.parts) {
    const [w] = sizeOf(p);
    if (p.part === 'jack') cuts.push({ kind: 'hole', at: p.at, size: [w * GADGETS.jack.hole, w * GADGETS.jack.hole] });
    if (p.part === 'led') cuts.push({ kind: 'hole', at: p.at, size: [w + GADGETS.hole.lip * 2, w + GADGETS.hole.lip * 2] });
  }
  // A slab placed with the cut role is a cut into the body: a tray, a well, a slot, a hole.
  for (const p of spec.parts) {
    if (p.part !== 'slab' || p.role !== 'cut') continue;
    const kind = (p.params?.cut as Cut['kind'] | undefined) ?? 'tray';
    cuts.push({ kind, at: p.at, size: sizeOf(p), depth: p.params?.depth === undefined ? undefined : Number(p.params.depth), radius: p.params?.radius === undefined ? undefined : Number(p.params.radius) });
  }
  // A driven actor runs in a slot cut as long as its travel.
  const held = heldOf(spec), driven = held ? boundTo(spec, held.slot) : [];
  if (held) for (const id of driven) {
    const p = spec.parts.find((q) => q.id === id); if (!p || p.part !== 'cap') continue;
    const y0 = held.from.y ?? 0, y1 = held.to.y ?? 0, [sw, pad] = GADGETS.cap.slot;
    cuts.push({ kind: 'slot', at: [p.at[0], p.at[1] + (y0 + y1) / 2], size: [sw, Math.abs(y1 - y0) + pad] });
  }
  const start = held ? driveTargets(spec, driveDefault(spec)) : [];
  // The value's share, for parts that show it as they are drawn (the cells lit, the light behind them).
  const share = driveShare(spec, o.value ?? driveDefault(spec)), lit = state === 'first-run' ? 1 : share;
  let body = { defs: '', html: '' }, top = { defs: '', html: '' };
  // An inset gadget: its face (the glass) is the body layer, the light in it the parts, and its surface
  // and frame the top, so light sits inside the glass and under the frame.
  let clip = '';
  if (bodyPart && bodyPart.part === 'bezel') {
    const bz = drawBezel(`${id}-body`, { at: bodyPart.at, size: sizeOf(bodyPart), material: resolved.material as GadgetMaterial, color: rs.body, opening: (bodyPart.params?.opening as 'round' | 'square' | undefined) ?? 'round', cuts }, { tier, host });
    const facePart = spec.parts.find((p) => p.part === 'glass-face');
    // Radar rings only when the face asks for them (a scope's), never on a gauge's glass.
    const g = drawGlass(`${id}-glass`, { at: bz.opening.at, size: bz.opening.size, shape: bz.opening.shape, color: resolved.face, rings: facePart?.params?.rings === true }, { tier });
    clip = g.clip;
    body = { defs: bz.defs + g.defs, html: `<g data-id="${facePart?.id ?? 'face'}">${g.glass}</g>` };
    top = { defs: '', html: `${g.surface}${bz.shade}<g data-id="${bodyPart.id}">${bz.frame}</g>` };
  }
  if (bodyPart && bodyPart.part === 'slab') {
    const s = drawSlab(`${id}-body`, { at: bodyPart.at, size: sizeOf(bodyPart), material: resolved.material as GadgetMaterial, color: rs.body, cuts }, { tier, host });
    body = { defs: s.defs, html: `<g data-id="${bodyPart.id}">${s.floors}` };
    // A socket's dark floor sits inside its cut, under the body.
    for (const p of spec.parts.filter((q) => q.part === 'jack')) {
      const j = drawJack(`${id}-${p.id}`, { at: p.at, size: sizeOf(p)[0] }, { tier, host });
      body.defs += j.defs;
      body.html += j.socket;
    }
    body.html += `${s.body}${s.lips}</g>`;
  }

  // The parts, lowest first: nuts and plates on the body, then cables, then plugs.
  let defs = '', trims = '', cables = '', plugs = '', lights = '';
  for (const p of spec.parts) {
    const size = sizeOf(p), pid = `${id}-${p.id}`;
    if (p.part === 'jack') {
      const j = drawJack(pid, { at: p.at, size: size[0] }, { tier, host });
      trims += `<g data-id="${p.id}">${j.nut}</g>`;
    } else if (p.part === 'beeper') {
      const b = drawBeeper(pid, { at: p.at, size: size[0], slots: Number(p.params?.slots ?? GADGETS.beeper.slots), material: byId[p.id].material === 'clay' ? 'clay' : 'metal' }, { tier, host });
      defs += b.defs;
      trims += `<g data-id="${p.id}">${b.body}</g>`;
    } else if (p.part === 'cable') {
      const from = pointOf(spec, p.params?.from), to = pointOf(spec, p.params?.to);
      if (!from || !to) continue;
      const c = drawCable(pid, { from, to, sag: p.params?.sag === undefined ? undefined : Number(p.params.sag), length: p.params?.length === undefined ? undefined : Number(p.params.length) }, { tier });
      defs += c.defs;
      cables += `<g data-id="${p.id}" data-from="${p.params?.from}" data-to="${p.params?.to}">${c.shadow}${c.body}</g>`;
    } else if (p.part === 'cap') {
      const r = byId[p.id], ceramic = p.material === 'ceramic';
      const face = r.accent && r.color ? r.color : ceramic ? { L: GADGETS.cap.ceramic[0], C: GADGETS.cap.ceramic[1], H: clayFace().H } : clayFace();
      const d = drawCap(pid, { at: p.at, size, color: face, material: ceramic ? 'ceramic' : 'clay', ribs: p.params?.ribs === undefined ? undefined : Number(p.params.ribs), shape: (p.params?.shape as 'fader' | 'knob' | undefined) ?? 'fader' }, { tier, host });
      defs += d.defs;
      // A driven cap is drawn at its starting place, so the first paint (and the server's) shows it there.
      const k = driven.indexOf(p.id), y = k >= 0 && held ? (held.from.y ?? 0) + ((held.to.y ?? 0) - (held.from.y ?? 0)) * start[k] : 0;
      plugs += `<g data-id="${p.id}"${r.accent ? ' data-accent="true"' : ''}><g data-drive="${k}" transform="translate(0 ${+y.toFixed(3)})">${d.shadow}${d.body}</g></g>`;
    } else if (p.part === 'backlight') {
      // Light in the glass: a beam turned by its mechanism, blips lit by it (dark until then, unless the
      // state says otherwise). Each is its own group, which a player moves or lights.
      const shape = (p.params?.shape as BacklightShape | undefined) ?? 'glow', colorName = (p.params?.color as string | undefined) ?? 'glass';
      const color = colorName === 'accent' ? { accent: true as const } : colorName === 'signal' ? { signal: rs.lamp[0] as LampSignal } : { glass: resolved.face };
      const d = drawBacklight(pid, { at: p.at, size: size[0], shape, color });
      defs += d.defs;
      const form = spec.states[state]?.form?.[p.id], alpha = form && 'param' in form && form.param === 'alpha' ? Number(form.value) : shape === 'dot' ? 0 : 1;
      if (!bodyPart || bodyPart.part !== 'slab') { lights += `<g data-id="${p.id}" data-moves style="opacity: ${alpha}">${d.body}</g>`; continue; }
      // On a slab, light behind cells: in the floor of the cut it sits in, as bright as the cells are full.
      const cut = cuts.find((c) => c.at[0] === p.at[0] && c.at[1] === p.at[1]);
      if (cut) defs += `<clipPath id="${pid}-clip"><path d="${cutPath(cut)}"/></clipPath>`;
      trims += `<g data-id="${p.id}"${cut ? ` clip-path="url(#${pid}-clip)"` : ''}><g data-part="backlight.level" style="opacity: ${+backlightLevel(lit).toFixed(3)}">${d.body}</g></g>`;
    } else if (p.part === 'slab' && p.role === 'actor' && bodyPart) {
      // A drawer's tray, run under the body's front edge: only what is out past the edge shows, and the
      // edge shadows it. Its cards stand to the value's share; it is drawn where the state holds it.
      const edge = bodyPart.at[1] + sizeOf(bodyPart)[1] / 2, [dd, da] = GADGETS.tray.edgeShadow, pose = poses[p.id];
      const d = drawTray(pid, { at: p.at, size: size as [number, number], color: rs.body, material: resolved.material as GadgetMaterial, fill: driveShare(spec, o.value ?? driveDefault(spec)) }, { tier, host });
      defs += d.defs + `<clipPath id="${pid}-out"><rect x="0" y="${edge - 1}" width="400" height="${400 - edge + 100}"/></clipPath>`
        + `<linearGradient id="${pid}-edge" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="${da}"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>`;
      const t = pose ? ` transform="translate(${pose.x ?? 0} ${pose.y ?? 0})"` : '';
      trims += `<g clip-path="url(#${pid}-out)"><g data-id="${p.id}"><g data-moves${t}>${d.body}</g></g>`
        + `<rect data-part="tray.edge" x="${p.at[0] - size[0] / 2 - GADGETS.tray.wall}" y="${edge}" width="${size[0] + 2 * GADGETS.tray.wall}" height="${dd}" fill="url(#${pid}-edge)"/></g>`;
    } else if (p.part === 'pull') {
      // A pull on a drawer front: it goes where the tray goes.
      const d = drawPull(pid, { at: p.at, size: size as [number, number], style: (p.params?.style as 'bar' | 'recess' | undefined) ?? 'bar', color: p.params?.style === 'recess' ? rs.body : undefined }, { tier });
      defs += d.defs;
      const pose = poses[p.id], t = pose ? ` transform="translate(${pose.x ?? 0} ${pose.y ?? 0})"` : '';
      plugs += `<g data-id="${p.id}"><g data-moves${t}>${d.shadow}${d.body}</g></g>`;
    } else if (p.part === 'lid') {
      // The lid on its mouth, turned to where the state holds it (the flip swings it from then on).
      const k = driven.indexOf(p.id), full = held ? -((held.to as { r?: number }).r ?? 0) : 0;
      const turn = k >= 0 ? driveTargets(spec, o.value ?? driveDefault(spec), state)[k] * full : 0;
      const d = drawLid(pid, { at: p.at, size: size as [number, number], hinge: (p.params?.hinge as 'back' | 'left' | undefined) ?? 'back', open: turn,
        armed: p.params?.armed === true, color: rs.body, material: resolved.material === 'clay' ? 'clay' : 'rubber' }, { tier, host });
      defs += d.defs;
      trims += `<g data-id="${p.id}">${d.shadow}${d.mouth}${d.body}</g>`;
    } else if (p.part === 'cell') {
      // Resin cells dyed in the gadget's glass colour, lit to the value's share (the glow lights them from then on).
      const d = drawCells(pid, { at: p.at, size: size[0], cols: Number(p.params?.cols ?? 4), rows: Number(p.params?.rows ?? 4), gap: p.params?.gap === undefined ? undefined : Number(p.params.gap),
        lit: lit * Number(p.params?.cols ?? 4) * Number(p.params?.rows ?? 4), color: { ...resolved.face, C: Math.max(resolved.face.C, GADGETS.cell.dye) } }, { tier, host });
      defs += d.defs;
      trims += `<g data-id="${p.id}">${d.shadow}${d.halo}${d.body}${d.glow}</g>`;
    } else if (p.part === 'needle') {
      // Printed on the glass and turned in it: its scale, the needle (which the swing turns) and its cap.
      const r = byId[p.id], held = heldOf(spec), k = held ? boundTo(spec, held.slot).indexOf(p.id) : -1;
      const value = k >= 0 ? driveShare(spec, o.value ?? driveDefault(spec)) : 0.5;
      const d = drawNeedle(pid, { at: p.at, length: size[0], arc: Number(p.params?.arc ?? 120), ticks: Number(p.params?.ticks ?? 9),
        threshold: p.params?.threshold === undefined ? undefined : Number(p.params.threshold), value, color: resolved.accent, glass: resolved.face }, { tier });
      defs += d.defs;
      lights += `<g data-id="${p.id}"${r.accent ? ' data-accent="true"' : ''}>${d.scale}${d.needle}${d.cap}</g>`;
    } else if (p.part === 'drum') {
      // A drum shows its digit of the count; the roll moves its strip from then on.
      const r = byId[p.id], face = r.accent && r.color ? r.color : p.params?.face === 'clay' ? clayFace() : { L: GADGETS.cap.ceramic[0], C: GADGETS.cap.ceramic[1], H: clayFace().H };
      const drums = boundTo(spec, 'drums'), k = drums.indexOf(p.id);
      const value = k >= 0 ? digitOf(o.value ?? driveDefault(spec), k, drums.length) : 0;
      const d = drawDrum(pid, { at: p.at, size: size as [number, number], value, color: face, glyphs: (p.params?.glyphs as 'digits' | 'ticks' | undefined) }, { tier });
      defs += d.defs;
      trims += `<g data-id="${p.id}"${r.accent ? ' data-accent="true"' : ''}>${d.body}</g>`;
    } else if (p.part === 'key') {
      const r = byId[p.id], ceramic = p.material === 'ceramic';
      const face = r.accent && r.color ? r.color : ceramic ? { L: GADGETS.cap.ceramic[0], C: GADGETS.cap.ceramic[1], H: clayFace().H } : clayFace();
      const d = drawKey(pid, { at: p.at, size: size[0], glyph: p.params?.glyph === undefined ? undefined : String(p.params.glyph), color: face, material: ceramic ? 'ceramic' : 'clay' }, { tier, host });
      defs += d.defs;
      // The face is what a press moves; the skirt stays.
      trims += `<g data-id="${p.id}"${r.accent ? ' data-accent="true"' : ''}>${d.shadow}${d.body.replace('<g data-part="key.face">', '<g data-part="key.face" data-moves>')}</g>`;
    } else if (p.part === 'plug') {
      const r = byId[p.id], face = r.accent && r.color ? r.color : clayFace();
      const d = drawPlug(pid, { at: p.at, size: size[0], color: face, stub: (p.params?.stub as 'up' | 'left' | 'right' | 'none' | undefined) ?? 'none' }, { tier, host });
      defs += d.defs;
      // A held pose is drawn in, so the first paint (and the server's) already shows the state.
      const pose = poses[p.id], [cx, cy] = p.at;
      const t = pose ? ` transform="translate(${cx + (pose.x ?? 0)} ${cy + (pose.y ?? 0)}) rotate(${pose.r ?? 0}) translate(${-cx} ${-cy})"` : '';
      const ts = pose ? ` transform="translate(${pose.x ?? 0} ${pose.y ?? 0})"` : '';
      plugs += `<g data-id="${p.id}"${r.accent ? ' data-accent="true"' : ''}>${d.shadow.replace('<g data-part="plug.shadow"', `<g data-part="plug.shadow" data-moves-shadow${ts}`)}${d.body.replace('<g data-part="plug"', `<g data-part="plug" data-moves${t}`)}</g>`;
    }
  }

  // The lamp: the state's signal and gesture (or a gesture an act asked for).
  const lampPart = spec.parts.find((p) => p.part === 'led');
  const [signal, gesture] = (o.lamp ?? rs.lamp) as [LampSignal, string];
  const lamp = lampPart ? drawLamp(`${id}-lamp`, { at: lampPart.at, size: sizeOf(lampPart)[0], signal, gesture }) : { defs: '', body: '' };

  return {
    resolved, state,
    body,
    // An inset gadget's trims (a beeper) sit on its frame, so over it; a slab gadget's stand on its body.
    parts: { defs, html: (lights ? `<g clip-path="url(#${clip})" data-part="bezel.light">${lights}</g>` : '') + (clip ? '' : trims) + cables + plugs },
    top: clip ? { defs: top.defs, html: top.html + trims } : top,
    lamp: { defs: lamp.defs, html: lamp.body },
    description: describeGadget(spec, state, o.value),
  };
}

/** The whole gadget as one SVG string, for a server, an email or a raster. */
export function renderGadgetSvg(spec: GadgetSpec, o: DrawOptions & { size?: number } = {}): string {
  const size = o.size ?? 160, tier = o.tier ?? tierFor(size);
  const d = drawGadget(spec, { ...o, tier });
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="${size}" height="${size}" role="img" data-gadget="${spec.name}" data-state="${d.state}" data-tier="${tier}">`
    + `<title>${esc(spec.title)}</title><desc>${esc(d.description)}</desc>`
    + `<defs>${d.body.defs}${d.parts.defs}${d.top.defs}${d.lamp.defs}</defs>`
    + `<g data-layer="body">${d.body.html}</g><g data-layer="parts">${d.parts.html}</g><g data-layer="top">${d.top.html}</g><g data-layer="lamp">${d.lamp.html}</g></svg>`;
}
