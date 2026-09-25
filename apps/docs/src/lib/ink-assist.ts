/* ─────────────────────────────────────────────────────────
 * ASSISTED INK: a hand on the elbow, not a hand that draws
 *
 * The prototype of the stroke assist an app's ink engine can run on every platform. It helps
 * while the stroke is being made and never moves ink after it is drawn: every output sample is
 * appended, nothing is redrawn, so there is no snap.
 *
 *   landing   a pen skids as it lands: if the stroke reverses within its first `dehook` px, the
 *             skid is dropped and the stroke starts where the hand really set off
 *   steady    a pulled string: the ink moves only when the pen pulls a short string taut, so any
 *             wobble smaller than the string never reaches it. The string is long when the pen
 *             moves slowly (`string` px, a tremor's reach) and shrinks to nothing by `sure` px/s,
 *             so a quick, sure stroke is not held back. A light One Euro filter smooths on top.
 *   corners   a sharp turn (over `corner` degrees across a few px) opens the cutoff by
 *             `cornerBoost` for a moment, so the point of a v or a k stays a point
 *   width     pressure has its own low-pass (`pressureCutoff`), so the width does not wobble
 *   letting go  the ink trails the pen slightly; on release the string goes slack and the ink walks
 *             on toward the lift point in 8 ms steps until it is there, so the stroke ends where
 *             the hand stopped, growing into place over a few frames
 * ───────────────────────────────────────────────────────── */

export interface InkSample { x: number; y: number; t: number; pressure: number }

export interface AssistParams {
  /** Px. The string's length when the pen moves slowly: wobble smaller than this never reaches the ink. */
  string: number;
  /** Px/s. From this speed on the string is gone: a sure stroke is not held back. */
  sure: number;
  /** Hz. The cutoff at rest: lower steadies more (a shaky hand), higher follows more. */
  minCutoff: number;
  /** How fast the cutoff opens with speed: higher gets out of the way sooner. */
  beta: number;
  /** Hz. The cutoff for the speed estimate itself. */
  dCutoff: number;
  /** Degrees. A turn this sharp counts as a corner. */
  corner: number;
  /** How much the cutoff opens at a corner. */
  cornerBoost: number;
  /** Px. A reversal within this much travel from the landing is a skid. */
  dehook: number;
  /** Hz. The cutoff for pressure. */
  pressureCutoff: number;
}

export type AssistTool = 'pen' | 'pencil' | 'marker';

/** Per tool, measured in the lab: for the pen, a 2.6 px string gone by 900 px/s with a 3 Hz filter
 * removes about 55% of an 8 Hz tremor's wobble and lags a quick stroke by about 7 px; longer
 * strings add kinks and lag without steadying more. A pen is helped most in writing, a pencil least (it is the sketching tool), a marker
 * sits between and never needs corners (its tip is broad). */
export const TOOL_ASSIST: Record<AssistTool, AssistParams> = {
  pen: { string: 2.6, sure: 900, minCutoff: 3, beta: 0.02, dCutoff: 1, corner: 62, cornerBoost: 6, dehook: 8, pressureCutoff: 3 },
  pencil: { string: 1.2, sure: 700, minCutoff: 4, beta: 0.03, dCutoff: 1, corner: 62, cornerBoost: 4, dehook: 4, pressureCutoff: 5 },
  marker: { string: 3, sure: 900, minCutoff: 3, beta: 0.02, dCutoff: 1, corner: 180, cornerBoost: 1, dehook: 8, pressureCutoff: 2 },
};

const TAU = Math.PI * 2;
const alphaOf = (cutoff: number, dt: number) => 1 / (1 + 1 / (TAU * cutoff * dt));

/** One stroke's assist: push raw samples as they arrive, read the assisted ones back. */
export class Assist {
  private p: AssistParams;
  private landing: InkSample[] = [];
  private landed = false;
  private last: InkSample | null = null;
  private lastT = 0;
  private fx = 0; private fy = 0; private dx = 0; private dy = 0; private fp = 0.5;
  private sx = 0; private sy = 0; // the string's end: where the ink is pulled to
  private dirs: [number, number][] = [];
  private boost = 0;

  constructor(params: AssistParams) { this.p = params; }

  /** A raw sample in; the assisted samples it releases out (none while landing is being judged). */
  push(s: InkSample): InkSample[] {
    if (!this.landed) {
      this.landing.push(s);
      if (travel(this.landing) < this.p.dehook * 2) return [];
      this.landed = true;
      const start = dehook(this.landing, this.p.dehook);
      this.fx = this.sx = start[0].x; this.fy = this.sy = start[0].y; this.fp = start[0].pressure;
      this.last = start[0];
      this.lastT = start[0].t;
      const out = [{ ...start[0] }];
      for (const q of start.slice(1)) out.push(this.step(q));
      return out;
    }
    return [this.step(s)];
  }

  /** On release: the ink walks on to the lift point in 8 ms steps until it is there. */
  drain(): InkSample[] {
    if (!this.landed) return this.landing.map((s) => ({ ...s }));
    const end = this.last!;
    const out: InkSample[] = [];
    for (let i = 0; i < 30 && Math.hypot(end.x - this.fx, end.y - this.fy) > 0.25; i++) {
      out.push(this.step({ ...end, t: end.t + 8 * (i + 1) }, true));
    }
    out.push({ x: end.x, y: end.y, t: end.t + 8 * (out.length + 1), pressure: this.fp });
    return out;
  }

  private step(s: InkSample, draining = false): InkSample {
    const prev = this.last!;
    const dt = Math.min(0.1, Math.max(0.001, (s.t - this.lastT) / 1000));
    this.lastT = s.t;
    // Speed estimate, itself low-passed (still while draining: the pen has stopped).
    const vx = draining ? 0 : (s.x - prev.x) / dt, vy = draining ? 0 : (s.y - prev.y) / dt;
    const ad = alphaOf(this.p.dCutoff, dt);
    this.dx += ad * (vx - this.dx); this.dy += ad * (vy - this.dy);
    // A corner opens the cutoff for a moment (it decays over the next few samples).
    if (!draining && this.isCorner(s)) this.boost = 1;
    const cornerGain = 1 + (this.p.cornerBoost - 1) * this.boost;
    // The string: long when slow, gone when sure, slack when letting go (or at a corner).
    const speed = Math.hypot(this.dx, this.dy);
    const reach = draining ? 0 : this.p.string * Math.max(0, 1 - speed / this.p.sure) * (1 - this.boost);
    const gx = s.x - this.sx, gy = s.y - this.sy, gl = Math.hypot(gx, gy);
    if (gl > reach) { this.sx = s.x - (gx / gl) * reach; this.sy = s.y - (gy / gl) * reach; }
    const cutoff = (this.p.minCutoff + this.p.beta * speed) * cornerGain;
    const a = alphaOf(cutoff, dt);
    this.fx += a * (this.sx - this.fx); this.fy += a * (this.sy - this.fy);
    this.fp += alphaOf(this.p.pressureCutoff, dt) * (s.pressure - this.fp);
    this.boost *= 0.6;
    if (!draining) this.last = s;
    return { x: this.fx, y: this.fy, t: s.t, pressure: this.fp };
  }

  // A corner: the raw direction over the last few px turns by more than `corner` degrees.
  private isCorner(s: InkSample) {
    const prev = this.last!;
    const len = Math.hypot(s.x - prev.x, s.y - prev.y);
    if (len < 0.5) return false;
    this.dirs.push([(s.x - prev.x) / len, (s.y - prev.y) / len]);
    if (this.dirs.length > 6) this.dirs.shift();
    if (this.dirs.length < 6) return false;
    const [a, b] = [avg(this.dirs.slice(0, 3)), avg(this.dirs.slice(3))];
    const cos = a[0] * b[0] + a[1] * b[1];
    return cos < Math.cos((this.p.corner * Math.PI) / 180);
  }
}

function avg(v: [number, number][]): [number, number] {
  const x = v.reduce((s, d) => s + d[0], 0), y = v.reduce((s, d) => s + d[1], 0), l = Math.hypot(x, y) || 1;
  return [x / l, y / l];
}

function travel(pts: InkSample[]) {
  let d = 0;
  for (let i = 1; i < pts.length; i++) d += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  return d;
}

// A skid: as a pen lands it flicks a little against the way the stroke then goes. Compare the
// direction of the first ~3 px with the direction after it; if they oppose (over ~107°), the stroke
// starts at the turning point (the point furthest back along the later direction), within `limit` px.
function dehook(pts: InkSample[], limit: number): InkSample[] {
  let d = 0, k = 0;
  for (let i = 1; i < pts.length; i++) { d += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); if (d >= 3) { k = i; break; } }
  if (!k || k >= pts.length - 1) return pts;
  const ax = pts[k].x - pts[0].x, ay = pts[k].y - pts[0].y, last = pts[pts.length - 1];
  const bx = last.x - pts[k].x, by = last.y - pts[k].y, bl = Math.hypot(bx, by), al = Math.hypot(ax, ay);
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

/* The ink's outline: a filled shape around the centre line whose radius follows pressure, with a
 * tapered start and end (the core's outline, simplified). */
export function outlinePath(pts: InkSample[], size: number, thinning: number, taper: number): string {
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
      const s = Math.min(1, lens[i] / taper), e = Math.min(1, (total - lens[i]) / taper);
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
