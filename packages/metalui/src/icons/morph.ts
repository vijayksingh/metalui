// Glyph morph: any Soft Hardware icon becomes any other, built from what the icons are made of.
//
// Every glyph is wires, beads and plates (scripts/build-morph.mjs). They are one material at
// different weights and extents, so the morph moves that material and never swaps it:
//   G1  A part becomes a part. Parts pair by how little they must travel (min-cost assignment).
//   G2  A wire keeps its weight; a bead is a wire of zero length, so a bead draws out into a
//       wire, thinning to the wire's weight, and a wire gathers back into a bead.
//   G3  A ring opens where it is nearest to the open wire it becomes, and closes the same way:
//       its two ends meet with round caps, so there is no seam. Or, when it moves less, the
//       wire is a loop pressed flat (out and back along itself) and the ring or plate presses
//       flat into it; a flat loop encloses nothing, so its tint drains on the way.
//   G4  The tint is the area a wire encloses. It fills as a loop opens and drains as it
//       flattens; its opacity moves from one glyph's duotone to the other's.
//   G5  Nothing comes from nowhere and nothing fades out. A part the next glyph lacks is
//       absorbed: it gathers into the nearest point of a wire that stays, riding along with
//       it, and ends at that wire's weight, so it disappears into it. A part the next glyph
//       gains buds from the nearest point of a wire that stays and grows out of it.
//   G6  The glyph is one object: every part moves on one spring (settle), from the same frame.
//   G7  A lone part is light: a leaving part is gathered by two thirds of the way, an arriving
//       part starts budding at one third, so the middle of a morph is never crowded.
//   G4b Solid ink is conserved: a solid spreading over more area thins in proportion.

import type { IconName } from './catalog.generated';
import { MORPH_PARTS } from './morph.generated';

export type Point = [number, number];

/** One drawable part: a wire (open or closed), a bead (all points equal) or a plate (weight 0). */
export interface MorphPart {
  points: Point[];
  closed: boolean;
  holes: Point[][];
  /** Wire width in 24u (a bead's diameter; 0 for a plate). */
  weight: number;
  /** Duotone tint, scaled by the colorway's --mu-duo-k. */
  tint: number;
  /** Solid fill (0 or 1 at rest). */
  solid: number;
  opacity: number;
  /** Indices of sharp corners in `points`, kept exactly when resampling. */
  corners: number[];
  bead: boolean;
  /** The authored path, drawn at rest instead of the flattened points. */
  path?: string;
}

/** A glyph on screen: its parts. */
export type MorphFrame = MorphPart[];

// ---------- parsing the generated geometry ----------

const CURVE_STEPS = 8;
const CORNER = Math.cos((20 * Math.PI) / 180);

function parse(d: string): { points: Point[]; closed: boolean }[] {
  const toks = d.match(/[MLCZ]|-?(?:\d*\.\d+|\d+)/g) ?? [];
  const subs: { points: Point[]; closed: boolean }[] = [];
  let i = 0;
  let cur: Point[] = [];
  const n = () => +toks[i++];
  while (i < toks.length) {
    const c = toks[i++];
    if (c === 'M') { cur = [[n(), n()]]; subs.push({ points: cur, closed: false }); }
    else if (c === 'L') cur.push([n(), n()]);
    else if (c === 'C') {
      const [x0, y0] = cur[cur.length - 1];
      const x1 = n(), y1 = n(), x2 = n(), y2 = n(), x3 = n(), y3 = n();
      for (let k = 1; k <= CURVE_STEPS; k++) {
        const t = k / CURVE_STEPS, u = 1 - t;
        const a = u * u * u, b = 3 * u * u * t, cc = 3 * u * t * t, e = t * t * t;
        cur.push([a * x0 + b * x1 + cc * x2 + e * x3, a * y0 + b * y1 + cc * y2 + e * y3]);
      }
    } else if (c === 'Z') subs[subs.length - 1].closed = true;
  }
  return subs;
}

function cornersOf(pts: Point[], closed: boolean): number[] {
  const out: number[] = [];
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    if (!closed && (i === 0 || i === n - 1)) continue;
    const a = pts[(i - 1 + n) % n], b = pts[i], c = pts[(i + 1) % n];
    const ux = b[0] - a[0], uy = b[1] - a[1], vx = c[0] - b[0], vy = c[1] - b[1];
    const lu = Math.hypot(ux, uy), lv = Math.hypot(vx, vy);
    if (lu < 1e-6 || lv < 1e-6) continue;
    if ((ux * vx + uy * vy) / (lu * lv) < CORNER) out.push(i);
  }
  return out;
}

const cache = new Map<string, MorphFrame>();

/** A glyph at rest as morphable parts. `weight` is the wire width in 24u (1.7 by default). */
export function morphParts(name: IconName, weight = 1.7): MorphFrame {
  const key = `${name}@${weight}`;
  let parts = cache.get(key);
  if (!parts) {
    parts = MORPH_PARTS[name].map(([path, w, tint, solid, opacity]) => {
      const [outer, ...holes] = parse(path);
      const bead = outer.points.length === 1;
      // Drop a closing point that repeats the start; the ring closes itself.
      const pts = outer.points;
      if (outer.closed && pts.length > 2 && Math.hypot(pts[0][0] - pts[pts.length - 1][0], pts[0][1] - pts[pts.length - 1][1]) < 1e-3) pts.pop();
      return {
        points: pts,
        closed: outer.closed,
        holes: holes.map((h) => h.points),
        weight: bead || w === 0 ? w : (w * weight) / 1.7,
        tint,
        solid,
        opacity,
        corners: cornersOf(pts, outer.closed),
        bead,
        path: bead ? `M${pts[0][0]} ${pts[0][1]}l0 0` : path,
      };
    });
    cache.set(key, parts);
  }
  return parts;
}

// ---------- resampling and alignment ----------

function resample(part: Pick<MorphPart, 'points' | 'closed' | 'corners'>, n: number): Point[] {
  const { points: pts, closed } = part;
  if (pts.length === 1) return Array.from({ length: n }, () => [pts[0][0], pts[0][1]] as Point);
  const ring = closed ? [...pts, pts[0]] : pts;
  const cum = [0];
  for (let i = 1; i < ring.length; i++) cum.push(cum[i - 1] + Math.hypot(ring[i][0] - ring[i - 1][0], ring[i][1] - ring[i - 1][1]));
  const L = cum[cum.length - 1];
  if (L < 1e-6) return Array.from({ length: n }, () => [pts[0][0], pts[0][1]] as Point);
  const steps = closed ? n : n - 1;
  const out: Point[] = [];
  let k = 0;
  for (let j = 0; j < n; j++) {
    const t = (j / steps) * L;
    while (k < cum.length - 2 && cum[k + 1] < t) k++;
    const seg = cum[k + 1] - cum[k] || 1, u = (t - cum[k]) / seg;
    out.push([ring[k][0] + (ring[k + 1][0] - ring[k][0]) * u, ring[k][1] + (ring[k + 1][1] - ring[k][1]) * u]);
  }
  // Sharp corners land exactly on a sample, so a check keeps its point and a chevron its tip.
  for (const c of part.corners) {
    const j = Math.round((cum[c] / L) * steps) % n;
    out[j] = [pts[c][0], pts[c][1]];
  }
  return out;
}

const d2 = (a: Point, b: Point) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;

function rotations(ring: Point[], open: boolean): Point[][] {
  // Every start point, both directions. A ring that must open repeats its start at the end.
  const n = ring.length, out: Point[][] = [];
  for (const dir of [1, -1]) {
    for (let s = 0; s < n; s++) {
      const r: Point[] = [];
      for (let i = 0; i < n; i++) r.push(ring[(s + dir * i + n * 2) % n]);
      if (open) r.push(r[0]);
      out.push(r);
    }
  }
  return out;
}

function cost(a: Point[], b: Point[]) {
  let c = 0;
  for (let i = 0; i < a.length; i++) c += d2(a[i], b[i]);
  return c / a.length;
}

/** Point-for-point correspondence between two parts (G3), with its mean squared travel. */
function align(a: MorphPart, b: MorphPart, n: number): { A: Point[]; B: Point[]; closed: boolean; travel: number } {
  if (a.closed && b.closed) {
    const A = resample(a, n), ring = resample(b, n);
    let best = { B: ring, travel: Infinity };
    for (const B of rotations(ring, false)) { const t = cost(A, B); if (t < best.travel) best = { B, travel: t }; }
    return { A, ...best, closed: true };
  }
  if (!a.closed && !b.closed) {
    const A = resample(a, n), B = resample(b, n), R = [...B].reverse();
    const f = cost(A, B), r = cost(A, R);
    return f <= r ? { A, B, closed: false, travel: f } : { A, B: R, closed: false, travel: r };
  }
  // One ring, one open wire. Either the ring opens at the point that travels least (G3), or
  // the wire is a loop pressed flat and the ring presses flat into it (G3b): whichever moves less.
  const openPart = a.closed ? b : a, ringPart = a.closed ? a : b;
  const W = resample(openPart, n), ring = resample(ringPart, n - 1);
  let open = { R: ring, travel: Infinity };
  for (const R of rotations(ring, true)) { const t = cost(W, R); if (t < open.travel) open = { R, travel: t }; }
  const half = resample(openPart, n / 2 + 1);
  const flat = [...half, ...half.slice(1, -1).reverse()];
  const loop = resample(ringPart, n);
  let fold = { R: loop, travel: Infinity };
  for (const R of rotations(loop, false)) { const t = cost(flat, R); if (t < fold.travel) fold = { R, travel: t }; }
  if (fold.travel < open.travel) {
    return a.closed ? { A: fold.R, B: flat, closed: true, travel: fold.travel } : { A: flat, B: fold.R, closed: true, travel: fold.travel };
  }
  return a.closed ? { A: open.R, B: W, closed: false, travel: open.travel } : { A: W, B: open.R, closed: false, travel: open.travel };
}

// ---------- pairing (G1) ----------

/** Min-cost perfect assignment (Hungarian, O(n³)); returns column for each row. */
function assign(c: number[][]): number[] {
  const n = c.length, INF = 1e18;
  const u = new Array(n + 1).fill(0), v = new Array(n + 1).fill(0), p = new Array(n + 1).fill(0), way = new Array(n + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Array(n + 1).fill(INF), used = new Array(n + 1).fill(false);
    do {
      used[j0] = true;
      const i0 = p[j0];
      let delta = INF, j1 = 0;
      for (let j = 1; j <= n; j++) {
        if (used[j]) continue;
        const cur = c[i0 - 1][j - 1] - u[i0] - v[j];
        if (cur < minv[j]) { minv[j] = cur; way[j] = j0; }
        if (minv[j] < delta) { delta = minv[j]; j1 = j; }
      }
      for (let j = 0; j <= n; j++) {
        if (used[j]) { u[p[j]] += delta; v[j] -= delta; } else minv[j] -= delta;
      }
      j0 = j1;
    } while (p[j0] !== 0);
    do { const j1 = way[j0]; p[j0] = p[j1]; j0 = j1; } while (j0);
  }
  const rowToCol = new Array(n).fill(-1);
  for (let j = 1; j <= n; j++) if (p[j]) rowToCol[p[j] - 1] = j - 1;
  return rowToCol;
}

const COARSE = 24;
const SAMPLES = 72;
/** A leaving or arriving part costs twice the same travel as a pair: a part becomes a part first (G1 over G5). */
const LONE = 2;
const traitCost = (a: MorphPart, b: MorphPart) => 0.5 * (a.weight - b.weight) ** 2 + 2 * (a.tint - b.tint) ** 2 + 4 * (a.solid - b.solid) ** 2;

function nearestTravel(part: MorphPart, others: MorphFrame) {
  // Mean squared distance for the part to gather into the nearest point of the other glyph.
  const pts = resample(part, COARSE);
  let q: Point = [12, 12], best = Infinity;
  for (const o of others) for (const r of resample(o, COARSE)) for (const p of pts) { const d = d2(p, r); if (d < best) { best = d; q = r; } }
  return pts.reduce((s, p) => s + d2(p, q), 0) / pts.length;
}

// ---------- planning and frames ----------

interface Track {
  A: Point[];
  B: Point[];
  closed: boolean;
  holesA: Point[][];
  holesB: Point[][];
  from: Traits;
  to: Traits;
  /** G5: the point this part gathers into (leaving) or grows from (arriving). */
  anchor?: Anchor;
  arriving?: boolean;
}
/** A point on an earlier track (by sample index), or a fixed point when there is none. */
type Anchor = { track: number; index: number } | { point: Point };
interface Traits { weight: number; tint: number; solid: number; opacity: number }
const traits = (p: MorphPart): Traits => ({ weight: p.weight, tint: p.tint, solid: p.solid, opacity: p.opacity });

export interface MorphPlan { tracks: Track[]; to: IconName }

const centroid = (pts: Point[]): Point => {
  const s = pts.reduce((o, p) => [o[0] + p[0], o[1] + p[1]], [0, 0]);
  return [s[0] / pts.length, s[1] / pts.length];
};

function pairHoles(a: Point[][], b: Point[][]): [Point[][], Point[][]] {
  // Holes pair by nearness; a hole without a partner closes to (or opens from) its own center.
  const A: Point[][] = [], B: Point[][] = [];
  const used = new Set<number>();
  const ring = (h: Point[]) => resample({ points: h, closed: true, corners: [] }, SAMPLES / 2);
  const shut = (h: Point[]) => { const c = centroid(h); return h.map(() => [c[0], c[1]] as Point); };
  for (const h of a) {
    let bi = -1, bd = Infinity;
    b.forEach((g, i) => { if (!used.has(i)) { const d = d2(centroid(h), centroid(g)); if (d < bd) { bd = d; bi = i; } } });
    const ha = ring(h);
    if (bi < 0) { A.push(ha); B.push(shut(ha)); continue; }
    used.add(bi);
    const hb = ring(b[bi]);
    let best = hb, bc = Infinity;
    for (const r of rotations(hb, false)) { const t = cost(ha, r); if (t < bc) { bc = t; best = r; } }
    A.push(ha); B.push(best);
  }
  b.forEach((g, i) => { if (!used.has(i)) { const hb = ring(g); A.push(shut(hb)); B.push(hb); } });
  return [A, B];
}

/** Plans the morph from what is on screen now to a glyph. */
export function planMorph(from: MorphFrame, to: IconName, weight = 1.7): MorphPlan {
  const target = morphParts(to, weight);
  const n = from.length, m = target.length, size = n + m;
  const lone = from.map((a) => LONE * nearestTravel(a, target));
  const arrive = target.map((b) => LONE * nearestTravel(b, from));
  const c: number[][] = Array.from({ length: size }, () => new Array(size).fill(0));
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (i < n && j < m) c[i][j] = align(from[i], target[j], COARSE).travel + traitCost(from[i], target[j]);
      else if (i < n) c[i][j] = j - m === i ? lone[i] : 1e9;
      else if (j < m) c[i][j] = i - n === j ? arrive[j] : 1e9;
    }
  }
  const pick = assign(c);

  // Tracks run in dependency order: staying parts, then arriving parts (which bud from a staying
  // part), then leaving parts (which gather into a staying or an arriving part).
  const tracks: Track[] = [];
  const leaving: number[] = [];
  const matched = new Set<number>();
  for (let i = 0; i < n; i++) {
    const j = pick[i];
    if (j < m) {
      matched.add(j);
      const al = align(from[i], target[j], SAMPLES);
      const [holesA, holesB] = pairHoles(from[i].holes, target[j].holes);
      tracks.push({ A: al.A, B: al.B, closed: al.closed, holesA, holesB, from: traits(from[i]), to: traits(target[j]) });
    } else leaving.push(i);
  }
  const staying = tracks.length;

  // G5: the nearest point of a track that is there at the relevant end of the morph.
  const anchorFor = (pts: Point[], side: 'A' | 'B', hosts: number, fallback: MorphFrame): Anchor => {
    let best = { track: -1, index: 0, d: Infinity };
    for (let t = 0; t < hosts; t++) {
      tracks[t][side].forEach((q, index) => { for (const p of pts) { const d = d2(p, q); if (d < best.d) best = { track: t, index, d }; } });
    }
    if (best.track >= 0) return { track: best.track, index: best.index };
    let point: Point = [12, 12], bd = Infinity;
    for (const o of fallback) for (const q of resample(o, COARSE)) for (const p of pts) { const d = d2(p, q); if (d < bd) { bd = d; point = q; } }
    return { point };
  };
  const hostWeight = (a: Anchor, side: 'from' | 'to') => ('track' in a ? tracks[a.track][side].weight : 0);
  const holeRings = (holes: Point[][]) => holes.map((h) => resample({ points: h, closed: true, corners: [] }, SAMPLES / 2));

  for (let j = 0; j < m; j++) {
    if (matched.has(j)) continue;
    const b = target[j];
    const B = resample(b, SAMPLES);
    // Buds from where it attaches now: the nearest point of a staying part, on screen at the start.
    const anchor = anchorFor(B, 'A', staying, from);
    const holes = holeRings(b.holes);
    tracks.push({
      A: B, B, closed: b.closed, holesA: holes, holesB: holes, anchor, arriving: true,
      from: { weight: Math.min(b.weight, hostWeight(anchor, 'from')), tint: 0, solid: b.solid, opacity: b.opacity },
      to: traits(b),
    });
  }
  const hosts = tracks.length;
  for (const i of leaving) {
    const a = from[i];
    const A = resample(a, SAMPLES);
    // Gathers into where it will rest: the nearest point of the next glyph, staying or arriving.
    const anchor = anchorFor(A, 'B', hosts, target);
    const holes = holeRings(a.holes);
    tracks.push({
      A, B: A, closed: a.closed, holesA: holes, holesB: holes, anchor, arriving: false,
      from: traits(a),
      // It ends as a point at its host's weight, inside the host: absorbed, not faded.
      to: { weight: Math.min(a.weight, hostWeight(anchor, 'to')), tint: 0, solid: a.solid, opacity: a.opacity },
    });
  }
  return { tracks, to };
}

const mix = (a: number, b: number, p: number) => a + (b - a) * p;
const mixPt = (a: Point, b: Point, p: number): Point => [mix(a[0], b[0], p), mix(a[1], b[1], p)];
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const areaOf = (pts: Point[]) => {
  let s = 0;
  for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; s += p[0] * q[1] - q[0] * p[1]; }
  return Math.abs(s) / 2;
};

/** G7: a lone part is light. A leaving part is gathered by two thirds of the way; an arriving
 *  part starts budding at one third. Staying parts carry the whole spring. */
const LEAVE_BY = 2 / 3;
const ARRIVE_FROM = 1 / 3;

/** The glyph at progress p (0 → 1; a spring may pass 1 slightly). */
export function morphAt(plan: MorphPlan, p: number): MorphFrame {
  const frame: MorphFrame = [];
  for (const t of plan.tracks) {
    const a = t.anchor;
    let q = p, points: Point[], holes: Point[][];
    if (!a) {
      points = t.A.map((v, i) => mixPt(v, t.B[i], q));
      holes = t.holesA.map((h, k) => h.map((v, i) => mixPt(v, t.holesB[k][i], q)));
    } else {
      q = t.arriving ? clamp01((p - ARRIVE_FROM) / (1 - ARRIVE_FROM)) : clamp01(p / LEAVE_BY);
      // The anchor rides its host as drawn in this frame, so the part stays attached to it.
      const host = 'track' in a ? frame[a.track].points[a.index] : a.point;
      const move = (v: Point) => (t.arriving ? mixPt(host, v, q) : mixPt(v, host, q));
      points = (t.arriving ? t.B : t.A).map(move);
      holes = t.holesA.map((h) => h.map(move));
    }
    // G4b: solid ink is conserved. A solid spreading over more area thins in proportion; one
    // gathering into less stays solid.
    let solid = t.from.solid;
    if (t.from.solid !== t.to.solid) {
      const inkA = t.from.solid * areaOf(t.A), inkB = t.to.solid * areaOf(t.B), now = areaOf(points);
      solid = now > 0.05 ? clamp01(mix(inkA, inkB, clamp01(q)) / now) : clamp01(mix(t.from.solid, t.to.solid, q));
    }
    frame.push({
      points,
      closed: t.closed,
      holes,
      weight: Math.max(0, mix(t.from.weight, t.to.weight, q)),
      tint: Math.max(0, mix(t.from.tint, t.to.tint, q)),
      solid,
      opacity: clamp01(mix(t.from.opacity, t.to.opacity, q)),
      corners: [],
      bead: false,
    });
  }
  return frame;
}

const f = (n: number) => +n.toFixed(3);

/** SVG path data for a part: its authored path at rest, its points in motion. */
export function morphPath(part: MorphPart): string {
  if (part.path) return part.path;
  const ring = (pts: Point[], close: boolean) => 'M' + pts.map((q) => `${f(q[0])} ${f(q[1])}`).join('L') + (close ? 'Z' : '');
  // A lone point still needs a segment to draw its round cap.
  const outer = part.points.length === 1 ? `M${f(part.points[0][0])} ${f(part.points[0][1])}l0 0` : ring(part.points, part.closed);
  return outer + part.holes.map((h) => ring(h, true)).join('');
}

/** Damped spring progress (mass 1) at time t seconds. */
export function springAt(k: number, c: number, t: number) {
  const w0 = Math.sqrt(k), z = c / (2 * Math.sqrt(k));
  if (z >= 1) return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
  const wd = w0 * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + ((z * w0) / wd) * Math.sin(wd * t));
}
