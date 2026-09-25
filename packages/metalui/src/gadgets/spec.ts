// The gadget spec (metalui/gadget@1, metalui/rig@1): small, closed and validated, so a person or an
// assistant can describe a gadget as data and the library supplies the craft. Every closed list here
// comes from tokens.json (gadgets) through gadgets.generated.ts.
import { GADGETS, GADGET_MATERIALS, type GadgetMaterial } from './gadgets.generated';

export type Job = keyof typeof GADGETS.jobs;
export const JOBS = Object.keys(GADGETS.jobs) as Job[];
export type Material = GadgetMaterial;
export const MATERIALS = GADGET_MATERIALS;
export type PartName = keyof typeof GADGETS.parts;
export const PARTS = Object.keys(GADGETS.parts) as PartName[];
export type MechanismName = keyof typeof GADGETS.mechanisms;
export const MECHANISMS = Object.keys(GADGETS.mechanisms) as MechanismName[];
export type Reach = 'own' | 'others' | 'world';
export const REACHES: readonly Reach[] = ['own', 'others', 'world'];
export type Container = 'slab' | 'inset' | 'free';
export const CONTAINERS: readonly Container[] = ['slab', 'inset', 'free'];
export type LampSignal = 'off' | 'live' | 'waiting' | 'failed' | 'link';
export const LAMP_SIGNALS: readonly LampSignal[] = ['off', 'live', 'waiting', 'failed', 'link'];
export type LampGesture = 'steady' | 'flicker' | 'breathe' | 'blink2' | 'rise';
export const LAMP_GESTURES: readonly LampGesture[] = ['steady', 'flicker', 'breathe', 'blink2', 'rise'];
export type Earcon = 'done' | 'failed' | 'waiting' | 'ready';
export const EARCON_NAMES: readonly Earcon[] = ['done', 'failed', 'waiting', 'ready'];
export type Role = 'body' | 'actor' | 'lamp' | 'cut' | 'trim';
export const ROLES: readonly Role[] = ['body', 'actor', 'lamp', 'cut', 'trim'];

/** What a gadget should make a person feel, each 0–1: valence, arousal, weight. */
export interface Feel { v: number; a: number; w: number }

/** What flows along a cable. */
export type Channel =
  | { kind: 'boolean'; default?: boolean }
  | { kind: 'number'; min: number; max: number; unit?: string; default?: number }
  | { kind: 'count'; max: number; default?: number }
  | { kind: 'state'; options: readonly string[]; default?: string }
  | { kind: 'pulse' };
export type Value = boolean | number | string | { pulse: true };

export interface PartPlacement {
  id: string;
  part: PartName;
  at: [number, number];
  size?: [number, number];
  rotate?: number;
  material?: Material | 'accent';
  role: Role;
  params?: Record<string, number | string | boolean>;
  z?: number;
}

export interface MechanismRef {
  name: MechanismName;
  bind: Record<string, string | string[]>;
  detents?: number;
  drive?: string;
}

export type FormValue =
  | { pose: { x?: number; y?: number; r?: number; sx?: number; sy?: number } }
  | { param: string; value: number | string | boolean };

export interface StateSpec {
  feel?: Partial<Feel>;
  lamp?: [LampSignal, LampGesture];
  form?: Record<string, FormValue>;
  beep?: Earcon;
  enter?: 'act' | 'none';
  hint?: string;
}

export interface GadgetSpec {
  $schema: 'metalui/gadget@1';
  name: string;
  title: string;
  job: Job;
  reach?: Reach;
  feel: Feel;
  container?: Container;
  material?: Material;
  station?: number;
  parts: PartPlacement[];
  mechanism: MechanismRef;
  ports?: { in?: Record<string, Channel>; out?: Record<string, Channel> };
  states: Record<string, StateSpec>;
  initial?: string;
  describe?: string;
}

export type CableMap =
  | { kind: 'threshold'; at: number; above: string | boolean; below: string | boolean }
  | { kind: 'scale'; from: [number, number]; to: [number, number] }
  | { kind: 'match'; when: string | boolean; pulse: true }
  | { kind: 'count'; step: 1 | -1 }
  | { kind: 'select'; table: Record<string, string> };

export interface Cable { from: string; to: string; map?: CableMap; jack?: 'auto' | [number, number] }

export interface RigSlot {
  gadget: string | GadgetSpec;
  at: [number, number];
  span?: [1 | 2, 1 | 2];
  set?: Record<string, Value>;
  params?: Record<string, number | string>;
}

export interface RigSpec {
  $schema: 'metalui/rig@1';
  name: string;
  title: string;
  job: Job;
  feel: Feel;
  grid: [number, number];
  gadgets: Record<string, RigSlot>;
  cables: Cable[];
}

/** A spec with every default filled: what `resolve` reads. Two specs that differ only in defaults normalise alike. */
export type NormalizedGadget = GadgetSpec & Required<Pick<GadgetSpec, 'reach' | 'container' | 'station' | 'initial'>> & {
  ports: { in: Record<string, Channel>; out: Record<string, Channel> };
};

const round = (x: number, step: number) => Math.round(x / step) * step;

export function normalize(spec: GadgetSpec): NormalizedGadget {
  const job = GADGETS.jobs[spec.job];
  return {
    ...spec,
    reach: spec.reach ?? (job.reach as Reach),
    container: spec.container ?? (job.containers[0] as Container),
    station: spec.station ?? job.stations[0],
    initial: spec.initial ?? 'rest',
    feel: { v: round(spec.feel.v, 0.01), a: round(spec.feel.a, 0.01), w: round(spec.feel.w, 0.01) },
    parts: spec.parts.map((p) => ({ ...p, at: [round(p.at[0], 0.5), round(p.at[1], 0.5)], rotate: p.rotate === undefined ? undefined : round(p.rotate, 1) })),
    ports: { in: spec.ports?.in ?? {}, out: spec.ports?.out ?? {} },
  };
}
