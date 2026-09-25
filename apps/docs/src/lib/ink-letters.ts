import type { InkSample } from './ink-assist';
import { extrema, type WordFrame } from './ink-word';

/* ─────────────────────────────────────────────────────────
 * YOUR LETTERS: one repair for every letter
 *
 *   bank     each letter you taught (or that a labelled word gave), in the word's own units:
 *            x and y in x-heights, y from the baseline (0) to the x-line (−1), centred on x
 *   read     a labelled word ("my") is cut into its letters: the cuts that make each piece
 *            closest to your usual version of that letter (dynamic programming along the ink)
 *   repair   a letter that strays from your usual one is pulled part of the way back to it,
 *            point by matched point; its entry and exit stay pinned, so it still joins its
 *            neighbours, and a letter close to your usual one is left exactly as written
 * Nothing here knows any particular letter: a floating o, a narrow hump, an open loop and a bent
 * stem are all the same thing, a distance from how you usually write it.
 * ───────────────────────────────────────────────────────── */

type Pt = { x: number; y: number };
export interface LetterSample { pts: Pt[]; length: number }
export type LetterBank = Record<string, LetterSample[]>;

export const LETTER_PARAMS = {
  /** Points per letter shape. */
  n: 40,
  /** Path step while reading, in x-heights. */
  stepXh: 1 / 6,
  /** A piece may be this much shorter or longer than your usual letter. */
  minLength: 0.5, maxLength: 1.8,
  /** A letter straying less than this (mean distance, x-heights) is left as written. */
  strayXh: 0.1,
  /** How far a straying letter is pulled back toward your usual one (0–1). */
  gain: 0.55,
  /** No point moves more than this, in x-heights. */
  clampXh: 0.6,
  /** The pinned share of a letter at each end (its joins). */
  pin: 0.18,
};
type Params = typeof LETTER_PARAMS;

const arcs = (p: Pt[]) => { const s = [0]; for (let i = 1; i < p.length; i++) s.push(s[i - 1] + Math.hypot(p[i].x - p[i - 1].x, p[i].y - p[i - 1].y)); return s; };

/** `n` points evenly spaced along the path. */
export function resample(p: Pt[], n: number): Pt[] {
  if (p.length < 2) return Array.from({ length: n }, () => ({ ...(p[0] ?? { x: 0, y: 0 }) }));
  const s = arcs(p), L = s[s.length - 1] || 1, out: Pt[] = [];
  for (let k = 0, j = 1; k < n; k++) {
    const d = (L * k) / (n - 1);
    while (j < p.length - 1 && s[j] < d) j++;
    const u = s[j] === s[j - 1] ? 0 : (d - s[j - 1]) / (s[j] - s[j - 1]);
    out.push({ x: p[j - 1].x + (p[j].x - p[j - 1].x) * u, y: p[j - 1].y + (p[j].y - p[j - 1].y) * u });
  }
  return out;
}

const toWord = (q: Pt, F: WordFrame) => ({ x: q.x / F.xHeight, y: (q.y - (F.a + F.b * q.x)) / F.xHeight });
const centred = (p: Pt[]) => { const cx = p.reduce((a, q) => a + q.x, 0) / p.length; return p.map((q) => ({ x: q.x - cx, y: q.y })); };

/** A letter written on a guide (a flat baseline at `baseline`, x-height `xh`), ready for the bank. */
export function sampleOf(strokes: Pt[][], baseline: number, xh: number, p: Params = LETTER_PARAMS): LetterSample {
  const F: WordFrame = { a: baseline, b: 0, xHeight: xh, capHeight: null, slant: 0 };
  const w = strokes.flat().map((q) => toWord(q, F));
  const s = arcs(w);
  return { pts: centred(resample(w, p.n)), length: s[s.length - 1] };
}

/** Your usual version of a letter: the mean of its samples, point by point. */
export function usual(bank: LetterBank, ch: string): LetterSample | null {
  const all = bank[ch]; if (!all?.length) return null;
  const n = all[0].pts.length;
  const pts = Array.from({ length: n }, (_, k) => ({ x: all.reduce((a, s) => a + s.pts[k].x, 0) / all.length, y: all.reduce((a, s) => a + s.pts[k].y, 0) / all.length }));
  return { pts, length: all.reduce((a, s) => a + s.length, 0) / all.length };
}


const median = (v: number[]) => { const s = [...v].sort((p, q) => p - q), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

/** The word's frame for reading letters. Short words fool a line fitted through their bottoms (a
 * descender, a lead-in), so the baseline is the median of the bottoms near it and the x-height the
 * median height of the tops above it (tops far off that are ascenders or retraces are left out); the
 * line tilts only when the word is long enough to show it, and never past about 6°. */
export function letterFrame(strokes: Pt[][]): WordFrame | null {
  const tops: Pt[] = [], bottoms: Pt[] = [];
  for (const st of strokes) { const e = extrema(st as InkSample[]); for (const i of e.tops) tops.push(st[i]); for (const i of e.bottoms) bottoms.push(st[i]); }
  if (tops.length < 1 || bottoms.length < 2) return null;
  let a = median(bottoms.map((q) => q.y)), b = 0, xh = NaN;
  for (let pass = 0; pass < 2; pass++) {
    const hs = tops.map((q) => a + b * q.x - q.y).filter((h) => h > 3);
    if (!hs.length) return null;
    const m = median(hs), body = hs.filter((h) => h >= 0.5 * m && h <= 1.6 * m);
    xh = median(body.length ? body : hs);
    const onLine = bottoms.filter((q) => Math.abs(q.y - (a + b * q.x)) < 0.5 * xh);
    if (!onLine.length) break;
    const xs = onLine.map((q) => q.x);
    if (onLine.length >= 4 && Math.max(...xs) - Math.min(...xs) > 3 * xh) {
      const slopes: number[] = [];
      for (let i = 0; i < onLine.length; i++) for (let j = i + 1; j < onLine.length; j++) { const dx = onLine[j].x - onLine[i].x; if (Math.abs(dx) > 2) slopes.push((onLine[j].y - onLine[i].y) / dx); }
      if (slopes.length) b = Math.max(-0.1, Math.min(0.1, median(slopes)));
    }
    a = median(onLine.map((q) => q.y - b * q.x));
  }
  return { a, b, xHeight: xh, capHeight: null, slant: 0 };
}

const meanDist = (a: Pt[], b: Pt[]) => a.reduce((t, q, k) => t + Math.hypot(q.x - b[k].x, q.y - b[k].y), 0) / a.length;

export interface LetterRead { ch: string; from: number; to: number; stray: number }
export interface WordRead { frame: WordFrame; letters: LetterRead[]; path: Pt[]; s: number[] }
/** Why the last word was or was not repaired, in plain words. */
export let lastLettersNote = '';

/** Cuts a labelled word into its letters. Null when a letter is missing from the bank or the ink cannot be framed. */
export function readWord(strokes: InkSample[][], text: string, bank: LetterBank, p: Params = LETTER_PARAMS): WordRead | null {
  const chars = [...text.replace(/\s+/g, '')];
  const missing = [...new Set(chars.filter((c) => !bank[c]?.length))];
  if (missing.length) { lastLettersNote = `teach ${missing.join(', ')} first`; return null; }
  const frame = letterFrame(strokes);
  if (!frame) { lastLettersNote = 'could not find the line this word sits on'; return null; }
  const whole = strokes.flat(), wholeS = arcs(whole);
  const step = p.stepXh * frame.xHeight, M = Math.max(chars.length * 4, Math.round(wholeS[wholeS.length - 1] / step) + 1);
  const path = resample(whole, M), s = arcs(path);
  const norm = path.map((q) => toWord(q, frame)), ns = s.map((v) => v / frame.xHeight);
  const refs = chars.map((c) => usual(bank, c)!);
  const cost = (i: number, j: number, k: number) => {
    const piece = centred(resample(norm.slice(i, j + 1), p.n));
    return meanDist(piece, refs[k].pts) * (ns[j] - ns[i]);
  };
  // best[k][j]: the cheapest way to read the first k+1 letters ending at path point j.
  const best = chars.map(() => new Float64Array(M).fill(Infinity)), from = chars.map(() => new Int32Array(M).fill(-1));
  const fits = (i: number, j: number, k: number) => { const len = ns[j] - ns[i]; return len >= p.minLength * refs[k].length && len <= p.maxLength * refs[k].length; };
  for (let j = 1; j < M; j++) if (fits(0, j, 0)) { best[0][j] = cost(0, j, 0); from[0][j] = 0; }
  for (let k = 1; k < chars.length; k++)
    for (let j = 1; j < M; j++)
      for (let i = j - 1; i >= 1; i--) {
        const len = ns[j] - ns[i];
        if (len > p.maxLength * refs[k].length) break;
        if (len < p.minLength * refs[k].length || best[k - 1][i] === Infinity) continue;
        const c = best[k - 1][i] + cost(i, j, k);
        if (c < best[k][j]) { best[k][j] = c; from[k][j] = i; }
      }
  if (best[chars.length - 1][M - 1] === Infinity) { lastLettersNote = `the ink does not fit “${text}” at its size`; return null; }
  const letters: LetterRead[] = [];
  for (let k = chars.length - 1, j = M - 1; k >= 0; k--) {
    const i = from[k][j];
    const piece = centred(resample(norm.slice(i, j + 1), p.n));
    letters.unshift({ ch: chars[k], from: i, to: j, stray: meanDist(piece, refs[k].pts) });
    j = i;
  }
  return { frame, letters, path, s };
}

// Matches two shapes point to point (dynamic time warping); for each point of `a`, the mean of its matches in `b`.
function matchTo(a: Pt[], b: Pt[]): Pt[] {
  const n = a.length, m = b.length, D = Array.from({ length: n }, () => new Float64Array(m).fill(Infinity));
  const d = (i: number, j: number) => Math.hypot(a[i].x - b[j].x, a[i].y - b[j].y);
  D[0][0] = d(0, 0);
  for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) {
    if (!i && !j) continue;
    D[i][j] = d(i, j) + Math.min(i ? D[i - 1][j] : Infinity, j ? D[i][j - 1] : Infinity, i && j ? D[i - 1][j - 1] : Infinity);
  }
  const sum = a.map(() => ({ x: 0, y: 0, c: 0 }));
  for (let i = n - 1, j = m - 1; ; ) {
    sum[i].x += b[j].x; sum[i].y += b[j].y; sum[i].c++;
    if (!i && !j) break;
    const up = i ? D[i - 1][j] : Infinity, left = j ? D[i][j - 1] : Infinity, diag = i && j ? D[i - 1][j - 1] : Infinity;
    if (diag <= up && diag <= left) { i--; j--; } else if (up <= left) i--; else j--;
  }
  return sum.map((q) => ({ x: q.x / q.c, y: q.y / q.c }));
}

// What kind of stray it is, in plain words (the largest of: off the line, size, width; else shape).
function strayKind(piece: Pt[], ref: Pt[]): string {
  const span = (v: number[]) => Math.max(...v) - Math.min(...v);
  const lift = piece.reduce((a, q) => a + q.y, 0) / piece.length - ref.reduce((a, q) => a + q.y, 0) / ref.length;
  const tall = span(piece.map((q) => q.y)) / span(ref.map((q) => q.y)), wide = span(piece.map((q) => q.x)) / span(ref.map((q) => q.x));
  const kinds: [number, string][] = [
    [Math.abs(lift) / 0.25, lift < 0 ? 'sits above the line' : 'sinks below the line'],
    [Math.abs(Math.log(tall)) / Math.log(1.25), tall < 1 ? 'shorter than usual' : 'taller than usual'],
    [Math.abs(Math.log(wide)) / Math.log(1.3), wide < 1 ? 'narrower than usual' : 'wider than usual'],
  ];
  const [score, words] = kinds.sort((u, v) => v[0] - u[0])[0];
  return score >= 1 ? words : 'its shape strays from your usual';
}

/** Repairs the letters that stray from your usual ones. Same strokes and sample counts back; null when nothing strays. */
export function repairLetters(strokes: InkSample[][], read: WordRead, bank: LetterBank, p: Params = LETTER_PARAMS): InkSample[][] | null {
  const F = read.frame, xh = F.xHeight;
  const fromWord = (q: Pt) => ({ x: q.x * xh, y: F.a + F.b * q.x * xh + q.y * xh });
  // Per letter: displacement (screen px) at n points spread along its stretch of the path.
  const moves: { s0: number; s1: number; d: Pt[] }[] = [], notes: string[] = [];
  for (const L of read.letters) {
    if (L.stray < p.strayXh) continue;
    const piecePx = resample(read.path.slice(L.from, L.to + 1), p.n);
    const norm = piecePx.map((q) => toWord(q, F)), cx = norm.reduce((a, q) => a + q.x, 0) / norm.length;
    const ref = usual(bank, L.ch)!.pts, placed = ref.map((q) => fromWord({ x: q.x + cx, y: q.y }));
    const target = matchTo(piecePx, placed);
    let d = target.map((t, k) => ({ x: t.x - piecePx[k].x, y: t.y - piecePx[k].y }));
    for (let pass = 0; pass < 2; pass++) d = d.map((q, k) => { const a = d[Math.max(0, k - 1)], b = d[Math.min(d.length - 1, k + 1)]; return { x: (a.x + 2 * q.x + b.x) / 4, y: (a.y + 2 * q.y + b.y) / 4 }; });
    d = d.map((q, k) => {
      const u = k / (d.length - 1), e = Math.min(1, Math.min(u, 1 - u) / p.pin), w = e * e * (3 - 2 * e);
      const len = Math.hypot(q.x, q.y), cap = Math.min(1, (p.clampXh * xh) / (len || 1));
      return { x: q.x * w * p.gain * cap, y: q.y * w * p.gain * cap };
    });
    moves.push({ s0: read.s[L.from], s1: read.s[L.to], d });
    notes.push(`${L.ch} ${strayKind(norm.map((q) => ({ x: q.x - cx, y: q.y })), ref)}`);
  }
  if (!moves.length) { lastLettersNote = 'every letter is close to your usual; left as written'; return null; }
  lastLettersNote = `${notes.join('; ')}: pulled part way back, the rest left as written`;
  // Each written sample finds its place along the path (the same arc length the reading used).
  const whole = strokes.flat(), ws = arcs(whole), total = ws[ws.length - 1] || 1, pathTotal = read.s[read.s.length - 1] || 1;
  let idx = 0;
  return strokes.map((st) => st.map((q) => {
    const s = (ws[idx++] / total) * pathTotal;
    const m = moves.find((v) => s >= v.s0 && s <= v.s1);
    if (!m) return { ...q };
    const u = ((s - m.s0) / Math.max(1e-6, m.s1 - m.s0)) * (m.d.length - 1), k = Math.min(m.d.length - 2, Math.floor(u)), f = u - k;
    return { ...q, x: q.x + m.d[k].x + (m.d[k + 1].x - m.d[k].x) * f, y: q.y + m.d[k].y + (m.d[k + 1].y - m.d[k].y) * f };
  }));
}

/** Letters of a labelled word that are already close to your usual ones join the bank, so it keeps
 * learning your hand from everything you label (never the straying ones: they would teach the drift).
 * At most `KEEP_SAMPLES` per letter, newest kept. */
const KEEP_SAMPLES = 8;
export function learnFrom(read: WordRead, bank: LetterBank, p: Params = LETTER_PARAMS): LetterBank {
  const next: LetterBank = { ...bank };
  for (const L of read.letters) {
    if (L.stray >= p.strayXh) continue;
    const w = read.path.slice(L.from, L.to + 1).map((q) => toWord(q, read.frame)), s = arcs(w);
    next[L.ch] = [...(next[L.ch] ?? []), { pts: centred(resample(w, p.n)), length: s[s.length - 1] }].slice(-KEEP_SAMPLES);
  }
  return next;
}
