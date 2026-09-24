// SF Symbols for the product and life sets: `npm run symbols` (macOS; needs Xcode's toolchain).
// `--check` fails when an output is stale, like the other generators.
//
// Writes one variable symbol template per glyph (Ultralight-S / Regular-S / Black-S masters,
// strokes outlined) into swift/Sources/MetalUI/Resources/MetalIcons.xcassets, plus a `.16` symbol
// from the 16px-tuned bodies, and the Swift catalogs (MetalIconName, MetalLifeIconName).
// Names are mu.<name>, mu.<name>.16, mu.life.<name> and mu.life.<name>.16 (DS-37).
//
// Imported from Kamui design/soft-hardware/icons/src/symbols.mjs. Geometry comes from the same
// static bake as the SVG exports. Stroke outlining, dashing and the mask/clip booleans run through
// CoreGraphics in lib/outline.swift. CoreGraphics output has a different point structure per stroke
// width, so every contour is resampled to a fixed point count, matched across masters by centroid
// and started at the corresponding point: the masters then interpolate (actool silently drops a
// symbol whose masters are incompatible).
//
// The feelings vessel (.v) is not in the life symbols: MetalLifeIcon draws it natively, so it can
// be filled when untinted and left empty when tinted (DS-42) without a fourth symbol layer.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { ICONS } from '../packages/metalui/icons/src/icons.mjs';
import { T16 } from '../packages/metalui/icons/src/tuned16.mjs';
import { staticSvg, SW } from './lib/static-svg.mjs';
import { LIFE_GLYPHS, LIFE_T16, LIFE_TINT_OF, LIFE_SW16, lifeStaticSvg } from './lib/life-icons.mjs';
import { root, emit, finish } from './lib/emit.mjs';

const CATALOG = 'swift/Sources/MetalUI/Resources/MetalIcons.xcassets';
const SWIFT_OUT = 'swift/Sources/MetalUI/Icons/MetalIcon+Catalog.generated.swift';

// Stroke widths of the three masters, in 24u (Kamui NATIVE.md §1.2).
const MASTERS = [['Ultralight-S', 0.9], ['Regular-S', SW], ['Black-S', 3.0]];
const SW16 = 1.85;

// ---------------------------------------------------------------- SVG parse
function parseSvg(src) {
  const root = { tag: 'root', attrs: {}, children: [] };
  const stack = [root];
  for (const m of src.matchAll(/<(\/?)([\w:-]+)([^>]*?)(\/?)>/g)) {
    const [, close, tag, rawAttrs, self] = m;
    if (close) { stack.pop(); continue; }
    const attrs = {};
    for (const a of rawAttrs.matchAll(/([\w:-]+)="([^"]*)"/g)) attrs[a[1]] = a[2];
    const node = { tag, attrs, children: [] };
    stack[stack.length - 1].children.push(node);
    if (!self) stack.push(node);
  }
  return root.children[0];
}

// ---------------------------------------------------------------- affine
const I = [1, 0, 0, 1, 0, 0];
const mul = (a, b) => [
  a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1],
  a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3],
  a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5],
];
const ap = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
function parseTransform(t) {
  let m = I;
  for (const [, fn, args] of (t || '').matchAll(/(\w+)\(([^)]*)\)/g)) {
    const v = args.trim().split(/[\s,]+/).map(Number);
    let n = I;
    if (fn === 'translate') n = [1, 0, 0, 1, v[0], v[1] || 0];
    else if (fn === 'scale') n = [v[0], 0, 0, v[1] ?? v[0], 0, 0];
    else if (fn === 'matrix') n = v;
    else if (fn === 'rotate') {
      const a = (v[0] * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
      const cx = v[1] || 0, cy = v[2] || 0;
      n = mul(mul([1, 0, 0, 1, cx, cy], [c, s, -s, c, 0, 0]), [1, 0, 0, 1, -cx, -cy]);
    }
    m = mul(m, n);
  }
  return m;
}

// ---------------------------------------------------------------- path data → absolute M/L/C/Z
function arcToCubics(x1, y1, rx, ry, phi, fa, fs, x2, y2) {
  if (rx === 0 || ry === 0) return [['L', x2, y2]];
  const p = (phi * Math.PI) / 180, cp = Math.cos(p), sp = Math.sin(p);
  const dx = (x1 - x2) / 2, dy = (y1 - y2) / 2;
  const x1p = cp * dx + sp * dy, y1p = -sp * dx + cp * dy;
  rx = Math.abs(rx); ry = Math.abs(ry);
  const lam = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lam > 1) { rx *= Math.sqrt(lam); ry *= Math.sqrt(lam); }
  const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
  const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
  let co = Math.sqrt(Math.max(0, num / den));
  if (fa === fs) co = -co;
  const cxp = (co * rx * y1p) / ry, cyp = (-co * ry * x1p) / rx;
  const cx = cp * cxp - sp * cyp + (x1 + x2) / 2, cy = sp * cxp + cp * cyp + (y1 + y2) / 2;
  const ang = (ux, uy, vx, vy) => {
    const a = Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
    return a;
  };
  const t1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let dt = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
  if (!fs && dt > 0) dt -= 2 * Math.PI;
  if (fs && dt < 0) dt += 2 * Math.PI;
  const segs = Math.max(1, Math.ceil(Math.abs(dt) / (Math.PI / 2) - 1e-9));
  const d = dt / segs, k = (4 / 3) * Math.tan(d / 4);
  const out = [];
  const pt = (t) => [cx + rx * Math.cos(t) * cp - ry * Math.sin(t) * sp, cy + rx * Math.cos(t) * sp + ry * Math.sin(t) * cp];
  const dv = (t) => [-rx * Math.sin(t) * cp - ry * Math.cos(t) * sp, -rx * Math.sin(t) * sp + ry * Math.cos(t) * cp];
  for (let i = 0; i < segs; i++) {
    const a = t1 + i * d, b = a + d;
    const [ax, ay] = pt(a), [bx, by] = pt(b), [adx, ady] = dv(a), [bdx, bdy] = dv(b);
    out.push(['C', ax + k * adx, ay + k * ady, bx - k * bdx, by - k * bdy, bx, by]);
  }
  out[out.length - 1][5] = x2; out[out.length - 1][6] = y2;
  return out;
}

function parsePathData(d) {
  const toks = d.match(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g) || [];
  const out = [];
  let i = 0, cmd = '', x = 0, y = 0, sx = 0, sy = 0, lcx = null, lcy = null, lqx = null, lqy = null;
  const num = () => +toks[i++];
  const flag = () => {
    // arc flags may be packed ("01"); the tokenizer splits "01" as one number
    const t = toks[i];
    if (t.length > 1 && /^[01]/.test(t) && !t.includes('.')) { toks[i] = t.slice(1); return +t[0]; }
    i++; return +t;
  };
  while (i < toks.length) {
    if (/[a-zA-Z]/.test(toks[i])) cmd = toks[i++];
    const rel = cmd === cmd.toLowerCase(), c = cmd.toUpperCase();
    const ox = rel ? x : 0, oy = rel ? y : 0;
    if (c !== 'C' && c !== 'S') { lcx = lcy = null; }
    if (c !== 'Q' && c !== 'T') { lqx = lqy = null; }
    switch (c) {
      case 'M': x = ox + num(); y = oy + num(); sx = x; sy = y; out.push(['M', x, y]); cmd = rel ? 'l' : 'L'; break;
      case 'L': x = ox + num(); y = oy + num(); out.push(['L', x, y]); break;
      case 'H': x = (rel ? x : 0) + num(); out.push(['L', x, y]); break;
      case 'V': y = (rel ? y : 0) + num(); out.push(['L', x, y]); break;
      case 'C': {
        const a = [ox + num(), oy + num(), ox + num(), oy + num(), ox + num(), oy + num()];
        out.push(['C', ...a]); lcx = a[2]; lcy = a[3]; x = a[4]; y = a[5]; break;
      }
      case 'S': {
        const c1x = lcx == null ? x : 2 * x - lcx, c1y = lcy == null ? y : 2 * y - lcy;
        const a = [ox + num(), oy + num(), ox + num(), oy + num()];
        out.push(['C', c1x, c1y, ...a]); lcx = a[0]; lcy = a[1]; x = a[2]; y = a[3]; break;
      }
      case 'Q': case 'T': {
        let qx, qy;
        if (c === 'Q') { qx = ox + num(); qy = oy + num(); } else { qx = lqx == null ? x : 2 * x - lqx; qy = lqy == null ? y : 2 * y - lqy; }
        const ex = ox + num(), ey = oy + num();
        out.push(['C', x + (2 / 3) * (qx - x), y + (2 / 3) * (qy - y), ex + (2 / 3) * (qx - ex), ey + (2 / 3) * (qy - ey), ex, ey]);
        lqx = qx; lqy = qy; x = ex; y = ey; break;
      }
      case 'A': {
        const rx = num(), ry = num(), phi = num(), fa = flag(), fs = flag();
        const ex = ox + num(), ey = oy + num();
        out.push(...arcToCubics(x, y, rx, ry, phi, fa, fs, ex, ey)); x = ex; y = ey; break;
      }
      case 'Z': out.push(['Z']); x = sx; y = sy; cmd = ''; break;
      default: throw new Error(`path command ${cmd} in ${d}`);
    }
    if (c === 'Z' && i < toks.length && !/[a-zA-Z]/.test(toks[i])) throw new Error('numbers after Z');
  }
  return out;
}

// SVG basic shapes, in the same start point / direction a browser uses
// (dash patterns depend on it).
function shapeData(n) {
  const a = n.attrs, v = (k, d = 0) => (a[k] == null ? d : +a[k]);
  switch (n.tag) {
    case 'path': return parsePathData(a.d);
    case 'circle': case 'ellipse': {
      const cx = v('cx'), cy = v('cy'), rx = n.tag === 'circle' ? v('r') : v('rx'), ry = n.tag === 'circle' ? v('r') : v('ry');
      return [['M', cx + rx, cy], ...arcToCubics(cx + rx, cy, rx, ry, 0, 0, 1, cx - rx, cy), ...arcToCubics(cx - rx, cy, rx, ry, 0, 0, 1, cx + rx, cy), ['Z']];
    }
    case 'rect': {
      const x = v('x'), y = v('y'), w = v('width'), h = v('height');
      let rx = a.rx != null ? v('rx') : v('ry'), ry = a.ry != null ? v('ry') : rx;
      rx = Math.min(rx, w / 2); ry = Math.min(ry, h / 2);
      if (!rx) return [['M', x, y], ['L', x + w, y], ['L', x + w, y + h], ['L', x, y + h], ['Z']];
      return [
        ['M', x + rx, y], ['L', x + w - rx, y], ...arcToCubics(x + w - rx, y, rx, ry, 0, 0, 1, x + w, y + ry),
        ['L', x + w, y + h - ry], ...arcToCubics(x + w, y + h - ry, rx, ry, 0, 0, 1, x + w - rx, y + h),
        ['L', x + rx, y + h], ...arcToCubics(x + rx, y + h, rx, ry, 0, 0, 1, x, y + h - ry),
        ['L', x, y + ry], ...arcToCubics(x, y + ry, rx, ry, 0, 0, 1, x + rx, y), ['Z'],
      ];
    }
    case 'line': return [['M', v('x1'), v('y1')], ['L', v('x2'), v('y2')]];
    default: return null;
  }
}
const transformData = (d, m) => d.map((c) => {
  if (c[0] === 'Z') return c;
  const o = [c[0]];
  for (let k = 1; k < c.length; k += 2) o.push(...ap(m, c[k], c[k + 1]).map((q) => +q.toFixed(5)));
  return o;
});
const scaleOf = (m) => Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2]));

// ---------------------------------------------------------------- SVG → outline jobs
const INHERIT = ['fill', 'fill-opacity', 'stroke', 'stroke-width', 'opacity', 'stroke-dasharray'];
const isNone = (p) => p == null || p === 'none';
const isWhite = (p) => /^(#fff(fff)?|white)$/i.test(p || '');

function collectItems(svgSrc, maskWidth) {
  const svg = parseSvg(svgSrc);
  const defs = {};
  (function findDefs(n) { for (const c of n.children) { if ((c.tag === 'mask' || c.tag === 'clipPath') && c.attrs.id) defs[c.attrs.id] = c; findDefs(c); } })(svg);

  // Mask/clip content → shapes to subtract / intersect, in the referencing user space.
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
        if (!isNone(st.stroke) && !isWhite(st.stroke)) shapes.push({ d: td, stroke: maskWidth(+(st['stroke-width'] ?? SW)) * scaleOf(cm) });
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
      const td = transformData(d, cm);
      const dim = +(st.opacity ?? 1) < 1;
      if (!isNone(st.fill)) {
        const duo = +(st['fill-opacity'] ?? 1) < 1;
        items.push({ layer: duo ? 'secondary' : dim ? 'tertiary' : 'primary', shape: { d: td, stroke: null }, masks: ms, duo: duo ? +st['fill-opacity'] : null, dim: dim ? +st.opacity : null });
      }
      if (!isNone(st.stroke)) {
        const dash = st['stroke-dasharray'] ? st['stroke-dasharray'].split(/[\s,]+/).map(Number) : null;
        items.push({ layer: dim ? 'tertiary' : 'primary', shape: { d: td, stroke: +st['stroke-width'] * scaleOf(cm), dash, pathLength: c.attrs.pathLength ? +c.attrs.pathLength : null }, masks: ms, dim: dim ? +st.opacity : null });
      }
    }
  })(svg, { fill: svg.attrs.fill, stroke: svg.attrs.stroke, 'stroke-width': svg.attrs['stroke-width'] }, I, []);
  return items;
}

// ---------------------------------------------------------------- contour matching + resampling
const area = (pts) => { let a = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; a += p[0] * q[1] - q[0] * p[1]; } return a / 2; };
const centroid = (pts) => { const s = pts.reduce((o, p) => [o[0] + p[0], o[1] + p[1]], [0, 0]); return [s[0] / pts.length, s[1] / pts.length]; };
const perimeter = (pts) => pts.reduce((l, p, i) => { const q = pts[(i + 1) % pts.length]; return l + Math.hypot(q[0] - p[0], q[1] - p[1]); }, 0);
function inside(pt, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
function clean(contours) {
  // drop slivers, dedupe consecutive points, orient by nesting depth
  const cs = contours.map((pts) => pts.filter((p, i) => { const q = pts[(i + 1) % pts.length]; return Math.hypot(q[0] - p[0], q[1] - p[1]) > 1e-4; }))
    .filter((pts) => pts.length >= 3 && Math.abs(area(pts)) > 0.004);
  return cs.map((pts, i) => {
    const probe = pts[0];
    const depth = cs.reduce((k, other, j) => k + (j !== i && Math.abs(area(other)) > Math.abs(area(pts)) && inside(probe, other) ? 1 : 0), 0);
    const want = depth % 2 === 0 ? 1 : -1; // outer contours positive (clockwise on screen), holes negative
    return Math.sign(area(pts)) === want ? pts : [...pts].reverse();
  });
}
function resample(pts, n, start) {
  let si = 0, best = Infinity;
  pts.forEach((p, i) => { const d = Math.hypot(p[0] - start[0], p[1] - start[1]); if (d < best) { best = d; si = i; } });
  const ring = [...pts.slice(si), ...pts.slice(0, si)];
  ring.push(ring[0]);
  const cum = [0];
  for (let i = 1; i < ring.length; i++) cum.push(cum[i - 1] + Math.hypot(ring[i][0] - ring[i - 1][0], ring[i][1] - ring[i - 1][1]));
  const L = cum[cum.length - 1], out = [];
  let k = 0;
  for (let j = 0; j < n; j++) {
    const t = (j / n) * L;
    while (k < cum.length - 2 && cum[k + 1] < t) k++;
    const seg = cum[k + 1] - cum[k] || 1, u = (t - cum[k]) / seg;
    out.push([ring[k][0] + (ring[k + 1][0] - ring[k][0]) * u, ring[k][1] + (ring[k + 1][1] - ring[k][1]) * u]);
  }
  return out;
}
/** masters: [[contour…] per master] for one layer → compatible resampled masters. */
function compatible(masters, label) {
  const [ul, reg, bl] = masters.map(clean);
  if (ul.length > reg.length || bl.length > reg.length) {
    throw new Error(`${label}: a master splits into more contours than Regular (${ul.length}/${reg.length}/${bl.length})`);
  }
  // Greedy global matching by centroid distance (same winding only). A
  // Regular contour with no partner (a counter that closes up at Black)
  // gets a zero-area stand-in at its centroid, so it shrinks away.
  const match = (others) => {
    const pairs = [];
    reg.forEach((rc, i) => others.forEach((oc, j) => {
      if (Math.sign(area(oc)) !== Math.sign(area(rc))) return;
      const a = centroid(rc), b = centroid(oc);
      pairs.push([Math.hypot(a[0] - b[0], a[1] - b[1]), i, j]);
    }));
    pairs.sort((p, q) => p[0] - q[0]);
    const out = new Array(reg.length).fill(null), used = new Set();
    for (const [, i, j] of pairs) if (!out[i] && !used.has(j)) { out[i] = others[j]; used.add(j); }
    if (used.size !== others.length) throw new Error(`${label}: unmatched contours ${JSON.stringify([reg, others].map((cs) => cs.map((c) => [centroid(c).map((q) => q.toFixed(2)), area(c).toFixed(2)])))}`);
    return out.map((oc, i) => oc ?? (() => {
      const c = centroid(reg[i]);
      return reg[i].map((p) => [c[0] + (p[0] - c[0]) * 1e-3, c[1] + (p[1] - c[1]) * 1e-3]);
    })());
  };
  const mu = match(ul), mb = match(bl);
  return reg.map((rc, i) => {
    const n = Math.min(900, Math.max(24, Math.ceil(perimeter(rc) / 0.12)));
    // start at the contour's top-most (then left-most) point; the others start at the nearest point to it
    const start = rc.reduce((b, p) => (p[1] < b[1] - 1e-6 || (Math.abs(p[1] - b[1]) < 1e-6 && p[0] < b[0]) ? p : b));
    return [resample(mu[i], n, start), resample(rc, n, start), resample(mb[i], n, start)];
  });
}

// ---------------------------------------------------------------- template
const S = 70.459 / 18; // 24u → template px: the 18u square keyline fills the S cap height
const BASE = 696;
const COLS = [300, 1200, 2100];
const tx = (col, u) => +(COLS[col] + u * S).toFixed(2);
const ty = (v) => +(BASE + (v - 21) * S).toFixed(2);
const LAYER_ORDER = ['secondary', 'tertiary', 'primary']; // back to front

function template(name, layers) {
  const present = LAYER_ORDER.filter((l) => layers[l]);
  const glyph = (col) => present.map((l, idx) => {
    // 0.1 px (≈0.026u) grid, relative moves after the first point: keeps the catalog small
    const d = layers[l].map((c) => {
      const q = c[col].map((p) => [Math.round(tx(col, p[0]) * 10), Math.round(ty(p[1]) * 10)]);
      const n = (v) => (v / 10).toString().replace(/^(-?)0\./, '$1.');
      const num = (a, b) => n(a) + (b < 0 ? n(b) : ' ' + n(b));
      return `M${num(...q[0])}` + q.slice(1).map((p, i) => `l${num(p[0] - q[i][0], p[1] - q[i][1])}`).join('') + 'Z';
    }).join('');
    return `  <path class="monochrome-${idx} multicolor-${idx}:tintColor hierarchical-${idx}:${l} SFSymbolsPreviewWireframe" d="${d}"/>`;
  }).join('\n');
  const guides = ['S', 'M', 'L'].map((sc, i) => `  <line id="Baseline-${sc}" x1="263" x2="3036" y1="${BASE + 430 * i}" y2="${BASE + 430 * i}"/>\n  <line id="Capline-${sc}" x1="263" x2="3036" y1="${(625.541 + 430 * i).toFixed(3)}" y2="${(625.541 + 430 * i).toFixed(3)}"/>`).join('\n');
  const margins = MASTERS.map(([id], col) => `  <line id="left-margin-${id}" x1="${tx(col, 0)}" x2="${tx(col, 0)}" y1="600" y2="720"/>\n  <line id="right-margin-${id}" x1="${tx(col, 24)}" x2="${tx(col, 24)}" y1="600" y2="720"/>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Generated by scripts/build-symbols.mjs from packages/metalui/icons/src. Do not edit. -->
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="3300" height="2200">
<g id="Notes">
  <text id="template-version" x="263" y="100">Template v.3.0</text>
  <text id="descriptive-name" x="263" y="140">${name}</text>
</g>
<g id="Guides">
${guides}
${margins}
</g>
<g id="Symbols">
${MASTERS.map(([id], col) => `<g id="${id}">\n${glyph(col)}\n</g>`).join('\n')}
</g>
</svg>
`;
}

// ---------------------------------------------------------------- run
const hasVessel = (g) => /class="v /.test(g.body);
const variants = [];
for (const ic of ICONS) {
  const t = T16[ic.name];
  variants.push({ symbol: `mu.${ic.name}`, base: SW, svg: (sw) => staticSvg(ic, sw, ic.body) });
  variants.push({ symbol: `mu.${ic.name}.16`, base: t?.sw ?? SW16, svg: (sw) => staticSvg(ic, sw, t?.body ?? ic.body) });
}
for (const g of LIFE_GLYPHS) {
  const t = LIFE_T16[g.name];
  const drop = hasVessel(g) ? ['v'] : [];
  variants.push({ symbol: `mu.life.${g.name}`, base: SW, svg: (sw) => lifeStaticSvg(g, sw, g.body, drop) });
  variants.push({ symbol: `mu.life.${g.name}.16`, base: t?.sw ?? LIFE_SW16, svg: (sw) => lifeStaticSvg(g, sw, t?.body ?? g.body, drop) });
}
// Knockout strokes inside masks (air gaps) can cut an outline into more pieces at heavy weights.
// Each non-Regular master is baked with three gap policies; assembly takes the first one whose
// topology matches Regular.
const GAP_MODES = {
  scaled: (k, d) => (w) => w * k, // air gap scales with the stroke
  air: (k, d) => (w) => w + d,    // air gap stays constant
  fixed: () => (w) => w,          // knockout stays at its Regular width
};
const jobs = [];
const meta = {};
for (const v of variants) {
  MASTERS.forEach(([, w], col) => {
    const sw = (w / SW) * v.base;
    for (const [mode, gap] of Object.entries(GAP_MODES)) {
      if (col === 1 && mode !== 'scaled') continue;
      const items = collectItems(v.svg(sw), gap(sw / v.base, sw - v.base));
      if (col === 1) {
        meta[v.symbol] = {
          duos: items.filter((i) => i.layer === 'secondary').map((i) => i.duo ?? 0),
          duo: Math.max(0, ...items.map((i) => i.duo ?? 0)) || null,
          dim: Math.max(0, ...items.map((i) => i.dim ?? 0)) || null,
        };
      }
      if (mode !== 'scaled' && !items.some((i) => i.masks.length)) continue;
      jobs.push({ id: `${v.symbol}|${col}|${mode}`, items: items.map(({ layer, shape, masks }) => ({ layer, shape, masks })) });
    }
  });
}
const res = spawnSync('xcrun', ['swift', root('scripts/lib/outline.swift')], { input: JSON.stringify({ jobs }), maxBuffer: 1 << 30 });
if (res.status !== 0) { console.error(res.stderr.toString()); process.exit(1); }
const byId = Object.fromEntries(JSON.parse(res.stdout.toString()).jobs.map((j) => [j.id, j.layers]));

const expected = new Set(['Contents.json']);
const frozen = [];
emit(`${CATALOG}/Contents.json`, JSON.stringify({ info: { author: 'xcode', version: 1 } }, null, 2) + '\n');
for (const v of variants) {
  const bake = (col, mode) => byId[`${v.symbol}|${col}|${mode}`];
  const reg = bake(1, 'scaled');
  // A symbol has one secondary opacity, but a glyph's duotone parts can differ (breakfast's white
  // .06 around a .4 yolk). The secondary layer takes the area-weighted mean, so the fill reads as
  // the glyph's overall tone instead of its most saturated part.
  const sec = reg.secondary ?? [];
  const areas = sec.map((contours) => contours.reduce((a, c) => a + Math.abs(area(c)), 0));
  const total = areas.reduce((a, b) => a + b, 0);
  if (total > 0) meta[v.symbol].duo = +(areas.reduce((a, w, i) => a + w * meta[v.symbol].duos[i], 0) / total).toFixed(3);
  const layers = {};
  for (const l of LAYER_ORDER) {
    if (!reg[l]) continue;
    layers[l] = reg[l].flatMap((regItem, k) => {
      const pick = (col) => {
        for (const mode of Object.keys(GAP_MODES)) {
          const item = bake(col, mode)?.[l]?.[k];
          if (item && clean(item).length <= clean(regItem).length) return item;
        }
        if (!process.argv.includes('--check')) console.warn(`${v.symbol}/${l}#${k}: master ${MASTERS[col][0]} keeps Regular geometry (topology differs)`);
        return regItem;
      };
      try {
        return compatible([pick(0), regItem, pick(2)], `${v.symbol}/${l}#${k}`);
      } catch {
        // The heavy or light master changes this part's topology beyond matching (contours merge
        // or flip winding). The part keeps its Regular geometry in every master, so the symbol
        // still compiles; only this part stops following the weight.
        frozen.push(`${v.symbol}/${l}#${k}`);
        return compatible([regItem, regItem, regItem], `${v.symbol}/${l}#${k}`);
      }
    });
  }
  expected.add(`${v.symbol}.symbolset`);
  emit(`${CATALOG}/${v.symbol}.symbolset/${v.symbol}.svg`, template(v.symbol, layers));
  emit(`${CATALOG}/${v.symbol}.symbolset/Contents.json`, JSON.stringify({ info: { author: 'xcode', version: 1 }, symbols: [{ filename: `${v.symbol}.svg`, idiom: 'universal' }] }, null, 2) + '\n');
}
// A symbol set with no source is stale output.
if (existsSync(root(CATALOG))) {
  const extra = readdirSync(root(CATALOG)).filter((f) => !expected.has(f));
  if (extra.length) { console.error(`stale symbol sets (delete them): ${extra.join(', ')}`); process.exit(1); }
}

// ---------------------------------------------------------------- Swift catalogs
const camel = (s) => s.replace(/-(\w)/g, (_, c) => c.toUpperCase());
const esc = (s) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
const TUNED_SW = (name) => T16[name]?.sw ?? SW16;
const swift = `// Generated by scripts/build-symbols.mjs from icons/src/icons.mjs and icons/src/life.mjs. Do not edit.

/// The product glyphs. Each case is a custom SF Symbol \`mu.<name>\` in MetalIcons.xcassets plus a
/// \`mu.<name>.16\` small cut. Draw one with \`MetalIcon\`.
public enum MetalIconName: String, CaseIterable, Sendable {
${ICONS.map((ic) => `    case ${camel(ic.name)} = "${ic.name}"`).join('\n')}

    public enum Category: String, Sendable { case tools = "Tools", actions = "Actions", status = "Status" }

    public var label: String {
        switch self {
${ICONS.map((ic) => `        case .${camel(ic.name)}: return "${esc(ic.label)}"`).join('\n')}
        }
    }

    public var category: Category {
        switch self {
${ICONS.map((ic) => `        case .${camel(ic.name)}: return .${ic.cat.toLowerCase()}`).join('\n')}
        }
    }

    /// Duotone fill opacity of the secondary layer at rest (nil: no duotone).
    public var duotoneOpacity: Double? {
        switch self {
${ICONS.map((ic) => `        case .${camel(ic.name)}: return ${meta[`mu.${ic.name}`].duo ?? 'nil'}`).join('\n')}
        }
    }

    /// Opacity of the dimmed (tertiary) layer, e.g. pin's contact shadow.
    public var dimmedOpacity: Double? {
        switch self {
${ICONS.map((ic) => `        case .${camel(ic.name)}: return ${meta[`mu.${ic.name}`].dim ?? 'nil'}`).join('\n')}
        }
    }

    /// Whether the \`.16\` cut has bespoke geometry (otherwise the master at a heavier stroke).
    public var hasTunedSmallBody: Bool {
        switch self {
${ICONS.map((ic) => `        case .${camel(ic.name)}: return ${T16[ic.name]?.body ? 'true' : 'false'}`).join('\n')}
        }
    }

    /// Regular stroke of the \`.16\` cut, in grid units.
    public var smallStrokeUnits: Double {
        switch self {
${ICONS.map((ic) => `        case .${camel(ic.name)}: return ${TUNED_SW(ic.name)}`).join('\n')}
        }
    }
}

/// The life glyphs. Each case is a custom SF Symbol \`mu.life.<name>\` plus a \`.16\` small cut.
/// Draw one with \`MetalLifeIcon\`, which adds the feelings vessel and the tint.
public enum MetalLifeIconName: String, CaseIterable, Sendable {
${LIFE_GLYPHS.map((g) => `    case ${camel(g.name)} = "${g.name}"`).join('\n')}

    public var label: String {
        switch self {
${LIFE_GLYPHS.map((g) => `        case .${camel(g.name)}: return "${esc(g.label)}"`).join('\n')}
        }
    }

    /// The category key (meals, sleep, body, feelings, work, social, places, learning, money, home, time, weather).
    public var category: String {
        switch self {
${LIFE_GLYPHS.map((g) => `        case .${camel(g.name)}: return "${g.cat}"`).join('\n')}
        }
    }

    /// The feelings family that colors the stroke, or nil for ink (tokens.json foundations.tint).
    public var tint: MetalTint? {
        switch self {
${LIFE_GLYPHS.map((g) => `        case .${camel(g.name)}: return ${LIFE_TINT_OF[g.name] ? `.${LIFE_TINT_OF[g.name]}` : 'nil'}`).join('\n')}
        }
    }

    /// Opacity of the feelings vessel (the r 9.3 disc) when untinted; nil when the glyph has none.
    public var vesselOpacity: Double? {
        switch self {
${LIFE_GLYPHS.map((g) => { const m = g.body.match(/<circle class="v d" style="--duo:([\d.]+)"/); return `        case .${camel(g.name)}: return ${m ? +m[1] : 'nil'}`; }).join('\n')}
        }
    }

    /// Duotone fill opacity of the symbol's secondary layer at rest (nil: no duotone).
    public var duotoneOpacity: Double? {
        switch self {
${LIFE_GLYPHS.map((g) => `        case .${camel(g.name)}: return ${meta[`mu.life.${g.name}`].duo ?? 'nil'}`).join('\n')}
        }
    }

    /// Opacity of the dimmed (tertiary) layer.
    public var dimmedOpacity: Double? {
        switch self {
${LIFE_GLYPHS.map((g) => `        case .${camel(g.name)}: return ${meta[`mu.life.${g.name}`].dim ?? 'nil'}`).join('\n')}
        }
    }

    /// Words and phrasings that mean this glyph.
    public var synonyms: [String] {
        switch self {
${LIFE_GLYPHS.map((g) => `        case .${camel(g.name)}: return [${(g.syn ?? []).map((w) => `"${esc(w)}"`).join(', ')}]`).join('\n')}
        }
    }
}
`;
emit(SWIFT_OUT, swift);
if (frozen.length && !process.argv.includes('--check')) console.warn(`${frozen.length} part(s) keep Regular geometry at every weight: ${frozen.join(', ')}`);
finish(`symbols (${variants.length})`);
