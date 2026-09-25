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

export interface InkSample { x: number; y: number; t: number; pressure: number }

export interface AssistParams {
  /** Ms. How far in time each point looks for its neighbours: more levels shake further. */
  settleMs: number;
  /** Degrees. A turn this sharp, slowed into, is a corner settling will not cross. */
  corner: number;
  /** Px. A landing flick is looked for within this much travel. */
  dehook: number;
}

export type AssistTool = 'pen' | 'pencil' | 'marker';

/** Per tool: a pen is helped most in writing; a pencil least, since it is the sketching tool and
 * its texture is the point; a marker's tip is broad, so it levels more and has no corners. */
export const TOOL_ASSIST: Record<AssistTool, AssistParams> = {
  pen: { settleMs: 36, corner: 62, dehook: 8 },
  pencil: { settleMs: 20, corner: 62, dehook: 4 },
  marker: { settleMs: 40, corner: 180, dehook: 8 },
};

/** The assisted stroke for the raw samples so far. Call it again as samples arrive: it is cheap
 * for a stroke's length, and only the newest points change. */
export function assistStroke(raw: InkSample[], p: AssistParams): InkSample[] {
  return settle(dehook(raw, p.dehook), p);
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

function settle(raw: InkSample[], { settleMs, corner }: AssistParams): InkSample[] {
  if (raw.length < 3 || settleMs <= 0) return raw.map((p) => ({ ...p }));
  // Corners, judged on a lightly levelled copy so a tremor's wiggle is not a corner.
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
  const out: InkSample[] = [];
  const sig2 = 2 * settleMs * settleMs;
  let from = 0;
  for (const to of [...cuts, raw.length - 1]) {
    for (let i = from; i <= to; i++) {
      if (out.length && i === from) continue; // a corner point is shared by two pieces
      if (i === from || i === to) { out.push({ ...raw[i] }); continue; }
      let wx = 0, wy = 0, wp = 0, ws = 0;
      for (let j = from; j <= to; j++) {
        const dt = raw[j].t - raw[i].t;
        if (Math.abs(dt) > settleMs * 3) continue;
        const w = Math.exp(-(dt * dt) / sig2);
        wx += w * raw[j].x; wy += w * raw[j].y; wp += w * raw[j].pressure; ws += w;
      }
      // Near a pinned end the window is one-sided; blend toward the raw point so ends do not pull in.
      const k = Math.min(1, Math.min(raw[i].t - raw[from].t, raw[to].t - raw[i].t) / (settleMs * 2));
      out.push({ x: raw[i].x + (wx / ws - raw[i].x) * k, y: raw[i].y + (wy / ws - raw[i].y) * k, t: raw[i].t, pressure: raw[i].pressure + (wp / ws - raw[i].pressure) * k });
    }
    from = to;
  }
  return out;
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
