// The rig engine: gadgets on a grid in one panel, wired by patch cables. Pure (no DOM, no clock), so
// the React Rig, SwiftUI's MetalRig and a server can all run it. `layoutRig` places the modules, gives
// every wired port a jack beside its gadget (outs on the right, ins on the left) and hangs a cord
// between each pair; `createRigFlow` keeps every gadget's port values and, on a change, works out
// what each cable carries and where it arrives, hop by hop, through the cable's map.
import { GADGETS } from './gadgets.generated';
import type { CableMap, GadgetSpec, RigSpec, Value } from './spec';
import { derivedState, driveDefault, driveShare, stateOf } from './draw';
import { cableControls, cablePath, cableSag } from './parts/cable';

type Pt = [number, number];
const R = GADGETS.rig;

export interface RigModule { inst: string; spec: GadgetSpec; at: Pt; col: number; row: number }
export interface RigJack { inst: string; port: string; dir: 'in' | 'out'; at: Pt }
export interface RigCable { index: number; from: string; to: string; a: Pt; b: Pt; length: number; d: string; map?: CableMap }
export interface RigLayout { width: number; height: number; modules: RigModule[]; jacks: RigJack[]; cables: RigCable[] }

/** The specs a rig's gadgets use: inline, or named from the catalog. */
export function rigSpecs(spec: RigSpec, catalog: Record<string, GadgetSpec> = {}): Record<string, GadgetSpec> {
  return Object.fromEntries(Object.entries(spec.gadgets).map(([inst, slot]) => [inst, typeof slot.gadget === 'string' ? catalog[slot.gadget] : slot.gadget]));
}

export function layoutRig(spec: RigSpec, catalog: Record<string, GadgetSpec> = {}): RigLayout {
  const specs = rigSpecs(spec, catalog), [cols, rows] = spec.grid;
  const width = 2 * R.padding + cols * R.pitch - (R.pitch - 400), height = 2 * R.padding + rows * R.pitch - (R.pitch - 400);
  // Modules in their order on the grid (row, then column), the same on every platform.
  const modules: RigModule[] = Object.entries(spec.gadgets).map(([inst, slot]) => ({
    inst, spec: specs[inst], col: slot.at[0], row: slot.at[1], at: [R.padding + slot.at[0] * R.pitch, R.padding + slot.at[1] * R.pitch] as Pt,
  })).sort((a, b) => a.row - b.row || a.col - b.col);
  // One jack per wired port, beside the gadget's body: outs on its right, ins on its left, top down.
  const wired = { in: new Map<string, string[]>(), out: new Map<string, string[]>() };
  const note = (dir: 'in' | 'out', end: string) => { const [inst, port] = end.split('.'); const l = wired[dir].get(inst) ?? []; if (!l.includes(port)) l.push(port); wired[dir].set(inst, l); };
  for (const c of spec.cables) { note('out', c.from); note('in', c.to); }
  const [bx, , bw] = GADGETS.canvas.body, body = { x: bx, width: bw };
  const jacks: RigJack[] = [];
  for (const m of modules) for (const dir of ['out', 'in'] as const) {
    (wired[dir].get(m.inst) ?? []).forEach((port, i) => {
      const x = dir === 'out' ? m.at[0] + body.x + body.width + R.gap : m.at[0] + body.x - R.gap;
      jacks.push({ inst: m.inst, port, dir, at: [x, m.at[1] + R.top + i * R.spacing] });
    });
  }
  const jackAt = (dir: 'in' | 'out', end: string) => { const [inst, port] = end.split('.'); return jacks.find((j) => j.dir === dir && j.inst === inst && j.port === port)!.at; };
  const cables: RigCable[] = spec.cables.map((c, index) => {
    // A cord longer than its gap hangs in a loop.
    const a = jackAt('out', c.from), b = jackAt('in', c.to), length = Math.hypot(b[0] - a[0], b[1] - a[1]) + R.slack;
    return { index, from: c.from, to: c.to, a, b, length, d: cablePath(a, b, cableControls(a, b, cableSag(a, b, { length }))), map: c.map };
  });
  return { width, height, modules, jacks, cables };
}

// ---------- Data flow ----------

export type PortValues = Record<string, Record<string, Value | undefined>>;
/** A value leaving a gadget along a cable: it arrives `hop` cables away from where the change began. */
export interface RigHop { cable: number; from: string; to: string; value: Value; hop: number }

const isPulse = (v: Value | undefined): v is { pulse: true } => typeof v === 'object' && v !== null && 'pulse' in v;

/** What a gadget puts out, from its inputs and state: a needle past its threshold is `above` and pulses
 *  `over` as it crosses; a counter echoes its `count` and pulses `rolled` as it wraps; an out pulse
 *  named after a state fires on entering it. `before` is its last inputs, to see crossings. */
export function deriveOutputs(spec: GadgetSpec, inputs: Record<string, Value | undefined>, before: Record<string, Value | undefined>, state: string, lastState: string): Record<string, Value> {
  const out: Record<string, Value> = {}, outs = spec.ports?.out ?? {};
  const drive = spec.mechanism.drive ?? Object.keys(spec.ports?.in ?? {})[0];
  const now = Number(inputs[drive] ?? driveDefault(spec)), was = Number(before[drive] ?? driveDefault(spec));
  const t = spec.parts.find((p) => p.part === 'needle')?.params?.threshold;
  if (t !== undefined) {
    const above = driveShare(spec, now) >= Number(t);
    if ('above' in outs) out.above = above;
    if ('over' in outs && above && driveShare(spec, was) < Number(t)) out.over = { pulse: true };
  }
  if (spec.mechanism.name === 'roll') {
    if ('count' in outs) out.count = now;
    const max = (spec.ports?.in?.[drive] as { max?: number } | undefined)?.max;
    if ('rolled' in outs && max !== undefined && now < was && was >= max) out.rolled = { pulse: true };
  }
  for (const [name, ch] of Object.entries(outs)) if (ch.kind === 'pulse' && spec.states[name] && state === name && lastState !== name) out[name] = { pulse: true };
  // A switch named after a state is on while the gadget shows it (a drawer full, a grid full).
  const shown = derivedState(spec, state, now);
  for (const [name, ch] of Object.entries(outs)) if (ch.kind === 'boolean' && spec.states[name] && !(name in out)) out[name] = shown === name;
  return out;
}

/** A cable's map applied to the value it carries (`current` is the value already at the far port). */
export function mapValue(map: CableMap | undefined, v: Value, current: Value | undefined): Value | undefined {
  if (!map) return v;
  switch (map.kind) {
    case 'threshold': return Number(v) >= map.at ? map.above : map.below;
    case 'scale': { const [a, b] = map.from, [c, d] = map.to; return c + ((Number(v) - a) / (b - a || 1)) * (d - c); }
    case 'match': return v === map.when ? { pulse: true } : undefined;
    case 'count': return isPulse(v) ? Math.max(0, Number(current ?? 0) + map.step) : undefined;
    case 'select': return map.table[String(v)] ?? undefined;
  }
}

export interface RigFlow {
  /** Every gadget's input values now. */
  readonly inputs: PortValues;
  /** Sets one gadget's input from outside, and returns what then travels along the cables, in order. */
  set(inst: string, port: string, value: Value): RigHop[];
  /** Sets a gadget's state from outside (a pulse named after it may leave along a cable). */
  setState(inst: string, state: string): RigHop[];
  state(inst: string): string;
}

export function createRigFlow(spec: RigSpec, catalog: Record<string, GadgetSpec> = {}): RigFlow {
  const specs = rigSpecs(spec, catalog), inputs: PortValues = {}, states: Record<string, string> = {};
  for (const [inst, g] of Object.entries(specs)) {
    inputs[inst] = Object.fromEntries(Object.entries(g.ports?.in ?? {}).map(([p, ch]) => [p, 'default' in ch ? (ch.default as Value) : undefined]));
    const slot = spec.gadgets[inst];
    for (const [p, v] of Object.entries(slot.set ?? {})) inputs[inst][p] = v;
    states[inst] = stateOf(g, undefined);
  }
  // A change at one gadget: its outputs go out along its cables, and each arrival may change the next.
  const run = (inst: string, before: Record<string, Value | undefined>, lastState: string, hop: number, out: RigHop[]) => {
    const outs = deriveOutputs(specs[inst], inputs[inst], before, states[inst], lastState);
    spec.cables.forEach((c, i) => {
      const [fi, fp] = c.from.split('.'), [ti, tp] = c.to.split('.');
      if (fi !== inst || !(fp in outs)) return;
      const arrived = mapValue(c.map, outs[fp], inputs[ti][tp]);
      if (arrived === undefined) return;
      out.push({ cable: i, from: c.from, to: c.to, value: arrived, hop });
      const prev = { ...inputs[ti] };
      if (!isPulse(arrived)) inputs[ti][tp] = arrived;
      run(ti, prev, states[ti], hop + 1, out);
    });
  };
  return {
    get inputs() { return inputs; },
    state: (inst) => states[inst],
    set(inst, port, value) {
      const before = { ...inputs[inst] }, out: RigHop[] = [];
      if (!isPulse(value)) inputs[inst][port] = value;
      run(inst, before, states[inst], 1, out);
      return out;
    },
    setState(inst, state) {
      const last = states[inst], out: RigHop[] = [];
      states[inst] = state;
      run(inst, { ...inputs[inst] }, last, 1, out);
      return out;
    },
  };
}
