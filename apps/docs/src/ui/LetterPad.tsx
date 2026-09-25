import * as React from 'react';
import { inkColor } from '@unlocalhosted/metalui';
import { TOOL_ASSIST, assistStroke, outlinePath, type InkSample } from '../lib/ink-assist';

/* ─────────────────────────────────────────────────────────
 * LETTER PAD: teaching the lab your letters
 *
 *   rest       two guides (the x-line dashed, the baseline solid) with room above for
 *              ascenders and below for descenders; the letter asked for sits at the left
 *   writing    your ink, assisted like the canvas; a letter may take several strokes (t, x, i)
 *   pause      800 ms after the last lift the letter is taken: the ink fades out (180 ms) and the
 *              next letter is asked for; under Reduce Motion it goes at once
 *   done       the pad reports every letter and the lab removes it
 * Each letter is asked for `times` times; your usual version is their mean.
 * ───────────────────────────────────────────────────────── */

const PAUSE = 800, FADE = 180;
const LOOK = { size: 3.4, thinning: 0.55, taper: 10 };

export function LetterPad({ letters, xh, times = 2, onLetter }: {
  letters: string[];
  /** The x-height to write at, in px (the last word's, so letters come out the size you write). */
  xh: number;
  times?: number;
  /** One written letter: its strokes, and the guides it was written on. */
  onLetter: (ch: string, strokes: InkSample[][], baseline: number, xh: number) => void;
}) {
  const queue = React.useMemo(() => letters.flatMap((ch) => Array.from({ length: times }, () => ch)), [letters, times]);
  const [at, setAt] = React.useState(0);
  const [ink, setInk] = React.useState<InkSample[][]>([]);
  const [fading, setFading] = React.useState(false);
  const raw = React.useRef<InkSample[] | null>(null);
  const strokes = React.useRef<InkSample[][]>([]);
  const pause = React.useRef<number | undefined>(undefined);
  const box = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => () => window.clearTimeout(pause.current), []);

  const xLine = 2 * xh, baseline = 3 * xh, height = Math.round(4.3 * xh);
  const ch = queue[at];
  const pos = (e: React.PointerEvent) => { const r = box.current!.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };

  const take = () => {
    const written = strokes.current; strokes.current = [];
    if (!written.length || !ch) return;
    onLetter(ch, written, baseline, xh);
    const next = () => { setInk([]); setFading(false); setAt((k) => k + 1); };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) next();
    else { setFading(true); window.setTimeout(next, FADE); }
  };
  const down = (e: React.PointerEvent) => {
    if (fading || !ch) return;
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* synthetic */ }
    e.preventDefault();
    window.clearTimeout(pause.current);
    raw.current = [{ ...pos(e), t: e.timeStamp, pressure: e.pointerType === 'pen' && e.pressure > 0 ? e.pressure : 0.5 }];
  };
  const move = (e: React.PointerEvent) => {
    const r = raw.current; if (!r) return;
    const list = (e.nativeEvent as PointerEvent).getCoalescedEvents?.();
    const b = box.current!.getBoundingClientRect();
    for (const ev of list && list.length ? list : [e.nativeEvent]) r.push({ x: ev.clientX - b.left, y: ev.clientY - b.top, t: ev.timeStamp, pressure: e.pointerType === 'pen' && ev.pressure > 0 ? ev.pressure : 0.5 });
    setInk([...strokes.current, assistStroke(r, TOOL_ASSIST.pen)]);
  };
  const up = () => {
    const r = raw.current; raw.current = null; if (!r) return;
    if (r.length > 1) strokes.current.push(assistStroke(r, TOOL_ASSIST.pen));
    setInk([...strokes.current]);
    pause.current = window.setTimeout(take, PAUSE);
  };

  if (!ch) return null;
  const round = Math.floor(at / times) + 1, of = letters.length;
  return (
    <div className="flex w-full flex-col items-center gap-8">
      <p className="type-doc-prose text-ink2" aria-live="polite">
        Write <strong className="text-ink">{ch}</strong> between the lines, the way you usually do ({round} of {of}{times > 1 ? `, ${(at % times) + 1} of ${times}` : ''}).
      </p>
      <div ref={box} className="snap-canvas" role="img" aria-label={`Write the letter ${ch} between the lines`}
        style={{ height, touchAction: 'none', cursor: 'crosshair', maxWidth: 360 }}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        <svg className="snap-world" aria-hidden>
          <line x1={0} x2="100%" y1={xLine} y2={xLine} stroke="var(--ink3)" strokeOpacity={0.45} strokeDasharray="3 5" />
          <line x1={0} x2="100%" y1={baseline} y2={baseline} stroke="var(--ink3)" strokeOpacity={0.6} />
          <g style={{ opacity: fading ? 0 : 1, transition: `opacity ${FADE}ms ease-out` }}>
            {ink.map((st, k) => st.length > 1 && <path key={k} d={outlinePath(st, LOOK.size, LOOK.thinning, LOOK.taper)} fill={inkColor('ink')} />)}
          </g>
        </svg>
        <span className="eng" style={{ position: 'absolute', left: 12, top: baseline - xh * 1.6, fontSize: xh * 1.4, lineHeight: 1, opacity: 0.18, pointerEvents: 'none' }}>{ch}</span>
      </div>
    </div>
  );
}
