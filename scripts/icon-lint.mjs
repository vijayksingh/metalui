// Icon grammar lint: checks every icon (or a proposals module) against the construction grammar
// in docs/ICON-GRAMMAR.md, K0–K9. A check tool, not a test: it reads a glyph exactly as the morph
// build does (scripts/lib/morph-parts.mjs) and reports what breaks which rule.
//
//   node scripts/icon-lint.mjs                       the set; exits 0 (the set predates the grammar)
//   node scripts/icon-lint.mjs --strict              exit 1 when any glyph fails a physics rule (K0–K7)
//   node scripts/icon-lint.mjs --proposals <module>  lint a proposals module (exits 1 on failure)
//   node scripts/icon-lint.mjs --only group,ungroup  lint named icons only
//   node scripts/icon-lint.mjs --life                the life set against the same grammar (the feelings
//                                                    vessel is the one plate the grammar allows as a body)
//   node scripts/icon-lint.mjs --feelings            the feelings construction (§K): vessel + trace, on
//                                                    the keyline, one tint whose valence is the feeling's;
//                                                    exits 1 on failure
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { ICONS } from '../packages/metalui/icons/src/icons.mjs';
import { readFileSync } from 'node:fs';
import { glyphParts, isMorphable } from './lib/morph-parts.mjs';
import { LIFE_GLYPHS, lifeStaticSvg } from './lib/life-icons.mjs';
import { root } from './lib/emit.mjs';

/** The grammar's numbers (docs/ICON-GRAMMAR.md §3). One place, so the doc and the lint agree. */
export const GRAMMAR = {
  parts: [2, 4],        // K2: one body and one to three marks
  body: [24, 60],       // K2: the body's material, in grid units
  mark: 30,             // K2: a mark's material, at most
  material: [40, 90],   // K3: the glyph's material
  keyline: [3.5, 20.5], // K5: the body lies within this square…
  span: 12,             //     …and spans at least this much; everything stays inside the live area
  live: [2, 22],
  centre: 4,            // K5: the body's centre within one step (4) of (12, 12)
  clearances: 1,        // K6
  corners: 4,           // K8
};

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : undefined; };
const flag = (k) => process.argv.includes(k);

// ---------- reading a glyph ----------
const CURVE_STEPS = 8;
function parse(d) {
  const toks = d.match(/[MLCZ]|-?(?:\d*\.\d+|\d+)/g) ?? [];
  const subs = [];
  let i = 0, cur = [];
  const n = () => +toks[i++];
  while (i < toks.length) {
    const c = toks[i++];
    if (c === 'M') { cur = [[n(), n()]]; subs.push({ points: cur, closed: false }); }
    else if (c === 'L') cur.push([n(), n()]);
    else if (c === 'C') {
      const [x0, y0] = cur[cur.length - 1];
      const x1 = n(), y1 = n(), x2 = n(), y2 = n(), x3 = n(), y3 = n();
      for (let k = 1; k <= CURVE_STEPS; k++) {
        const t = k / CURVE_STEPS, u = 1 - t, a = u * u * u, b = 3 * u * u * t, cc = 3 * u * t * t, e = t * t * t;
        cur.push([a * x0 + b * x1 + cc * x2 + e * x3, a * y0 + b * y1 + cc * y2 + e * y3]);
      }
    } else if (c === 'Z') subs[subs.length - 1].closed = true;
  }
  return subs;
}
const CORNER = Math.cos((20 * Math.PI) / 180);
function corners(pts, closed) {
  let c = 0;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    if (!closed && (i === 0 || i === n - 1)) continue;
    const a = pts[(i - 1 + n) % n], b = pts[i], d = pts[(i + 1) % n];
    const ux = b[0] - a[0], uy = b[1] - a[1], vx = d[0] - b[0], vy = d[1] - b[1];
    const lu = Math.hypot(ux, uy), lv = Math.hypot(vx, vy);
    if (lu > 1e-6 && lv > 1e-6 && (ux * vx + uy * vy) / (lu * lv) < CORNER) c++;
  }
  return c;
}
function part(row) {
  const [d, w, tint, solid, , rels = []] = row;
  const [outer] = parse(d);
  const pts = outer.points, bead = pts.length === 1;
  if (outer.closed && pts.length > 2 && Math.hypot(pts[0][0] - pts[pts.length - 1][0], pts[0][1] - pts[pts.length - 1][1]) < 1e-3) pts.pop();
  const ring = outer.closed ? [...pts, pts[0]] : pts;
  let L = 0;
  for (let i = 1; i < ring.length; i++) L += Math.hypot(ring[i][0] - ring[i - 1][0], ring[i][1] - ring[i - 1][1]);
  let area = 0;
  for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; area += p[0] * q[1] - q[0] * p[1]; }
  const box = pts.reduce((b, p) => [Math.min(b[0], p[0]), Math.min(b[1], p[1]), Math.max(b[2], p[0]), Math.max(b[3], p[1])], [Infinity, Infinity, -Infinity, -Infinity]);
  const kind = bead ? 'bead' : w === 0 ? (solid ? 'solid plate' : 'plate') : outer.closed ? 'ring' : 'wire';
  return { kind, material: bead ? w : L, tint, solid, closed: outer.closed, bead, points: pts, box, area: area / 2, corners: bead ? 0 : corners(pts, outer.closed), relations: rels.length,
    centroid: [(box[0] + box[2]) / 2, (box[1] + box[3]) / 2] };
}

// The feelings vessel: a tinted disc of r 9.3 about the grid centre (life.mjs V()).
const VESSEL_R = 9.3;
function isVessel(p) {
  const w = p.box[2] - p.box[0], h = p.box[3] - p.box[1];
  return Math.abs(w - 2 * VESSEL_R) < 0.2 && Math.abs(h - 2 * VESSEL_R) < 0.2 && Math.hypot(p.centroid[0] - 12, p.centroid[1] - 12) < 0.1;
}

// ---------- the feelings construction (docs/ICON-GRAMMAR.md §K) ----------
const TINT = JSON.parse(readFileSync(root('tokens/tokens.json'), 'utf8')).foundations.tint;
const VALENCE = { '+': 'pleasant', 0: 'neutral', '-': 'unpleasant' };
/** A feeling is the vessel plus one to three marks inside it, and carries exactly one tint whose
 *  valence is the feeling's own. Returns { fails, info }. */
export function lintFeeling(g, rows) {
  const fails = [];
  const parts = rows.map(part);
  const vessel = parts.find((p) => p.kind === 'plate' && isVessel(p));
  if (!vessel) fails.push('§K no vessel: every feeling is the r 9.3 disc about the centre');
  const marks = parts.filter((p) => p !== vessel);
  if (marks.length < 1 || marks.length > 3) fails.push(`§K marks ${marks.length} (one to three: the trace and its beads or level)`);
  for (const [i, m] of parts.entries()) {
    if (m === vessel) continue;
    // A level is a fill clipped to the vessel: read back as a window, it is inside by construction.
    if ((rows[i][5] ?? []).some(([kind, j]) => kind === 'inside' && parts[j] === vessel)) continue;
    const far = Math.max(...m.points.map(([x, y]) => Math.hypot(x - 12, y - 12)));
    if (far > VESSEL_R + 0.9) fails.push(`§K a ${m.kind} reaches ${f1(far)}u from the centre: the trace stays inside the vessel`);
  }
  const families = Object.entries(TINT).filter(([k, t]) => !k.startsWith('$') && k !== 'field-shift' && t.feelings?.includes(g.name));
  if (families.length !== 1) fails.push(`§K tints ${families.length} (exactly one family in tokens.json names it)`);
  // DS-42: a tint names the kind of feeling, not its quadrant, so a neutral feeling may carry a
  // pleasant kind (curious is wonder). What it may never do is cross valence: a pleasant feeling in
  // an unpleasant family, or the reverse.
  else {
    const [fam, t] = families[0], v = VALENCE[g.val];
    if ((v === 'pleasant' && t.valence === 'unpleasant') || (v === 'unpleasant' && t.valence === 'pleasant')) fails.push(`§K tint ${fam} is ${t.valence}, the feeling is ${v}`);
  }
  const info = `vessel ${vessel ? 'yes' : 'no'} · ${marks.map((m) => `${m.kind} ${f1(m.material)}`).join(', ')} · tint ${families.map(([k]) => k).join('/') || 'none'}`;
  return { fails, info };
}

// ---------- the rules ----------
const f1 = (n) => (+n).toFixed(1);
/** Returns { fails: string[], warns: string[], info: string } for one glyph's rows. */
export function lint(rows, { vessel = false } = {}) {
  const G = GRAMMAR, fails = [], warns = [];
  const parts = rows.map(part);
  if (!isMorphable(rows)) fails.push('K0 solid plate: a character glyph, not in the morph family (it changes by the drum)');
  // §K: a feeling's vessel is the one plate the grammar allows, and it is the body.
  const allowed = vessel ? parts.find((p) => p.kind === 'plate' && isVessel(p)) : null;
  for (const p of parts) if (p.kind === 'plate' && p !== allowed) fails.push('K1 plate: a tinted area is a wire\'s fill, not a plate');
  if (parts.length < G.parts[0] || parts.length > G.parts[1]) fails.push(`K2 parts ${parts.length} (${G.parts[0]}–${G.parts[1]})`);
  const body = parts.reduce((a, b) => (b.material > a.material ? b : a), parts[0]);
  const marks = parts.filter((p) => p !== body);
  if (body.material < G.body[0] || body.material > G.body[1]) fails.push(`K2 body ${f1(body.material)}u (${G.body[0]}–${G.body[1]})`);
  for (const m of marks) if (m.material > G.mark) fails.push(`K2 mark ${f1(m.material)}u (at most ${G.mark}): two bodies`);
  const total = parts.reduce((s, p) => s + p.material, 0);
  if (total < G.material[0] || total > G.material[1]) fails.push(`K3 material ${f1(total)}u (${G.material[0]}–${G.material[1]})`);
  if (!(body.kind === 'ring' || (body.kind === 'wire' && body.tint > 0) || body === allowed)) fails.push(`K4 body is a ${body.kind}${body.kind === 'wire' ? ' without tint' : ''} (a ring, or a tinted wire)`);
  for (const m of marks) if (!(m.kind === 'bead' || m.kind === 'wire' || m.kind === 'ring')) fails.push(`K4 mark is a ${m.kind}`);
  const [k0, k1] = G.keyline, span = Math.max(body.box[2] - body.box[0], body.box[3] - body.box[1]);
  if (body.box[0] < k0 - 0.05 || body.box[1] < k0 - 0.05 || body.box[2] > k1 + 0.05 || body.box[3] > k1 + 0.05) fails.push(`K5 body box ${body.box.map(f1).join(',')} leaves the ${k0}–${k1} keyline square`);
  if (span < G.span) fails.push(`K5 body spans ${f1(span)}u (at least ${G.span}): it does not hold the keyline`);
  const outside = parts.some((p) => p.box[0] < G.live[0] - 0.05 || p.box[1] < G.live[0] - 0.05 || p.box[2] > G.live[1] + 0.05 || p.box[3] > G.live[1] + 0.05);
  if (outside) fails.push(`K5 outside the live area ${G.live[0]}–${G.live[1]}`);
  const off = Math.hypot(body.centroid[0] - 12, body.centroid[1] - 12);
  if (off > G.centre) fails.push(`K5 body centre ${f1(off)}u from the grid centre (at most ${G.centre})`);
  const rels = parts.reduce((s, p) => s + p.relations, 0);
  if (rels > G.clearances) fails.push(`K6 clearances ${rels} (at most ${G.clearances})`);
  const sharp = parts.reduce((s, p) => s + p.corners, 0);
  if (sharp > G.corners) warns.push(`K8 sharp corners ${sharp} (at most ${G.corners})`);
  for (const p of parts) {
    if (p.bead) continue;
    if (p.closed) {
      const top = p.points.reduce((a, q) => (q[1] < a[1] - 1e-6 || (Math.abs(q[1] - a[1]) < 1e-6 && q[0] < a[0]) ? q : a), p.points[0]);
      if (Math.hypot(top[0] - p.points[0][0], top[1] - p.points[0][1]) > 0.5) warns.push(`K7 ring starts at ${p.points[0].map(f1)}, not its top (${top.map(f1)})`);
      if (p.area < 0) warns.push('K7 ring runs counter-clockwise');
    } else {
      const a = p.points[0], b = p.points[p.points.length - 1];
      if (a[0] > b[0] + 0.5 || (Math.abs(a[0] - b[0]) <= 0.5 && a[1] > b[1] + 0.5)) warns.push(`K7 wire starts at ${a.map(f1)}, its right (or lower) end`);
    }
  }
  const info = `${parts.length} parts · body ${body.kind} ${f1(body.material)}u · marks ${marks.map((m) => `${m.kind} ${f1(m.material)}`).join(', ') || 'none'} · ${f1(total)}u · ${rels} clearance${rels === 1 ? '' : 's'}`;
  return { fails, warns, info };
}

// ---------- run ----------
if (flag('--feelings')) {
  let bad = 0;
  const feelings = LIFE_GLYPHS.filter((g) => g.cat === 'feelings');
  for (const g of feelings) {
    let rows;
    try { rows = glyphParts(g, lifeStaticSvg); } catch (e) { bad++; console.log(`FAIL  ${g.name.padEnd(12)} unreadable: ${e.message}`); continue; }
    const { fails, info } = lintFeeling(g, rows);
    if (fails.length) bad++;
    console.log(`${fails.length ? 'FAIL' : 'pass'}  ${g.name.padEnd(12)} ${info}`);
    for (const m of fails) console.log(`        ✗ ${m}`);
  }
  console.log(`\n${feelings.length - bad} of ${feelings.length} feelings follow the construction`);
  process.exit(bad ? 1 : 0);
}
const only = arg('--only')?.split(',');
let icons = ICONS;
const life = flag('--life');
if (life) icons = LIFE_GLYPHS;
if (arg('--proposals')) icons = (await import(pathToFileURL(resolve(arg('--proposals'))).href)).PROPOSALS;
if (only) icons = icons.filter((ic) => only.includes(ic.name));
let failed = 0;
for (const ic of icons) {
  let rows;
  try { rows = life ? glyphParts(ic, lifeStaticSvg) : glyphParts(ic); } catch (e) { console.log(`FAIL  ${ic.name.padEnd(11)} unreadable: ${e.message}`); failed++; continue; }
  const { fails, warns, info } = lint(rows, { vessel: life && ic.cat === 'feelings' });
  const ok = fails.length === 0;
  if (!ok) failed++;
  console.log(`${ok ? 'pass' : 'FAIL'}  ${ic.name.padEnd(11)} ${info}`);
  for (const m of fails) console.log(`        ✗ ${m}`);
  for (const m of warns) console.log(`        · ${m}`);
}
console.log(`\n${icons.length - failed} of ${icons.length} pass the grammar`);
if (failed && (flag('--strict') || arg('--proposals'))) process.exit(1);
