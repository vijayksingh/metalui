// Morph strain: how hard every icon is to morph, and why (docs/ICON-GRAMMAR.md).
//
//   node scripts/morph-strain.mjs                       ranking, hardest pairs, feature evidence
//   node scripts/morph-strain.mjs --md <file>           also write the tables as Markdown
//   node scripts/morph-strain.mjs --matrix              also print the full 31×31 matrix
//   node scripts/morph-strain.mjs --proposals <mod> --out <dir>
//         score a proposals module (icons in the icons.mjs format, replacing set icons by name)
//         before/after against the whole set, and write filmstrips.html for its PAIRS
//
// Plans come from the same engine the app runs (packages/metalui/src/icons/morph.ts, bundled
// here) and the same reading of a glyph the build uses (scripts/lib/morph-parts.mjs).
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { ICONS } from '../packages/metalui/icons/src/icons.mjs';
import { root } from './lib/emit.mjs';
import { glyphParts, isMorphable } from './lib/morph-parts.mjs';

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : undefined; };
const flag = (k) => process.argv.includes(k);

// ---------- the engine, as the app runs it ----------
const bundle = await build({ entryPoints: [root('packages/metalui/src/icons/morph.ts')], bundle: true, format: 'esm', write: false, logLevel: 'silent' });
const engine = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
const { partsFrom, planFrames, morphAt, morphPath, morphOutline } = engine;

// ---------- glyphs and their structure ----------
const f2 = (n) => n.toFixed(2);
const material = (p) => {
  if (p.bead) return p.weight;
  const ring = p.closed ? [...p.points, p.points[0]] : p.points;
  let L = 0;
  for (let i = 1; i < ring.length; i++) L += Math.hypot(ring[i][0] - ring[i - 1][0], ring[i][1] - ring[i - 1][1]);
  return L;
};
const bbox = (pts) => pts.reduce((b, p) => [Math.min(b[0], p[0]), Math.min(b[1], p[1]), Math.max(b[2], p[0]), Math.max(b[3], p[1])], [Infinity, Infinity, -Infinity, -Infinity]);
const overlap = (a, b) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];

/** Structural features of a glyph: the candidate causes of strain. */
function features(frame) {
  const mats = frame.map(material);
  const boxes = frame.map((p) => bbox(p.points));
  let overlaps = 0;
  for (let i = 0; i < frame.length; i++) for (let j = i + 1; j < frame.length; j++) if (overlap(boxes[i], boxes[j])) overlaps++;
  const kinds = { wire: 0, ring: 0, bead: 0, plate: 0 };
  for (const p of frame) kinds[p.bead ? 'bead' : p.weight === 0 ? 'plate' : p.closed ? 'ring' : 'wire']++;
  return {
    parts: frame.length,
    wires: kinds.wire, rings: kinds.ring, beads: kinds.bead, plates: kinds.plate,
    relations: frame.reduce((s, p) => s + p.behind.length + p.inside.length, 0),
    tinted: frame.filter((p) => p.tint > 0).length,
    solids: frame.filter((p) => p.solid > 0 && !p.bead).length,
    material: mats.reduce((a, b) => a + b, 0),
    largest: Math.max(...mats),
    spread: Math.max(...mats) / Math.max(0.1, Math.min(...mats)),
    corners: frame.reduce((s, p) => s + p.corners.length, 0),
    holes: frame.reduce((s, p) => s + p.holes.length, 0),
    overlaps,
    ends: kinds.wire * 2,
    offset: (() => { const b = boxes[mats.indexOf(Math.max(...mats))]; return Math.hypot((b[0] + b[2]) / 2 - 12, (b[1] + b[3]) / 2 - 12); })(),
  };
}
const FEATURES = {
  parts: 'parts', wires: 'open wires', rings: 'closed wires', beads: 'beads', plates: 'plates', relations: 'clearances (depth relations)',
  tinted: 'tinted parts', solids: 'solid plates', material: 'total material (u)', largest: 'largest part (u)', spread: 'largest ÷ smallest part',
  corners: 'sharp corners', holes: 'holes', overlaps: 'overlapping part boxes', ends: 'free wire ends', offset: 'body centre off the grid centre (u)',
};

// The morph family only: a glyph with a solid plate (keeper) is a character and never morphs (K0).
const setRows = Object.fromEntries(ICONS.map((ic) => [ic.name, glyphParts(ic)]).filter(([, r]) => isMorphable(r)));
const frames = (rows) => Object.fromEntries(Object.entries(rows).map(([n, r]) => [n, partsFrom(r)]));

/** Strain of every ordered pair among the given frames. */
function matrixOf(glyphs) {
  const names = Object.keys(glyphs), m = {};
  for (const a of names) { m[a] = {}; for (const b of names) if (a !== b) m[a][b] = planFrames(glyphs[a], glyphs[b]).strain; }
  return { names, m };
}
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
function ranking({ names, m }) {
  return names.map((n) => {
    const out = names.filter((b) => b !== n).map((b) => m[n][b].total), inn = names.filter((a) => a !== n).map((a) => m[a][n].total);
    const worst = names.filter((b) => b !== n).sort((x, y) => (m[n][y].total + m[y][n].total) - (m[n][x].total + m[x][n].total))[0];
    return { name: n, out: mean(out), in: mean(inn), all: mean([...out, ...inn]), worst };
  }).sort((a, b) => b.all - a.all);
}
function pearson(xs, ys) {
  const mx = mean(xs), my = mean(ys);
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < xs.length; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; syy += (ys[i] - my) ** 2; }
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : 0;
}

// ---------- reports ----------
const table = (head, rows) => [`| ${head.join(' | ')} |`, `| ${head.map(() => '---').join(' | ')} |`, ...rows.map((r) => `| ${r.join(' | ')} |`)].join('\n');

function report(glyphs, { matrix = false } = {}) {
  const M = matrixOf(glyphs), rank = ranking(M);
  const feats = Object.fromEntries(M.names.map((n) => [n, features(glyphs[n])]));
  const out = [];
  out.push('## Icons ranked by mean strain (as source and as target, against every other icon)\n');
  out.push(table(['#', 'icon', 'mean', 'as source', 'as target', 'hardest partner', 'parts', 'clearances', 'plates', 'rings', 'wires', 'beads', 'material'],
    rank.map((r, i) => [i + 1, r.name, f2(r.all), f2(r.out), f2(r.in), r.worst, feats[r.name].parts, feats[r.name].relations, feats[r.name].plates, feats[r.name].rings, feats[r.name].wires, feats[r.name].beads, feats[r.name].material.toFixed(0)])));
  // Which structure predicts strain: correlation of each feature with an icon's mean strain, and the
  // mean strain of icons with and without the feature.
  const byName = Object.fromEntries(rank.map((r) => [r.name, r.all]));
  const evidence = Object.keys(FEATURES).map((k) => {
    const xs = M.names.map((n) => feats[n][k]), ys = M.names.map((n) => byName[n]);
    const has = M.names.filter((n) => feats[n][k] > (k === 'parts' ? 3 : 0)), not = M.names.filter((n) => !has.includes(n));
    return { k, r: pearson(xs, ys), has: mean(has.map((n) => byName[n])), hasN: has.length, not: mean(not.map((n) => byName[n])), notN: not.length };
  }).sort((a, b) => b.r - a.r);
  out.push(`\n## Which structure predicts strain\n\nPearson r between a feature and the icon's mean strain (n = ${M.names.length}), and the mean strain of icons with the feature against those without (for parts: more than three).\n`);
  out.push(table(['feature', 'r', 'with (n)', 'without (n)'], evidence.map((e) => [FEATURES[e.k], f2(e.r), `${f2(e.has)} (${e.hasN})`, e.notN ? `${f2(e.not)} (${e.notN})` : '—'])));
  // Pair-level: what the strain is made of in the hardest and easiest pairs.
  const pairs = [];
  for (const a of M.names) for (const b of M.names) if (a !== b) pairs.push({ a, b, s: M.m[a][b] });
  pairs.sort((x, y) => y.s.total - x.s.total);
  // Pair-level evidence: a feature of the pair against its strain (n = 930).
  const PAIR = {
    dparts: ['part count mismatch |a − b|', (x, y) => Math.abs(x.parts - y.parts)],
    dkind: ['kind mismatch (rings, wires, beads, plates that have no partner of their kind)', (x, y) => Math.abs(x.rings - y.rings) + Math.abs(x.wires - y.wires) + Math.abs(x.beads - y.beads) + Math.abs(x.plates - y.plates)],
    dmaterial: ['material mismatch |a − b| (u)', (x, y) => Math.abs(x.material - y.material)],
    material: ['material of both (u)', (x, y) => x.material + y.material],
    relations: ['clearances of both', (x, y) => x.relations + y.relations],
    plates: ['plates of both', (x, y) => x.plates + y.plates],
    parts: ['parts of both', (x, y) => x.parts + y.parts],
    corners: ['sharp corners of both', (x, y) => x.corners + y.corners],
    overlaps: ['overlapping part boxes of both', (x, y) => x.overlaps + y.overlaps],
    offset: ['body centres off the grid centre, both (u)', (x, y) => x.offset + y.offset],
    doffset: ['distance between the two bodies\' centres (u)', (x, y) => Math.abs(x.offset - y.offset)],
  };
  const pairEvidence = Object.entries(PAIR).map(([k, [label, fn]]) => {
    const xs = pairs.map((p) => fn(feats[p.a], feats[p.b])), ys = pairs.map((p) => p.s.total);
    const zero = pairs.filter((p, i) => xs[i] === 0), some = pairs.filter((p, i) => xs[i] > 0);
    return { label, r: pearson(xs, ys), zero: mean(zero.map((p) => p.s.total)), zeroN: zero.length, some: mean(some.map((p) => p.s.total)), someN: some.length };
  }).sort((a, b) => b.r - a.r);
  out.push(`\n## Which mismatch predicts strain\n\nPearson r between a feature of the pair and its strain (n = ${pairs.length}), and the mean strain of pairs where the feature is zero against the rest.\n`);
  out.push(table(['pair feature', 'r', 'zero (n)', 'nonzero (n)'], pairEvidence.map((e) => [e.label, f2(e.r), e.zeroN ? `${f2(e.zero)} (${e.zeroN})` : '—', e.someN ? `${f2(e.some)} (${e.someN})` : '—'])));
  const row = (p) => [`${p.a} → ${p.b}`, f2(p.s.total), f2(p.s.travel), f2(p.s.lone), f2(p.s.topology), f2(p.s.traits), f2(p.s.crossing), p.s.turn ? 'yes' : ''];
  const head = ['pair', 'strain', 'travel (u)', 'lone share', 'topology share', 'traits', 'crossing share', 'turn'];
  out.push('\n## Hardest 20 pairs\n');
  out.push(table(head, pairs.slice(0, 20).map(row)));
  out.push('\n## Easiest 20 pairs\n');
  out.push(table(head, pairs.slice(-20).reverse().map(row)));
  const totals = pairs.map((p) => p.s.total);
  const share = (k) => mean(pairs.map((p) => ({ travel: p.s.travel / 4, lone: 2 * p.s.lone, topology: 0.5 * p.s.topology, traits: 0.25 * p.s.traits, crossing: 0.5 * p.s.crossing, turn: p.s.turn ? 0.5 : 0 })[k])) / mean(totals);
  out.push(`\n## Distribution\n\n${pairs.length} ordered pairs. Mean strain ${f2(mean(totals))}, median ${f2(totals[Math.floor(totals.length / 2)])}, under 1: ${totals.filter((t) => t < 1).length}, 1–2: ${totals.filter((t) => t >= 1 && t < 2).length}, 2 and over: ${totals.filter((t) => t >= 2).length}. Share of the total: travel ${(share('travel') * 100).toFixed(0)}%, lone material ${(share('lone') * 100).toFixed(0)}%, topology ${(share('topology') * 100).toFixed(0)}%, traits ${(share('traits') * 100).toFixed(0)}%, crossing ${(share('crossing') * 100).toFixed(0)}%, turn ${(share('turn') * 100).toFixed(0)}%.`);
  if (matrix) {
    out.push('\n## Matrix (row → column)\n');
    out.push(table(['', ...M.names], M.names.map((a) => [a, ...M.names.map((b) => (a === b ? '·' : M.m[a][b].total.toFixed(1)))])));
  }
  return { text: out.join('\n'), M, rank, feats };
}

// ---------- filmstrips (the same drawing MorphGlyph does) ----------
function frameSvg(frame, size, id) {
  const rels = frame.flatMap((part, i) => [
    ...part.inside.map((r, k) => ({ key: `${id}i${i}-${k}`, caster: frame[r.part], r: r.r, inside: true, part: i })),
    ...part.behind.map((r, k) => ({ key: `${id}b${i}-${k}`, caster: frame[r.part], r: r.r, inside: false, part: i })),
  ]);
  const defs = rels.map((r) => `<mask id="${r.key}" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">${r.inside ? '' : '<rect width="24" height="24" fill="#fff" stroke="none"/>'}<path d="${morphOutline(r.caster)}" fill="${r.inside ? '#fff' : r.caster.body ? '#000' : 'none'}" stroke="#000" stroke-width="${Math.max(0, 2 * r.r)}"/></mask>`).join('');
  const body = frame.map((part, i) => {
    let node = `<path d="${morphPath(part)}" stroke-width="${part.weight}" fill-rule="${part.holes.length ? 'evenodd' : 'nonzero'}"${part.opacity < 1 ? ` opacity="${part.opacity}"` : ''} fill-opacity="${(part.tint + part.solid).toFixed(4)}"/>`;
    for (const r of rels) if (r.part === i) node = `<g mask="url(#${r.key})">${node}</g>`;
    return node;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${defs ? `<defs>${defs}</defs>` : ''}${body}</svg>`;
}
const STEPS = [0, 0.2, 0.4, 0.6, 0.8, 1];
function filmstrip(a, b, A, B, id, size = 96) {
  const plan = planFrames(A, B);
  const cells = STEPS.map((s, k) => frameSvg(s === 1 ? B : morphAt(plan, s), size, `${id}-${k}`)).join('');
  const moves = [...new Set(plan.tracks.map((t) => t.move))].join(' · ');
  return `<div class="row"><div class="label"><b>${a} → ${b}</b><span>strain ${f2(plan.strain.total)}${plan.turn !== undefined ? ' · turn' : ''}</span><span>${moves}</span></div>${cells}</div>`;
}
const PAGE = (title, rows) => `<!doctype html><meta charset="utf-8"><title>${title}</title><style>body{font:13px/1.4 ui-monospace,Menlo,monospace;color:#2b2b2b;background:#f6f5f2;margin:24px}h1{font-size:15px}h2{font-size:13px;margin:32px 0 8px;color:#666}.row{display:flex;align-items:center;gap:8px;margin:6px 0}.label{width:220px;display:flex;flex-direction:column;gap:2px;color:#666}.label b{color:#2b2b2b;font-weight:600}svg{color:#2b2b2b}</style><h1>${title}</h1>${rows}`;

// ---------- run ----------
const proposalsPath = arg('--proposals');
if (!proposalsPath) {
  const { text } = report(frames(setRows), { matrix: flag('--matrix') });
  console.log(text);
  const md = arg('--md');
  if (md) { mkdirSync(dirname(resolve(md)), { recursive: true }); writeFileSync(resolve(md), `# Morph strain of the set\n\nGenerated by \`node scripts/morph-strain.mjs --md ${md}\`. Strain is the engine's own score (docs/MORPH.md): under 1 a pair reads as one object changing.\n\n${text}\n`); }
} else {
  const mod = await import(pathToFileURL(resolve(proposalsPath)).href);
  const outDir = resolve(arg('--out') ?? dirname(resolve(proposalsPath)));
  mkdirSync(outDir, { recursive: true });
  const before = frames(setRows);
  const afterRows = { ...setRows };
  for (const ic of mod.PROPOSALS) {
    const r = glyphParts(ic);
    if (!isMorphable(r)) throw new Error(`${ic.name}: a glyph with a solid plate is not in the morph family (docs/ICON-GRAMMAR.md, K0).`);
    afterRows[ic.name] = r;
  }
  const after = frames(afterRows);
  const names = Object.keys(before);
  const lines = ['## Proposals: mean strain against the rest of the set, before → after\n'];
  const rows = [];
  for (const ic of mod.PROPOSALS) {
    const others = names.filter((n) => n !== ic.name && !mod.PROPOSALS.some((p) => p.name === n));
    const score = (g) => mean(others.flatMap((n) => [planFrames(g[ic.name], g[n]).strain.total, planFrames(g[n], g[ic.name]).strain.total]));
    // A glyph outside the family before (a solid character) has no "before": it is a new glyph.
    const fb = before[ic.name] ? features(before[ic.name]) : null, fa = features(after[ic.name]);
    const arrow = (k) => (fb ? `${fb[k]} → ${fa[k]}` : `new · ${fa[k]}`);
    rows.push([ic.name, fb ? f2(score(before)) : 'out of family', f2(score(after)), arrow('parts'), arrow('relations'), arrow('plates'), fb ? `${fb.material.toFixed(0)} → ${fa.material.toFixed(0)}` : `new · ${fa.material.toFixed(0)}`]);
  }
  lines.push(table(['icon', 'before', 'after', 'parts', 'clearances', 'plates', 'material'], rows));
  lines.push('\n## Pairs of interest, before → after\n');
  const pairRows = (mod.PAIRS ?? []).map(([a, b]) => [`${a} → ${b}`, before[a] && before[b] ? f2(planFrames(before[a], before[b]).strain.total) : 'out of family', f2(planFrames(after[a], after[b]).strain.total)]);
  lines.push(table(['pair', 'before', 'after'], pairRows));
  const text = lines.join('\n');
  console.log(text);
  const strips = (mod.PAIRS ?? []).map(([a, b], i) => `<h2>${a} → ${b}</h2>${before[a] && before[b] ? filmstrip(a, b, before[a], before[b], `b${i}`) : '<div class="row"><div class="label">before: out of the morph family</div></div>'}${filmstrip(a, b, after[a], after[b], `a${i}`)}`).join('');
  writeFileSync(join(outDir, 'filmstrips.html'), PAGE('Icon grammar proposals: before (top) and after (bottom)', strips));
  writeFileSync(join(outDir, 'STRAIN.md'), `# Proposal strain\n\nGenerated by \`node scripts/morph-strain.mjs --proposals ${proposalsPath} --out ${arg('--out') ?? dirname(proposalsPath)}\`.\n\n${text}\n`);
  console.log(`\nwrote ${join(outDir, 'filmstrips.html')} and STRAIN.md`);
}
