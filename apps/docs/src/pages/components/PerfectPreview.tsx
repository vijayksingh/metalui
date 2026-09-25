import * as React from 'react';
import { PerfectPreview, inkColor } from '@unlocalhosted/metalui';
import reactSource from '../../../../../packages/metalui/src/components/perfect-preview/perfect-preview.tsx?raw';
import agentSource from '../../../../../packages/metalui/src/components/perfect-preview/perfect-preview.agent.md?raw';
import { ComponentPage } from '../../ui/ComponentPage';

/* Draw a rough circle or line and keep the pointer still: the clean shape traces itself, then the
 * stroke morphs into it. Move again before it closes to keep your own stroke. The fit here is a
 * stand-in for the core's shape_recognize: rectangle, ellipse, triangle, line or nothing. */

type P = [number, number];
const N = 96;

function resample(pts: P[], n = N): P[] {
  const d = [0];
  for (let i = 1; i < pts.length; i++) d.push(d[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const L = d[d.length - 1] || 1, out: P[] = [];
  for (let k = 0, j = 0; k < n; k++) {
    const t = (k / (n - 1)) * L;
    while (j < d.length - 2 && d[j + 1] < t) j++;
    const u = (t - d[j]) / (d[j + 1] - d[j] || 1);
    out.push([pts[j][0] + (pts[j + 1][0] - pts[j][0]) * u, pts[j][1] + (pts[j + 1][1] - pts[j][1]) * u]);
  }
  return out;
}

/** Douglas-Peucker: an open stroke reduced to its corners. */
function corners(pts: P[], eps: number): P[] {
  if (pts.length < 3) return pts;
  const [a, b] = [pts[0], pts[pts.length - 1]];
  let far = 0, at = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const d = L ? Math.abs((b[0] - a[0]) * (a[1] - p[1]) - (a[0] - p[0]) * (b[1] - a[1])) / L : Math.hypot(p[0] - a[0], p[1] - a[1]);
    if (d > far) { far = d; at = i; }
  }
  if (far <= eps) return [a, b];
  return [...corners(pts.slice(0, at + 1), eps).slice(0, -1), ...corners(pts.slice(at), eps)];
}

const cross = (o: P, a: P, b: P) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
/** The convex hull (monotone chain), counter-clockwise in screen maths. */
function hull(pts: P[]): P[] {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]), lo: P[] = [], hi: P[] = [];
  for (const q of p) { while (lo.length > 1 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.reverse()) { while (hi.length > 1 && cross(hi[hi.length - 2], hi[hi.length - 1], q) <= 0) hi.pop(); hi.push(q); }
  return [...lo.slice(0, -1), ...hi.slice(0, -1)];
}
const areaOf = (v: P[]) => v.reduce((s, p, i) => s + cross([0, 0], p, v[(i + 1) % v.length]), 0) / 2;

/** The smallest box around the hull, at any tilt: its angle, centre and half sizes. */
function minBox(h: P[]) {
  let best = { area: Infinity, th: 0, cx: 0, cy: 0, hx: 0, hy: 0 };
  for (let i = 0; i < h.length; i++) {
    const a = h[i], b = h[(i + 1) % h.length], th = Math.atan2(b[1] - a[1], b[0] - a[0]), c = Math.cos(th), s = Math.sin(th);
    const u = h.map(([x, y]) => x * c + y * s), w = h.map(([x, y]) => -x * s + y * c);
    const [u0, u1, w0, w1] = [Math.min(...u), Math.max(...u), Math.min(...w), Math.max(...w)];
    const area = (u1 - u0) * (w1 - w0);
    if (area < best.area) {
      const mu = (u0 + u1) / 2, mw = (w0 + w1) / 2;
      best = { area, th, cx: mu * c - mw * s, cy: mu * s + mw * c, hx: (u1 - u0) / 2, hy: (w1 - w0) / 2 };
    }
  }
  // A box within 10° of level is drawn level.
  const q = Math.PI / 2, off = ((best.th % q) + q) % q, lean = off > q / 2 ? off - q : off;
  if (Math.abs(lean) < 0.17) {
    const xs = h.map((p) => p[0]), ys = h.map((p) => p[1]);
    const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    best = { ...best, th: 0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, hx: (x1 - x0) / 2, hy: (y1 - y0) / 2 };
  }
  return best;
}

/** The biggest triangle on the hull's points. */
function bigTriangle(h: P[]): P[] {
  let best: P[] = h.slice(0, 3), area = 0;
  for (let i = 0; i < h.length; i++) for (let j = i + 1; j < h.length; j++) for (let k = j + 1; k < h.length; k++) {
    const a = Math.abs(cross(h[i], h[j], h[k]));
    if (a > area) { area = a; best = [h[i], h[j], h[k]]; }
  }
  return best;
}

/** The biggest quadrilateral on the hull's points (hull order keeps it simple). */
function bigQuad(h: P[]): P[] {
  const v = h.length > 36 ? h.filter((_, i) => i % Math.ceil(h.length / 36) === 0) : h;
  let best: P[] = v.slice(0, 4), area = 0;
  for (let i = 0; i < v.length; i++) for (let j = i + 1; j < v.length; j++) for (let k = j + 1; k < v.length; k++) for (let l = k + 1; l < v.length; l++) {
    const a = Math.abs(areaOf([v[i], v[j], v[k], v[l]]));
    if (a > area) { area = a; best = [v[i], v[j], v[k], v[l]]; }
  }
  return best;
}

/** A closed polygon as N points, going the way the hand went and starting nearest its start. */
function ring(v: P[], stroke: P[]) {
  const poly = Math.sign(areaOf(v)) === Math.sign(areaOf(stroke)) ? v : [...v].reverse();
  const r = resample([...poly, poly[0]], N).slice(0, N - 1), from = stroke[0];
  let at = 0;
  r.forEach((p, i) => { if (Math.hypot(p[0] - from[0], p[1] - from[1]) < Math.hypot(r[at][0] - from[0], r[at][1] - from[1])) at = i; });
  const out = [...r.slice(at), ...r.slice(0, at)];
  return [...out, out[0]];
}

/* A stand-in for the core's shape_recognize. A closed stroke is judged on its convex hull, by
 * measures that do not depend on where it started or how its corners were drawn. Measured on
 * rough hand-drawn shapes (5th / 50th / 95th percentile):
 *                      triangle          rectangle         ellipse
 *   biggest triangle   .73 / .78 / .86   .46 / .48 / .50   .44 / .46 / .47   → triangle ≥ .62
 *   box it fills       .56 / .60 / .64   .87 / .95 / .97   .75 / .78 / .80   → rectangle ≥ .835
 *   biggest 4-gon      .82 / .86 / .91   .82 / .87 / .91   .66 / .67 / .69   → rectangle ≥ .77
 * An open stroke is a line if it stays straight; anything else is kept as drawn. */
const FIT = { closed: 0.35, straight: 0.08, triangle: 0.62, boxFill: 0.835, quad: 0.77, oval: [0.68, 0.835] };

function fit(pts: P[]): P[] | null {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const size = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 1);
  const start = pts[0], end = pts[pts.length - 1];
  if (Math.hypot(start[0] - end[0], start[1] - end[1]) > FIT.closed * size) {
    return corners(pts, FIT.straight * size).length === 2 ? resample([start, end]) : null;
  }
  const h = hull(pts), A = Math.abs(areaOf(h)), box = minBox(h);
  if (!(A > 0) || !(box.hx > 0.08 * size && box.hy > 0.08 * size)) return null;
  const c = Math.cos(box.th), s = Math.sin(box.th), at = (x: number, y: number): P => [box.cx + x * c - y * s, box.cy + x * s + y * c];
  const tri = bigTriangle(h);
  if (Math.abs(areaOf(tri)) / A >= FIT.triangle) return ring(tri, pts);
  const boxFill = A / (4 * box.hx * box.hy);
  if (boxFill >= FIT.boxFill || Math.abs(areaOf(bigQuad(h))) / A >= FIT.quad) {
    return ring([at(-box.hx, -box.hy), at(box.hx, -box.hy), at(box.hx, box.hy), at(-box.hx, box.hy)], pts);
  }
  if (boxFill < FIT.oval[0]) return null;
  return ring(Array.from({ length: 72 }, (_, k) => { const t = (k / 72) * Math.PI * 2; return at(box.hx * Math.cos(t), box.hy * Math.sin(t)); }), pts);
}

const pathOf = (pts: P[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('');

/* ─────────────────────────────────────────────────────────
 * HOLD TO PERFECT, then tune
 *
 *     0ms   the pen stops moving on a stroke that fits a shape
 *   140ms   the fitted shape starts tracing itself (the hold timer)
 *   590ms   it closes: the stroke morphs into the shape (180 ms, eased out)
 *   770ms   still holding: the shape is in the hand. Moving turns and resizes it around
 *           its centre; the turn catches at every 45° within 5°. Letting go places it.
 * Moving before the outline closes keeps the hand-drawn stroke.
 * ───────────────────────────────────────────────────────── */
const TIMING = { still: 140, morph: 180 };
const TUNE = { catchEvery: 45, catchWithin: 5, minScale: 0.2, maxScale: 5 };

type Phase = 'idle' | 'holding' | 'done' | 'tuning';

function Play() {
  // The stroke lives in a ref: pointer events can come faster than renders.
  const stroke = React.useRef<P[]>([]);
  const [pts, setPts] = React.useState<P[]>([]);
  const fitted = React.useRef<P[] | null>(null);
  const [shape, setShape] = React.useState<P[] | null>(null);
  const [phase, setPhaseState] = React.useState<Phase>('idle');
  const phaseRef = React.useRef<Phase>('idle');
  const setPhase = (p: Phase) => { phaseRef.current = p; setPhaseState(p); };
  const hand = React.useRef<{ centre: P; base: P[]; from: P } | null>(null);
  const [tune, setTune] = React.useState<{ centre: { x: number; y: number }; pointer: { x: number; y: number }; angle: number; scale: number } | undefined>();
  const down = React.useRef(false);
  const still = React.useRef<number | undefined>(undefined);
  const box = React.useRef<HTMLDivElement>(null);
  const at = (e: React.PointerEvent): P => { const r = box.current!.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };

  const arm = (all: P[]) => {
    window.clearTimeout(still.current);
    setPhase('idle');
    if (all.length < 8) return;
    still.current = window.setTimeout(() => { const f = fit(all); if (!f) return; fitted.current = f; setShape(f); setPhase('holding'); }, TIMING.still);
  };
  const morph = () => {
    const from = resample(stroke.current), to = fitted.current!;
    setPhase('done');
    const t0 = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / TIMING.morph), e = 1 - Math.pow(1 - t, 3);
      stroke.current = from.map((p, i) => [p[0] + (to[i][0] - p[0]) * e, p[1] + (to[i][1] - p[1]) * e]);
      setPts(stroke.current);
      if (t < 1) { requestAnimationFrame(step); return; }
      if (!down.current) { setPhase('idle'); return; }
      // Still holding: the shape is in the hand.
      const c = to.reduce<P>((m, p) => [m[0] + p[0] / to.length, m[1] + p[1] / to.length], [0, 0]);
      hand.current = { centre: c, base: to, from: last.current };
      setTune({ centre: { x: c[0], y: c[1] }, pointer: { x: last.current[0], y: last.current[1] }, angle: 0, scale: 1 });
      setPhase('tuning');
    };
    requestAnimationFrame(step);
  };
  const last = React.useRef<P>([0, 0]);

  const turn = (p: P) => {
    const h = hand.current!;
    const v0 = [h.from[0] - h.centre[0], h.from[1] - h.centre[1]], v = [p[0] - h.centre[0], p[1] - h.centre[1]];
    const L0 = Math.hypot(v0[0], v0[1]) || 1;
    const k = Math.max(TUNE.minScale, Math.min(TUNE.maxScale, Math.hypot(v[0], v[1]) / L0));
    let deg = ((Math.atan2(v[1], v[0]) - Math.atan2(v0[1], v0[0])) * 180) / Math.PI;
    deg = ((deg + 540) % 360) - 180;
    const near = Math.round(deg / TUNE.catchEvery) * TUNE.catchEvery;
    if (Math.abs(deg - near) < TUNE.catchWithin) deg = near;
    const r = (deg * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
    stroke.current = h.base.map(([x, y]) => { const dx = (x - h.centre[0]) * k, dy = (y - h.centre[1]) * k; return [h.centre[0] + dx * c - dy * s, h.centre[1] + dx * s + dy * c]; });
    setPts(stroke.current);
    setTune({ centre: { x: h.centre[0], y: h.centre[1] }, pointer: { x: p[0], y: p[1] }, angle: deg, scale: k });
  };

  return (
    <div
      ref={box}
      className="snap-canvas"
      style={{ height: 360, touchAction: 'none', cursor: 'crosshair' }}
      onPointerDown={(e) => { try { (e.target as HTMLElement).setPointerCapture(e.pointerId); } catch { /* a synthetic pointer */ } down.current = true; setShape(null); setPhase('idle'); stroke.current = [at(e)]; last.current = at(e); setPts(stroke.current); }}
      onPointerMove={(e) => {
        if (!down.current) return;
        const p = at(e); last.current = p;
        if (phaseRef.current === 'tuning') { turn(p); return; }
        if (phaseRef.current === 'done') return;
        stroke.current = [...stroke.current, p]; setPts(stroke.current); arm(stroke.current);
      }}
      onPointerUp={() => { down.current = false; window.clearTimeout(still.current); if (phaseRef.current !== 'done') setPhase('idle'); }}
    >
      <svg width={1} height={1} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <path d={pathOf(pts)} fill="none" stroke={inkColor('ink')} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {shape && <PerfectPreview d={pathOf(shape)} phase={phase} tune={tune} onHeld={() => down.current && morph()} />}
      {!pts.length && <span className="eng ink-hint">draw a rough circle, triangle, box or line, then hold still</span>}
    </div>
  );
}

export default function PerfectPreviewPage() {
  return (
    <ComponentPage
      title="Perfect preview"
      lede="Draw a rough shape and hold still: the clean shape draws itself, then your stroke becomes it."
      play={{ lede: 'Draw a rough circle, triangle, box or line and keep the pointer still without letting go. When it snaps, keep holding: move to turn and resize it, then let go. Move before the outline closes to keep your own stroke.', node: <Play /> }}
      sources={[
        { id: 'react', label: 'React', code: reactSource },
        { id: 'agent', label: 'Agent guide', code: agentSource },
      ]}
      rules={[
        { id: 'PF1', title: 'The outline is the timer', body: 'The clean shape traces round over the hold. When it closes, the stroke changes. No separate progress ring.', origin: 'Ours' },
        { id: 'PF2', title: 'Easy to refuse', body: 'Moving again or Escape keeps the hand-drawn stroke at once.', origin: 'DRAWING.md DR-05' },
        { id: 'PF3', title: 'A morph, not a swap', body: 'The stroke moves into the shape over 180 ms. It never jumps.', origin: 'DRAWING.md DR-05' },
        { id: 'PF4', title: 'Then it is in your hand', body: 'Keep holding after the snap and move: the shape turns and resizes around its centre, catching at 0°, 45° and 90°. Let go to place it.', origin: 'Owner' },
      ]}
    />
  );
}
