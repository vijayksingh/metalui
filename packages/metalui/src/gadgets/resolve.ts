// Resolution: a gadget's job and feel become everything a renderer needs. Job picks the hue (a
// station), where the sound goes, and sometimes the material; feel picks the material (first matching
// rule), the body's lightness and chroma, the weight its parts strike with, and the beeper's key.
// Nothing here is tuned per gadget: every number is a foundation (tokens.json → gadgets, sound).
import { GADGETS, type GadgetMaterial } from './gadgets.generated';
import { SOUND } from '../sound/recipes.generated';
import { pigment, deltaE, simulateCvd, type Pigment } from './color';
import { normalize, type Feel, type GadgetSpec, type Job, type Material, type Reach, type Container, type LampSignal, type LampGesture } from './spec';

export interface Oklch { L: number; C: number; H: number }
export interface ResolvedColor extends Oklch { pigment: Pigment }

/** The part of a spec the model reads: enough to resolve a placement without drawing it. */
export interface Placement { job: Job; feel: Feel; station?: number; material?: Material; container?: Container; reach?: Reach }

export interface ResolvedFeel {
  job: Job;
  feel: Feel;
  material: Material;
  /** Why this material: 'pin' (spec), 'job' (the job's pin) or the rule that matched. */
  materialBy: string;
  station: number;
  container: Container;
  reach: Reach;
  body: ResolvedColor;
  accent: ResolvedColor;
  /** The beeper's register (base MIDI) and scale, from weight and valence. */
  register: number;
  scale: 'major' | 'minor';
  /** Lightness band index for the set rules: 0 light, 1 middle, 2 dark. */
  band: 0 | 1 | 2;
}

const F = GADGETS.feel;
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const wrap = (h: number) => ((h % 360) + 360) % 360;
const color = (L: number, C: number, H: number): ResolvedColor => ({ L, C, H, pigment: pigment(L, C, H) });

/** Evaluates a material rule such as "w>=0.8&v<=0.4" against a feel. */
function matches(rule: string, f: Feel): boolean {
  if (rule === '*') return true;
  return rule.split('&').every((term) => {
    const m = term.match(/^([vaw])(>=|<=)([\d.]+)$/);
    if (!m) throw new Error(`gadgets.feel.material-rules: cannot read "${term}"`);
    const x = f[m[1] as keyof Feel], t = parseFloat(m[3]);
    return m[2] === '>=' ? x >= t : x <= t;
  });
}

export function materialFor(p: Placement): { material: Material; by: string } {
  if (p.material) return { material: p.material, by: 'pin' };
  const pin = (GADGETS.jobs[p.job] as { pin?: Material }).pin;
  if (pin) return { material: pin, by: 'job' };
  for (const [rule, m] of F.materialRules) if (matches(rule, p.feel)) return { material: m as Material, by: rule };
  return { material: 'clay', by: '*' };
}

/** The body's OKLCH for a feel on a material and hue station. */
export function bodyColor(job: Job, feel: Feel, material: GadgetMaterial, station: number): Oklch {
  const m = GADGETS.materials[material] as unknown as { L: readonly [number, number]; CCap: number };
  const L = clamp(F.L.base + F.L.W * feel.w + F.L.V * (feel.v - 0.5), m.L[0], m.L[1]);
  let C = clamp(F.C.base + F.C.A * feel.a * (F.C.VMix[0] + F.C.VMix[1] * feel.v), 0, m.CCap);
  const cMax = (GADGETS.jobs[job] as { bodyCMax?: number }).bodyCMax;
  if (cMax !== undefined) C = Math.min(C, cMax);
  const H = wrap(station + F.H.V * (feel.v - 0.5) + F.H.W * feel.w);
  return { L, C, H };
}

/** The accent: house orange, or sky when the body's hue sits near orange. */
export function accentFor(bodyHue: number): Oklch {
  const A = GADGETS.accent, near = Math.abs(((bodyHue - A.warm[2] + 540) % 360) - 180) <= A.flipWithinDeg;
  const [L, C, H] = near ? A.cool : A.warm;
  return { L, C: Math.max(C, A.minC), H };
}

export function resolveFeel(p: Placement): ResolvedFeel {
  const job = GADGETS.jobs[p.job];
  const { material, by } = materialFor(p);
  const station = p.station ?? job.stations[0];
  const b = bodyColor(p.job, p.feel, material, station);
  const a = accentFor(b.H);
  const [t0, t1] = F.register.thresholds, midi = F.register.baseMidi;
  const [bLight, bMid] = GADGETS.set.bands;
  return {
    job: p.job, feel: p.feel, material, materialBy: by, station,
    container: p.container ?? (job.containers[0] as Container),
    reach: p.reach ?? (job.reach as Reach),
    body: color(b.L, b.C, b.H), accent: color(a.L, a.C, a.H),
    register: p.feel.w <= t0 ? midi[0] : p.feel.w <= t1 ? midi[1] : midi[2],
    scale: p.feel.v >= 0.5 ? 'major' : 'minor',
    band: b.L >= bLight ? 0 : b.L >= bMid ? 1 : 2,
  };
}

export interface ResolvedPart { id: string; part: string; material: Material | 'lamp'; accent: boolean; color: ResolvedColor | null; f0: number | null }
export interface ResolvedState { name: string; feel: Feel; body: ResolvedColor; lamp: [LampSignal, LampGesture] }
export interface ResolvedGadget extends ResolvedFeel {
  name: string;
  title: string;
  parts: ResolvedPart[];
  states: Record<string, ResolvedState>;
}

const PITCH = SOUND.pitch;
const f0For = (material: string, longest: number, weight: number) => {
  const m = (SOUND.materials as Record<string, { f0x: number }>)[material];
  return m ? PITCH.base * Math.sqrt(PITCH.ref / Math.max(1, longest)) * (1 - PITCH.heavy * weight) * m.f0x : null;
};

/**
 * Resolves a whole spec. The body part takes the feel's material; other parts take their own
 * (placement, else the Part's first). A state's feel override re-resolves colour, never material:
 * a state is the same object.
 */
export function resolve(spec: GadgetSpec): ResolvedGadget {
  const n = normalize(spec);
  const base = resolveFeel(n);
  const parts: ResolvedPart[] = n.parts.map((p) => {
    const def = GADGETS.parts[p.part] as unknown as { size: readonly [number, number]; materials: readonly string[] };
    const size = p.size ?? def.size;
    const accent = p.material === 'accent';
    const mat = (p.role === 'body' ? base.material : accent ? def.materials.find((m) => m !== 'accent') ?? 'clay' : p.material ?? def.materials[0]) as Material | 'lamp';
    const col = accent ? base.accent : p.role === 'body' ? base.body : null;
    return { id: p.id, part: p.part, material: mat, accent, color: col, f0: mat === 'lamp' ? null : f0For(mat, Math.max(size[0], size[1]), n.feel.w) };
  });
  const states: Record<string, ResolvedState> = {};
  for (const [name, st] of Object.entries(n.states)) {
    const feel = { ...n.feel, ...st.feel };
    const b = bodyColor(n.job, feel, base.material, base.station);
    states[name] = { name, feel, body: color(b.L, b.C, b.H), lamp: st.lamp ?? ['off', 'steady'] };
  }
  return { ...base, name: n.name, title: n.title, parts, states };
}

// ---------- Set rules: gadgets side by side must not repeat themselves ----------

export interface SetMember { name: string; resolved: ResolvedFeel; silhouette?: string; mechanism?: string }
export interface SetProblem { code: 'set.hue' | 'set.band' | 'set.deltaE' | 'set.container' | 'set.cvd' | 'set.silhouette'; members: string[]; message: string; fix: string }

const lchVec = (c: Oklch): [number, number, number] => [c.L, c.C, c.H];

export function checkSet(members: SetMember[]): SetProblem[] {
  const S = GADGETS.set, out: SetProblem[] = [];
  for (let i = 0; i < members.length; i++) for (let j = i + 1; j < members.length; j++) {
    const a = members[i], b = members[j], ra = a.resolved, rb = b.resolved, pair = [a.name, b.name];
    const gap = Math.abs(((ra.station - rb.station + 540) % 360) - 180);
    if (gap < S.hueGap) out.push({ code: 'set.hue', members: pair, message: `${a.name} (${ra.station}°) and ${b.name} (${rb.station}°) sit ${gap}° apart; gadgets side by side need ${S.hueGap}°.`, fix: `Give one of them another station of its job, or move it to another rig.` });
    if (ra.material === rb.material && ra.band === rb.band) out.push({ code: 'set.band', members: pair, message: `${a.name} and ${b.name} are both ${ra.material} in the same lightness band.`, fix: `Change one's weight (w) to move it to another band, or pin another material.` });
    const d = deltaE(lchVec(ra.body), lchVec(rb.body));
    if (d < S.deltaE) out.push({ code: 'set.deltaE', members: pair, message: `${a.name} and ${b.name} differ by ΔE ${d.toFixed(3)}; they need ${S.deltaE}.`, fix: `Move one's feel further apart (valence shifts hue, weight shifts lightness).` });
    const dc = Math.min(...(['deuteranopia', 'protanopia'] as const).map((k) => deltaE(simulateCvd(lchVec(ra.body), k), simulateCvd(lchVec(rb.body), k))));
    if (dc < S.cvdDeltaE) out.push({ code: 'set.cvd', members: pair, message: `${a.name} and ${b.name} look alike to red–green colour blindness (ΔE ${dc.toFixed(3)}).`, fix: `Separate them in lightness (weight), which colour blindness keeps.` });
    if (a.silhouette && a.silhouette === b.silhouette && a.mechanism === b.mechanism) out.push({ code: 'set.silhouette', members: pair, message: `${a.name} and ${b.name} are the same object doing the same thing.`, fix: `Change the count or axis of one's parts, or its mechanism.` });
  }
  let run = 0;
  for (const m of members) {
    run = m.resolved.container === 'slab' ? run + 1 : 0;
    if (run > S.slabRun) { out.push({ code: 'set.container', members: [m.name], message: `More than ${S.slabRun} slab gadgets in a row.`, fix: `Use an inset or free gadget between them.` }); run = 0; }
  }
  return out;
}
