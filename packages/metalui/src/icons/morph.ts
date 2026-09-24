// Glyph morph: any Soft Hardware icon becomes any other, born from what the icons are made of.
// The language is docs/MORPH.md; this file is its engine.
//
// Every glyph is parts of one material (wires, beads, plates) at a depth (a part can sit behind
// another, keeping a clearance; or inside a frame). A morph moves that material, never swaps it:
//   E1  A part becomes a part. Parts pair by how little they must travel (min-cost assignment),
//       with a small cost for changing weight, tint or solidity.
//   E2  Every pair rides a carriage: the rigid motion (turn, uniform scale, travel) that best
//       explains where it goes, with the shape change left over applied in the carriage's own
//       frame. Rigid things stay rigid on the way; bends happen in place.
//   E3  A bead is a wire of zero length: it draws out into a wire (thinning to its weight) and a
//       wire gathers into a bead.
//   E4  A ring opens where it is nearest the ends it becomes, and closes the same way (round caps,
//       no seam); or, when it moves less, the wire is a loop pressed flat and the ring presses flat
//       into it. Tint is the area a wire encloses: it fills as a loop opens, drains as it flattens.
//   E5  Solid ink is conserved: a solid spreading over more area thins in proportion.
//   E6  Depth is live. A clearance travels with the part that casts it and its gap lerps, so
//       parts keep their distance while they move and nothing tears.
//   E7  Nothing fades and nothing comes from nowhere. A part the next glyph lacks tucks behind a
//       body that can hide it, or gathers into the nearest point of a wire that stays and ends at
//       its weight, inside it. A part the next glyph gains emerges from behind a body or buds from
//       a staying wire.
//   E8  A mirror pair turns over: when the next glyph is the reflection of this one, the whole
//       glyph turns on its axis, edge-on at the half turn, instead of every part deforming.
//   E9  The glyph is one object: every part moves on one settle spring, from the same frame.
//       A lone part is light: leaving is done by two thirds of the way, arriving starts at one third.
//   E10 Every plan carries its strain, so a product can see which changes will not be smooth.

import { MORPH_PARTS, type MorphIconName, type MorphPartSource } from './morph.generated';

export type Point = [number, number];

/** Depth between parts: this part is hidden within `part`'s ink widened by `r` (behind), or
 *  visible only within `part`'s body narrowed by `r` (inside). Indices point into the same frame. */
export interface MorphRelation { part: number; r: number }

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
  /** A body hides its whole area when it casts depth; a wire hides only along itself. */
  body: boolean;
  behind: MorphRelation[];
  inside: MorphRelation[];
  /** The authored path, drawn at rest instead of the flattened points. */
  path?: string;
}

/** A glyph on screen: its parts, in drawing order. */
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
export function morphParts(name: MorphIconName, weight = 1.7): MorphFrame {
  const key = `${name}@${weight}`;
  let parts = cache.get(key);
  if (!parts) cache.set(key, (parts = partsFrom(MORPH_PARTS[name], weight)));
  return parts;
}

/** Generated rows (the shape of morph.generated.ts) as a frame; for glyphs outside the set, such as proposals. */
export function partsFrom(rows: readonly MorphPartSource[], weight = 1.7): MorphFrame {
  return rows.map(([path, w, tint, solid, opacity, rels = []]) => {
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
        body: (outer.closed && !bead) || tint > 0 || solid > 0,
        behind: rels.filter((r) => r[0] === 'behind').map((r) => ({ part: r[1], r: r[2] })),
        inside: rels.filter((r) => r[0] === 'inside').map((r) => ({ part: r[1], r: r[2] })),
        path: bead ? `M${pts[0][0]} ${pts[0][1]}l0 0` : path,
      };
  });
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

/** The moves of the language (docs/MORPH.md): how one track gets from A to B. */
export type MorphMove = 'carry' | 'draw' | 'gather' | 'open' | 'close' | 'press' | 'unfold' | 'bud' | 'absorb' | 'emerge' | 'tuck';

/** Point-for-point correspondence between two parts (E3, E4), with its mean squared travel.
 *  `body`: the pair keeps its fill (a body opens, it never presses flat through zero area). */
function align(a: MorphPart, b: MorphPart, n: number, body = false): { A: Point[]; B: Point[]; closed: boolean; travel: number; move: MorphMove } {
  const beadMove: MorphMove = a.bead === b.bead ? 'carry' : a.bead ? 'draw' : 'gather';
  if (a.closed && b.closed) {
    const A = resample(a, n), ring = resample(b, n);
    let best = { B: ring, travel: Infinity };
    for (const B of rotations(ring, false)) { const t = cost(A, B); if (t < best.travel) best = { B, travel: t }; }
    return { A, ...best, closed: true, move: beadMove };
  }
  if (!a.closed && !b.closed) {
    const A = resample(a, n), B = resample(b, n), R = [...B].reverse();
    const f = cost(A, B), r = cost(A, R);
    return f <= r ? { A, B, closed: false, travel: f, move: beadMove } : { A, B: R, closed: false, travel: r, move: beadMove };
  }
  // One ring, one open wire. Either the ring opens at the point that travels least, or the wire
  // is a loop pressed flat and the ring presses flat into it: whichever moves less.
  const openPart = a.closed ? b : a, ringPart = a.closed ? a : b;
  const W = resample(openPart, n), ring = resample(ringPart, n - 1);
  let open = { R: ring, travel: Infinity };
  for (const R of rotations(ring, true)) { const t = cost(W, R); if (t < open.travel) open = { R, travel: t }; }
  const half = resample(openPart, n / 2 + 1);
  const flat = [...half, ...half.slice(1, -1).reverse()];
  const loop = resample(ringPart, n);
  let fold = { R: loop, travel: Infinity };
  for (const R of rotations(loop, false)) { const t = cost(flat, R); if (t < fold.travel) fold = { R, travel: t }; }
  if (!body && fold.travel < open.travel) {
    return a.closed ? { A: fold.R, B: flat, closed: true, travel: fold.travel, move: 'press' } : { A: flat, B: fold.R, closed: true, travel: fold.travel, move: 'unfold' };
  }
  return a.closed ? { A: open.R, B: W, closed: false, travel: open.travel, move: 'open' } : { A: W, B: open.R, closed: false, travel: open.travel, move: 'close' };
}

// ---------- the carriage (E2) ----------

interface Carriage {
  cA: Point;
  cB: Point;
  /** Turn (radians, the short way) and uniform scale from A to B. */
  theta: number;
  s: number;
  /** A's points about cA, and what each must still move by, in the carriage frame, to be B. */
  local: Point[];
  res: Point[];
  holesLocal: Point[][];
  holesRes: Point[][];
}

const centroid = (pts: Point[]): Point => {
  const s = pts.reduce((o, p) => [o[0] + p[0], o[1] + p[1]], [0, 0]);
  return [s[0] / pts.length, s[1] / pts.length];
};
/** The largest turn a carriage explains; past it the part is nearer a reflection, so it deforms in place. */
const MAX_TURN = (120 * Math.PI) / 180;

/** Least-squares similarity (Procrustes) from A to B, with the residual in A's own frame. */
function carriageOf(A: Point[], B: Point[], holesA: Point[][], holesB: Point[][]): Carriage {
  const cA = centroid(A), cB = centroid(B);
  let sxx = 0, sxy = 0, va = 0, vb = 0;
  for (let i = 0; i < A.length; i++) {
    const ax = A[i][0] - cA[0], ay = A[i][1] - cA[1], bx = B[i][0] - cB[0], by = B[i][1] - cB[1];
    sxx += ax * bx + ay * by; sxy += ax * by - ay * bx; va += ax * ax + ay * ay; vb += bx * bx + by * by;
  }
  const rigid = va > 1e-6 && vb > 1e-6;
  let theta = rigid ? Math.atan2(sxy, sxx) : 0;
  let s = rigid ? Math.sqrt(vb / va) : 1;
  if (Math.abs(theta) > MAX_TURN) { theta = 0; s = 1; }
  const c = Math.cos(-theta), sn = Math.sin(-theta);
  const local = (pts: Point[], ctr: Point): Point[] => pts.map((p) => [p[0] - ctr[0], p[1] - ctr[1]]);
  const back = (pts: Point[]): Point[] => pts.map((p) => [(p[0] * c - p[1] * sn) / s, (p[0] * sn + p[1] * c) / s]);
  const res = (la: Point[], lb: Point[]): Point[] => back(lb).map((q, i) => [q[0] - la[i][0], q[1] - la[i][1]]);
  const la = local(A, cA), lb = local(B, cB);
  const hl = holesA.map((h) => local(h, cA)), hb = holesB.map((h) => local(h, cB));
  return { cA, cB, theta, s, local: la, res: res(la, lb), holesLocal: hl, holesRes: hl.map((h, k) => res(h, hb[k])) };
}

function ride(c: Carriage, pts: Point[], res: Point[], q: number): Point[] {
  const cx = mix(c.cA[0], c.cB[0], q), cy = mix(c.cA[1], c.cB[1], q);
  const ang = c.theta * q, sc = mix(1, c.s, q), co = Math.cos(ang) * sc, si = Math.sin(ang) * sc;
  return pts.map((p, i) => {
    const x = p[0] + res[i][0] * q, y = p[1] + res[i][1] * q;
    return [cx + x * co - y * si, cy + x * si + y * co];
  });
}

// ---------- pairing (E1) ----------

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
/** Pairing minimises energy: mass (material) times squared travel. A leaving or arriving part costs
 *  twice its travel to gather, capped at 20 (a step and a nest, squared over two): a part becomes a
 *  part first (E1 over E7), but a good pair is never traded away to spare a large part from leaving. */
const LONE = 2, LONE_CAP = 20;
/** Changing kind (a ring opening, a wire closing) costs one step of travel (4²): a part keeps its kind when it can. */
const KIND = 16;
const isPlate = (p: MorphPart) => p.weight === 0 && !p.bead;
const traitCost = (a: MorphPart, b: MorphPart) => {
  // A bead is solid ink like a plate; its weight is its size, not a wire's, so neither is compared across kinds.
  const solid = (p: MorphPart) => (p.bead ? 1 : p.solid);
  const weight = isPlate(a) || isPlate(b) ? 0 : 0.5 * (a.weight - b.weight) ** 2;
  return weight + 2 * (a.tint - b.tint) ** 2 + 4 * (solid(a) - solid(b)) ** 2 + (a.closed !== b.closed && !a.bead && !b.bead ? KIND : 0);
};

function nearestTravel(part: MorphPart, others: MorphFrame) {
  // Mean squared distance for the part to gather into the nearest point of the other glyph.
  const pts = resample(part, COARSE);
  let q: Point = [12, 12], best = Infinity;
  for (const o of others) for (const r of resample(o, COARSE)) for (const p of pts) { const d = d2(p, r); if (d < best) { best = d; q = r; } }
  return pts.reduce((s, p) => s + d2(p, q), 0) / pts.length;
}

/** How much material a part is: wire length, ring or plate perimeter, or a bead's diameter. */
function materialOf(part: MorphPart) {
  if (part.bead || part.points.length === 1) return part.weight;
  const ring = part.closed ? [...part.points, part.points[0]] : part.points;
  let L = 0;
  for (let i = 1; i < ring.length; i++) L += Math.hypot(ring[i][0] - ring[i - 1][0], ring[i][1] - ring[i - 1][1]);
  return L;
}

// ---------- the turn (E8) ----------

const GRID_CENTER = 12;
/** The axis a glyph turns on: 0 turns about the vertical axis (x mirrors), 1 about the horizontal. */
export type MorphAxis = 0 | 1;

function cloud(frame: MorphFrame): Point[] { return frame.flatMap((p) => resample(p, COARSE)); }
function chamfer(P: Point[], Q: Point[]) {
  const near = (from: Point[], to: Point[]) => from.reduce((s, p) => s + Math.min(...to.map((q) => d2(p, q))), 0) / from.length;
  return near(P, Q) + near(Q, P);
}
const mirrorPt = (p: Point, axis: MorphAxis): Point => (axis === 0 ? [2 * GRID_CENTER - p[0], p[1]] : [p[0], 2 * GRID_CENTER - p[1]]);
function mirrorPart(p: MorphPart, axis: MorphAxis): MorphPart {
  const points = p.points.map((q) => mirrorPt(q, axis));
  return { ...p, points, holes: p.holes.map((h) => h.map((q) => mirrorPt(q, axis))), corners: cornersOf(points, p.closed), path: undefined };
}
/** When the next glyph is this one's reflection, the axis it turns on. */
function turnAxis(from: MorphFrame, to: MorphFrame): MorphAxis | undefined {
  if (from.length !== to.length) return undefined;
  const P = cloud(from), Q = cloud(to);
  const direct = chamfer(P, Q);
  if (direct < 2) return undefined;
  let best: { axis: MorphAxis; c: number } | undefined;
  for (const axis of [0, 1] as MorphAxis[]) {
    const c = chamfer(P, Q.map((q) => mirrorPt(q, axis)));
    if (c < 0.25 * direct && (!best || c < best.c)) best = { axis, c };
  }
  return best?.axis;
}

// ---------- planning and frames ----------

interface Traits { weight: number; tint: number; solid: number; opacity: number }
const traits = (p: MorphPart): Traits => ({ weight: p.weight, tint: p.tint, solid: p.solid, opacity: p.opacity });
/** A point on an earlier track (by sample index), or a fixed point when there is none. */
type Anchor = { track: number; index: number } | { point: Point };
interface TrackRelation { track: number; rA: number; rB: number }

/** One part becoming one part (or leaving, or arriving). */
export interface MorphTrack {
  A: Point[];
  B: Point[];
  closed: boolean;
  holesA: Point[][];
  holesB: Point[][];
  from: Traits;
  to: Traits;
  carriage?: Carriage;
  /** E7: the point this part gathers into (leaving) or grows from (arriving). */
  anchor?: Anchor;
  /** The share of the morph this part moves in: [0,1] staying, [0,⅔] leaving, [⅓,1] arriving. */
  window: readonly [number, number];
  move: MorphMove;
  body: boolean;
  material: number;
  /** Mean distance each point travels. */
  travel: number;
  behind: TrackRelation[];
  inside: TrackRelation[];
  /** Drawing order: leaving parts first, then the next glyph's order. */
  z: number;
}

/** How far a morph is from smooth (E10). Under 1 it reads as one object changing. */
export interface MorphStrain {
  /** Mean travel per unit of material, in grid units. */
  travel: number;
  /** Share of material with no partner (budding or gathering; tucks and emerges count half). */
  lone: number;
  /** Share of tracks that change topology: rings opening or closing, plates becoming wires. */
  topology: number;
  /** Mean change of weight, tint and solidity across tracks, in the pairing's trait units. */
  traits: number;
  /** Share of track pairs whose straight paths cross each other on the way. */
  crossing: number;
  turn: boolean;
  total: number;
}

export interface MorphPlan {
  tracks: MorphTrack[];
  /** The glyph planned to, when it is one of the set. */
  to?: MorphIconName;
  turn?: MorphAxis;
  strain: MorphStrain;
  /** The pairing's cost matrix (from × to, then the lone costs), for reading why parts paired as they did. */
  costs: number[][];
}

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

const STAY = [0, 1] as const;
const LEAVE = [0, 2 / 3] as const;
const ARRIVE = [1 / 3, 1] as const;
/** Point in a ring (chord-closed when open), and distance to its line. */
function inside(pt: Point, ring: Point[]) {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if (yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
function distTo(pt: Point, line: Point[]) {
  let best = Infinity;
  for (let i = 1; i < line.length; i++) {
    const [ax, ay] = line[i - 1], [bx, by] = line[i];
    const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy;
    const t = L2 ? Math.max(0, Math.min(1, ((pt[0] - ax) * dx + (pt[1] - ay) * dy) / L2)) : 0;
    best = Math.min(best, Math.hypot(pt[0] - (ax + dx * t), pt[1] - (ay + dy * t)));
  }
  return best;
}
/** The centroid of a ring's area (a wire's samples alone would lean toward its denser side). */
function areaCentroid(ring: Point[]): Point {
  let a = 0, x = 0, y = 0;
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i], q = ring[(i + 1) % ring.length], w = p[0] * q[1] - q[0] * p[1];
    a += w; x += (p[0] + q[0]) * w; y += (p[1] + q[1]) * w;
  }
  return Math.abs(a) < 1e-6 ? centroid(ring) : [x / (3 * a), y / (3 * a)];
}
const meanTravel = (A: Point[], B: Point[]) => A.reduce((s, p, i) => s + Math.sqrt(d2(p, B[i])), 0) / A.length;
const bounds = (pts: Point[]) => pts.reduce((b, p) => [Math.min(b[0], p[0]), Math.min(b[1], p[1]), Math.max(b[2], p[0]), Math.max(b[3], p[1])], [Infinity, Infinity, -Infinity, -Infinity]);
/** A body hides a part that fits within it (scaled down to this at most); otherwise the part gathers. */
const TUCK_MIN = 0.5, TUCK_R = 1, TUCK_MARGIN = 0.2, TUCK_BOXY = 0.6;

/** Strain weights: one step of travel (4), all material lone, every track changing topology,
 *  a trait unit, every pair of paths crossing, a turn. */
const STRAIN = { travel: 1 / 4, lone: 2, topology: 0.5, traits: 0.25, crossing: 0.5, turn: 0.5 };

/** Plans the morph from what is on screen now to a glyph of the set. */
export function planMorph(from: MorphFrame, to: MorphIconName, weight = 1.7): MorphPlan {
  return { ...planFrames(from, morphParts(to, weight)), to };
}

/** Whether segments ab and cd cross. */
function crosses(a: Point, b: Point, c: Point, d: Point) {
  const o = (p: Point, q: Point, r: Point) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
  return o(a, b, c) !== o(a, b, d) && o(c, d, a) !== o(c, d, b);
}

/** Plans the morph from one frame to another. */
export function planFrames(from: MorphFrame, rest: MorphFrame): MorphPlan {
  const turn = turnAxis(from, rest);
  const target = turn === undefined ? rest : rest.map((p) => mirrorPart(p, turn));
  const n = from.length, m = target.length, size = n + m;
  const massA = from.map(materialOf), massB = target.map(materialOf);
  const lone = from.map((a, i) => LONE * massA[i] * Math.min(LONE_CAP, nearestTravel(a, target)));
  const arrive = target.map((b, j) => LONE * massB[j] * Math.min(LONE_CAP, nearestTravel(b, from)));
  const c: number[][] = Array.from({ length: size }, () => new Array(size).fill(0));
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (i < n && j < m) c[i][j] = ((massA[i] + massB[j]) / 2) * (align(from[i], target[j], COARSE).travel + traitCost(from[i], target[j]));
      else if (i < n) c[i][j] = j - m === i ? lone[i] : 1e9;
      else if (j < m) c[i][j] = i - n === j ? arrive[j] : 1e9;
    }
  }
  const pick = assign(c);
  // A body: tinted or solid, or casting depth on another part, in either glyph.
  const casters = new Set([...from.flatMap((p) => p.behind.map((r) => r.part)).map((i) => `A${i}`), ...target.flatMap((p) => p.behind.map((r) => r.part)).map((j) => `B${j}`)]);
  const isBody = (i: number, j: number) => from[i].tint > 0 || from[i].solid > 0 || target[j].tint > 0 || target[j].solid > 0 || casters.has(`A${i}`) || casters.has(`B${j}`);

  // Tracks run in dependency order: staying parts, then arriving parts (which emerge or bud from
  // a staying part), then leaving parts (which tuck behind or gather into a staying or arriving part).
  const tracks: MorphTrack[] = [];
  /** Each staying track's real outline at either end (chord-closed when open), for what it can hide. */
  const bodies: { A: Point[]; B: Point[] }[] = [];
  const fromTrack = new Array<number>(n).fill(-1), toTrack = new Array<number>(m).fill(-1);
  const leaving: number[] = [];
  for (let i = 0; i < n; i++) {
    const j = pick[i];
    if (j < m) {
      const al = align(from[i], target[j], SAMPLES, isBody(i, j));
      const [holesA, holesB] = pairHoles(from[i].holes, target[j].holes);
      fromTrack[i] = toTrack[j] = tracks.length;
      bodies.push({ A: resample(from[i], COARSE), B: resample(target[j], COARSE) });
      tracks.push({
        A: al.A, B: al.B, closed: al.closed, holesA, holesB, from: traits(from[i]), to: traits(target[j]),
        carriage: carriageOf(al.A, al.B, holesA, holesB), window: STAY, move: al.move, body: isBody(i, j),
        material: (materialOf(from[i]) + materialOf(target[j])) / 2, travel: meanTravel(al.A, al.B),
        behind: [], inside: [], z: n + j,
      });
    } else leaving.push(i);
  }
  const staying = tracks.length;

  // E7: the nearest point of a track that is there at the relevant end of the morph.
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
  const anchorPoint = (a: Anchor, side: 'A' | 'B'): Point => ('track' in a ? tracks[a.track][side][a.index] : a.point);
  const hostWeight = (a: Anchor, side: 'from' | 'to') => ('track' in a ? tracks[a.track][side].weight : 0);
  const holeRings = (holes: Point[][]) => holes.map((h) => resample({ points: h, closed: true, corners: [] }, SAMPLES / 2));
  /** The widest clearance a track casts in either glyph, or none. */
  const castR = (t: number): number | undefined => {
    const rs = [...from.flatMap((p) => p.behind.filter((r) => fromTrack[r.part] === t).map((r) => r.r)), ...target.flatMap((p) => p.behind.filter((r) => toTrack[r.part] === t).map((r) => r.r))];
    return rs.length ? Math.max(...rs) : undefined;
  };
  // E7: a staying body that can hide the part at the end where it must be hidden, and the pose it
  // takes there: centred on the body, scaled down only as far as the clearance needs to cover it.
  // A body is a part that casts depth in either glyph (its depth is authored), or one that is
  // tinted or solid at that end (a card is opaque even when nothing is drawn behind it).
  const hideBehind = (pts: Point[], weight: number, side: 'A' | 'B', inFrontOf: Set<number>): { track: number; pose: Point[]; r: number } | undefined => {
    const [x0, y0, x1, y1] = bounds(pts), pc: Point = [(x0 + x1) / 2, (y0 + y1) / 2];
    let best: { track: number; pose: Point[]; s: number; r: number } | undefined;
    for (let t = 0; t < staying; t++) {
      // Never behind a part it is in front of: depth does not flip.
      if (inFrontOf.has(t)) continue;
      const cast = castR(t), look = side === 'A' ? tracks[t].from : tracks[t].to;
      if (cast === undefined && !(look.tint > 0 || look.solid > 0)) continue;
      const body = bodies[t][side];
      // A body is a boxy or round outline, not a bent wire's chord; and it must be there at all.
      const [bx0, by0, bx1, by1] = bounds(body), area = areaOf(body);
      if (area < 4 || area < TUCK_BOXY * (bx1 - bx0) * (by1 - by0)) continue;
      const r = Math.max(TUCK_R, cast ?? 0), reach = r - weight / 2 - TUCK_MARGIN, bc = areaCentroid(body);
      for (let s = 1; s >= TUCK_MIN - 1e-9; s -= 0.05) {
        if (best && s <= best.s) break;
        const pose: Point[] = pts.map((p) => [bc[0] + (p[0] - pc[0]) * s, bc[1] + (p[1] - pc[1]) * s]);
        if (pose.every((p) => inside(p, body) || distTo(p, body) <= reach)) { best = { track: t, pose, s, r }; break; }
      }
    }
    return best && { track: best.track, pose: best.pose, r: best.r };
  };

  for (let j = 0; j < m; j++) {
    if (toTrack[j] >= 0) continue;
    const b = target[j];
    const B = resample(b, SAMPLES);
    const holes = holeRings(b.holes);
    toTrack[j] = tracks.length;
    const hide = hideBehind(B, b.weight, 'A', new Set(target.flatMap((p, k) => p.behind.filter((r) => r.part === j).map(() => toTrack[k]))));
    if (hide) {
      // Emerges from behind a body that hides it now.
      const r = hide.r;
      const holesA = holes.map((h) => h.map((p) => [p[0], p[1]] as Point));
      tracks.push({
        A: hide.pose, B, closed: b.closed, holesA, holesB: holes, from: traits(b), to: traits(b),
        carriage: carriageOf(hide.pose, B, holesA, holes), window: ARRIVE, move: 'emerge', body: b.body,
        material: materialOf(b), travel: meanTravel(hide.pose, B), behind: [{ track: hide.track, rA: r, rB: r }], inside: [], z: n + j,
      });
      continue;
    }
    // Buds from where it attaches now: the nearest point of a staying part, on screen at the start.
    const anchor = anchorFor(B, 'A', staying, from);
    const host = anchorPoint(anchor, 'A');
    tracks.push({
      A: B, B, closed: b.closed, holesA: holes, holesB: holes, anchor, window: ARRIVE, move: 'bud', body: b.body,
      from: { weight: Math.min(b.weight, hostWeight(anchor, 'from')), tint: 0, solid: b.solid, opacity: b.opacity },
      to: traits(b), material: materialOf(b), travel: meanTravel(B, B.map(() => host)),
      behind: [], inside: [], z: n + j,
    });
  }
  const hosts = tracks.length;
  for (const i of leaving) {
    const a = from[i];
    const A = resample(a, SAMPLES);
    const holes = holeRings(a.holes);
    fromTrack[i] = tracks.length;
    const hide = hideBehind(A, a.weight, 'B', new Set(from.flatMap((p, k) => p.behind.filter((r) => r.part === i).map(() => fromTrack[k]))));
    if (hide) {
      // Tucks behind a body that will hide it.
      const r = hide.r;
      tracks.push({
        A, B: hide.pose, closed: a.closed, holesA: holes, holesB: holes, from: traits(a), to: traits(a),
        carriage: carriageOf(A, hide.pose, holes, holes), window: LEAVE, move: 'tuck', body: a.body,
        material: materialOf(a), travel: meanTravel(A, hide.pose), behind: [{ track: hide.track, rA: r, rB: r }], inside: [], z: i - n,
      });
      continue;
    }
    // Gathers into where it will rest: the nearest point of the next glyph, staying or arriving.
    const anchor = anchorFor(A, 'B', hosts, target);
    const host = anchorPoint(anchor, 'B');
    tracks.push({
      A, B: A, closed: a.closed, holesA: holes, holesB: holes, anchor, window: LEAVE, move: 'absorb', body: a.body,
      from: traits(a),
      // It ends as a point at its host's weight, inside the host: absorbed, not faded.
      to: { weight: Math.min(a.weight, hostWeight(anchor, 'to')), tint: 0, solid: a.solid, opacity: a.opacity },
      material: materialOf(a), travel: meanTravel(A, A.map(() => host)),
      behind: [], inside: [], z: i - n,
    });
  }

  // E6: depth from both glyphs, each gap lerping from one glyph's value to the other's (0 where absent).
  const addRel = (list: TrackRelation[], track: number, side: 'rA' | 'rB', r: number) => {
    let rel = list.find((x) => x.track === track);
    if (!rel) { rel = { track, rA: 0, rB: 0 }; list.push(rel); }
    rel[side] = Math.max(rel[side], r);
  };
  from.forEach((p, i) => {
    for (const r of p.behind) addRel(tracks[fromTrack[i]].behind, fromTrack[r.part], 'rA', r.r);
    for (const r of p.inside) addRel(tracks[fromTrack[i]].inside, fromTrack[r.part], 'rA', r.r);
  });
  target.forEach((p, j) => {
    for (const r of p.behind) addRel(tracks[toTrack[j]].behind, toTrack[r.part], 'rB', r.r);
    for (const r of p.inside) addRel(tracks[toTrack[j]].inside, toTrack[r.part], 'rB', r.r);
  });

  // E10: strain.
  const total = tracks.reduce((s, t) => s + t.material, 0) || 1;
  const loneShare = tracks.reduce((s, t) => s + (t.move === 'bud' || t.move === 'absorb' ? t.material : t.move === 'tuck' || t.move === 'emerge' ? t.material / 2 : 0), 0) / total;
  const topology = tracks.filter((t) => ['open', 'close', 'press', 'unfold'].includes(t.move) || (t.from.weight === 0) !== (t.to.weight === 0)).length / tracks.length;
  const travel = tracks.reduce((s, t) => s + t.material * t.travel, 0) / total;
  const traitOf = (t: MorphTrack) => 0.5 * Math.min(4, Math.abs(t.from.weight - t.to.weight)) + 2 * Math.abs(t.from.tint - t.to.tint) + Math.abs(t.from.solid - t.to.solid);
  const traitsShare = tracks.reduce((s, t) => s + t.material * traitOf(t), 0) / total;
  let pairs = 0, crossed = 0;
  for (let i = 0; i < tracks.length; i++) {
    for (let j = i + 1; j < tracks.length; j++) {
      pairs++;
      const a = tracks[i], b = tracks[j];
      if (crosses(centroid(a.A), centroid(a.B), centroid(b.A), centroid(b.B))) crossed++;
    }
  }
  const crossing = pairs ? crossed / pairs : 0;
  const strain: MorphStrain = {
    travel, lone: loneShare, topology, traits: traitsShare, crossing, turn: turn !== undefined,
    total: travel * STRAIN.travel + loneShare * STRAIN.lone + topology * STRAIN.topology + traitsShare * STRAIN.traits + crossing * STRAIN.crossing + (turn !== undefined ? STRAIN.turn : 0),
  };
  return { tracks, turn, strain, costs: c };
}

const mix = (a: number, b: number, p: number) => a + (b - a) * p;
const mixPt = (a: Point, b: Point, p: number): Point => [mix(a[0], b[0], p), mix(a[1], b[1], p)];
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const areaOf = (pts: Point[]) => {
  let s = 0;
  for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; s += p[0] * q[1] - q[0] * p[1]; }
  return Math.abs(s) / 2;
};

/** The glyph at progress p (0 → 1; a spring may pass 1 slightly). */
export function morphAt(plan: MorphPlan, p: number): MorphFrame {
  const parts: MorphPart[] = [];
  for (const t of plan.tracks) {
    const [w0, w1] = t.window;
    const q = t.window === STAY ? p : clamp01((p - w0) / (w1 - w0));
    let points: Point[], holes: Point[][];
    const a = t.anchor;
    if (a) {
      // The anchor rides its host as drawn in this frame, so the part stays attached to it.
      const host = 'track' in a ? parts[a.track].points[a.index] : a.point;
      const arriving = t.window === ARRIVE;
      const move = (v: Point) => (arriving ? mixPt(host, v, q) : mixPt(v, host, q));
      points = (arriving ? t.B : t.A).map(move);
      holes = t.holesA.map((h) => h.map(move));
    } else if (t.carriage) {
      const cg = t.carriage;
      points = ride(cg, cg.local, cg.res, q);
      holes = cg.holesLocal.map((h, k) => ride(cg, h, cg.holesRes[k], q));
    } else {
      points = t.A.map((v, i) => mixPt(v, t.B[i], q));
      holes = t.holesA.map((h, k) => h.map((v, i) => mixPt(v, t.holesB[k][i], q)));
    }
    // E5: solid ink is conserved. A solid spreading over more area thins in proportion; one
    // gathering into less stays solid.
    let solid = t.from.solid;
    if (t.from.solid !== t.to.solid) {
      const inkA = t.from.solid * areaOf(t.A), inkB = t.to.solid * areaOf(t.B), now = areaOf(points);
      solid = now > 0.05 ? clamp01(mix(inkA, inkB, q) / now) : clamp01(mix(t.from.solid, t.to.solid, q));
    }
    parts.push({
      points,
      closed: t.closed,
      holes,
      weight: Math.max(0, mix(t.from.weight, t.to.weight, q)),
      tint: Math.max(0, mix(t.from.tint, t.to.tint, q)),
      solid,
      opacity: clamp01(mix(t.from.opacity, t.to.opacity, q)),
      corners: [],
      bead: false,
      body: t.body,
      behind: t.behind.map((r) => ({ part: r.track, r: Math.max(0, mix(r.rA, r.rB, p)) })),
      inside: t.inside.map((r) => ({ part: r.track, r: Math.max(0, mix(r.rA, r.rB, p)) })),
    });
  }
  // E8: the whole glyph turns on its axis; edge-on at the half turn.
  if (plan.turn !== undefined) {
    const k = Math.cos(Math.PI * p), axis = plan.turn;
    const turn = (v: Point): Point => (axis === 0 ? [GRID_CENTER + (v[0] - GRID_CENTER) * k, v[1]] : [v[0], GRID_CENTER + (v[1] - GRID_CENTER) * k]);
    for (const part of parts) { part.points = part.points.map(turn); part.holes = part.holes.map((h) => h.map(turn)); }
  }
  // Draw in depth order, with relations pointing at the drawn indices.
  const order = plan.tracks.map((_, i) => i).sort((a, b) => plan.tracks[a].z - plan.tracks[b].z);
  const at = new Array<number>(order.length);
  order.forEach((track, i) => { at[track] = i; });
  return order.map((track) => {
    const part = parts[track];
    return { ...part, behind: part.behind.map((r) => ({ part: at[r.part], r: r.r })), inside: part.inside.map((r) => ({ part: at[r.part], r: r.r })) };
  });
}

/** The strain of a plan: how far from smooth its morph is (E10). */
export const morphStrain = (plan: MorphPlan): MorphStrain => plan.strain;

const f = (n: number) => +n.toFixed(3);
const ringPath = (pts: Point[], close: boolean) => 'M' + pts.map((q) => `${f(q[0])} ${f(q[1])}`).join('L') + (close ? 'Z' : '');

/** SVG path data for a part: its authored path at rest, its points in motion. */
export function morphPath(part: MorphPart): string {
  if (part.path) return part.path;
  return morphOutline(part) + part.holes.map((h) => ringPath(h, true)).join('');
}

/** The part's outer contour alone: its body, for the clearance it casts. */
export function morphOutline(part: MorphPart): string {
  if (part.path) return part.path.split(/(?=M)/)[0];
  // A lone point still needs a segment to draw its round cap.
  return part.points.length === 1 ? `M${f(part.points[0][0])} ${f(part.points[0][1])}l0 0` : ringPath(part.points, part.closed);
}

/** Damped spring progress (mass 1) at time t seconds. */
export function springAt(k: number, c: number, t: number) {
  const w0 = Math.sqrt(k), z = c / (2 * Math.sqrt(k));
  if (z >= 1) return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
  const wd = w0 * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + ((z * w0) / wd) * Math.sin(wd * t));
}
