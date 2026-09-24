// Geometry helpers for the MetalUI life set (imported from Kamui design/medium-icons/src/geo.mjs) (24-unit grid).
export const f = (n) => +(+n).toFixed(2);
const rad = (d) => (d * Math.PI) / 180;

// point on circle; angle in degrees, 0 = +x, positive = counter-clockwise on screen (math convention)
export const pol = (cx, cy, r, deg) => [f(cx + r * Math.cos(rad(deg))), f(cy - r * Math.sin(rad(deg)))];

// sampled arc (math angles, a0 -> a1) as "L x y" segments
function arcPts(cx, cy, r, a0, a1, n) {
  const out = [];
  for (let i = 0; i <= n; i++) out.push(pol(cx, cy, r, a0 + ((a1 - a0) * i) / n));
  return out;
}
const toD = (pts, close = true) => pts.map((p, i) => (i ? 'L' : 'M') + p[0] + ' ' + p[1]).join('') + (close ? 'Z' : '');

// circle/circle intersection angles (about circle 1 and circle 2)
function inter(c1, c2) {
  const [x1, y1, r1] = c1, [x2, y2, r2] = c2;
  const dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy);
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, r1 * r1 - a * a));
  const mx = x1 + (a * dx) / d, my = y1 + (a * dy) / d;
  const P = [mx + (h * dy) / d, my - (h * dx) / d], Q = [mx - (h * dy) / d, my + (h * dx) / d];
  const ang = (c, p) => (Math.atan2(-(p[1] - c[1]), p[0] - c[0]) * 180) / Math.PI;
  return { P, Q, a1P: ang(c1, P), a1Q: ang(c1, Q), a2P: ang(c2, P), a2Q: ang(c2, Q) };
}
const norm = (a) => ((a % 360) + 360) % 360;

// Crescent = circle c1 minus circle c2 (smooth, sampled). Outer arc goes the long way (away from c2).
export function crescent(c1, c2, n = 40) {
  const I = inter(c1, c2);
  const toC2 = (Math.atan2(-(c2[1] - c1[1]), c2[0] - c1[0]) * 180) / Math.PI;
  // outer arc: from P to Q the way that avoids toC2
  let s = I.a1P, e = I.a1Q;
  let span = norm(e - s); // ccw span P->Q
  const mid = s + span / 2;
  if (Math.abs(((norm(mid - toC2) + 180) % 360) - 180) < 90) span = span - 360; // go cw instead
  const outer = arcPts(c1[0], c1[1], c1[2], s, s + span, n);
  // inner arc on c2 from Q back to P, the way that lies inside c1 (toward c1)
  const toC1 = (Math.atan2(-(c1[1] - c2[1]), c1[0] - c2[0]) * 180) / Math.PI;
  let s2 = I.a2Q, span2 = norm(I.a2P - s2);
  const mid2 = s2 + span2 / 2;
  if (Math.abs(((norm(mid2 - toC1) + 180) % 360) - 180) > 90) span2 = span2 - 360;
  const inner = arcPts(c2[0], c2[1], c2[2], s2, s2 + span2, Math.round(n * 0.7));
  return toD([...outer, ...inner.slice(1, -1)]);
}

// four-point sparkle (concave star), solid
export const sparkle = (cx, cy, r, k = 0.18) => {
  const q = r * k;
  return `M${f(cx)} ${f(cy - r)}C${f(cx + q)} ${f(cy - q)} ${f(cx + q)} ${f(cy - q)} ${f(cx + r)} ${f(cy)}C${f(cx + q)} ${f(cy + q)} ${f(cx + q)} ${f(cy + q)} ${f(cx)} ${f(cy + r)}C${f(cx - q)} ${f(cy + q)} ${f(cx - q)} ${f(cy + q)} ${f(cx - r)} ${f(cy)}C${f(cx - q)} ${f(cy - q)} ${f(cx - q)} ${f(cy - q)} ${f(cx)} ${f(cy - r)}Z`;
};

// radial rays
export const rays = (cx, cy, r0, r1, n, off = 0) =>
  Array.from({ length: n }, (_, i) => {
    const a = off + (360 / n) * i, p = pol(cx, cy, r0, a), q = pol(cx, cy, r1, a);
    return `M${p[0]} ${p[1]}L${q[0]} ${q[1]}`;
  }).join('');

// snowflake: 3 axes + chevrons
export function snowflake(cx, cy, R, b, bl) {
  let d = '';
  for (let i = 0; i < 6; i++) {
    const a = 90 + i * 60;
    const e = pol(cx, cy, R, a);
    if (i < 3) { const o = pol(cx, cy, R, a + 180); d += `M${o[0]} ${o[1]}L${e[0]} ${e[1]}`; }
    const m = pol(cx, cy, b, a), l = pol(m[0], m[1], bl, a + 135), r = pol(m[0], m[1], bl, a - 135);
    d += `M${l[0]} ${l[1]}L${m[0]} ${m[1]}L${r[0]} ${r[1]}`;
  }
  return d;
}

// sine-ish wave as cubic segments: from x0, baseline y, half-period w, amplitude a, count halves
export function wave(x0, y, w, a, halves, up = true) {
  let d = `M${f(x0)} ${f(y)}`;
  for (let i = 0; i < halves; i++) {
    const s = (up ? -1 : 1) * (i % 2 ? -1 : 1) * a;
    d += `c${f(w * 0.36)} ${f(s * 1.33)} ${f(w * 0.64)} ${f(s * 1.33)} ${f(w)} 0`;
  }
  return d;
}

// zigzag polyline from x0,y: n segments of width w alternating +-a
export function zig(x0, y, w, a, n, up = true) {
  let d = `M${f(x0)} ${f(y)}`;
  for (let i = 0; i < n; i++) d += `l${f(w)} ${f((up ? -1 : 1) * (i % 2 ? -1 : 1) * a)}`;
  return d;
}

// arc path (math angles) as SVG A command, from a0 to a1 (clockwise on screen when a0 > a1)
export function arc(cx, cy, r, a0, a1) {
  const p = pol(cx, cy, r, a0), q = pol(cx, cy, r, a1);
  const span = a0 - a1; // positive => clockwise on screen
  const large = Math.abs(span) > 180 ? 1 : 0, sweep = span > 0 ? 1 : 0;
  return `M${p[0]} ${p[1]}A${r} ${r} 0 ${large} ${sweep} ${q[0]} ${q[1]}`;
}

// cookie: circle with a round bite
export function bitten(c1, c2) { return crescent(c1, c2, 56); }
