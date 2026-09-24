// An authored icon → its morph parts (the rows of morph.generated.ts). Used by scripts/build-morph.mjs
// for the set and by scripts/morph-strain.mjs for proposals, so both read a glyph the same way.
//
// Every Soft Hardware glyph is made of three things, and the morph is invented from them:
//   wire   a centerline drawn at the set's weight with round caps; open or closed; a closed
//          (or chord-closed) wire can hold a duotone tint
//   bead   a solid dot: a wire of zero length, drawn at the dot's diameter
//   plate  a filled body with no wire: tinted or solid, possibly with holes
// and of the depth between them (docs/MORPH.md, C9):
//   behind a part is hidden where it falls within another part's ink widened by a clearance r
//   inside a part is visible only within a frame's body narrowed by r
// The authored masks and clips are read back into those relations, so the runtime draws a
// clearance live and it travels with the object that casts it. A mask that is not a part's
// clearance (or a knockout wholly inside a plate, which becomes a hole) fails the build.
// Dashed wires become their visible runs. Geometry comes from the same static bake as the SVG
// export, so every glyph at rest is the icon.
import { staticSvg, SW } from './static-svg.mjs';
import { ap, I, mul, parseSvg, parseTransform, scaleOf, shapeData, transformData } from './svg-geometry.mjs';

const BEAD_MAX_R = 2.2; // solid circles up to this radius are beads, larger ones are plates
const DENSE = 0.02;     // sampling step (24u) for cutting dashed wires
const SIMPLIFY = 0.008; // polyline tolerance (24u) for cut runs
const PROBE = 0.05;     // sampling step for reading a mask back into a clearance
const R_STEP = 0.05, R_MAX = 3; // clearances tried, in 24u
const EDGE = 0.06;      // samples this close to a mask edge do not vote

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
  const seg = (n0, at) => {
    const n = Math.max(1, Math.ceil(n0 / step));
    for (let i = 1; i <= n; i++) pts.push(at(i / n));
  };
  for (const c of sub.cmds.slice(1)) {
    if (c[0] === 'L') {
      const [x0, y0] = [x, y], [x1, y1] = [c[1], c[2]];
      seg(Math.hypot(x1 - x0, y1 - y0), (t) => [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t]);
      [x, y] = [x1, y1];
    } else if (c[0] === 'C') {
      const p = [[x, y], [c[1], c[2]], [c[3], c[4]], [c[5], c[6]]];
      const hull = Math.hypot(p[1][0] - p[0][0], p[1][1] - p[0][1]) + Math.hypot(p[2][0] - p[1][0], p[2][1] - p[1][1]) + Math.hypot(p[3][0] - p[2][0], p[3][1] - p[2][1]);
      seg(hull, (t) => {
        const u = 1 - t, a = u * u * u, b = 3 * u * u * t, cc = 3 * u * t * t, d = t * t * t;
        return [a * p[0][0] + b * p[1][0] + cc * p[2][0] + d * p[3][0], a * p[0][1] + b * p[1][1] + cc * p[2][1] + d * p[3][1]];
      });
      [x, y] = [c[5], c[6]];
    }
  }
  if (sub.closed) {
    const [x0, y0] = [x, y], [x1, y1] = pts[0];
    const L = Math.hypot(x1 - x0, y1 - y0);
    if (L > 1e-6) seg(L, (t) => [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t]);
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
/** Distance from a point to a polyline (or a lone point). */
function distToLine(pt, line) {
  let best = Infinity;
  if (line.length === 1) return Math.hypot(pt[0] - line[0][0], pt[1] - line[0][1]);
  for (let i = 1; i < line.length; i++) {
    const [ax, ay] = line[i - 1], [bx, by] = line[i];
    const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy;
    const t = L2 ? Math.max(0, Math.min(1, ((pt[0] - ax) * dx + (pt[1] - ay) * dy) / L2)) : 0;
    const d = Math.hypot(pt[0] - (ax + dx * t), pt[1] - (ay + dy * t));
    if (d < best) best = d;
  }
  return best;
}
const bbox = (pts) => pts.reduce((b, p) => [Math.min(b[0], p[0]), Math.min(b[1], p[1]), Math.max(b[2], p[0]), Math.max(b[3], p[1])], [Infinity, Infinity, -Infinity, -Infinity]);
const sameCmds = (a, b) => a.length === b.length && a.every((c, i) => c[0] === b[i][0] && c.every((v, k) => k === 0 || Math.abs(v - b[i][k]) < 0.02));

// ---------- the glyph → items ----------
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
      for (const [attr, op] of [['mask', 'behind'], ['clip-path', 'inside']]) {
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

// ---------- items → parts ----------
/** A part's probe geometry: its outline polygon(s) when closed, and its centerline samples. */
function probeOf(cmds, bead) {
  if (bead) return { outer: null, line: [[cmds[0][1], cmds[0][2]]] };
  const subs = subpaths(cmds).map((s) => ({ pts: dense(s, PROBE), closed: s.closed }));
  return { outer: subs[0].closed ? subs.map((s) => s.pts) : null, line: subs[0].pts };
}

function partsOf(it) {
  const { node, st, cm } = it;
  const o = +(st.opacity ?? 1);
  const fill = !isNone(st.fill), stroke = !isNone(st.stroke);
  const fo = +(st['fill-opacity'] ?? 1);
  const tint = fill && fo < 1 ? fo : 0, solid = fill && fo >= 1 ? 1 : 0;
  const w = stroke ? +(st['stroke-width'] ?? SW) * scaleOf(cm) : 0;
  if (node.tag === 'circle' && solid && !stroke && +node.attrs.r * scaleOf(cm) <= BEAD_MAX_R) {
    const [cx, cy] = ap(cm, +node.attrs.cx, +node.attrs.cy), r = +node.attrs.r * scaleOf(cm);
    const cmds = [['M', cx, cy]];
    return [{ cmds, d: `M${fmt(cx)} ${fmt(cy)}`, w: r2(2 * r), t: 0, s: 0, o, bead: true, probe: probeOf(cmds, true) }];
  }
  const subs = subpaths(it.d);
  if (!stroke) {
    // A plate: one outer contour with its holes (every further subpath).
    const cmds = subs.flatMap((s) => [...s.cmds, ['Z']]);
    return [{ cmds, d: subs.map((s) => cmdsToD(s.cmds) + 'Z').join(''), w: 0, t: tint, s: solid, o, plate: true, probe: probeOf(cmds, false) }];
  }
  const dash = st['stroke-dasharray'] && st['stroke-dasharray'] !== 'none' ? st['stroke-dasharray'].split(/[\s,]+/).map(Number) : null;
  const pathLength = node.attrs.pathLength ? +node.attrs.pathLength : null;
  const parts = [];
  for (const sub of subs) {
    const runs = dash ? cutDash(sub, dash, pathLength) : null;
    if (!runs) {
      const cmds = [...sub.cmds, ...(sub.closed ? [['Z']] : [])];
      parts.push({ cmds, d: cmdsToD(sub.cmds) + (sub.closed ? 'Z' : ''), w: r2(w), t: tint, s: solid, o, probe: probeOf(cmds, false) });
    } else {
      for (const run of runs) {
        const cmds = run.map((p, i) => [i ? 'L' : 'M', p[0], p[1]]);
        parts.push({ cmds, d: polyToD(run, false), w: r2(w), t: tint, s: solid, o, probe: probeOf(cmds, false) });
      }
    }
  }
  return parts;
}

// ---------- masks → relations ----------
/** Sample points of a part that vote on what a mask hides: its line, and a grid over a plate. */
function samplesOf(part) {
  const pts = [...part.probe.line];
  if (part.plate) {
    const [x0, y0, x1, y1] = bbox(part.probe.line);
    for (let y = y0; y <= y1; y += 0.4) for (let x = x0; x <= x1; x += 0.4) if (inPolygons([x, y], part.probe.outer)) pts.push([x, y]);
  }
  return pts;
}
/** How a mask shape covers a point: true (painted), false, or null on the edge (no vote). */
function shapeCovers(shape, pt) {
  const polys = (shape.polys ??= subpaths(shape.d).map((s) => dense(s, PROBE)));
  if (shape.stroke == null) {
    const near = polys.some((p) => distToLine(pt, [...p, p[0]]) < EDGE);
    return near ? null : inPolygons(pt, polys);
  }
  const d = Math.min(...polys.map((p) => distToLine(pt, p)));
  return Math.abs(d - shape.stroke / 2) < EDGE ? null : d <= shape.stroke / 2;
}
/** Whether a closed part's ink widened by r covers a point; `inside`: its body narrowed by r. */
function partCovers(part, r, pt, inside) {
  const within = inPolygons(pt, part.probe.outer), d = distToLine(pt, part.probe.line);
  return inside ? within && d >= r : within || d <= r;
}

/** Reads one mask shape on a part back into a relation (or a hole), or throws. */
function readMask(icon, part, partIndex, parts, shape, op) {
  const others = parts.map((p, i) => ({ p, i })).filter(({ i }) => i !== partIndex);
  const bare = (cmds) => cmds.filter((c) => c[0] !== 'Z');
  // Direct: the mask is another part's own drawing, so the clearance is the mask's stroke.
  const direct = others.find(({ p }) => !p.bead && sameCmds(bare(p.cmds), bare(shape.d)));
  if (direct && op === 'behind') return { rel: [op, direct.i, r2((shape.stroke ?? 0) / 2)] };
  // A knockout drawn wholly inside a plate is a hole in it.
  if (op === 'behind' && shape.stroke == null && part.plate) {
    const polys = subpaths(shape.d).map((s) => dense(s, PROBE));
    if (polys.flat().every((q) => inPolygons(q, part.probe.outer))) return { hole: subpaths(shape.d) };
  }
  // Inferred: the smallest clearance of a closed part that hides (or shows) exactly what the mask does.
  const voters = samplesOf(part).map((q) => [q, shapeCovers(shape, q)]).filter(([, v]) => v != null);
  const slack = Math.max(1, Math.ceil(voters.length * 0.003));
  // Every clearance that reproduces the mask passes; the relation takes the middle of that range.
  let best = null;
  for (const { p, i } of others) {
    if (!p.probe.outer) continue;
    const passing = [];
    for (let r = 0; r <= R_MAX + 1e-9; r += R_STEP) {
      let miss = 0;
      for (const [q, v] of voters) if (partCovers(p, r, q, op === 'inside') !== v) { if (++miss > slack) break; }
      if (miss <= slack) passing.push(r);
    }
    if (!passing.length || (best && passing[0] >= best.lo)) continue;
    // An open-ended range (the mask never reaches this part's edge) assumes the least: its lower bound.
    const hi = passing[passing.length - 1];
    best = { i, lo: passing[0], r: r2(hi >= R_MAX - 1e-9 ? passing[0] : (passing[0] + hi) / 2) };
  }
  if (!best) throw new Error(`${icon}: a mask on part ${partIndex} is not another part's clearance, a window, or a knockout inside a plate (docs/MORPH.md, C9).`);
  return { rel: [op, best.i, best.r] };
}

// ---------- the morph family ----------
/** A glyph belongs to the morph family when it is wire-based. A glyph with a solid plate (a filled
 *  body with no wire: a character, a mascot) belongs to a different system and never morphs; a
 *  control switches to or from it by the drum (T1, SwapIcon). docs/ICON-GRAMMAR.md, K0. */
export const isMorphable = (rows) => !rows.some((r) => r[1] === 0 && r[3] === 1);

// ---------- an icon → its rows ----------
/** The morph parts of one authored icon: [path, weight, tint, solid, opacity, relations?] rows. */
export function glyphParts(ic) {
  const items = collect(staticSvg(ic));
  const parts = [], owner = [];
  items.forEach((it, k) => { for (const p of partsOf(it)) { parts.push(p); owner.push(k); } });
  parts.forEach((part, pi) => {
    const rels = new Map();
    for (const m of items[owner[pi]].masks) {
      for (const shape of m.shapes) {
        const read = readMask(ic.name, part, pi, parts, shape, m.op);
        if (read.hole) { part.d += read.hole.map((s) => cmdsToD(s.cmds) + 'Z').join(''); continue; }
        const [op, i, r] = read.rel, key = `${op}${i}`;
        rels.set(key, [op, i, Math.max(r, rels.get(key)?.[2] ?? 0)]);
      }
    }
    part.rels = [...rels.values()];
  });
  return parts.map((p) => (p.rels.length ? [p.d, p.w, p.t, p.s, p.o, p.rels] : [p.d, p.w, p.t, p.s, p.o]));
}
