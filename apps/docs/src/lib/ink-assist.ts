/* ─────────────────────────────────────────────────────────
 * ASSISTED INK: a hand on the elbow, not a hand that draws
 *
 * The prototype of the stroke assist an app's ink engine can run on every platform. The tip of the
 * ink is always exactly under the pen (no lag), and the ink just behind it levels out, like wet ink
 * behind a nib. Nothing snaps: a point only levels while it is within a few samples of the pen,
 * and never moves again after that.
 *
 *   landing   a pen flicks as it lands: if the first ~3 px run against the stroke, the flick is
 *             dropped and the stroke starts at the turning point
 *   settling  each point becomes a Gaussian average of its neighbours in time, both behind and
 *             ahead (sigma `settleMs`), so shake is removed without lag. The newest points level as
 *             the pen moves on; the first and last points are pinned, so the stroke starts where it
 *             landed and ends exactly where it was lifted
 *   corners   a turn past `corner` degrees, judged over ~8 px on a lightly levelled copy and only
 *             where the pen slowed into it (a hand slows into a real corner; a tremor does not),
 *             splits the stroke, so settling never rounds the point of a v or a k
 *   width     pressure settles the same way, so the width does not wobble
 *
 * Measured against an 8 Hz tremor and 60 Hz mouse input (the lab on the Brush cursor page):
 * pen settling at 36 ms takes wobble from 2.68 to about 1 (clean writing is 0.59) and mouse
 * jitter from 6.8 to 1.3, keeps a v's apex within 0.4 px, and moves ink older than ~12 samples by
 * at most 0.3 px. Filters that only see the past (a pulled string, a damped spring, One Euro)
 * reached 1.4–1.5 at best and lagged a quick stroke by 7–14 px.
 * ───────────────────────────────────────────────────────── */

import type { StrokeGuide } from './ink-guide';

export interface InkSample { x: number; y: number; t: number; pressure: number }

export interface AssistParams {
  /** Ms. How far in time each point looks for its neighbours: more levels shake further. */
  settleMs: number;
  /** Degrees. A turn this sharp, slowed into, is a corner settling will not cross. */
  corner: number;
  /** Px. A landing flick is looked for within this much travel. */
  dehook: number;
  /** Px of path one sigma may cover: smaller keeps fast small letters sharper, larger smooths more. */
  sigmaPx: number;
}

export type AssistTool = 'pen' | 'pencil' | 'marker';

/** Per tool: a pen is helped most in writing; a pencil least, since it is the sketching tool and
 * its texture is the point; a marker's tip is broad, so it levels more and has no corners. */
export const TOOL_ASSIST: Record<AssistTool, AssistParams> = {
  pen: { settleMs: 36, corner: 62, dehook: 8, sigmaPx: 8 },
  pencil: { settleMs: 20, corner: 62, dehook: 4, sigmaPx: 3 },
  marker: { settleMs: 40, corner: 180, dehook: 8, sigmaPx: 6 },
};

/** The assisted stroke for all its raw samples at once (a finished stroke). */
export function assistStroke(raw: InkSample[], p: AssistParams): InkSample[] {
  return settle(densify(dehook(raw, p.dehook)), p);
}

/* Filling gaps. A fast stroke on a 60 Hz mouse, or a dropped event, leaves samples far apart, and a
 * straight chord across the gap flattens a curve (the loop of a y goes straight for a bit). Any gap
 * wider than `GAP` px is filled with points on a centripetal Catmull-Rom curve through the
 * neighbouring samples, with time and pressure interpolated. */
const GAP = 2;

function catmull(p0: InkSample, p1: InkSample, p2: InkSample, p3: InkSample, u: number): InkSample {
  // Centripetal parameterisation (alpha 0.5): no loops or cusps inside a segment.
  const d = (a: InkSample, b: InkSample) => Math.max(1e-3, Math.sqrt(Math.hypot(b.x - a.x, b.y - a.y)));
  const t1 = d(p0, p1), t2 = t1 + d(p1, p2), t3 = t2 + d(p2, p3), t = t1 + (t2 - t1) * u;
  const lerp = (a: InkSample, b: InkSample, ta: number, tb: number) => { const k = (t - ta) / (tb - ta); return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k }; };
  const a1 = lerp(p0, p1, 0, t1), a2 = lerp(p1, p2, t1, t2), a3 = lerp(p2, p3, t2, t3);
  const b1 = { x: a1.x + (a2.x - a1.x) * ((t - 0) / t2), y: a1.y + (a2.y - a1.y) * ((t - 0) / t2) };
  const b2 = { x: a2.x + (a3.x - a2.x) * ((t - t1) / (t3 - t1)), y: a2.y + (a3.y - a2.y) * ((t - t1) / (t3 - t1)) };
  const k = (t - t1) / (t2 - t1);
  return { x: b1.x + (b2.x - b1.x) * k, y: b1.y + (b2.y - b1.y) * k, t: p1.t + (p2.t - p1.t) * u, pressure: p1.pressure + (p2.pressure - p1.pressure) * u };
}

/** The points to insert between raw[i] and raw[i + 1] (not including either). */
function fill(raw: InkSample[], i: number): InkSample[] {
  const p1 = raw[i], p2 = raw[i + 1], gap = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  if (gap <= GAP) return [];
  const p0 = raw[i - 1] ?? { ...p1, x: 2 * p1.x - p2.x, y: 2 * p1.y - p2.y };
  const p3 = raw[i + 2] ?? { ...p2, x: 2 * p2.x - p1.x, y: 2 * p2.y - p1.y };
  const n = Math.ceil(gap / GAP), out: InkSample[] = [];
  for (let k = 1; k < n; k++) out.push(catmull(p0, p1, p2, p3, k / n));
  return out;
}

function densify(raw: InkSample[]): InkSample[] {
  const out: InkSample[] = [];
  for (let i = 0; i < raw.length; i++) { out.push(raw[i]); if (i < raw.length - 1) out.push(...fill(raw, i)); }
  return out;
}

/**
 * A live stroke, assisted as it is written at a flat cost per frame. Settling reaches three sigmas
 * either side, so a point more than `reach` (six sigmas) behind the pen can never change again: it
 * is frozen once and never recomputed. Each frame settles only the live tail, starting `reach`
 * earlier so the tail's start is not pinned where the real stroke has no end.
 */
export class LiveInk {
  private raw: InkSample[] = [];
  private landed: InkSample[] | null = null; // the stroke after its landing flick, judged once
  private dense: InkSample[] = []; // `landed` with its gaps filled; the newest segment stays open until the next sample
  private frozen: InkSample[] = [];
  private start = 0; // index in `landed` of the first point not yet frozen
  private arc: number[] = []; // arc position of each filled point
  /** `guide`: the word's pull toward its line (ink-guide.ts), applied to the live tail only. */
  constructor(private p: AssistParams, private guide?: StrokeGuide) {}
  get guided(): StrokeGuide | undefined { return this.guide; }

  push(s: InkSample) {
    this.raw.push(s);
    if (this.landed) this.landed.push(s);
    else if (travel(this.raw) >= this.p.dehook + 12) this.landed = dehook(this.raw, this.p.dehook).slice();
    else return;
    // Close the segment before the newest one: its curve needs the sample after it.
    const L = this.landed, closed = this.dense.length ? this.closedTo : 0;
    if (!this.dense.length) this.dense.push(L[0]);
    for (let i = closed; i < L.length - 2; i++) { this.dense.push(...fill(L, i), L[i + 1]); this.closedTo = i + 1; }
    if (!this.guide) return;
    const D = this.dense, A = this.arc;
    for (let i = A.length; i < D.length; i++) A.push(i ? A[i - 1] + Math.hypot(D[i].x - D[i - 1].x, D[i].y - D[i - 1].y) : 0);
    this.guide.scan(D, A, A[Math.min(this.start, A.length - 1)] ?? 0);
  }
  private closedTo = 0;

  /** The assisted stroke so far: the frozen part (never changes) and the live tail. */
  read(at?: number): { frozen: InkSample[]; tail: InkSample[] } {
    // (With a guide, the finished stroke is the last read, frozen plus tail: the pull stays as it was.)
    if (!this.landed) return { frozen: [], tail: settle(densify(dehook(this.raw, this.p.dehook)), this.p) };
    // The filled points, then the newest (still open) segment as it stands.
    const L = this.landed, pts = L.length > 1 ? this.dense.concat(fill(L, L.length - 2), L[L.length - 1]) : this.dense;
    const last = pts[pts.length - 1].t, reach = this.p.settleMs * 6, now = Math.max(last, at ?? last);
    let from = this.start;
    while (from > 0 && pts[this.start].t - pts[from - 1].t < reach) from--;
    const settled = settle(pts.slice(from), this.p);
    if (this.guide) {
      // The pull, on the ink not yet frozen: vertical only, and none at the tip.
      // After the lift (`at` past the last sample) the pull keeps arriving, tapered to nothing over
      // the last half x-height, so the stroke still ends where the pen lifted.
      const A = this.arc, D = this.dense.length, G = this.guide;
      const S: number[] = [];
      for (let i = this.start, s = A[Math.min(this.start, D - 1)] ?? 0; i < pts.length; i++) {
        if (i >= D) s += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
        else s = A[i];
        S.push(s);
      }
      const sEnd = S[S.length - 1] ?? 0, fade = 0.5 * G.xHeight;
      for (let i = this.start; i < pts.length; i++) {
        const s = S[i - this.start];
        let dy = G.offset(s, pts[i].t, now);
        if (now > last) { const d0 = G.offset(s, pts[i].t, last); dy = d0 + Math.min(1, (sEnd - s) / fade) * (dy - d0); }
        if (dy) settled[i - from] = { ...settled[i - from], y: settled[i - from].y + dy };
      }
    }
    let to = this.start;
    while (to < pts.length - 1 && now - pts[to].t > reach) to++;
    if (to > this.start) { this.frozen.push(...settled.slice(this.start - from, to - from)); this.start = to; }
    return { frozen: this.frozen, tail: settled.slice(this.start - from) };
  }
}

function travel(pts: InkSample[]) {
  let d = 0;
  for (let i = 1; i < pts.length; i++) d += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  return d;
}

// A flick: as a pen lands it moves a little against the way the stroke then goes. Compare the
// direction of the first ~3 px with the direction of the next ~12 px; if they oppose (over ~107°),
// the stroke starts at the turning point (the point furthest back along the later direction).
function dehook(pts: InkSample[], limit: number): InkSample[] {
  if (pts.length < 4 || limit <= 0) return pts;
  let d = 0, k = 0;
  for (let i = 1; i < pts.length; i++) { d += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); if (d >= 3) { k = i; break; } }
  if (!k || k >= pts.length - 1) return pts;
  let e = k; d = 0;
  while (e < pts.length - 1 && d < 12) { d += Math.hypot(pts[e + 1].x - pts[e].x, pts[e + 1].y - pts[e].y); e++; }
  const ax = pts[k].x - pts[0].x, ay = pts[k].y - pts[0].y;
  const bx = pts[e].x - pts[k].x, by = pts[e].y - pts[k].y, bl = Math.hypot(bx, by), al = Math.hypot(ax, ay);
  if (bl < 1 || al < 1 || (ax * bx + ay * by) / (al * bl) > -0.3) return pts;
  let back = Infinity, at = 0; d = 0;
  for (let i = 0; i < pts.length; i++) {
    if (i) d += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    if (d > limit) break;
    const along = (pts[i].x * bx + pts[i].y * by) / bl;
    if (along < back) { back = along; at = i; }
  }
  return pts.slice(at);
}

/** Corners: where a turn past `corner` degrees, judged over ~8 px on a lightly levelled copy (so a
 * tremor's wiggle is not a corner), is one the pen slowed into (a hand slows into a real corner; a
 * tremor does not). Returns the sample indices. */
export function cornerCuts(raw: InkSample[], corner: number, settleMs: number): number[] {
  if (raw.length < 5) return [];
  const soft = raw.map((p) => {
    let x = 0, y = 0, w = 0;
    for (const q of raw) { const dt = q.t - p.t; if (Math.abs(dt) > settleMs) continue; const k = Math.exp(-(dt * dt) / (2 * (settleMs / 2) ** 2)); x += k * q.x; y += k * q.y; w += k; }
    return { x: x / w, y: y / w, t: p.t };
  });
  const cosLimit = Math.cos((corner * Math.PI) / 180);
  const dirAt = (i: number, step: number) => {
    let j = i, d = 0;
    while (j + step >= 0 && j + step < soft.length && d < 8) { d += Math.hypot(soft[j + step].x - soft[j].x, soft[j + step].y - soft[j].y); j += step; }
    const dx = soft[j].x - soft[i].x, dy = soft[j].y - soft[i].y, l = Math.hypot(dx, dy);
    return l > 3 ? { u: [dx / l, dy / l], speed: d / Math.max(1, Math.abs(soft[j].t - soft[i].t)) } : null;
  };
  const cuts: number[] = [];
  for (let i = 2; i < raw.length - 2; i++) {
    const a = dirAt(i, -1), b = dirAt(i, 1);
    if (!a || !b || (cuts.length && i - cuts[cuts.length - 1] <= 3)) continue;
    const turned = -(a.u[0] * b.u[0] + a.u[1] * b.u[1]) < cosLimit;
    const here = Math.hypot(soft[i + 1].x - soft[i - 1].x, soft[i + 1].y - soft[i - 1].y) / Math.max(1, soft[i + 1].t - soft[i - 1].t);
    if (turned && here < 0.75 * Math.max(a.speed, b.speed)) cuts.push(i);
  }
  // Settle each piece between corners; its ends are pinned.
  return cuts;
}

const SIGMA_MIN = 6;

function settle(raw: InkSample[], { settleMs, corner, sigmaPx }: AssistParams): InkSample[] {
  if (raw.length < 3 || settleMs <= 0) return raw.map((p) => ({ ...p }));
  const cuts = cornerCuts(raw, corner, settleMs);
  // Speed-adaptive: a point's sigma covers at most `sigmaPx` of path, so a fast, small letter (an s)
  // keeps its shape while slow, shaky writing gets the full `settleMs`.
  const sigmaAt = raw.map((p, i) => {
    const a = raw[Math.max(0, i - 2)], b = raw[Math.min(raw.length - 1, i + 2)];
    const speed = Math.hypot(b.x - a.x, b.y - a.y) / Math.max(1, b.t - a.t);
    return Math.max(SIGMA_MIN, Math.min(settleMs, sigmaPx / Math.max(1e-3, speed)));
  });
  const out: InkSample[] = [];
  let from = 0;
  for (const to of [...cuts, raw.length - 1]) {
    for (let i = from; i <= to; i++) {
      if (out.length && i === from) continue; // a corner point is shared by two pieces
      if (i === from || i === to) { out.push({ ...raw[i] }); continue; }
      let wx = 0, wy = 0, wp = 0, ws = 0;
      const sig = sigmaAt[i], sig2 = 2 * sig * sig;
      for (let j = from; j <= to; j++) {
        const dt = raw[j].t - raw[i].t;
        if (Math.abs(dt) > sig * 3) continue;
        const w = Math.exp(-(dt * dt) / sig2);
        wx += w * raw[j].x; wy += w * raw[j].y; wp += w * raw[j].pressure; ws += w;
      }
      // Near a pinned end the window is one-sided; blend toward the raw point so ends do not pull in.
      const k = Math.min(1, Math.min(raw[i].t - raw[from].t, raw[to].t - raw[i].t) / (sig * 2));
      out.push({ x: raw[i].x + (wx / ws - raw[i].x) * k, y: raw[i].y + (wy / ws - raw[i].y) * k, t: raw[i].t, pressure: raw[i].pressure + (wp / ws - raw[i].pressure) * k });
    }
    from = to;
  }
  return out;
}

/* The ink's outline: a filled shape around the centre line whose radius follows pressure, with a
 * tapered start and end (the core's outline, simplified). */
export function outlinePath(pts: InkSample[], size: number, thinning: number, taper: number, ends: { start?: boolean; end?: boolean } = { start: true, end: true }): string {
  if (pts.length < 2) {
    const p = pts[0]; if (!p) return '';
    const r = size / 2;
    return `M${p.x - r} ${p.y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
  }
  const lens = [0];
  for (let i = 1; i < pts.length; i++) lens.push(lens[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const total = lens[lens.length - 1] || 1;
  const left: [number, number][] = [], right: [number, number][] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let tx = b.x - a.x, ty = b.y - a.y; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
    let r = (size / 2) * (1 - thinning + thinning * 2 * pts[i].pressure);
    if (taper > 0) {
      const s = ends.start === false ? 1 : Math.min(1, lens[i] / taper), e = ends.end === false ? 1 : Math.min(1, (total - lens[i]) / taper);
      r *= s * (2 - s) * (1 - (1 - e) ** 3);
    }
    r = Math.max(0.3, r);
    left.push([pts[i].x - ty * r, pts[i].y + tx * r]);
    right.push([pts[i].x + ty * r, pts[i].y - tx * r]);
  }
  const ring = [...left, ...right.reverse()];
  // Smooth through midpoints so the outline has no facets.
  let d = `M${ring[0][0].toFixed(2)} ${ring[0][1].toFixed(2)}`;
  for (let i = 1; i < ring.length; i++) {
    const [x0, y0] = ring[i], [x1, y1] = ring[(i + 1) % ring.length];
    d += `Q${x0.toFixed(2)} ${y0.toFixed(2)} ${((x0 + x1) / 2).toFixed(2)} ${((y0 + y1) / 2).toFixed(2)}`;
  }
  return d + 'Z';
}
