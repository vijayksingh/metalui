import { LiveInk, TOOL_ASSIST, type InkSample } from './ink-assist';
import { StrokeGuide, TOOL_GUIDE, WordGuide } from './ink-guide';
import { extrema } from './ink-word';

/* The guide's checks (INK_ENGINE fixtures, synthetic): run in the lab's page, headless, with no
 * input events. Each case is written at 60 Hz and read every frame, as the lab does. */

const XH = 24, BASE = 200, HZ = 1000 / 60;
type Case = { name: string; pts: InkSample[]; truth: (x: number) => number };

// A cursive run of arches (like "mmmm"): arch k rises to height hk and back to the line.
function arches(heights: number[], opts: { lift?: number[]; seed?: number } = {}): InkSample[] {
  const out: InkSample[] = [], perArch = 260; let t = 0, x0 = 40;
  let r = opts.seed ?? 7; const rnd = () => ((r = (r * 16807) % 2147483647) / 2147483647 - 0.5);
  heights.forEach((h, k) => {
    const w = 1.1 * XH, lift = opts.lift?.[k] ?? 0;
    const n = Math.round(perArch / HZ);
    for (let i = k ? 1 : 0; i <= n; i++) {
      const u = i / n, prevLift = opts.lift?.[k - 1] ?? 0;
      const foot = u < 0.5 ? prevLift * (1 - u * 2) : lift * (u * 2 - 1); // a raised bottom between arches
      out.push({ x: x0 + w * u + 0.4 * rnd(), y: BASE - foot * XH - h * Math.sin(Math.PI * u) ** 2 + 0.4 * rnd(), t, pressure: 0.6 });
      t += HZ;
    }
    x0 += w;
  });
  return out;
}

function run(pts: InkSample[]) {
  const p = TOOL_ASSIST.pen, word = new WordGuide(TOOL_GUIDE.pen!), sg = new StrokeGuide(word, p.settleMs);
  const plain = new LiveInk(p), live = new LiveInk(p, sg);
  let prevDiff: number[] = [], maxStep = 0, tipLag = 0, frozenChanged = false, snapshot: InkSample[] = [];
  const frame = (at?: number, q?: InkSample) => {
    const r = live.read(at), u = plain.read(at), all = r.frozen.concat(r.tail), un = u.frozen.concat(u.tail);
    if (q) tipLag = Math.max(tipLag, Math.hypot(all[all.length - 1].x - q.x, all[all.length - 1].y - q.y));
    for (let i = 0; i < snapshot.length; i++) if (r.frozen[i].x !== snapshot[i].x || r.frozen[i].y !== snapshot[i].y) frozenChanged = true;
    snapshot = r.frozen.slice();
    // The guide's own movement between frames: (guided − plain) now, against the frame before.
    const diff = all.map((v, i) => v.y - (un[i]?.y ?? v.y));
    for (let i = 0; i < Math.min(diff.length, prevDiff.length); i++) maxStep = Math.max(maxStep, Math.abs(diff[i] - prevDiff[i]));
    prevDiff = diff;
    return { all, un };
  };
  for (const q of pts) { live.push(q); plain.push(q); frame(undefined, q); }
  const lastT = pts[pts.length - 1].t;
  let out = frame();
  for (let el = HZ; el <= sg.settleAfterLift + HZ; el += HZ) out = frame(lastT + Math.min(el, sg.settleAfterLift));
  const endMoved = Math.hypot(out.all[out.all.length - 1].x - pts[pts.length - 1].x, out.all[out.all.length - 1].y - pts[pts.length - 1].y);
  return { ink: out.all, plain: out.un, maxStep, tipLag, frozenChanged, endMoved };
}

function measure(ink: InkSample[], truth: (x: number) => number) {
  const e = extrema(ink);
  const tops = e.tops.map((i) => truth(ink[i].x) - ink[i].y).filter((h) => h > 3);
  const bottoms = e.bottoms.map((i) => truth(ink[i].x) - ink[i].y);
  const mean = tops.reduce((a, v) => a + v, 0) / tops.length;
  const cv = Math.sqrt(tops.reduce((a, v) => a + (v - mean) ** 2, 0) / tops.length) / mean;
  return { tops, bottoms, cv };
}

export function checkGuide() {
  const flat = () => BASE;
  const cases: Case[] = [
    { name: 'drift-size', pts: arches(Array.from({ length: 9 }, (_, k) => XH * (1 + 0.04 * k))), truth: flat },
    { name: 'floating-o', pts: arches([XH, XH, XH, XH, XH, XH], { lift: [0, 0, 0, 0.5, 0, 0] }), truth: flat },
    { name: 'clean', pts: arches(Array.from({ length: 8 }, (_, k) => XH * (1 + 0.03 * Math.sin(k * 2.1)))), truth: flat },
    { name: 'ascender', pts: arches([XH, XH, XH, 2.6 * XH, XH, XH]), truth: flat },
    { name: 'size-change', pts: arches([XH, XH, XH, XH, 1.5 * XH, 1.5 * XH, 1.5 * XH, 1.5 * XH, 1.5 * XH]), truth: flat },
  ];
  // A drawing: a 200 px circle.
  const circle: InkSample[] = [];
  for (let i = 0; i <= 90; i++) { const a = (i / 90) * Math.PI * 2; circle.push({ x: 300 + 100 * Math.cos(a), y: 200 + 100 * Math.sin(a), t: i * HZ, pressure: 0.6 }); }
  const rows = cases.map((c) => {
    const r = run(c.pts), ma = measure(r.plain, c.truth), mb = measure(r.ink, c.truth);
    const moved = r.ink.map((q, i) => Math.abs(q.y - r.plain[i].y)).sort((u, v) => u - v);
    return {
      case: c.name,
      topsBefore: ma.tops.map((v) => +(v / XH).toFixed(2)).join(' '),
      topsAfter: mb.tops.map((v) => +(v / XH).toFixed(2)).join(' '),
      cv: `${ma.cv.toFixed(3)} → ${mb.cv.toFixed(3)}`,
      bottomsAfter: mb.bottoms.map((v) => +(v / XH).toFixed(2)).join(' '),
      p95MoveXh: +(moved[Math.floor(moved.length * 0.95)] / XH).toFixed(3),
      maxStepPx: +r.maxStep.toFixed(2), tipLagPx: +r.tipLag.toFixed(2), endMovedPx: +r.endMoved.toFixed(2), frozenChanged: r.frozenChanged,
    };
  });
  const c = run(circle);
  rows.push({ case: 'drawing', topsBefore: '', topsAfter: '', cv: '', bottomsAfter: '', p95MoveXh: Math.max(...c.ink.map((q, i) => Math.abs(q.y - c.plain[i].y))), maxStepPx: c.maxStep, tipLagPx: c.tipLag, endMovedPx: c.endMoved, frozenChanged: c.frozenChanged });
  return rows;
}
