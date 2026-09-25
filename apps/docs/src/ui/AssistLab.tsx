import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Button, Switcher, inkColor } from '@unlocalhosted/metalui';
import { Assist, TOOL_ASSIST, outlinePath, type AssistTool, type InkSample } from '../lib/ink-assist';

/* ─────────────────────────────────────────────────────────
 * ASSISTED INK LAB (the Brush cursor page)
 *
 *   draw        your stroke goes through the assist as you draw; the ink only ever grows
 *   release     the ink walks on to where you lifted, one 8 ms step per frame
 *   view        Assisted · Raw · Both (the raw path as a faint trace under the ink)
 *   shaky hand  replays a wave and a v, written with an 8 Hz tremor and a skid on landing,
 *               in real time, through the same assist
 * The dials tune the assist live (per tool presets are the defaults).
 * ───────────────────────────────────────────────────────── */

const LOOK: Record<AssistTool, { size: number; thinning: number; taper: number; opacity: number }> = {
  pen: { size: 3.4, thinning: 0.55, taper: 10, opacity: 1 },
  pencil: { size: 2, thinning: 0.3, taper: 4, opacity: 0.85 },
  marker: { size: 10, thinning: 0.05, taper: 0, opacity: 0.45 },
};

interface Stroke { id: number; tool: AssistTool; raw: InkSample[]; ink: InkSample[] }

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
  const [strokes, setStrokes] = React.useState<Stroke[]>([]);
  const d = useDialKit('Assisted ink', {
    steady: { string: [TOOL_ASSIST.pen.string, 0, 8, 0.1], sure: [TOOL_ASSIST.pen.sure, 100, 2000, 50], minCutoff: [TOOL_ASSIST.pen.minCutoff, 0.3, 10, 0.1], beta: [TOOL_ASSIST.pen.beta, 0, 0.1, 0.002] },
    corners: { corner: [TOOL_ASSIST.pen.corner, 30, 180, 1], cornerBoost: [TOOL_ASSIST.pen.cornerBoost, 1, 12, 0.5] },
    landing: { dehook: [TOOL_ASSIST.pen.dehook, 0, 16, 1] },
    width: { pressureCutoff: [TOOL_ASSIST.pen.pressureCutoff, 0.5, 12, 0.5] },
  });
  const params = () => ({ ...TOOL_ASSIST[tool], ...d.steady, ...d.corners, ...d.landing, ...d.width });

  const box = React.useRef<HTMLDivElement>(null);
  const live = React.useRef<{ s: Stroke; a: Assist; last?: { x: number; y: number; t: number } } | null>(null);
  const bump = (s: Stroke) => setStrokes((all) => all.map((k) => (k.id === s.id ? { ...s } : k)));

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
    const s: Stroke = { id: Date.now(), tool, raw: [], ink: [] };
    live.current = { s, a: new Assist(params()), last: { ...p, t } };
    feed(live.current, { ...p, t, pressure: 0.5 });
    setStrokes((all) => [...all, s]);
  };
  const feed = (L: NonNullable<typeof live.current>, sample: InkSample) => {
    L.s.raw.push(sample);
    L.s.ink.push(...L.a.push(sample));
  };
  const move = (e: React.PointerEvent) => {
    const L = live.current; if (!L) return;
    const events = (e.nativeEvent as PointerEvent).getCoalescedEvents?.() ?? [e.nativeEvent];
    for (const ev of events) {
      const r = box.current!.getBoundingClientRect(), p = { x: ev.clientX - r.left, y: ev.clientY - r.top }, t = ev.timeStamp;
      feed(L, { ...p, t, pressure: pressureOf(e, p, t) });
      L.last = { ...p, t };
    }
    bump(L.s);
  };
  // Letting go: the ink walks on to the lift point, one step per frame, so it grows into place.
  const letGo = (L: NonNullable<typeof live.current>) => {
    const rest = L.a.drain();
    const walk = () => {
      const next = rest.shift(); if (!next) return;
      L.s.ink.push(next); bump(L.s);
      requestAnimationFrame(walk);
    };
    requestAnimationFrame(walk);
  };
  const up = () => { const L = live.current; live.current = null; if (L) letGo(L); };

  // The shaky hand, replayed in real time through the same assist.
  const shaky = () => {
    const r = box.current!.getBoundingClientRect();
    const run = (strokesLeft: InkSample[][]) => {
      const pts = strokesLeft.shift(); if (!pts) return;
      const s: Stroke = { id: Date.now() + Math.random(), tool, raw: [], ink: [] };
      const L = { s, a: new Assist(params()) };
      setStrokes((all) => [...all, s]);
      const start = performance.now(), base = pts[0].t;
      let i = 0;
      const tick = () => {
        const now = performance.now() - start;
        while (i < pts.length && pts[i].t - base <= now) feed(L, { ...pts[i], t: pts[i].t - base }), i++;
        bump(s);
        if (i < pts.length) requestAnimationFrame(tick);
        else { letGo(L); setTimeout(() => run(strokesLeft), 180); }
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
        <Button size="compact" onClick={shaky}>Shaky hand</Button>
        <Button size="compact" onClick={() => setStrokes([])}>Clear</Button>
      </div>
      <div ref={box} className="snap-canvas" style={{ height: 300, touchAction: 'none', cursor: 'crosshair' }} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        <svg className="snap-world" style={{ overflow: 'visible' }} aria-hidden>
          {strokes.map((s) => {
            const look = LOOK[s.tool];
            return (
              <g key={s.id}>
                {view !== 'assisted' && s.raw.length > 1 && (
                  <polyline points={s.raw.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke="var(--ink3)" strokeOpacity={view === 'both' ? 0.5 : 1} strokeWidth={view === 'both' ? 1 : look.size * 0.8} strokeLinecap="round" strokeLinejoin="round" />
                )}
                {view !== 'raw' && <path d={outlinePath(s.ink, look.size, look.thinning, look.taper)} fill={inkColor('ink')} fillOpacity={look.opacity} />}
              </g>
            );
          })}
        </svg>
        {!strokes.length && <span className="eng ink-hint">write here, slowly and quickly</span>}
      </div>
    </div>
  );
}
