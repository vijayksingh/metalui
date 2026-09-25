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
import { drawSlab, type Cut } from './parts/slab';
import { drawJack } from './parts/jack';
import { drawPlug } from './parts/plug';
import { drawCable } from './parts/cable';
import { drawBeeper } from './parts/beeper';
import { drawLamp, type LampSignal } from './parts/led';

export interface DrawOptions { state?: string; tier?: Tier; host?: Host; id?: string; lamp?: [string, string] }
export interface GadgetDraw {
  resolved: ResolvedGadget;
  state: string;
  body: { defs: string; html: string };
  parts: { defs: string; html: string };
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

export function describeGadget(spec: GadgetSpec, state: string): string {
  const text = (spec.describe ?? '{title}: {state}').replace('{title}', spec.title).replace('{state}', state);
  const hint = spec.states[state]?.hint;
  return hint ? `${text}, ${hint}` : text;
}

/** The pose a state holds each part in (its `form`), by part id. */
export function formPoses(spec: GadgetSpec, state: string): Record<string, { x?: number; y?: number; r?: number; sx?: number; sy?: number }> {
  const out: Record<string, { x?: number; y?: number; r?: number }> = {};
  for (const [id, f] of Object.entries(spec.states[state]?.form ?? {})) if ('pose' in f) out[id] = f.pose;
  return out;
}

export function drawGadget(spec: GadgetSpec, o: DrawOptions = {}): GadgetDraw {
  const tier = o.tier ?? 'full', host = o.host ?? 'bone', id = o.id ?? `g-${spec.name}`;
  const resolved = resolve(spec), state = stateOf(spec, o.state), rs = resolved.states[state];
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
  let body = { defs: '', html: '' };
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
  let defs = '', trims = '', cables = '', plugs = '';
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
    } else if (p.part === 'plug') {
      const r = byId[p.id], face = r.accent && r.color ? r.color : clayFace();
      const d = drawPlug(pid, { at: p.at, size: size[0], color: face, stub: (p.params?.stub as 'up' | 'left' | 'right' | 'none' | undefined) ?? 'none' }, { tier, host });
      defs += d.defs;
      // A held pose is drawn in, so the first paint (and the server's) already shows the state.
      const pose = poses[p.id], [cx, cy] = p.at;
      const t = pose ? ` transform="translate(${cx + (pose.x ?? 0)} ${cy + (pose.y ?? 0)}) rotate(${pose.r ?? 0}) translate(${-cx} ${-cy})"` : '';
      const ts = pose ? ` transform="translate(${pose.x ?? 0} ${pose.y ?? 0})"` : '';
      plugs += `<g data-id="${p.id}"${r.accent ? ' data-accent="true"' : ''}>${d.shadow.replace('<g data-part="plug.shadow"', `<g data-part="plug.shadow"${ts}`)}${d.body.replace('<g data-part="plug"', `<g data-part="plug"${t}`)}</g>`;
    }
  }

  // The lamp: the state's signal and gesture (or a gesture an act asked for).
  const lampPart = spec.parts.find((p) => p.part === 'led');
  const [signal, gesture] = (o.lamp ?? rs.lamp) as [LampSignal, string];
  const lamp = lampPart ? drawLamp(`${id}-lamp`, { at: lampPart.at, size: sizeOf(lampPart)[0], signal, gesture }) : { defs: '', body: '' };

  return {
    resolved, state,
    body,
    parts: { defs, html: trims + cables + plugs },
    lamp: { defs: lamp.defs, html: lamp.body },
    description: describeGadget(spec, state),
  };
}

/** The whole gadget as one SVG string, for a server, an email or a raster. */
export function renderGadgetSvg(spec: GadgetSpec, o: DrawOptions & { size?: number } = {}): string {
  const size = o.size ?? 160, tier = o.tier ?? tierFor(size);
  const d = drawGadget(spec, { ...o, tier });
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="${size}" height="${size}" role="img" data-gadget="${spec.name}" data-state="${d.state}" data-tier="${tier}">`
    + `<title>${esc(spec.title)}</title><desc>${esc(d.description)}</desc>`
    + `<defs>${d.body.defs}${d.parts.defs}${d.lamp.defs}</defs>`
    + `<g data-layer="body">${d.body.html}</g><g data-layer="parts">${d.parts.html}</g><g data-layer="lamp">${d.lamp.html}</g></svg>`;
}
