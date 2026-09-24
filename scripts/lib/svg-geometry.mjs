// SVG geometry: parse a static icon, bake transforms, and reduce every shape to absolute
// M/L/C/Z commands. Ported from the Kamui SF Symbols exporter
// (kamui/design/soft-hardware/icons/src/symbols.mjs), so both exports read glyphs the same way.
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

export { parseSvg, I, mul, ap, parseTransform, arcToCubics, parsePathData, shapeData, transformData, scaleOf };
