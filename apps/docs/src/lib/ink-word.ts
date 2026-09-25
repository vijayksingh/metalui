/* ─────────────────────────────────────────────────────────
 * WORD SETTLE: a finished word, made better with full context
 *
 * Phase 2 of the ink engine (its design doc, §4.10). Runs once on a
 * finished word (the pen has moved on) over its assisted strokes, and returns where every sample
 * should settle. Sample count and order never change. Steps, in order:
 *
 *   G  frame      the word's baseline (a Theil–Sen line through the bottoms of its letters), its
 *                 x-height and cap height (medians of the tops), and its slant (the median lean of
 *                 its upright runs)
 *   level      a word that climbs or sinks 3–25° turns half way to level (at most 8°), rigidly
 *   H  straighten the drawn baseline wanders; every sample moves by the wander (at most 0.6
 *                 x-height), so the word sits on its line; whole letters move, shapes are kept
 *   J  size       letter parts whose tops are near the x-line (or the cap line) grow or shrink 30%
 *                 of the way toward it, about the baseline
 *   K  slant      letter parts lean 30% of the way toward the word's slant, at most 6°
 *   L  legs       straight legs going the same way (an N's two uprights) turn halfway toward their
 *                 mean angle, at most 8°; a leg that stops 0.15–0.35 x-height short of its tallest
 *                 sibling is extended to that height (never trimmed)
 *   N  do no harm reshaping (size, slant, legs) moves each point at most min(0.3 x-height, 8 px); if its p95 exceeds
 *                 0.2 x-height the gains are halved once, then only H is kept; if the median move is
 *                 under 0.35 px nothing is returned (clean writing is left alone); ascenders and
 *                 descenders are only straightened; strokes that are not letters are left out, and a
 *                 word whose x-height is outside 4–60 px is a drawing and is not settled; the typical
 *                 point moves at most 0.1 x-height
 *   trust         a word is settled only when its frame is clear: 3+ bottoms on the line, scattered
 *                 under 0.25 x-height, a tilt under 10°; otherwise it is left exactly as written
 * ───────────────────────────────────────────────────────── */

import { cornerCuts, type InkSample } from './ink-assist';

export interface WordParams {
  straightenGain: number; straightenClampXh: number;
  sizeGain: number; sizeClampXh: number;
  slantGain: number; slantClampDeg: number;
  legGain: number; legClampDeg: number; legExtendMaxXh: number;
  budgetPointXh: number; budgetPointPx: number; budgetP95Xh: number; silencePx: number;
  /** Screen px. A word's x-height outside this range is not handwriting. */
  xHeightMinPx: number; xHeightMaxPx: number;
  /** The typical point may move at most this many x-heights. */
  budgetP50Xh: number;
  /** Trust: bottoms scatter at most this many x-heights (RMS) around the line; the line tilts at most this. */
  trustSpreadXh: number; trustTiltDeg: number;
  /** Levelling: a word tilted between min and max degrees turns `levelGain` of the way to level, at most clamp. */
  levelGain: number; levelMinDeg: number; levelMaxDeg: number; levelClampDeg: number;
}

export const WORD_PARAMS: WordParams = {
  straightenGain: 1, straightenClampXh: 0.6,
  sizeGain: 0.3, sizeClampXh: 0.2,
  slantGain: 0.3, slantClampDeg: 6,
  legGain: 0.5, legClampDeg: 8, legExtendMaxXh: 0.35,
  budgetPointXh: 0.3, budgetPointPx: 8, budgetP95Xh: 0.2, silencePx: 0.35,
  xHeightMinPx: 4, xHeightMaxPx: 60,
  budgetP50Xh: 0.1,
  trustSpreadXh: 0.4, trustTiltDeg: 25,
  levelGain: 0.5, levelMinDeg: 3, levelMaxDeg: 25, levelClampDeg: 8,
};

export interface WordFrame {
  /** Baseline: y = a + b·x (screen y grows down). */
  a: number; b: number;
  xHeight: number;
  capHeight: number | null;
  /** Radians from vertical; positive leans right. */
  slant: number;
}

export interface WordSettle { strokes: InkSample[][]; frame: WordFrame; budget: { p50: number; p95: number; max: number } }

/** Why the last word was or was not settled, in plain words (for the lab's readout). */
export let lastWordNote = '';

type Pt = { x: number; y: number };
const median = (v: number[]) => { if (!v.length) return NaN; const s = [...v].sort((p, q) => p - q), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const quantile = (v: number[], q: number) => { const s = [...v].sort((p, r) => p - r); return s[Math.min(s.length - 1, Math.floor(q * s.length))] ?? 0; };
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Tops and bottoms: turning points of y confirmed once the stroke reverses by at least `PROUD` px
 * (a zigzag test, so a broad, flat-topped arch still has its top). Stroke ends count when they are
 * `PROUD` px beyond the next turn. */
const PROUD = 2;
export function extrema(pts: InkSample[]): { tops: number[]; bottoms: number[] } {
  const tops: number[] = [], bottoms: number[] = [];
  if (pts.length < 2) return { tops, bottoms };
  let dir = 0, ext = 0; // dir: +1 going down the screen (toward a bottom), -1 going up
  for (let i = 1; i < pts.length; i++) {
    const y = pts[i].y;
    if (dir === 0) {
      if (Math.abs(y - pts[0].y) >= PROUD) { dir = y > pts[0].y ? 1 : -1; (dir === 1 ? tops : bottoms).push(0); ext = i; }
      continue;
    }
    if (dir === 1) { if (y >= pts[ext].y) ext = i; else if (pts[ext].y - y >= PROUD) { bottoms.push(ext); dir = -1; ext = i; } }
    else { if (y <= pts[ext].y) ext = i; else if (y - pts[ext].y >= PROUD) { tops.push(ext); dir = 1; ext = i; } }
  }
  if (dir === 1) bottoms.push(ext); else if (dir === -1) tops.push(ext);
  return { tops, bottoms };
}

function theilSen(p: Pt[]): { a: number; b: number } {
  const slopes: number[] = [];
  for (let i = 0; i < p.length; i++) for (let j = i + 1; j < p.length; j++) { const dx = p[j].x - p[i].x; if (Math.abs(dx) > 2) slopes.push((p[j].y - p[i].y) / dx); }
  const b = slopes.length ? median(slopes) : 0;
  return { a: median(p.map((q) => q.y - b * q.x)), b };
}

// Upright runs: stretches of about half an x-height whose vertical travel is over twice the
// horizontal. Their lean from vertical (positive leans right), weighted by nothing (medians).
function uprightLeans(pts: InkSample[], span: number): number[] {
  const out: number[] = [];
  let start = 0, d = 0;
  for (let i = 1; i < pts.length; i++) {
    d += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    if (d < span) continue;
    const dx = pts[i].x - pts[start].x, dy = pts[i].y - pts[start].y;
    if (Math.abs(dy) > 2 * Math.abs(dx)) out.push(dy < 0 ? Math.atan2(dx, -dy) : Math.atan2(-dx, dy));
    start = i; d = 0;
  }
  return out;
}

/** G: the word's frame, from all its strokes with equal weights. Null when there is not enough to judge. */
export function fitFrame(strokes: InkSample[][]): WordFrame | null {
  const bottoms: Pt[] = [], tops: Pt[] = [];
  for (const s of strokes) { const e = extrema(s); for (const i of e.bottoms) bottoms.push(s[i]); for (const i of e.tops) tops.push(s[i]); }
  if (bottoms.length < 2 || tops.length < 1) return null;
  let { a, b } = theilSen(bottoms);
  const heights = (line: { a: number; b: number }) => tops.map((t) => line.a + line.b * t.x - t.y).filter((h) => h > 1);
  let xh = median(heights({ a, b }));
  if (!(xh > 2)) return null;
  // Descenders' bottoms (well below the line) do not define it: refit without them.
  const onLine = bottoms.filter((q) => q.y - (a + b * q.x) < 0.6 * xh);
  if (onLine.length >= 2) ({ a, b } = theilSen(onLine));
  const hs = heights({ a, b });
  let body = hs.filter((h) => h <= 1.6 * median(hs));
  xh = median(body.length ? body : hs);
  const caps = hs.filter((h) => h > 1.6 * xh);
  const leans = strokes.flatMap((s) => uprightLeans(s, 0.5 * xh));
  return { a, b, xHeight: xh, capHeight: caps.length ? median(caps) : null, slant: leans.length ? median(leans) : 0 };
}

/** Letters, not a drawing: the stroke's height measured from the word's own baseline (so a word that
 * climbs is still letters) is at most `LETTER_MAX_XH` x-heights (one stroke can carry an ascender and
 * a descender). */
const LETTER_MAX_XH = 6;
function letterLike(st: InkSample[], F: WordFrame): boolean {
  const hs = st.map((q) => F.a + F.b * q.x - q.y);
  return Math.max(...hs) - Math.min(...hs) <= LETTER_MAX_XH * F.xHeight;
}

/** Settles a finished word. Returns null when it is not letters, cannot be judged, or would barely move. */
export function settleWord(strokes: InkSample[][], p: WordParams = WORD_PARAMS, corner = 62, settleMs = 36): WordSettle | null {
  const frame = fitFrame(strokes);
  if (!frame) { lastWordNote = 'left as written: not enough letter tops and bottoms to find its lines'; return null; }
  const xh = frame.xHeight;
  // Handwriting has a handwriting-sized x-height; outside it, this is a drawing (a lone zigzag would
  // otherwise set its own x-height and pass as letters).
  if (xh < p.xHeightMinPx || xh > p.xHeightMaxPx) { lastWordNote = `left as written: an x-height of ${xh.toFixed(0)} px reads as a drawing`; return null; }
  // Trust: only settle a word whose frame is clear. At least 3 bottoms on the line, scattered less
  // than `trustSpreadXh` around it, and a baseline tilted less than `trustTiltDeg`. Otherwise the
  // frame is a guess (a short word with a tall h and a y's tail), and the writing is left alone.
  const B0 = (x: number) => frame.a + frame.b * x;
  const onLine = strokes.flatMap((st) => extrema(st).bottoms.map((i) => st[i].y - B0(st[i].x))).filter((r) => Math.abs(r) < 0.6 * xh);
  const spread = onLine.length ? Math.sqrt(onLine.reduce((a, r) => a + r * r, 0) / onLine.length) : Infinity;
  const trusted = !(onLine.length < 3 || spread > p.trustSpreadXh * xh || Math.abs(Math.atan(frame.b)) > (p.trustTiltDeg * Math.PI) / 180);
  if (!trusted) {
    // Finishing a short leg needs only the letter's own legs, not a trusted baseline: it still runs.
    const out = strokes.map((st) => st.map((q) => ({ ...q })));
    const letterOk = out.map((st) => letterLike(st, frame));
    let extended = false;
    out.forEach((st, k) => { if (letterOk[k] && extendLegs(st, frame, p, corner, settleMs)) extended = true; });
    if (!extended) {
      const why = onLine.length < 3 ? `only ${onLine.length} letter bottoms on the line` : spread > p.trustSpreadXh * xh ? `its bottoms scatter ${(spread / xh).toFixed(2)} x-height around the line (limit ${p.trustSpreadXh})` : `it tilts ${Math.abs(Math.atan(frame.b) * 180 / Math.PI).toFixed(0)}° (steeper than ${p.trustTiltDeg}° reads as deliberate)`;
      lastWordNote = `left as written: its lines are unclear, ${why}`;
      return null;
    }
    lastWordNote = 'a short leg finished; the rest left as written (lines unclear)';
    const m = out.flatMap((st, k) => st.map((q, i) => Math.hypot(q.x - strokes[k][i].x, q.y - strokes[k][i].y)));
    return { strokes: out, frame, budget: { p50: median(m), p95: quantile(m, 0.95), max: Math.max(...m) } };
  }
  // Only letters: a stroke taller than 4 x-heights (from the baseline) is a drawing, left as it is.
  const letter = strokes.map((st) => letterLike(st, frame));
  // Levelling: a word that climbs or sinks a little is turned part of the way to level, about its
  // middle on the baseline. A rigid turn: letter shapes are untouched. A steep word is deliberate.
  const tilt = Math.atan(frame.b), deg = Math.abs(tilt) * 180 / Math.PI;
  let base = strokes;
  if (deg > p.levelMinDeg && deg <= p.levelMaxDeg) {
    const turn = -Math.sign(tilt) * Math.min(p.levelClampDeg, p.levelGain * deg) * Math.PI / 180;
    const xs = strokes.flat().map((q) => q.x), cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = frame.a + frame.b * cx;
    const c = Math.cos(turn), sn = Math.sin(turn);
    base = strokes.map((st, k) => letter[k] ? st.map((q) => ({ ...q, x: cx + (q.x - cx) * c - (q.y - cy) * sn, y: cy + (q.x - cx) * sn + (q.y - cy) * c })) : st.map((q) => ({ ...q })));
  }
  const F = fitFrame(base) ?? frame;
  // Straightening moves whole letters (shapes kept) and has its own clamp; the budget below measures
  // only what reshapes letters (size, slant, legs), against the straightened word.
  const run = (g: number) => settleWith(base, letter, F, p, g, corner, settleMs);
  let r = run(1);
  const reshape = (o: { afterH: InkSample[][]; out: InkSample[][] }) => o.out.flatMap((s, k) => s.map((q, i) => Math.hypot(q.x - o.afterH[k][i].x, q.y - o.afterH[k][i].y)));
  const over = (v: number[]) => quantile(v, 0.95) > p.budgetP95Xh * xh || median(v) > p.budgetP50Xh * xh;
  if (over(reshape(r))) r = run(0.5);
  if (over(reshape(r))) r = run(0);
  const out = r.out;
  // The short leg is finished after the budget: it is a completion, bounded on its own.
  let extended = false;
  out.forEach((st, k) => { if (letter[k] && extendLegs(st, F, p, corner, settleMs)) extended = true; });
  const m = out.flatMap((s, k) => s.map((q, i) => Math.hypot(q.x - strokes[k][i].x, q.y - strokes[k][i].y)));
  if (median(m) < p.silencePx && !extended) { lastWordNote = 'left as written: already neat (it would move under 0.35 px)'; return null; }
  lastWordNote = `settled: tilt ${Math.abs(tilt * 180 / Math.PI).toFixed(0)}°${deg > p.levelMinDeg && deg <= p.levelMaxDeg ? ' levelled half way' : ''}, x-height ${xh.toFixed(0)} px; points moved ${median(m).toFixed(1)} px typically, ${Math.max(...m).toFixed(1)} px at most${extended ? '; a short leg finished' : ''}`;
  return { strokes: out, frame: F, budget: { p50: median(m), p95: quantile(m, 0.95), max: Math.max(...m) } };
}

function settleWith(strokes: InkSample[][], letter: boolean[], F: WordFrame, p: WordParams, gain: number, corner: number, settleMs: number): { afterH: InkSample[][]; out: InkSample[][] } {
  const xh = F.xHeight, B = (x: number) => F.a + F.b * x, H = (q: Pt) => B(q.x) - q.y;
  const outs = strokes.map((s) => s.map((q) => ({ ...q })));

  // H: straighten. The wander is the drawn baseline (bottoms near the line, interpolated) minus the line.
  const nodes: Pt[] = [];
  strokes.forEach((s, k) => { if (!letter[k]) return; for (const i of extrema(s).bottoms) { const r = s[i].y - B(s[i].x); if (Math.abs(r) < 0.6 * xh) nodes.push({ x: s[i].x, y: r }); } });
  nodes.sort((u, v) => u.x - v.x);
  const wander = (x: number) => {
    if (!nodes.length) return 0;
    if (x <= nodes[0].x) return nodes[0].y;
    if (x >= nodes[nodes.length - 1].x) return nodes[nodes.length - 1].y;
    let k = 1; while (nodes[k].x < x) k++;
    const u = (x - nodes[k - 1].x) / Math.max(1e-6, nodes[k].x - nodes[k - 1].x), e = u * u * (3 - 2 * u);
    return nodes[k - 1].y + (nodes[k].y - nodes[k - 1].y) * e;
  };
  outs.forEach((s, k) => { if (!letter[k]) return; for (const q of s) q.y -= clamp(wander(q.x) * p.straightenGain, -p.straightenClampXh * xh, p.straightenClampXh * xh); });
  const afterH = outs.map((st) => st.map((q) => ({ ...q })));
  if (gain === 0) return { afterH, out: outs };

  outs.forEach((s, k) => {
    if (!letter[k]) return;
    // I: letter parts, cut where the stroke touches the baseline.
    const touches = extrema(s).bottoms.filter((i) => Math.abs(s[i].y - B(s[i].x)) <= 0.15 * xh);
    const bounds = [0, ...touches, s.length - 1].filter((v, i, arr) => i === 0 || v > arr[i - 1]);
    for (let n = 0; n < bounds.length - 1; n++) {
      const from = bounds[n], to = bounds[n + 1];
      const piece = s.slice(from, to + 1);
      let top = piece[0]; for (const q of piece) if (q.y < top.y) top = q;
      const hp = H(top);
      const nearX = Math.abs(hp - xh) <= 0.35 * xh, nearCap = F.capHeight !== null && Math.abs(hp - F.capHeight) <= 0.35 * xh;
      if (!nearX && !nearCap) continue; // an ascender or a half-height loop: only straightened
      // J: size, about the baseline.
      const target = nearX ? xh : F.capHeight!;
      if (hp > 1) {
        let scale = 1 + p.sizeGain * gain * (target / hp - 1);
        const change = clamp(hp * (scale - 1), -p.sizeClampXh * xh, p.sizeClampXh * xh);
        scale = 1 + change / hp;
        for (let i = from; i <= to; i++) { const h = H(s[i]); s[i].y = B(s[i].x) - h * scale; }
      }
      // K: slant, sheared about the baseline.
      const leans = uprightLeans(s.slice(from, to + 1), 0.5 * xh);
      if (leans.length) {
        const lim = (p.slantClampDeg * Math.PI) / 180;
        const d = clamp(p.slantGain * gain * (F.slant - median(leans)), -lim, lim);
        for (let i = from; i <= to; i++) s[i].x += Math.tan(d) * H(s[i]);
      }
    }
    // L: legs.
    legs(s, F, p, gain, corner, settleMs);
  });
  return { afterH, out: clampMoves(afterH, outs, xh, p) };
}

type Leg = { from: number; to: number; angle: number; len: number };

// The corner test reports a few neighbouring indices per corner; keep, from each cluster, the index
// where the stroke turns most sharply (over ±3 samples).
function mergedCuts(s: InkSample[], corner: number, settleMs: number): number[] {
  const raw = cornerCuts(s, corner, settleMs), merged: number[] = [];
  const turn = (i: number) => {
    const a = s[Math.max(0, i - 3)], b = s[i], c = s[Math.min(s.length - 1, i + 3)];
    const ux = b.x - a.x, uy = b.y - a.y, vx = c.x - b.x, vy = c.y - b.y, l = Math.hypot(ux, uy) * Math.hypot(vx, vy);
    return l > 0 ? 1 - (ux * vx + uy * vy) / l : 0;
  };
  for (let i = 0; i < raw.length; ) {
    let j = i; while (j + 1 < raw.length && raw[j + 1] - raw[j] <= 6) j++;
    let best = raw[i]; for (let k = i; k <= j; k++) for (let q = raw[k] - 3; q <= raw[k] + 3; q++) if (q > 0 && q < s.length - 1 && turn(q) > turn(best)) best = q;
    merged.push(best); i = j + 1;
  }
  return [0, ...merged, s.length - 1].filter((v, i, arr) => i === 0 || v > arr[i - 1]);
}

// Legs: straight runs between corners (or ends), at least half an x-height long, chord over arc ≥ 0.95
// (a leg with a little tremor is still a leg).
function findLegs(s: InkSample[], xh: number, corner: number, settleMs: number): Leg[] {
  const cuts = mergedCuts(s, corner, settleMs), found: Leg[] = [];
  for (let n = 0; n < cuts.length - 1; n++) {
    const from = cuts[n], to = cuts[n + 1];
    let arc = 0; for (let i = from + 1; i <= to; i++) arc += Math.hypot(s[i].x - s[i - 1].x, s[i].y - s[i - 1].y);
    const dx = s[to].x - s[from].x, dy = s[to].y - s[from].y, chord = Math.hypot(dx, dy);
    if (arc >= 0.5 * xh && chord / arc >= 0.95) found.push({ from, to, angle: Math.atan2(dy, dx), len: chord });
  }
  return found;
}

// Legs going the same way turn toward their mean angle, about the end nearer the baseline.
function legs(s: InkSample[], F: WordFrame, p: WordParams, gain: number, corner: number, settleMs: number) {
  const xh = F.xHeight, B = (x: number) => F.a + F.b * x;
  const cuts = mergedCuts(s, corner, settleMs);
  const found = findLegs(s, xh, corner, settleMs);
  const lim = (p.legClampDeg * Math.PI) / 180, twelve = (12 * Math.PI) / 180;
  const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
  for (const leg of found) {
    const group = found.filter((o) => Math.abs(wrap(o.angle - leg.angle)) <= twelve);
    if (group.length < 2) continue;
    // Parallel: turn toward the group's mean, about the end nearer the baseline.
    const mean = Math.atan2(group.reduce((a, o) => a + Math.sin(o.angle) * o.len, 0), group.reduce((a, o) => a + Math.cos(o.angle) * o.len, 0));
    const turn = clamp(p.legGain * gain * wrap(mean - leg.angle), -lim, lim);
    const pivotAtFrom = s[leg.from].y >= s[leg.to].y;
    const pv = pivotAtFrom ? s[leg.from] : s[leg.to];
    const c = Math.cos(turn), sn = Math.sin(turn);
    const before = { ...(pivotAtFrom ? s[leg.to] : s[leg.from]) };
    for (let i = leg.from; i <= leg.to; i++) { const x = s[i].x - pv.x, y = s[i].y - pv.y; s[i].x = pv.x + x * c - y * sn; s[i].y = pv.y + x * sn + y * c; }
    const moved = pivotAtFrom ? s[leg.to] : s[leg.from];
    carry(s, pivotAtFrom ? leg.to : leg.from, pivotAtFrom ? 1 : -1, moved.x - before.x, moved.y - before.y, cuts);
  }
}

// The short leg (an N's last upright): after the budget, a leg whose free top end stops short of the
// height its sibling reached is extended along itself to that height, its samples re-spaced over the
// new length. Never trimmed; bounded by `legExtendMaxXh`. Returns whether it extended anything.
function extendLegs(s: InkSample[], F: WordFrame, p: WordParams, corner: number, settleMs: number): boolean {
  const xh = F.xHeight, B = (x: number) => F.a + F.b * x;
  const found = findLegs(s, xh, corner, settleMs);
  const twelve = (12 * Math.PI) / 180, wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
  let extended = false;
  for (const leg of found) {
    const group = found.filter((o) => Math.abs(wrap(o.angle - leg.angle)) <= twelve);
    if (group.length < 2) continue;
    const topIdx = s[leg.from].y < s[leg.to].y ? leg.from : leg.to;
    const free = topIdx === 0 || topIdx === s.length - 1;
    if (!free) continue;
    // Equal legs: the target is the tallest sibling leg's height.
    const topOf = (o: Leg) => (s[o.from].y < s[o.to].y ? o.from : o.to);
    const heights = group.filter((o) => o !== leg).map((o) => B(s[topOf(o)].x) - s[topOf(o)].y);
    const reached = heights.length ? Math.max(...heights) : null;
    if (reached == null) continue;
    const topH = B(s[topIdx].x) - s[topIdx].y, gap = reached - topH;
    if (gap <= 0.15 * xh || gap > p.legExtendMaxXh * xh) continue;
    // Extend along the leg to the line; its samples re-spaced linearly over the new length.
    const baseIdx = topIdx === leg.from ? leg.to : leg.from, base = s[baseIdx], tip = s[topIdx];
    const ux = tip.x - base.x, uy = tip.y - base.y, dyNeeded = -gap; // screen y goes up by `gap`
    const k = uy !== 0 ? 1 + dyNeeded / uy : 1;
    const nx = base.x + ux * k, ny = base.y + uy * k;
    const lo = Math.min(leg.from, leg.to), hi = Math.max(leg.from, leg.to);
    const bx = base.x, by = base.y;
    for (let i = lo; i <= hi; i++) { const u = (i - lo) / Math.max(1, hi - lo), f = topIdx === hi ? u : 1 - u; s[i].x = bx + (nx - bx) * f; s[i].y = by + (ny - by) * f; }
    extended = true;
  }
  return extended;
}

// When a leg's end moves, the next leg starts from the new place: its samples take the move, fading to
// nothing at its far end, so the stroke stays joined.
function carry(s: InkSample[], at: number, dir: 1 | -1, dx: number, dy: number, cuts: number[]) {
  const next = dir === 1 ? cuts.find((c) => c > at) ?? s.length - 1 : [...cuts].reverse().find((c) => c < at) ?? 0;
  const n = Math.abs(next - at);
  for (let k = 1; k <= n; k++) { const i = at + dir * k, f = 1 - k / Math.max(1, n); s[i].x += dx * f; s[i].y += dy * f; }
}

// N: the per-point budget. A move larger than min(0.3 x-height, 8 px) is shortened to it.
function clampMoves(src: InkSample[][], out: InkSample[][], xh: number, p: WordParams): InkSample[][] {
  const cap = Math.min(p.budgetPointXh * xh, p.budgetPointPx);
  return out.map((s, k) => s.map((q, i) => {
    const o = src[k][i], dx = q.x - o.x, dy = q.y - o.y, d = Math.hypot(dx, dy);
    return d <= cap ? q : { ...q, x: o.x + (dx * cap) / d, y: o.y + (dy * cap) / d };
  }));
}
