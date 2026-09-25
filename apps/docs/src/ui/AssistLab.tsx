import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Button, Switcher, inkColor } from '@unlocalhosted/metalui';
import { LiveInk, TOOL_ASSIST, assistStroke, outlinePath, type AssistTool, type InkSample } from '../lib/ink-assist';
import { fitFrame, settleWord } from '../lib/ink-word';

/* ─────────────────────────────────────────────────────────
 * ASSISTED INK LAB (the Brush cursor page)
 *
 *   draw        the ink's tip is under the pen; the ink just behind it levels as you go
 *   release     the stroke ends exactly where you lifted (its last point is pinned)
 *   view        Assisted · Raw · Both (the raw path as a faint trace under the ink)
 *   shaky hand  replays a wave and a v, written with an 8 Hz tremor and a skid on landing,
 *               in real time, through the same assist
 * Cost stays flat however long the word: a live stroke's frozen ink is outlined once, in chunks,
 * and only its tail is recomputed each frame; a finished stroke is outlined once, on lift.
 * The dials tune the assist for new strokes (per tool presets are the defaults).
 * Words: a 600 ms pause, or a new stroke more than 1.2 x-heights past the word or 1.5 off its line,
 * completes the word; it then settles (ink-word.ts) in one morph on MetalUI's settle spring (a
 * crossfade under Reduce Motion). Settled · As written compares.
 * Copy strokes copies every stroke's raw samples (x, y, time, pressure) as JSON: real handwriting
 * for the engine's fixtures.
 * ───────────────────────────────────────────────────────── */

const LOOK: Record<AssistTool, { size: number; thinning: number; taper: number; opacity: number }> = {
  pen: { size: 3.4, thinning: 0.55, taper: 10, opacity: 1 },
  pencil: { size: 2, thinning: 0.3, taper: 4, opacity: 0.85 },
  marker: { size: 10, thinning: 0.05, taper: 0, opacity: 0.45 },
};

interface Stroke {
  id: number; tool: AssistTool; raw: InkSample[]; live?: LiveInk; chunks: string[]; chunked: number; done?: string;
  /** The assisted ink as written, once lifted; the word settle's target; the morph's progress (0–1). */
  ink?: InkSample[]; settled?: InkSample[]; morph?: number; settledPath?: string;
}

/* MetalUI's settle spring, read from its token (a CSS linear() curve and a duration), so the word's
 * morph moves exactly like the rest of the system. */
function settleSpring(): { ease: (t: number) => number; ms: number } {
  const css = getComputedStyle(document.documentElement);
  const pts = (css.getPropertyValue('--mu-spring-settle').match(/-?[\d.]+/g) ?? ['0', '1']).map(Number);
  const ms = parseFloat(css.getPropertyValue('--mu-spring-settle-d')) * 1000 || 440;
  return { ms, ease: (t) => { const x = Math.min(1, Math.max(0, t)) * (pts.length - 1), i = Math.floor(x); return i >= pts.length - 1 ? pts[pts.length - 1] : pts[i] + (pts[i + 1] - pts[i]) * (x - i); } };
}
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const CHUNK = 32;
/** Word finding (INK_ENGINE.md §4.8): a pause, or a gap past the word, or a new line. */
const PAUSE = 600, WORD_GAP = 1.2, LINE_GAP = 1.5;

/** The stroke's ink as outline paths: cached chunks of frozen ink and the live tail, or the finished whole. */
function inkPaths(s: Stroke, written: boolean): string[] {
  const look = LOOK[s.tool];
  if (s.settled && s.ink && !written) {
    if (s.morph !== undefined && s.morph < 1 && !reducedMotion()) {
      const e = settleSpring().ease(s.morph);
      const pts = s.ink.map((q, i) => ({ ...q, x: q.x + (s.settled![i].x - q.x) * e, y: q.y + (s.settled![i].y - q.y) * e }));
      return [outlinePath(pts, look.size, look.thinning, look.taper)];
    }
    s.settledPath ??= outlinePath(s.settled, look.size, look.thinning, look.taper);
    return [s.settledPath];
  }
  if (s.done) return [s.done];
  if (!s.live) return [];
  const { frozen, tail } = s.live.read();
  while (frozen.length - s.chunked >= CHUNK) {
    const piece = frozen.slice(Math.max(0, s.chunked - 1), s.chunked + CHUNK);
    s.chunks.push(outlinePath(piece, look.size, look.thinning, look.taper, { start: s.chunked === 0, end: false }));
    s.chunked += CHUNK;
  }
  const rest = frozen.slice(Math.max(0, s.chunked - 1)).concat(tail);
  return [...s.chunks, outlinePath(rest, look.size, look.thinning, look.taper, { start: s.chunked === 0, end: true })];
}

// A shaky hand writing a wave (like "mmm") and a v, with a skid as the pen lands.
function shakyStrokes(x0: number, y0: number): InkSample[][] {
  const tremor = (t: number, seed: number) => 2.2 * Math.sin(TAU * 8 * t + seed) + 0.7 * Math.sin(TAU * 13 * t + seed * 3);
  const wave: InkSample[] = [];
  const t0 = 0;
  for (let i = 0; i <= 150; i++) {
    const u = i / 150, t = t0 + u * 1.5;
    wave.push({ x: x0 + 260 * u + tremor(t, 1), y: y0 + 24 * Math.sin(TAU * 3 * u) + tremor(t, 2), t: t * 1000, pressure: 0.5 + 0.2 * Math.sin(TAU * 11 * t) });
  }
  // The skid: the pen lands and flicks back up-left before the stroke sets off down-right.
  wave.unshift({ x: x0 + 1, y: y0 + 1, t: -45, pressure: 0.4 }, { x: x0 - 1.5, y: y0 - 2, t: -30, pressure: 0.42 }, { x: x0 - 3, y: y0 - 4, t: -15, pressure: 0.45 });
  const v: InkSample[] = [];
  const pts = [[x0 + 300, y0 - 26], [x0 + 330, y0 + 30], [x0 + 360, y0 - 26]];
  for (let i = 0; i <= 80; i++) {
    const u = i / 80, t = 1.8 + u * 0.8;
    const [a, b] = u < 0.5 ? [pts[0], pts[1]] : [pts[1], pts[2]];
    const k = u < 0.5 ? u * 2 : (u - 0.5) * 2;
    v.push({ x: a[0] + (b[0] - a[0]) * k + tremor(t, 4), y: a[1] + (b[1] - a[1]) * k + tremor(t, 5), t: t * 1000, pressure: 0.55 });
  }
  return [wave, v];
}
const TAU = Math.PI * 2;

export function AssistLab() {
  const [tool, setTool] = React.useState<AssistTool>('pen');
  const [view, setView] = React.useState<'assisted' | 'raw' | 'both'>('both');
  const [asWritten, setAsWritten] = React.useState<'settled' | 'written'>('settled');
  const [strokes, setStrokes] = React.useState<Stroke[]>([]);
  const d = useDialKit('Assisted ink', {
    settle: { settleMs: [TOOL_ASSIST.pen.settleMs, 0, 80, 1], sigmaPx: [TOOL_ASSIST.pen.sigmaPx, 1, 20, 0.5] },
    corners: { corner: [TOOL_ASSIST.pen.corner, 30, 180, 1] },
    landing: { dehook: [TOOL_ASSIST.pen.dehook, 0, 16, 1] },
  });
  // The tool's preset, until a dial is moved away from the pen's default.
  const params = (t: AssistTool) => {
    const base = TOOL_ASSIST[t], pen = TOOL_ASSIST.pen;
    return {
      settleMs: d.settle.settleMs !== pen.settleMs ? d.settle.settleMs : base.settleMs,
      sigmaPx: d.settle.sigmaPx !== pen.sigmaPx ? d.settle.sigmaPx : base.sigmaPx,
      corner: d.corners.corner !== pen.corner ? d.corners.corner : base.corner,
      dehook: d.landing.dehook !== pen.dehook ? d.landing.dehook : base.dehook,
    };
  };

  const box = React.useRef<HTMLDivElement>(null);
  const live = React.useRef<{ s: Stroke; last?: { x: number; y: number; t: number } } | null>(null);
  // Strokes are mutable records (their live ink and cached chunks); a new array re-renders them.
  const bump = (_s: Stroke) => setStrokes((all) => [...all]);

  const pos = (e: React.PointerEvent) => { const r = box.current!.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  // A pen reports pressure; otherwise slower movement presses harder.
  const pressureOf = (e: React.PointerEvent, p: { x: number; y: number }, t: number) => {
    if (e.pointerType === 'pen' && e.pressure > 0) return e.pressure;
    const l = live.current?.last; if (!l) return 0.5;
    const v = Math.hypot(p.x - l.x, p.y - l.y) / Math.max(1, t - l.t);
    return Math.max(0.2, Math.min(0.8, 0.8 - v * 0.25));
  };

  const down = (e: React.PointerEvent) => {
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* synthetic */ }
    e.preventDefault();
    const p = pos(e), t = e.timeStamp;
    window.clearTimeout(pause.current);
    if (startsNewWord(p.x, p.y)) completeWord();
    const s: Stroke = { id: Date.now(), tool, raw: [], live: new LiveInk(params(tool)), chunks: [], chunked: 0 };
    live.current = { s, last: { ...p, t } };
    feed(live.current, { ...p, t, pressure: 0.5 });
    setStrokes((all) => [...all, s]);
  };
  const feed = (L: { s: Stroke }, sample: InkSample) => { L.s.raw.push(sample); L.s.live?.push(sample); };
  const move = (e: React.PointerEvent) => {
    const L = live.current; if (!L) return;
    // Coalesced events carry every sample since the last frame; some browsers return an empty list.
    const coalesced = (e.nativeEvent as PointerEvent).getCoalescedEvents?.();
    const events = coalesced && coalesced.length ? coalesced : [e.nativeEvent];
    for (const ev of events) {
      const r = box.current!.getBoundingClientRect(), p = { x: ev.clientX - r.left, y: ev.clientY - r.top }, t = ev.timeStamp;
      feed(L, { ...p, t, pressure: pressureOf(e, p, t) });
      L.last = { ...p, t };
    }
    bump(L.s);
  };
  // On lift the stroke is outlined once, whole (the same ink as its live pieces), and cached; it joins
  // the word being written, and a pause of `PAUSE` ms completes the word.
  const word = React.useRef<Stroke[]>([]);
  const pause = React.useRef<number | undefined>(undefined);
  const finish = (st: Stroke) => {
    const look = LOOK[st.tool];
    st.ink = assistStroke(st.raw, params(st.tool));
    st.done = outlinePath(st.ink, look.size, look.thinning, look.taper);
    st.live = undefined; st.chunks = [];
    bump(st);
    if (st.tool === 'marker') return; // a marker is a highlighter: no words
    word.current.push(st);
    window.clearTimeout(pause.current);
    pause.current = window.setTimeout(completeWord, PAUSE);
  };
  // A finished word settles with full context, in one morph on the settle spring.
  const completeWord = () => {
    window.clearTimeout(pause.current);
    const strokesOfWord = word.current; word.current = [];
    if (!strokesOfWord.length) return;
    const result = settleWord(strokesOfWord.map((w) => w.ink!));
    if (!result) return;
    strokesOfWord.forEach((w, k) => { w.settled = result.strokes[k]; w.settledPath = undefined; w.morph = 0; });
    bump(strokesOfWord[0]);
    const { ms } = settleSpring(), start = performance.now();
    const step = () => {
      const t = (performance.now() - start) / ms;
      for (const w of strokesOfWord) w.morph = Math.min(1, t);
      bump(strokesOfWord[0]);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  // A new stroke far past the word, or off its line, completes the word first.
  const startsNewWord = (x: number, y: number) => {
    const ws = word.current; if (!ws.length) return false;
    const F = fitFrame(ws.map((w) => w.ink!)), xh = F?.xHeight ?? 20;
    const right = Math.max(...ws.flatMap((w) => w.ink!.map((q) => q.x)));
    const base = F ? F.a + F.b * x : Math.max(...ws.flatMap((w) => w.ink!.map((q) => q.y)));
    return x > right + WORD_GAP * xh || Math.abs(y - base) > LINE_GAP * xh + xh;
  };
  const up = () => { const L = live.current; live.current = null; if (L) finish(L.s); };

  // The shaky hand, replayed in real time through the same assist.
  const shaky = () => {
    const r = box.current!.getBoundingClientRect();
    const run = (strokesLeft: InkSample[][]) => {
      const pts = strokesLeft.shift(); if (!pts) return;
      const s: Stroke = { id: Date.now() + Math.random(), tool, raw: [], live: new LiveInk(params(tool)), chunks: [], chunked: 0 };
      const L = { s };
      setStrokes((all) => [...all, s]);
      const start = performance.now(), base = pts[0].t;
      let i = 0;
      const tick = () => {
        const now = performance.now() - start;
        while (i < pts.length && pts[i].t - base <= now) feed(L, { ...pts[i], t: pts[i].t - base }), i++;
        bump(s);
        if (i < pts.length) requestAnimationFrame(tick);
        else { finish(s); setTimeout(() => run(strokesLeft), 180); }
      };
      requestAnimationFrame(tick);
    };
    run(shakyStrokes(40, r.height / 2));
  };

  return (
    <div className="flex w-full flex-col items-center gap-14">
      <div className="flex flex-wrap items-center justify-center gap-12">
        <Switcher size="compact" aria-label="Tool" value={tool} onValueChange={setTool} options={[{ value: 'pen', label: 'Pen' }, { value: 'pencil', label: 'Pencil' }, { value: 'marker', label: 'Marker' }]} />
        <Switcher size="compact" aria-label="Show" value={view} onValueChange={setView} options={[{ value: 'assisted', label: 'Assisted' }, { value: 'raw', label: 'Raw' }, { value: 'both', label: 'Both' }]} />
        <Switcher size="compact" aria-label="Word" value={asWritten} onValueChange={setAsWritten} options={[{ value: 'settled', label: 'Settled' }, { value: 'written', label: 'As written' }]} />
        <Button size="compact" onClick={shaky}>Shaky hand</Button>
        <Button size="compact" onClick={() => setStrokes([])}>Clear</Button>
        <Button size="compact" onClick={() => { void navigator.clipboard?.writeText(JSON.stringify({ tool, strokes: strokes.map((st) => ({ tool: st.tool, samples: st.raw.map((q) => [+q.x.toFixed(2), +q.y.toFixed(2), +q.t.toFixed(1), +q.pressure.toFixed(3)]) })) })); }}>Copy strokes</Button>
      </div>
      <div ref={box} className="snap-canvas" style={{ height: 300, touchAction: 'none', cursor: 'crosshair' }} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        <svg className="snap-world" style={{ overflow: 'visible' }} aria-hidden>
          {strokes.map((s) => {
            const look = LOOK[s.tool];
            return (
              <g key={s.id} data-settled={s.settled ? '' : undefined}>
                {view !== 'assisted' && s.raw.length > 1 && (
                  <polyline points={s.raw.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke="var(--ink3)" strokeOpacity={view === 'both' ? 0.5 : 1} strokeWidth={view === 'both' ? 1 : look.size * 0.8} strokeLinecap="round" strokeLinejoin="round" />
                )}
                {view !== 'raw' && reducedMotion() && s.settled && s.done && asWritten === 'settled' && (s.morph ?? 1) < 1 && <g opacity={look.opacity * (1 - (s.morph ?? 1))}><path d={s.done} fill={inkColor('ink')} /></g>}
                {view !== 'raw' && <g opacity={look.opacity * (reducedMotion() && s.settled && asWritten === 'settled' && (s.morph ?? 1) < 1 ? (s.morph ?? 1) : 1)}>{inkPaths(s, asWritten === 'written').map((d, i) => <path key={i} d={d} fill={inkColor('ink')} />)}</g>}
              </g>
            );
          })}
        </svg>
        {!strokes.length && <span className="eng ink-hint">write here, slowly and quickly</span>}
      </div>
    </div>
  );
}
