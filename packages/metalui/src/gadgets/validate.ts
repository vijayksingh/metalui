// The validator: one walk over a spec that returns every problem at once, each with a path, a code, a
// message a person can read and a fix an assistant can apply. No dependencies; the closed lists and
// limits are the foundations (tokens.json → gadgets.parts, .mechanisms, .jobs, .spec).
import { GADGETS } from './gadgets.generated';
import { resolveFeel, checkSet, type SetMember } from './resolve';
import {
  CONTAINERS, EARCON_NAMES, JOBS, LAMP_GESTURES, LAMP_SIGNALS, MATERIALS, MECHANISMS, PARTS, REACHES, ROLES,
  type Channel, type GadgetSpec, type RigSpec,
} from './spec';

export type ProblemCode =
  | 'schema.version' | 'field.missing' | 'field.type' | 'field.range' | 'field.enum'
  | 'part.unknown' | 'part.material' | 'part.param' | 'part.offCanvas' | 'part.overlap' | 'part.roles'
  | 'mechanism.unknown' | 'mechanism.unbound' | 'mechanism.bindKind' | 'mechanism.drive'
  | 'state.rest' | 'state.lamp' | 'state.beep' | 'state.form'
  | 'port.unknown' | 'port.kind' | 'cable.cycle' | 'cable.fanout' | 'cable.fanin' | 'cable.map' | 'cable.selfLoop'
  | 'grid.overlap' | 'grid.outside' | 'gadget.unknown'
  | 'set.hue' | 'set.band' | 'set.deltaE' | 'set.container' | 'set.cvd' | 'set.silhouette';

export interface Problem { path: string; code: ProblemCode; message: string; fix?: string }
export type Validation<T> = { ok: true; spec: T } | { ok: false; problems: Problem[] };

const L = GADGETS.spec;
type Obj = Record<string, unknown>;
const isObj = (x: unknown): x is Obj => !!x && typeof x === 'object' && !Array.isArray(x);
const KEBAB = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const list = (xs: readonly unknown[]) => xs.map((x) => `"${x}"`).join(', ');

class Walk {
  problems: Problem[] = [];
  add(path: string, code: ProblemCode, message: string, fix?: string) { this.problems.push({ path, code, message, fix }); }
  need(o: Obj, key: string, path: string): boolean {
    if (o[key] === undefined) { this.add(`${path}.${key}`, 'field.missing', `${key} is required.`, `Add "${key}".`); return false; }
    return true;
  }
  str(o: Obj, key: string, path: string, opt = false): string | undefined {
    if (!opt && !this.need(o, key, path)) return;
    const v = o[key];
    if (v === undefined) return;
    if (typeof v !== 'string') { this.add(`${path}.${key}`, 'field.type', `${key} must be text.`); return; }
    return v;
  }
  num(v: unknown, path: string, lo: number, hi: number): number | undefined {
    if (typeof v !== 'number' || Number.isNaN(v)) { this.add(path, 'field.type', `${path.split('.').pop()} must be a number.`); return; }
    if (v < lo || v > hi) { this.add(path, 'field.range', `${path.split('.').pop()} is ${v}; it must be ${lo} to ${hi}.`, `Use a value from ${lo} to ${hi}.`); return; }
    return v;
  }
  oneOf<T>(v: unknown, path: string, options: readonly T[]): v is T {
    if (!options.includes(v as T)) { this.add(path, 'field.enum', `${JSON.stringify(v)} is not one of ${list(options)}.`, `Use one of ${list(options)}.`); return false; }
    return true;
  }
  feel(v: unknown, path: string) {
    if (!isObj(v)) { this.add(path, 'field.type', 'feel must be { v, a, w }, each 0 to 1.'); return; }
    for (const k of ['v', 'a', 'w']) if (this.need(v, k, path)) this.num(v[k], `${path}.${k}`, 0, 1);
  }
  channel(v: unknown, path: string) {
    if (!isObj(v)) { this.add(path, 'field.type', 'A port is a channel: { kind, … }.'); return; }
    if (!this.oneOf(v.kind, `${path}.kind`, ['boolean', 'number', 'count', 'state', 'pulse'] as const)) return;
    if (v.kind === 'number') { this.num(v.min, `${path}.min`, -1e9, 1e9); this.num(v.max, `${path}.max`, -1e9, 1e9); }
    if (v.kind === 'count') this.num(v.max, `${path}.max`, 1, 1e6);
    if (v.kind === 'state' && (!Array.isArray(v.options) || v.options.length < 2)) this.add(`${path}.options`, 'field.type', 'A state port lists at least two options.');
  }
}

const bbox = (at: number[], size: readonly number[]) => [at[0] - size[0] / 2, at[1] - size[1] / 2, at[0] + size[0] / 2, at[1] + size[1] / 2];
const overlaps = (a: number[], b: number[]) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];

/** Validates a gadget spec. On success returns the spec as typed. */
export function validateGadget(input: unknown, path = '$'): Validation<GadgetSpec> {
  const w = new Walk();
  walkGadget(w, input, path);
  return w.problems.length ? { ok: false, problems: w.problems } : { ok: true, spec: input as GadgetSpec };
}

function walkGadget(w: Walk, input: unknown, path: string) {
  if (!isObj(input)) return w.add(path, 'field.type', 'A gadget spec is an object.');
  const s = input;
  if (s.$schema !== 'metalui/gadget@1') w.add(`${path}.$schema`, 'schema.version', `$schema is ${JSON.stringify(s.$schema)}; this reader understands "metalui/gadget@1".`, 'Set "$schema": "metalui/gadget@1".');
  const name = w.str(s, 'name', path);
  if (name !== undefined && (!KEBAB.test(name) || name.length > L.nameMax)) w.add(`${path}.name`, 'field.type', `name must be kebab-case, at most ${L.nameMax} characters.`, `Use something like "${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, L.nameMax) || 'my-gadget'}".`);
  w.str(s, 'title', path);
  const jobOk = w.need(s, 'job', path) && w.oneOf(s.job, `${path}.job`, JOBS);
  const job = jobOk ? GADGETS.jobs[s.job as keyof typeof GADGETS.jobs] : undefined;
  if (s.reach !== undefined) w.oneOf(s.reach, `${path}.reach`, REACHES);
  if (w.need(s, 'feel', path)) w.feel(s.feel, `${path}.feel`);
  if (s.container !== undefined && w.oneOf(s.container, `${path}.container`, CONTAINERS) && job && !(job.containers as readonly string[]).includes(s.container as string))
    w.add(`${path}.container`, 'field.enum', `A ${s.job} gadget cannot be ${s.container}.`, `Use one of ${list(job.containers)}.`);
  if (s.material !== undefined) w.oneOf(s.material, `${path}.material`, MATERIALS);
  if (s.station !== undefined && job && !(job.stations as readonly number[]).includes(s.station as number))
    w.add(`${path}.station`, 'field.enum', `Station ${s.station} does not belong to ${s.job}.`, `Use one of ${list(job.stations)}, or leave it out.`);

  // Parts
  const parts = Array.isArray(s.parts) ? s.parts : [];
  if (!Array.isArray(s.parts)) w.need(s, 'parts', path);
  else if (parts.length < L.parts[0] || parts.length > L.parts[1]) w.add(`${path}.parts`, 'field.range', `A gadget has ${L.parts[0]} to ${L.parts[1]} parts; this one has ${parts.length}.`);
  const ids = new Map<string, { part: string; role: string; box: number[] }>();
  parts.forEach((p, i) => {
    const pp = `${path}.parts[${i}]`;
    if (!isObj(p)) return w.add(pp, 'field.type', 'A part placement is an object.');
    const id = w.str(p, 'id', pp);
    if (id !== undefined && ids.has(id)) w.add(`${pp}.id`, 'field.enum', `Two parts are called "${id}".`, 'Give each part its own id.');
    if (!w.need(p, 'part', pp)) return;
    if (!PARTS.includes(p.part as never)) return w.add(`${pp}.part`, 'part.unknown', `"${p.part}" is not a Part. An assistant composes from the catalog and cannot invent one.`, `Use one of ${list(PARTS)}; a new Part is a design task for a person.`);
    const def = GADGETS.parts[p.part as keyof typeof GADGETS.parts] as unknown as { size: readonly number[]; materials: readonly string[]; params: Record<string, readonly (string | number)[]> };
    if (w.need(p, 'role', pp)) w.oneOf(p.role, `${pp}.role`, ROLES);
    let at: number[] | undefined;
    if (!Array.isArray(p.at) || p.at.length !== 2) w.add(`${pp}.at`, 'field.type', 'at is [x, y] on the 400-unit canvas.');
    else { const x = w.num(p.at[0], `${pp}.at[0]`, 0, 400), y = w.num(p.at[1], `${pp}.at[1]`, 0, 400); if (x !== undefined && y !== undefined) at = [x, y]; }
    const size = Array.isArray(p.size) ? (p.size as number[]) : def.size;
    if (p.material !== undefined && !def.materials.includes(p.material as string))
      w.add(`${pp}.material`, 'part.material', `A ${p.part} cannot be cut from ${p.material}.`, `Use one of ${list(def.materials)}.`);
    if (p.params !== undefined) {
      if (!isObj(p.params)) w.add(`${pp}.params`, 'field.type', 'params is an object.');
      else for (const [k, v] of Object.entries(p.params)) {
        const spec = def.params[k];
        if (!spec) { w.add(`${pp}.params.${k}`, 'part.param', `A ${p.part} has no param "${k}".`, Object.keys(def.params).length ? `Its params are ${list(Object.keys(def.params))}.` : `A ${p.part} takes no params.`); continue; }
        const [kind, ...rest] = spec;
        if (kind === 'enum' && !rest.includes(v as string)) w.add(`${pp}.params.${k}`, 'part.param', `${k} is ${JSON.stringify(v)}; it must be one of ${list(rest)}.`);
        if (kind === 'number' && (typeof v !== 'number' || v < (rest[0] as number) || v > (rest[1] as number))) w.add(`${pp}.params.${k}`, 'part.param', `${k} must be a number from ${rest[0]} to ${rest[1]}.`);
        if (kind === 'boolean' && typeof v !== 'boolean') w.add(`${pp}.params.${k}`, 'part.param', `${k} is true or false.`);
        if (kind === 'string' && typeof v !== 'string') w.add(`${pp}.params.${k}`, 'part.param', `${k} is text.`);
        if (kind === 'ref' && typeof v !== 'string') w.add(`${pp}.params.${k}`, 'part.param', `${k} names another part's id.`);
      }
    }
    if (at && p.part !== 'cable') {
      const box = bbox(at, size);
      if (box[0] < 0 || box[1] < 0 || box[2] > 400 || box[3] > 400) w.add(`${pp}.at`, 'part.offCanvas', `The ${p.part} runs off the 400-unit canvas.`, 'Move it inward or make it smaller.');
      if (id !== undefined) ids.set(id, { part: p.part as string, role: p.role as string, box });
    } else if (id !== undefined) ids.set(id, { part: p.part as string, role: p.role as string, box: [0, 0, 0, 0] });
  });
  // refs in params (a cable's from/to)
  parts.forEach((p, i) => {
    if (!isObj(p) || !isObj(p.params)) return;
    const def = GADGETS.parts[p.part as keyof typeof GADGETS.parts] as unknown as { params: Record<string, readonly string[]> } | undefined;
    for (const [k, v] of Object.entries(p.params)) if (def?.params[k]?.[0] === 'ref' && typeof v === 'string' && !ids.has(v))
      w.add(`${path}.parts[${i}].params.${k}`, 'part.param', `${k} names "${v}", which is not a part here.`, `Use one of ${list([...ids.keys()])}.`);
  });
  const all = [...ids.entries()];
  const bodies = all.filter(([, v]) => v.role === 'body'), lamps = all.filter(([, v]) => v.role === 'lamp');
  if (s.container !== 'free' && parts.length && bodies.length !== 1) w.add(`${path}.parts`, 'part.roles', `A ${s.container ?? 'slab'} gadget has exactly one body; this one has ${bodies.length}.`, 'Mark the slab or bezel as role "body".');
  if (parts.length && lamps.length !== 1) w.add(`${path}.parts`, 'part.roles', `A gadget has exactly one lamp; this one has ${lamps.length}.`, 'Add one "led" part with role "lamp", top right (313, 78).');
  if (bodies.length === 1) {
    const [, body] = bodies[0];
    const bodyMat = parts.find((p) => isObj(p) && p.role === 'body') as Obj | undefined;
    if (jobOk && s.feel && isObj(s.feel)) {
      try {
        const m = resolveFeel({ job: s.job as never, feel: s.feel as never, material: s.material as never }).material;
        const allowed = (GADGETS.parts[body.part as keyof typeof GADGETS.parts] as unknown as { materials: readonly string[] }).materials;
        if (!bodyMat?.material && !allowed.includes(m)) w.add(`${path}.material`, 'part.material', `This feel makes the body ${m}, and a ${body.part} cannot be ${m}.`, `Use an inset container (a bezel around a ${m} face), or pin one of ${list(allowed)}.`);
      } catch { /* feel problems are reported above */ }
    }
    for (const [cid, c] of all) if (c.role === 'cut' && !(c.box[0] >= body.box[0] && c.box[1] >= body.box[1] && c.box[2] <= body.box[2] && c.box[3] <= body.box[3]))
      w.add(`${path}.parts`, 'part.offCanvas', `The cut "${cid}" is not inside the body.`, 'Move it inside the body.');
  }
  if (lamps.length === 1) for (const [oid, o] of all) if ((o.role === 'actor' || o.role === 'trim') && o.part !== 'cable' && overlaps(lamps[0][1].box, o.box))
    w.add(`${path}.parts`, 'part.overlap', `"${oid}" covers the lamp.`, 'Keep the lamp clear: it is how the gadget shows its state.');
  const actors = all.filter(([, v]) => v.role === 'actor');
  for (let i = 0; i < actors.length; i++) for (let j = i + 1; j < actors.length; j++) if (overlaps(actors[i][1].box, actors[j][1].box))
    w.add(`${path}.parts`, 'part.overlap', `"${actors[i][0]}" and "${actors[j][0]}" overlap; moving parts would collide.`, 'Space them apart.');

  // Ports
  const ports = isObj(s.ports) ? s.ports : {};
  for (const dir of ['in', 'out'] as const) {
    const ps = isObj(ports[dir]) ? (ports[dir] as Obj) : {};
    if (Object.keys(ps).length > L.ports) w.add(`${path}.ports.${dir}`, 'field.range', `At most ${L.ports} ${dir} ports.`);
    for (const [k, v] of Object.entries(ps)) w.channel(v, `${path}.ports.${dir}.${k}`);
  }

  // Mechanism
  if (w.need(s, 'mechanism', path) && isObj(s.mechanism)) {
    const m = s.mechanism, mp = `${path}.mechanism`;
    if (!MECHANISMS.includes(m.name as never)) w.add(`${mp}.name`, 'mechanism.unknown', `"${m.name}" is not a mechanism.`, `Use one of ${list(MECHANISMS)}; a new mechanism is a design task for a person.`);
    else {
      const def = GADGETS.mechanisms[m.name as keyof typeof GADGETS.mechanisms] as unknown as { mode: string; drive?: readonly string[]; detents?: boolean; slots: Record<string, { parts: readonly string[]; many?: boolean; optional?: boolean }> };
      const bind = isObj(m.bind) ? m.bind : {};
      for (const [slot, sd] of Object.entries(def.slots)) {
        const b = bind[slot];
        if (b === undefined) { if (!sd.optional) w.add(`${mp}.bind.${slot}`, 'mechanism.unbound', `${m.name} needs its "${slot}" slot bound.`, `Bind it to a ${sd.parts.join(' or ')}.`); continue; }
        const targets = Array.isArray(b) ? b : [b];
        if (Array.isArray(b) && !sd.many) w.add(`${mp}.bind.${slot}`, 'mechanism.bindKind', `"${slot}" takes one part.`);
        for (const t of targets) {
          const part = ids.get(t as string);
          if (!part) w.add(`${mp}.bind.${slot}`, 'mechanism.bindKind', `"${t}" is not a part here.`, `Use one of ${list([...ids.keys()])}.`);
          else if (!sd.parts.includes(part.part)) w.add(`${mp}.bind.${slot}`, 'mechanism.bindKind', `"${slot}" takes a ${sd.parts.join(' or ')}; "${t}" is a ${part.part}.`);
        }
      }
      for (const k of Object.keys(bind)) if (!def.slots[k]) w.add(`${mp}.bind.${k}`, 'mechanism.bindKind', `${m.name} has no slot "${k}".`, `Its slots are ${list(Object.keys(def.slots))}.`);
      if (m.detents !== undefined) { if (!def.detents) w.add(`${mp}.detents`, 'field.enum', `${m.name} has no detents.`); else w.num(m.detents, `${mp}.detents`, L.detents[0], L.detents[1]); }
      if (def.mode === 'held') {
        const ins = isObj(ports.in) ? (ports.in as Record<string, Channel>) : {};
        const driveName = (m.drive as string | undefined) ?? Object.keys(ins)[0];
        const drive = driveName ? ins[driveName] : undefined;
        if (!drive) w.add(`${mp}.drive`, 'mechanism.drive', `${m.name} follows a value, and there is no in port${m.drive ? ` "${m.drive}"` : ''} to drive it.`, `Add an in port of kind ${list(def.drive ?? [])}.`);
        else if (!(def.drive ?? []).includes(drive.kind)) w.add(`${mp}.drive`, 'mechanism.drive', `${m.name} is driven by ${list(def.drive ?? [])}; "${driveName}" is a ${drive.kind}.`);
      }
    }
  }

  // States
  if (w.need(s, 'states', path) && isObj(s.states)) {
    const st = s.states, sp = `${path}.states`;
    if (!st.rest) w.add(`${sp}.rest`, 'state.rest', 'Every gadget has a "rest" state.', 'Add "rest": { "lamp": ["off", "steady"] }.');
    if (Object.keys(st).length > L.states) w.add(sp, 'field.range', `At most ${L.states} states.`);
    let failedLamps = 0;
    for (const [k, v] of Object.entries(st)) {
      const p = `${sp}.${k}`;
      if (!KEBAB.test(k)) w.add(p, 'field.type', `State names are kebab-case; "${k}" is not.`);
      if (!isObj(v)) { w.add(p, 'field.type', 'A state is an object.'); continue; }
      if (v.feel !== undefined) { if (!isObj(v.feel)) w.add(`${p}.feel`, 'field.type', 'feel override is { v?, a?, w? }.'); else for (const [fk, fv] of Object.entries(v.feel)) { if (!['v', 'a', 'w'].includes(fk)) w.add(`${p}.feel.${fk}`, 'field.enum', 'feel has v, a and w.'); else w.num(fv, `${p}.feel.${fk}`, 0, 1); } }
      if (v.lamp !== undefined) {
        if (!Array.isArray(v.lamp) || v.lamp.length !== 2) w.add(`${p}.lamp`, 'state.lamp', 'lamp is [signal, gesture].', 'For example ["live", "steady"].');
        else {
          if (!LAMP_SIGNALS.includes(v.lamp[0])) w.add(`${p}.lamp`, 'state.lamp', `"${v.lamp[0]}" is not a lamp signal; lamps only say ${list(LAMP_SIGNALS)}.`);
          if (!LAMP_GESTURES.includes(v.lamp[1])) w.add(`${p}.lamp`, 'state.lamp', `"${v.lamp[1]}" is not a lamp gesture.`, `Use one of ${list(LAMP_GESTURES)}.`);
          if (v.lamp[0] === 'failed') failedLamps++;
        }
      }
      if (v.beep !== undefined) {
        if (k === 'rest') w.add(`${p}.beep`, 'state.beep', 'Resting never beeps: a beep is a change of state.', 'Remove the beep from rest.');
        else w.oneOf(v.beep, `${p}.beep`, EARCON_NAMES);
      }
      if (v.enter !== undefined) w.oneOf(v.enter, `${p}.enter`, ['act', 'none'] as const);
      if (v.form !== undefined && isObj(v.form)) for (const [fid, fv] of Object.entries(v.form)) {
        if (!ids.has(fid)) { w.add(`${p}.form.${fid}`, 'state.form', `"${fid}" is not a part here.`, `Use one of ${list([...ids.keys()])}.`); continue; }
        if (!isObj(fv)) continue;
        if (isObj(fv.pose)) for (const [pk, pv] of Object.entries(fv.pose)) {
          const lim = pk === 'r' ? [-L.pose.r, L.pose.r] : pk === 'sx' || pk === 'sy' ? L.pose.s : [-L.pose.x, L.pose.x];
          if (typeof pv !== 'number' || pv < lim[0] || pv > lim[1]) w.add(`${p}.form.${fid}.pose.${pk}`, 'state.form', `A held pose moves ${pk} by ${lim[0]} to ${lim[1]}.`);
        }
      }
    }
    if (failedLamps > 1) w.add(sp, 'state.lamp', 'Only one state may light the failed lamp.', 'Merge the failure states into one.');
    const initial = s.initial as string | undefined;
    if (initial !== undefined && !st[initial]) w.add(`${path}.initial`, 'field.enum', `initial is "${initial}", which is not a state.`);
  }
}

type Catalog = Record<string, GadgetSpec>;
const KINDS_OK: Record<string, string[]> = { boolean: ['boolean', 'state'], number: ['number'], count: ['count', 'number'], state: ['state'], pulse: ['pulse'] };
const MAPS: Record<string, [string[], string[]]> = { threshold: [['number', 'count'], ['state', 'boolean']], scale: [['number', 'count'], ['number']], match: [['state', 'boolean'], ['pulse']], count: [['pulse'], ['count']], select: [['state'], ['state']] };

/** Validates a rig: its gadgets (inline or from the catalog), grid, cables, and the set rules across them. */
export function validateRig(input: unknown, catalog: Catalog = {}, path = '$'): Validation<RigSpec> {
  const w = new Walk();
  if (!isObj(input)) { w.add(path, 'field.type', 'A rig spec is an object.'); return { ok: false, problems: w.problems }; }
  const s = input;
  if (s.$schema !== 'metalui/rig@1') w.add(`${path}.$schema`, 'schema.version', `$schema is ${JSON.stringify(s.$schema)}; this reader understands "metalui/rig@1".`, 'Set "$schema": "metalui/rig@1".');
  w.str(s, 'name', path); w.str(s, 'title', path);
  if (w.need(s, 'job', path)) w.oneOf(s.job, `${path}.job`, JOBS);
  if (w.need(s, 'feel', path)) w.feel(s.feel, `${path}.feel`);
  const [maxC, maxR] = L.rigGrid;
  const grid = Array.isArray(s.grid) ? s.grid as number[] : undefined;
  if (!grid) w.need(s, 'grid', path);
  else { w.num(grid[0], `${path}.grid[0]`, 1, maxC); w.num(grid[1], `${path}.grid[1]`, 1, maxR); }
  const slots = isObj(s.gadgets) ? s.gadgets : {};
  const n = Object.keys(slots).length;
  if (n < L.rigGadgets[0] || n > L.rigGadgets[1]) w.add(`${path}.gadgets`, 'field.range', `A rig holds ${L.rigGadgets[0]} to ${L.rigGadgets[1]} gadgets; this one holds ${n}.`);
  const specs: Record<string, GadgetSpec> = {}, cells = new Map<string, string>();
  for (const [inst, slot] of Object.entries(slots)) {
    const sp = `${path}.gadgets.${inst}`;
    if (!isObj(slot)) { w.add(sp, 'field.type', 'A rig slot is an object.'); continue; }
    const g = slot.gadget;
    if (typeof g === 'string') { if (catalog[g]) specs[inst] = catalog[g]; else w.add(`${sp}.gadget`, 'gadget.unknown', `"${g}" is not in the catalog.`, Object.keys(catalog).length ? `Use one of ${list(Object.keys(catalog))}, or an inline spec.` : 'Use an inline gadget spec.'); }
    else { walkGadget(w, g, `${sp}.gadget`); if (isObj(g)) specs[inst] = g as unknown as GadgetSpec; }
    const at = Array.isArray(slot.at) ? slot.at as number[] : undefined, span = Array.isArray(slot.span) ? slot.span as number[] : [1, 1];
    if (!at) { w.need(slot, 'at', sp); continue; }
    for (let dx = 0; dx < span[0]; dx++) for (let dy = 0; dy < span[1]; dy++) {
      const c = at[0] + dx, r = at[1] + dy;
      if (grid && (c < 0 || r < 0 || c >= grid[0] || r >= grid[1])) { w.add(`${sp}.at`, 'grid.outside', `${inst} sits outside the ${grid[0]} × ${grid[1]} grid.`, 'Move it in, or grow the grid.'); dx = span[0]; break; }
      const key = `${c},${r}`;
      if (cells.has(key)) w.add(`${sp}.at`, 'grid.overlap', `${inst} and ${cells.get(key)} share a module.`, 'Give each gadget its own module.');
      else cells.set(key, inst);
    }
  }
  const cables = Array.isArray(s.cables) ? s.cables : [];
  if (cables.length < L.cables[0] || cables.length > L.cables[1]) w.add(`${path}.cables`, 'field.range', `A rig has ${L.cables[0]} to ${L.cables[1]} cables.`);
  const port = (end: unknown, dir: 'in' | 'out', p: string): { inst: string; channel: Channel } | undefined => {
    if (typeof end !== 'string' || !end.includes('.')) { w.add(p, 'field.type', 'A cable end is "instance.port".'); return; }
    const [inst, name] = end.split('.');
    const g = specs[inst];
    if (!g) { w.add(p, 'port.unknown', `There is no gadget "${inst}" in this rig.`); return; }
    const ch = g.ports?.[dir]?.[name];
    if (!ch) { const other = g.ports?.[dir === 'in' ? 'out' : 'in']?.[name]; w.add(p, 'port.unknown', other ? `"${end}" is an ${dir === 'in' ? 'out' : 'in'} port; a cable runs from an out port to an in port.` : `${inst} has no ${dir} port "${name}".`, `Its ${dir} ports are ${list(Object.keys(g.ports?.[dir] ?? {}))}.`); return; }
    return { inst, channel: ch };
  };
  const edges: [string, string][] = [], fanOut = new Map<string, number>(), fanIn = new Map<string, number>();
  cables.forEach((c, i) => {
    const cp = `${path}.cables[${i}]`;
    if (!isObj(c)) return w.add(cp, 'field.type', 'A cable is { from, to, map? }.');
    const from = port(c.from, 'out', `${cp}.from`), to = port(c.to, 'in', `${cp}.to`);
    if (!from || !to) return;
    if (from.inst === to.inst) return w.add(cp, 'cable.selfLoop', `A cable cannot run from ${from.inst} back into itself.`);
    edges.push([from.inst, to.inst]);
    fanOut.set(c.from as string, (fanOut.get(c.from as string) ?? 0) + 1);
    fanIn.set(c.to as string, (fanIn.get(c.to as string) ?? 0) + 1);
    const fk = from.channel.kind, tk = to.channel.kind;
    if (isObj(c.map)) {
      const kinds = MAPS[c.map.kind as string];
      if (!kinds) w.add(`${cp}.map.kind`, 'cable.map', `"${c.map.kind}" is not a cable map.`, `Use one of ${list(Object.keys(MAPS))}.`);
      else if (!kinds[0].includes(fk) || !kinds[1].includes(tk)) w.add(`${cp}.map`, 'cable.map', `A ${c.map.kind} map turns ${kinds[0].join('/')} into ${kinds[1].join('/')}; this cable carries ${fk} into ${tk}.`);
    } else if (!KINDS_OK[fk]?.includes(tk)) w.add(cp, 'port.kind', `${c.from} carries a ${fk} and ${c.to} takes a ${tk}.`, `Add a map: ${Object.entries(MAPS).filter(([, k]) => k[0].includes(fk) && k[1].includes(tk)).map(([m]) => m).join(' or ') || 'no map joins these; wire another port'}.`);
  });
  for (const [k, v] of fanOut) if (v > L.fanOut) w.add(`${path}.cables`, 'cable.fanout', `${k} feeds ${v} cables; at most ${L.fanOut}.`);
  for (const [k, v] of fanIn) if (v > 1) w.add(`${path}.cables`, 'cable.fanin', `${k} has ${v} drivers; an in port has one.`);
  // cycles (DFS)
  const adj = new Map<string, string[]>(); for (const [a, b] of edges) adj.set(a, [...(adj.get(a) ?? []), b]);
  const seen = new Map<string, 0 | 1 | 2>();
  const dfs = (v: string): boolean => { seen.set(v, 1); for (const u of adj.get(v) ?? []) { if (seen.get(u) === 1 || (!seen.get(u) && dfs(u))) return true; } seen.set(v, 2); return false; };
  for (const v of adj.keys()) if (!seen.get(v) && dfs(v)) { w.add(`${path}.cables`, 'cable.cycle', 'The cables loop back on themselves; values must flow one way.', 'Remove one cable from the loop.'); break; }
  // set rules across the rig's gadgets, in grid order
  const members: SetMember[] = Object.entries(specs).filter(([, g]) => isObj(g) && g.job && g.feel)
    .sort(([a], [b]) => { const A = (slots[a] as Obj).at as number[], B = (slots[b] as Obj).at as number[]; return A[1] - B[1] || A[0] - B[0]; })
    .map(([inst, g]) => ({ name: inst, resolved: resolveFeel(g), mechanism: g.mechanism?.name, silhouette: g.parts?.map((p) => p.part).sort().join(',') }));
  for (const p of checkSet(members)) w.add(`${path}.gadgets`, p.code, p.message, p.fix);
  return w.problems.length ? { ok: false, problems: w.problems } : { ok: true, spec: input as unknown as RigSpec };
}

/** Validates either kind of spec by its $schema. */
export function validate(input: unknown, catalog: Catalog = {}): Validation<GadgetSpec | RigSpec> {
  if (isObj(input) && input.$schema === 'metalui/rig@1') return validateRig(input, catalog);
  return validateGadget(input);
}
