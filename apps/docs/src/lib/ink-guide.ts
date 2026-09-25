import type { AssistTool, InkSample } from './ink-assist';

/* ─────────────────────────────────────────────────────────
 * KEEPING TO THE LINE, WHILE YOU WRITE
 *
 *   frame    the word's baseline and x-height, fitted as you write from the tops and bottoms of
 *            the letters so far (the last ~8 letters; the baseline from the last ~4), eased in
 *            half way at each new turn, so it does not follow the drift it resists
 *   judge    each top or bottom, once the pen has turned 2 px past it, is compared with the frame
 *            as it was: a top above or below the x-line, a bottom off the baseline. Half the
 *            difference becomes that turn's pull, capped (0.15 x-height for a top, 0.2 for a
 *            bottom) and fixed from then on. Tall tops (ascenders, capitals, over 1.5 x-heights)
 *            and deep bottoms (descenders) are never pulled; three tops in a row at a new size are
 *            a deliberate change, and the frame follows them
 *   apply    a turn's pull spreads along the ink to its neighbouring turns (a tent), vertically
 *            only, and fades in with the ink's age: nothing within ~1.5 sigma of the pen moves (the
 *            tip stays under the pen), the full pull is reached by ~4 sigma, and ink is frozen by 6
 *            sigma. Each frame a point moves under a pixel; nothing snaps and nothing moves after
 *            the fact
 *   lift     the ink near the pen was still arriving at its pull; it goes on for ~4 sigma (144 ms
 *            for the pen) after the lift, like wet ink, while the stroke's last point stays put
 *   off      for a marker, a drawing (a stroke over 4 x-heights tall), and until the word has two
 *            bottoms and three tops (the previous word's x-height counts as one)
 * It cannot fix a letter's shape or width: a squeezed hump is where the pen went. It halves size
 * drift and pulls a floating letter part way down; it does not remove them.
 * ───────────────────────────────────────────────────────── */

export interface GuideParams {
  /** Share of a top's distance from the x-line that is pulled back, and the cap, in x-heights. */
  gTop: number; cTop: number;
  /** The same for a bottom and the baseline. */
  gBot: number; cBot: number;
  /** Sigmas of age where the pull starts and where it is full. */
  rampStart: number; rampFull: number;
}

export const TOOL_GUIDE: Record<AssistTool, GuideParams | null> = {
  pen: { gTop: 0.5, cTop: 0.15, gBot: 0.5, cBot: 0.2, rampStart: 1.5, rampFull: 4 },
  pencil: { gTop: 0.3, cTop: 0.1, gBot: 0.3, cBot: 0.12, rampStart: 1.5, rampFull: 4 },
  marker: null,
};

const MIN_TOPS = 3, PROUD = 2, MEMORY = 8, LINE_MEMORY = 4, LETTER = 1.1, SILENT = 0.03, DRAWING = 4;
const median = (v: number[]) => { const s = [...v].sort((p, q) => p - q), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const clamp = (v: number, c: number) => Math.max(-c, Math.min(c, v));
const smooth = (u: number) => { const e = Math.max(0, Math.min(1, u)); return e * e * (3 - 2 * e); };

type Turn = { x: number; y: number; top: boolean; written?: number };
type Frame = { a: number; b: number; xh: number };

/** One word's frame, shared by all its strokes. */
export class WordGuide {
  private turns: Turn[] = [];
  frame: Frame | null = null;
  constructor(readonly p: GuideParams, private prior?: number) {}
  get xHeight(): number | undefined { return this.frame?.xh ?? this.prior; }

  /** A newly confirmed turn: its pull (screen px, + is down), judged against the frame before it, then it joins the frame. */
  judge(t: Turn, strokeSpan: number): number {
    const F = this.frame, p = this.p;
    let dy = 0;
    if (F && strokeSpan <= DRAWING * F.xh) {
      const r = F.a + F.b * t.x - t.y; // height above the baseline
      if (t.top) {
        if (r >= 0.6 * F.xh && r <= 1.5 * F.xh && !this.resizing(r)) dy = clamp(p.gTop * (r - F.xh), p.cTop * F.xh);
      } else {
        const g = Math.abs(r) <= 0.25 * F.xh ? p.gBot : (r > 0 ? r <= 0.6 * F.xh : r >= -0.4 * F.xh) ? p.gBot / 2 : 0;
        dy = clamp(g * r, p.cBot * F.xh);
      }
      if (Math.abs(dy) < SILENT * F.xh) dy = 0;
    }
    // The frame learns the turn where the ink will show it, so it keeps to the size it holds you to.
    this.turns.push({ ...t, y: t.y + dy, written: t.y });
    this.refit(t.x);
    return dy;
  }

  // Three tops in a row within 15% of each other, all over 25% from the x-height: a deliberate new
  // size. Judged on the tops as written (not as pulled), so the pull cannot hide the change.
  private recentTops(): number[] {
    const F = this.frame; if (!F) return [];
    return this.turns.filter((t) => t.top).slice(-3).map((t) => F.a + F.b * t.x - (t.written ?? t.y));
  }
  private resizing(h: number): boolean {
    const F = this.frame!, hs = [...this.recentTops().slice(-2), h];
    if (hs.length < 3) return false;
    const m = median(hs);
    return hs.every((v) => Math.abs(v / m - 1) <= 0.15) && Math.abs(m / F.xh - 1) > 0.25;
  }

  private refit(xPen: number) {
    const cur = this.frame, xh0 = cur?.xh ?? this.prior;
    const near = (k: number) => this.turns.filter((t) => !xh0 || t.x >= xPen - k * LETTER * xh0);
    const win = near(MEMORY), bottoms = win.filter((t) => !t.top), tops = win.filter((t) => t.top);
    if (!bottoms.length) return;
    // The line so far (or a flat one through the bottoms' median), then the x-height above it.
    let a = cur ? cur.a : median(bottoms.map((t) => t.y)), b = cur ? cur.b : 0;
    const hs = tops.map((t) => a + b * t.x - t.y).filter((h) => h > 3);
    if (this.prior) hs.push(this.prior);
    if (!hs.length) return;
    // Body tops: ascenders stand out above the lower tops (over 1.6 times the lower quartile), so
    // an early h or l does not set the size.
    const sorted = [...hs].sort((u, v) => u - v), low = sorted[Math.floor((sorted.length - 1) / 4)];
    const body = hs.filter((h) => h <= 1.6 * low && h >= 0.5 * low);
    const xh = median(body.length ? body : hs);
    if (cur) {
      // A deliberate new size is taken at once, and the letters before it are forgotten (easing
      // into it, or remembering them, would pull the next letters back to the old size).
      const recent = this.recentTops();
      if (recent.length === 3) {
        const rm = median(recent);
        if (recent.every((v) => Math.abs(v / rm - 1) <= 0.15) && Math.abs(rm / cur.xh - 1) > 0.25 && rm <= 1.5 * cur.xh) {
          const topsAt = this.turns.map((t, i) => (t.top ? i : -1)).filter((i) => i >= 0);
          this.turns = this.turns.slice(topsAt[topsAt.length - 3]).map((t) => ({ ...t, y: t.written ?? t.y }));
          this.frame = { ...cur, xh: rm };
          return;
        }
      }
    }
    const onLine = bottoms.filter((t) => Math.abs(t.y - (a + b * t.x)) < 0.6 * xh && t.x >= xPen - LINE_MEMORY * LETTER * xh);
    if (onLine.length < 2 || tops.length + (this.prior ? 1 : 0) < MIN_TOPS) return;
    const xs = onLine.map((t) => t.x);
    let b2 = 0;
    if (onLine.length >= 3 && Math.max(...xs) - Math.min(...xs) > 2 * xh) {
      const slopes: number[] = [];
      for (let i = 0; i < onLine.length; i++) for (let j = i + 1; j < onLine.length; j++) { const dx = onLine[j].x - onLine[i].x; if (Math.abs(dx) > 2) slopes.push((onLine[j].y - onLine[i].y) / dx); }
      if (slopes.length) b2 = Math.max(-0.15, Math.min(0.15, median(slopes)));
    }
    const a2 = median(onLine.map((t) => t.y - b2 * t.x));
    if (!cur) { this.frame = { a: a2, b: b2, xh }; return; }
    // Eased in half way: the line at the pen, its tilt and the x-height.
    const yl = cur.a + cur.b * xPen, yl2 = a2 + b2 * xPen;
    b = cur.b + 0.5 * (b2 - cur.b);
    a = yl + 0.5 * (yl2 - yl) - b * xPen;
    this.frame = { a, b, xh: cur.xh + 0.5 * (xh - cur.xh) };
  }
}

/** One stroke's turns and their pulls. Fed the stroke's filled points (append-only) with their arc positions. */
export class StrokeGuide {
  private pulls: { s: number; dy: number; left: number; w: number; tc: number }[] = [];
  private scanned = 1; private dir = 0; private ext = 0; private lastS = 0;
  private lo = Infinity; private hi = -Infinity;
  constructor(private word: WordGuide, private sigma: number) {}
  get xHeight(): number { return this.word.xHeight ?? 20; }
  /** Ms after the pen lifts until every pull is full. */
  get settleAfterLift(): number { return this.word.p.rampFull * this.sigma; }

  /** Finds turns in the points not yet scanned. `frozenS`: where the frozen ink ends now (a new pull never reaches behind it). */
  scan(pts: InkSample[], s: number[], frozenS: number) {
    if (!pts.length) return;
    if (this.scanned === 1) { this.lo = Math.min(this.lo, pts[0].y); this.hi = Math.max(this.hi, pts[0].y); }
    for (let i = this.scanned; i < pts.length; i++) {
      const y = pts[i].y;
      this.lo = Math.min(this.lo, y); this.hi = Math.max(this.hi, y);
      if (this.dir === 0) { if (Math.abs(y - pts[0].y) >= PROUD) { this.dir = y > pts[0].y ? 1 : -1; this.ext = i; } continue; }
      const e = this.ext;
      if (this.dir === 1) { if (y >= pts[e].y) this.ext = i; else if (pts[e].y - y >= PROUD) { this.turn(pts, s, e, false, frozenS); this.dir = -1; this.ext = i; } }
      else { if (y <= pts[e].y) this.ext = i; else if (y - pts[e].y >= PROUD) { this.turn(pts, s, e, true, frozenS); this.dir = 1; this.ext = i; } }
    }
    this.scanned = pts.length;
  }

  private turn(pts: InkSample[], s: number[], e: number, top: boolean, frozenS: number) {
    const dy = this.word.judge({ x: pts[e].x, y: pts[e].y, top }, this.hi - this.lo);
    const xh = this.word.xHeight ?? 20, w = Math.max(2, Math.min(1.2 * xh, s[e] - this.lastS));
    if (dy) this.pulls.push({ s: s[e], dy, left: Math.max(s[e] - w, this.lastS, frozenS), w, tc: pts[pts.length - 1].t });
    this.lastS = s[e];
  }

  /** The vertical pull on a point at arc position `s`, written at time `t`, as of `now`. */
  offset(s: number, t: number, now: number): number {
    let dy = 0;
    const r0 = this.word.p.rampStart * this.sigma, r1 = (this.word.p.rampFull - this.word.p.rampStart) * this.sigma;
    for (let k = this.pulls.length - 1; k >= 0; k--) {
      const q = this.pulls[k];
      if (s > q.s + q.w) break; // pulls are in order along the stroke
      const tent = s <= q.s ? (s <= q.left ? 0 : (s - q.left) / Math.max(1e-6, q.s - q.left)) : 1 - (s - q.s) / q.w;
      if (tent <= 0) continue;
      // Fades in with the point's age, and never faster than since the pull was found (so ink that
      // freezes meanwhile meets its neighbours exactly).
      dy += q.dy * tent * smooth((Math.min(now - t, now - q.tc) - r0) / r1);
    }
    return dy;
  }
}
