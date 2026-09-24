// icons/src/icons.mjs → morph geometry (packages/metalui/src/icons/morph.generated.ts).
//
// Every Soft Hardware glyph is made of three things, and the morph is invented from them:
//   wire   a centerline drawn at the set's weight with round caps; open or closed; a closed
//          (or chord-closed) wire can hold a duotone tint
//   bead   a solid dot: a wire of zero length, drawn at the dot's diameter
//   plate  a filled body with no wire: tinted or solid, possibly with holes
// Masks and clips are baked here, so the runtime never needs them:
//   - a dashed wire becomes its visible runs
//   - a masked or clipped plate, and a wire something in front keeps clear of, become exactly
//     what is left of them on screen: plates (CoreGraphics booleans, scripts/lib/outline.swift)
// Geometry comes from the same static bake as the SVG export, so every glyph at rest is the icon.
// Needs macOS (xcrun swift) for the plate booleans.
import { spawnSync } from 'node:child_process';
import { ICONS } from '../packages/metalui/icons/src/icons.mjs';
import { emit, finish, root } from './lib/emit.mjs';
import { staticSvg, SW } from './lib/static-svg.mjs';
import { ap, I, mul, parseSvg, parseTransform, scaleOf, shapeData, transformData } from './lib/svg-geometry.mjs';

const BEAD_MAX_R = 2.2; // solid circles up to this radius are beads, larger ones are plates
const DENSE = 0.02;     // sampling step (24u) for cutting dashed wires
const SIMPLIFY = 0.008; // polyline tolerance (24u) for cut runs and plate outlines

const INHERIT = ['fill', 'fill-opacity', 'stroke', 'stroke-width', 'opacity', 'stroke-dasharray'];
const isNone = (p) => p == null || p === 'none';
const isWhite = (p) => /^(#fff(fff)?|white)$/i.test(p || '');
const r2 = (n) => +n.toFixed(2);
const fmt = (n) => String(r2(n)).replace(/^(-?)0\./, '$1.');

// ---------- commands → subpaths, dense points ----------
function subpaths(cmds) {
  const out = [];
  for (const c of cmds) {
    if (c[0] === 'M') out.push({ cmds: [c], closed: false });
    else if (c[0] === 'Z') out[out.length - 1].closed = true;
    else out[out.length - 1].cmds.push(c);
  }
  return out;
}
function dense(sub, step = DENSE) {
  const pts = [[sub.cmds[0][1], sub.cmds[0][2]]];
  let [x, y] = pts[0];
  const seg = (nx, ny, at) => {
    const n = Math.max(1, Math.ceil(nx / step));
    for (let i = 1; i <= n; i++) pts.push(at(i / n));
  };
  for (const c of sub.cmds.slice(1)) {
    if (c[0] === 'L') {
      const [x0, y0] = [x, y], [x1, y1] = [c[1], c[2]];
      seg(Math.hypot(x1 - x0, y1 - y0), 0, (t) => [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t]);
      [x, y] = [x1, y1];
    } else if (c[0] === 'C') {
      const p = [[x, y], [c[1], c[2]], [c[3], c[4]], [c[5], c[6]]];
      const hull = Math.hypot(p[1][0] - p[0][0], p[1][1] - p[0][1]) + Math.hypot(p[2][0] - p[1][0], p[2][1] - p[1][1]) + Math.hypot(p[3][0] - p[2][0], p[3][1] - p[2][1]);
      seg(hull, 0, (t) => {
        const u = 1 - t, a = u * u * u, b = 3 * u * u * t, cc = 3 * u * t * t, d = t * t * t;
        return [a * p[0][0] + b * p[1][0] + cc * p[2][0] + d * p[3][0], a * p[0][1] + b * p[1][1] + cc * p[2][1] + d * p[3][1]];
      });
      [x, y] = [c[5], c[6]];
    }
  }
  if (sub.closed) {
    const [x0, y0] = [x, y], [x1, y1] = pts[0];
    const L = Math.hypot(x1 - x0, y1 - y0);
    if (L > 1e-6) seg(L, 0, (t) => [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t]);
  }
  return pts;
}
const lengths = (pts) => pts.reduce((a, p, i) => (i ? [...a, a[i - 1] + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1])] : [0]), []);

// ---------- geometry helpers ----------
function inPolygons(pt, polys) {
  let c = false;
  for (const poly of polys) {
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c;
    }
  }
  return c;
}
// ---------- the glyph → parts ----------
function collect(svgSrc) {
  const svg = parseSvg(svgSrc);
  const defs = {};
  (function find(n) { for (const c of n.children) { if ((c.tag === 'mask' || c.tag === 'clipPath') && c.attrs.id) defs[c.attrs.id] = c; find(c); } })(svg);

  function maskShapes(def, ctm) {
    const shapes = [];
    (function walk(n, style, m) {
      for (const c of n.children) {
        const st = { ...style }; for (const k of INHERIT) if (c.attrs[k] != null) st[k] = c.attrs[k];
        const cm = mul(m, parseTransform(c.attrs.transform));
        if (c.tag === 'g') { walk(c, st, cm); continue; }
        const d = shapeData(c); if (!d) continue;
        const td = transformData(d, cm);
        if (def.tag === 'clipPath') { shapes.push({ d: td, stroke: null }); continue; }
        if (!isNone(st.fill) && !isWhite(st.fill)) shapes.push({ d: td, stroke: null });
        if (!isNone(st.stroke) && !isWhite(st.stroke)) shapes.push({ d: td, stroke: +(st['stroke-width'] ?? SW) * scaleOf(cm) });
      }
    })(def, { fill: 'black', stroke: 'none' }, ctm);
    return shapes;
  }

  const items = [];
  (function walk(n, style, m, masks) {
    for (const c of n.children) {
      if (c.tag === 'defs' || c.tag === 'mask' || c.tag === 'clipPath') continue;
      const st = { ...style };
      for (const k of INHERIT) if (c.attrs[k] != null) st[k] = c.attrs[k];
      if (c.attrs.opacity != null) st.opacity = String(+(style.opacity ?? 1) * +c.attrs.opacity);
      const cm = mul(m, parseTransform(c.attrs.transform));
      const ms = [...masks];
      for (const [attr, op] of [['mask', 'subtract'], ['clip-path', 'intersect']]) {
        const ref = c.attrs[attr]?.match(/url\(#([^)]+)\)/)?.[1];
        if (ref && defs[ref]) ms.push({ op, shapes: maskShapes(defs[ref], cm) });
      }
      if (c.tag === 'g') { walk(c, st, cm, ms); continue; }
      const d = shapeData(c); if (!d) continue;
      items.push({ node: c, d: transformData(d, cm), cm, st, masks: ms });
    }
  })(svg, { fill: svg.attrs.fill, stroke: svg.attrs.stroke, 'stroke-width': svg.attrs['stroke-width'] }, I, []);
  return items;
}

const cmdsToD = (cmds) => cmds.map((c) => c[0] + c.slice(1).map(fmt).join(' ')).join('');
const polyToD = (pts, closed) => pts.map((p, i) => (i ? 'L' : 'M') + fmt(p[0]) + ' ' + fmt(p[1])).join('') + (closed ? 'Z' : '');

function simplify(pts, tol = SIMPLIFY) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  (function rdp(a, b) {
    let best = -1, idx = -1;
    const [ax, ay] = pts[a], [bx, by] = pts[b], dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy);
    for (let i = a + 1; i < b; i++) {
      const d = L ? Math.abs(dy * pts[i][0] - dx * pts[i][1] + bx * ay - by * ax) / L : Math.hypot(pts[i][0] - ax, pts[i][1] - ay);
      if (d > best) { best = d; idx = i; }
    }
    if (best > tol) { keep[idx] = 1; rdp(a, idx); rdp(idx, b); }
  })(0, pts.length - 1);
  return pts.filter((_, i) => keep[i]);
}

/** The visible runs of a dashed wire, or null when the dash leaves it whole. */
function cutDash(sub, dash, pathLength) {
  const pts = dense(sub);
  const cum = lengths(pts), L = cum[cum.length - 1];
  const k = pathLength ? L / pathLength : 1;
  const pattern = dash.map((v) => v * k), period = pattern.reduce((x, y) => x + y, 0);
  const on = (len) => {
    let r = len % period;
    for (let i = 0; i < pattern.length; i++) { if (r <= pattern[i] + 1e-6) return i % 2 === 0; r -= pattern[i]; }
    return true;
  };
  const vis = cum.map(on);
  if (vis.every(Boolean)) return null;
  // Walk the samples (from a hidden one, for a ring) and collect visible runs.
  let order = pts.map((_, i) => i);
  if (sub.closed) { const h = vis.indexOf(false); order = [...order.slice(h), ...order.slice(0, h)]; }
  const runs = [];
  let cur = null;
  for (const i of order) {
    if (vis[i]) (cur ??= []).push(pts[i]);
    else if (cur) { runs.push(cur); cur = null; }
  }
  if (cur) runs.push(cur);
  return runs.filter((r) => r.length > 1).map((r) => simplify(r));
}

const area = (pts) => pts.reduce((a, p, i) => { const q = pts[(i + 1) % pts.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;

const glyphs = {};
const plateJobs = [];
for (const ic of ICONS) {
  const parts = (glyphs[ic.name] = []);
  for (const it of collect(staticSvg(ic))) {
    const { node, st, masks, cm } = it;
    const o = +(st.opacity ?? 1);
    const fill = !isNone(st.fill), stroke = !isNone(st.stroke);
    const fo = +(st['fill-opacity'] ?? 1);
    const tint = fill && fo < 1 ? fo : 0, solid = fill && fo >= 1 ? 1 : 0;
    const w = stroke ? +(st['stroke-width'] ?? SW) * scaleOf(cm) : 0;

    if (node.tag === 'circle' && solid && !stroke && !masks.length && +node.attrs.r * scaleOf(cm) <= BEAD_MAX_R) {
      const [cx, cy] = ap(cm, +node.attrs.cx, +node.attrs.cy), r = +node.attrs.r * scaleOf(cm);
      parts.push({ d: `M${fmt(cx)} ${fmt(cy)}`, w: r2(2 * r), t: 0, s: 0, o, bead: true });
      continue;
    }
    if (!stroke) {
      if (masks.length) { plateJobs.push({ t: tint, s: solid, o, item: { layer: 'primary', shape: { d: it.d, stroke: null }, masks: masks.map((m) => ({ op: m.op, shapes: m.shapes })) } }); parts.push({ job: plateJobs.length - 1 }); }
      else for (const sub of subpaths(it.d)) parts.push({ d: cmdsToD(sub.cmds) + 'Z', w: 0, t: tint, s: solid, o });
      continue;
    }
    // A wire that something in front keeps clear of is drawn as exactly what is left of it: a
    // plate cut from its outline (the cards' clearance can leave a sliver of the folder behind).
    if (masks.length) {
      const job = (shape, t, s) => { plateJobs.push({ t, s, o, item: { layer: 'primary', shape, masks: masks.map((m) => ({ op: m.op, shapes: m.shapes })) } }); parts.push({ job: plateJobs.length - 1 }); };
      if (tint) job({ d: it.d, stroke: null }, tint, 0);
      job({ d: it.d, stroke: w }, 0, 1);
      continue;
    }
    const dash = st['stroke-dasharray'] && st['stroke-dasharray'] !== 'none' ? st['stroke-dasharray'].split(/[\s,]+/).map(Number) : null;
    const pathLength = node.attrs.pathLength ? +node.attrs.pathLength : null;
    for (const sub of subpaths(it.d)) {
      const runs = dash ? cutDash(sub, dash, pathLength) : null;
      if (!runs) parts.push({ d: cmdsToD(sub.cmds) + (sub.closed ? 'Z' : ''), w: r2(w), t: tint, s: solid, o });
      else for (const run of runs) parts.push({ d: polyToD(run, false), w: r2(w), t: tint, s: solid, o });
    }
  }
}

// Masked and clipped plates: exact booleans through CoreGraphics.
if (plateJobs.length) {
  const res = spawnSync('xcrun', ['swift', root('scripts/lib/outline.swift')], {
    input: JSON.stringify({ jobs: plateJobs.map((j, i) => ({ id: String(i), items: [j.item] })) }),
    maxBuffer: 1 << 28,
  });
  if (res.status !== 0) { console.error(res.stderr.toString()); process.exit(1); }
  const byId = Object.fromEntries(JSON.parse(res.stdout.toString()).jobs.map((j) => [j.id, j.layers.primary[0]]));
  plateJobs.forEach((job, i) => {
    const contours = byId[String(i)].map((c) => simplify([...c, c[0]]).slice(0, -1)).filter((c) => c.length >= 3 && Math.abs(area(c)) > 0.01);
    // Nesting decides outer and hole; each outer contour becomes one plate carrying its holes.
    const depth = contours.map((c, a) => contours.filter((o, b) => b !== a && Math.abs(area(o)) > Math.abs(area(c)) && inPolygons(c[0], [o])).length);
    const plates = [];
    contours.forEach((c, a) => {
      if (depth[a] % 2) return;
      const outer = area(c) > 0 ? c : [...c].reverse();
      const holes = contours.filter((h, b) => depth[b] === depth[a] + 1 && inPolygons(h[0], [c])).map((h) => (area(h) < 0 ? h : [...h].reverse()));
      plates.push({ d: [outer, ...holes].map((p) => polyToD(p, true)).join(''), w: 0, t: job.t, s: job.s, o: job.o });
    });
    job.plates = plates;
  });
}

const rows = ICONS.map((ic) => `  ${JSON.stringify(ic.name)}: [\n${glyphs[ic.name].flatMap((p) => ('job' in p ? plateJobs[p.job].plates : [p])).map((p) => `    [${JSON.stringify(p.d)}, ${p.w}, ${p.t}, ${p.s}, ${p.o}]`).join(',\n')},\n  ],`);
emit('packages/metalui/src/icons/morph.generated.ts', `// Generated by scripts/build-morph.mjs from icons/src/icons.mjs. Do not edit.
// Each glyph at rest as morphable parts: [path, weight, tint, solid, opacity].
//   path    one wire (open, or closed with Z), a bead (a lone point), or a plate (outer + holes)
//   weight  wire width in 24u; a bead's diameter; 0 for a plate
//   tint    duotone fill opacity (scaled by the colorway's --mu-duo-k); solid is 1 for solid fills
import type { IconName } from './catalog.generated';

export type MorphPartSource = readonly [path: string, weight: number, tint: number, solid: number, opacity: number];

export const MORPH_PARTS: Record<IconName, readonly MorphPartSource[]> = {
${rows.join('\n')}
};
`);
finish(`morph geometry (${ICONS.length})`);
