'use client';

import * as React from 'react';
import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group';
import { Radio as BaseRadio } from '@base-ui/react/radio';
import { DotDisplay, IconButton, Led, Meter, Sparkline, SwapText, Tooltip, type DotInk, type LedKind } from '@unlocalhosted/metalui';
import { ChevronIcon } from '@unlocalhosted/metalui/icons';

/* ─────────────────────────────────────────────────────────
 * STUDIO WEEK · one week of a workspace on the canvas, read on the studio's own instruments
 *
 *   rest      a raised slab. Four readout keys in a sunk tray (notes written, regions formed, cues
 *             confirmed, time in the past), each a pixel figure, its change on last week in words
 *             with a lamp, and the week as a sparkline; the chosen key sits pressed with its LED lit.
 *             Below, the week as a dot matrix: seven days by twenty-four hours, each hour a 2 × 3
 *             block lit by how much happened then; the hours still to come are dark, and now is an
 *             amber dot. Beside it, the recognizer: each kind of cue as a segmented meter of how
 *             many were confirmed.
 *
 *   choose    pressing a readout key: it sinks (the press) and its LED rises; the old LED goes out
 *             ~0 ms  the matrix re-plots as a scan, one hour column after another, left to right,
 *                    over the settle spring's duration (a display steps, it never tweens)
 *
 *   week      ‹ › step a week: the dates and every figure turn on the drum; the matrix scans; the
 *             sparklines and meters follow; the next key rests at this week
 *
 *   read      pointer over the matrix, or focus it and use the arrows (Home / End): a frame sits on
 *             the hour at once (it is the pointer); the line under the matrix turns to say what
 *             happened then
 *
 * Reduce Motion: the matrix re-plots at once; the drum crossfades; lamps change without a gesture.
 * Layout follows the block's own width (@container/block): under 34rem the readouts are two by two;
 * under 44rem the recognizer goes under the matrix.
 * ───────────────────────────────────────────────────────── */

const TIMING = {
  scanColumns: 24,  // the matrix re-plots one hour column per scan step
};

const MATRIX = {
  days:    7,
  hours:   24,
  blockX:  2,   // dots per hour across
  blockY:  3,   // dots per hour down (an hour is a 2 × 3 block, so a day reads as a row)
  levels:  4,   // lit levels above dark
};

/* ── Data ──────────────────────────────────────────────────── */

type MeasureId = 'notes' | 'regions' | 'cues' | 'past';

const MEASURES: { id: MeasureId; label: string; unit: string }[] = [
  { id: 'notes', label: 'Notes written', unit: 'notes' },
  { id: 'regions', label: 'Regions formed', unit: 'regions' },
  { id: 'cues', label: 'Cues confirmed', unit: 'cues confirmed' },
  { id: 'past', label: 'Time in the past', unit: 'minutes in the past' },
];

const CUE_KINDS = ['Dates', 'Times', 'Amounts', 'Tags', 'People', 'Colours'];
const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Now, for the sample: Wednesday 30 September 2026, 10:40 in the studio. */
const NOW = new Date(2026, 8, 30, 10, 40);

function seeded(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function mondayOf(d: Date) {
  const m = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
  return m;
}

/** How busy an hour of a studio day tends to be: mornings and late afternoons, a lunch dip, quiet weekends. */
function rhythm(day: number, hour: number) {
  const weekend = day >= 5 ? 0.25 : 1;
  const morning = Math.exp(-((hour - 10.5) ** 2) / 4);
  const afternoon = Math.exp(-((hour - 15.5) ** 2) / 5);
  const evening = 0.25 * Math.exp(-((hour - 21) ** 2) / 3);
  return weekend * (morning + afternoon * 0.9 + evening);
}

type Week = {
  start: Date;
  /** Per measure: [day][hour] amounts; hours still to come are null. */
  grid: Record<MeasureId, (number | null)[][]>;
  totals: Record<MeasureId, number>;
  kinds: { kind: string; recognised: number; confirmed: number }[];
};

/** A week `offset` weeks from this one (0 = this week, −1 = last week). `until` stops it at a
 *  moment (last week up to this point of it), so an unfinished week compares like with like. */
function weekOf(offset: number, until: Date = NOW): Week {
  const start = mondayOf(NOW);
  start.setDate(start.getDate() + offset * 7);
  const r = seeded(1000 + offset * 17);
  const pace = 0.85 + r() * 0.3;
  const grid = { notes: [], regions: [], cues: [], past: [] } as unknown as Week['grid'];
  const totals = { notes: 0, regions: 0, cues: 0, past: 0 };
  let recognisedAll = 0;
  for (let d = 0; d < MATRIX.days; d++) {
    for (const m of MEASURES) grid[m.id][d] = [];
    for (let h = 0; h < MATRIX.hours; h++) {
      const at = new Date(start); at.setDate(start.getDate() + d); at.setHours(h);
      if (at > until) { for (const m of MEASURES) grid[m.id][d][h] = null; continue; }
      const base = rhythm(d, h) * pace;
      const notes = Math.round(base * 9 * (0.6 + r() * 0.8));
      const regions = r() < base * 0.35 ? 1 + Math.round(r()) : 0;
      const recognised = Math.round(notes * (0.7 + r() * 0.5));
      const cues = Math.round(recognised * (0.78 + r() * 0.18));
      const past = r() < base * 0.3 ? Math.round(4 + r() * 22) : 0;
      grid.notes[d][h] = notes; grid.regions[d][h] = regions; grid.cues[d][h] = cues; grid.past[d][h] = past;
      totals.notes += notes; totals.regions += regions; totals.cues += cues; totals.past += past;
      recognisedAll += recognised;
    }
  }
  const rk = seeded(2000 + offset * 31);
  const shares = [0.24, 0.18, 0.12, 0.26, 0.12, 0.08];
  const kinds = CUE_KINDS.map((kind, i) => {
    const recognised = Math.max(1, Math.round(recognisedAll * shares[i]));
    return { kind, recognised, confirmed: Math.min(recognised, Math.round(recognised * (0.62 + rk() * 0.35))) };
  });
  return { start, grid, totals: { ...totals, cues: recognisedAll ? Math.round((totals.cues / recognisedAll) * 100) : 0 }, kinds };
}

/* ── Formatting ────────────────────────────────────────────── */

const count = new Intl.NumberFormat('en');
const dayMonth = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
const hh = (h: number) => `${String(h).padStart(2, '0')}:00`;

function figure(id: MeasureId, v: number) {
  if (id === 'cues') return `${v}%`;
  if (id === 'past') return `${Math.floor(v / 60)}h${String(v % 60).padStart(2, '0')}`;
  return count.format(v);
}

/** The change on last week, said in words, with the lamp that goes with it. */
function change(id: MeasureId, now: number, before: number): { words: string; led: LedKind } {
  const diff = now - before;
  if (diff === 0) return { words: 'the same', led: 'off' };
  const more = diff > 0;
  const n = Math.abs(diff);
  const words = id === 'cues' ? `${n} ${n === 1 ? 'pt' : 'pts'} ${more ? 'up' : 'down'}` : id === 'past' ? `${n} min ${more ? 'more' : 'less'}` : `${count.format(n)} ${more ? 'more' : 'fewer'}`;
  // More time in the past is neither good nor bad: it's where the studio looked back.
  return { words, led: id === 'past' ? 'link' : more ? 'live' : 'waiting' };
}

/* ── Motion helpers ────────────────────────────────────────── */

/** A spring's duration in ms, zero under Reduce Motion (the travel tokens go to 0). */
function springMs(el: Element, name: 'settle' | 'part') {
  const s = getComputedStyle(el);
  return parseFloat(s.getPropertyValue(`--mu-spring-${name}-d`)) * 1000 * (parseFloat(s.getPropertyValue(`--mu-travel-${name}`)) || 0);
}

/** How many hour columns of the new picture are showing: a left-to-right scan when it changes. */
function useScan(key: string, el: React.RefObject<HTMLElement | null>) {
  const [shown, setShown] = React.useState(MATRIX.hours);
  const first = React.useRef(true);
  React.useEffect(() => {
    if (first.current) { first.current = false; return; }
    const ms = el.current ? springMs(el.current, 'settle') : 0;
    if (!ms) { setShown(MATRIX.hours); return; }
    let step = 0;
    setShown(0);
    const every = ms / TIMING.scanColumns;
    const t = window.setInterval(() => {
      step += MATRIX.hours / TIMING.scanColumns;
      setShown(Math.min(MATRIX.hours, Math.round(step)));
      if (step >= MATRIX.hours) window.clearInterval(t);
    }, every);
    return () => window.clearInterval(t);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return shown;
}

/* ── The matrix ────────────────────────────────────────────── */

const INKS: readonly DotInk[] = ['off', ['ink', 0.16], ['ink', 0.34], ['ink', 0.58], ['ink', 0.86], 'sun'];
const NOW_INK = 5;

function Matrix({ week, previous, measure }: { week: Week; previous: Week | null; measure: (typeof MEASURES)[number] }) {
  const box = React.useRef<HTMLDivElement>(null);
  const grid = week.grid[measure.id];
  const shown = useScan(`${week.start.toISOString()}|${measure.id}`, box);
  const [at, setAt] = React.useState<{ d: number; h: number } | null>(null);
  const cols = MATRIX.hours * MATRIX.blockX;
  const rows = MATRIX.days * MATRIX.blockY;
  const max = Math.max(1, ...grid.flat().map((v) => v ?? 0));
  const isNow = (d: number, h: number) => week.start.getTime() === mondayOf(NOW).getTime() && d === (NOW.getDay() + 6) % 7 && h === NOW.getHours();

  const dots = React.useMemo(() => {
    const out = new Uint8Array(cols * rows);
    for (let d = 0; d < MATRIX.days; d++) for (let h = 0; h < MATRIX.hours; h++) {
      // Columns not yet scanned still show the old picture (the same measure a moment ago).
      const from = h < shown ? grid : previous?.grid[measure.id] ?? grid;
      const v = from[d][h];
      const level = isNow(d, h) ? NOW_INK : v == null || v === 0 ? 0 : Math.max(1, Math.ceil((v / max) * MATRIX.levels));
      for (let y = 0; y < MATRIX.blockY; y++) for (let x = 0; x < MATRIX.blockX; x++) out[(d * MATRIX.blockY + y) * cols + h * MATRIX.blockX + x] = level;
    }
    return out;
  }, [grid, shown, previous, measure.id, max]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (e: React.PointerEvent) => {
    const r = box.current!.getBoundingClientRect();
    const h = Math.floor(((e.clientX - r.left) / r.width) * MATRIX.hours);
    const d = Math.floor(((e.clientY - r.top) / r.height) * MATRIX.days);
    if (h >= 0 && h < MATRIX.hours && d >= 0 && d < MATRIX.days) setAt({ d, h });
  };
  const keys = (e: React.KeyboardEvent) => {
    const now = at ?? { d: (NOW.getDay() + 6) % 7, h: NOW.getHours() };
    const move: Record<string, [number, number]> = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] };
    let next = now;
    if (move[e.key]) next = { d: Math.min(MATRIX.days - 1, Math.max(0, now.d + move[e.key][0])), h: Math.min(MATRIX.hours - 1, Math.max(0, now.h + move[e.key][1])) };
    else if (e.key === 'Home') next = { d: now.d, h: 0 };
    else if (e.key === 'End') next = { d: now.d, h: MATRIX.hours - 1 };
    else return;
    e.preventDefault();
    setAt(next);
  };

  const v = at ? grid[at.d][at.h] : null;
  const day = at ? new Date(week.start.getFullYear(), week.start.getMonth(), week.start.getDate() + at.d) : null;
  const line = at && day
    ? `${DAY_NAMES[at.d]} ${dayMonth.format(day)} · ${hh(at.h)}–${hh((at.h + 1) % 24)} · ${v == null ? 'still to come' : measure.id === 'cues' ? `${v} cues confirmed` : `${v} ${v === 1 ? measure.unit.replace(/s(\b| )/, '$1') : measure.unit}`}`
    : 'Point at an hour, or focus the week and use the arrow keys';

  return (
    <div className="grid min-w-0 content-start gap-8">
      <div className="grid grid-cols-[auto_1fr] gap-x-8">
        <div className="grid" aria-hidden style={{ gridTemplateRows: `repeat(${MATRIX.days}, 1fr)` }}>
          {DAY_LETTERS.map((l, i) => <span key={i} className="grid place-items-center type-label engraved">{l}</span>)}
        </div>
        <div
          ref={box}
          tabIndex={0}
          role="img"
          aria-label={`${measure.label} by hour, Monday to Sunday. Use the arrow keys to read each hour.`}
          className="relative w-fit cursor-crosshair outline-none touch-none focus-visible:focus-ring"
          onPointerMove={pick}
          onPointerDown={pick}
          onPointerLeave={() => setAt(null)}
          onFocus={() => setAt((a) => a ?? { d: (NOW.getDay() + 6) % 7, h: NOW.getHours() })}
          onBlur={() => setAt(null)}
          onKeyDown={keys}
        >
          <DotDisplay
            cols={cols}
            rows={rows}
            dots={dots}
            inks={INKS}
            style={{ width: `calc(var(--mu-r-dot-display-self-pitch) * ${cols})`, height: `calc(var(--mu-r-dot-display-self-pitch) * ${rows})` }}
          />
          {at && (
            <span
              aria-hidden
              className="pointer-events-none absolute rounded-[3px] outline-2 outline-offset-1 outline-solid outline-green-deep"
              style={{ left: `${(at.h / MATRIX.hours) * 100}%`, top: `${(at.d / MATRIX.days) * 100}%`, width: `${100 / MATRIX.hours}%`, height: `${100 / MATRIX.days}%` }}
            />
          )}
        </div>
        <span />
        <div className="flex justify-between pt-4 type-tick text-ink3" aria-hidden style={{ width: `calc(var(--mu-r-dot-display-self-pitch) * ${cols})` }}>
          {[0, 6, 12, 18, 24].map((h) => <span key={h}>{String(h).padStart(2, '0')}</span>)}
        </div>
      </div>
      <p className="m-0 type-meta text-ink2" aria-live="polite"><SwapText value={line} /></p>
    </div>
  );
}

/* ── Readouts ──────────────────────────────────────────────── */

function Readouts({ week, last, measure, onMeasureChange, versus }: { week: Week; last: Week; measure: MeasureId; onMeasureChange: (m: MeasureId) => void; versus: string }) {
  return (
    <div className="grid gap-8">
    <span className="type-meta text-ink3">Compared with {versus}</span>
    <BaseRadioGroup
      value={measure}
      onValueChange={(v) => onMeasureChange(v as MeasureId)}
      aria-label="What the week shows"
      className="grid grid-cols-2 gap-6 p-6 rounded-card recipe-switcher @min-[34rem]/block:grid-cols-4"
    >
      {MEASURES.map((m) => {
        const c = change(m.id, week.totals[m.id], last.totals[m.id]);
        const days = week.grid[m.id].map((hours) => {
          const lived = hours.filter((v): v is number => v != null);
          if (!lived.length) return null;
          return { value: m.id === 'cues' ? lived.reduce((a, b) => a + b, 0) : lived.reduce((a, b) => a + b, 0) };
        });
        return (
          <BaseRadio.Root
            key={m.id}
            value={m.id}
            className="group relative grid min-w-0 cursor-pointer content-start gap-6 border-0 p-12 text-left outline-none rounded-surface-radius-plate recipe-switcher-thumb transition-[translate] duration-settle ease-settle data-checked:translate-y-px data-checked:recipe-button-pressed focus-visible:focus-ring"
          >
            <span className="flex items-center justify-between gap-8">
              <span className="type-meta text-ink2 truncate">{m.label}</span>
              <span className="grid size-6 place-items-center" aria-hidden>
                <span className="size-6 rounded-round recipe-status-led-off group-data-checked:recipe-status-led-live" />
              </span>
            </span>
            <span className="type-pixel-small text-ink"><SwapText value={figure(m.id, week.totals[m.id])} /></span>
            <span className="flex min-w-0 items-center gap-6 type-meta text-ink2">
              <Led kind={c.led} size="small" gesture="steady" />
              <span className="truncate"><SwapText value={c.words} /></span>
            </span>
            <Sparkline size="mini" points={days} aria-hidden />
          </BaseRadio.Root>
        );
      })}
    </BaseRadioGroup>
    </div>
  );
}

/* ── The block ─────────────────────────────────────────────── */

export interface StudioWeekProps {
  /** The workspace the week belongs to. */
  studio?: string;
  className?: string;
}

/** One week of a workspace: what was written, formed, confirmed and revisited, hour by hour. */
export function StudioWeek({ studio = 'Lisbon Studio', className }: StudioWeekProps) {
  const [offset, setOffset] = React.useState(0);
  const [measure, setMeasure] = React.useState<MeasureId>('notes');
  const week = React.useMemo(() => weekOf(offset), [offset]);
  // This week is unfinished: compare it with last week up to the same point.
  const last = React.useMemo(() => {
    if (offset !== 0) return weekOf(offset - 1);
    const sameTime = new Date(NOW); sameTime.setDate(NOW.getDate() - 7);
    return weekOf(-1, sameTime);
  }, [offset]);
  const [previous, setPrevious] = React.useState<{ week: Week; measure: MeasureId } | null>(null);
  const chosen = MEASURES.find((m) => m.id === measure)!;
  const end = new Date(week.start); end.setDate(end.getDate() + 6);
  const title = offset === 0 ? 'This week' : offset === -1 ? 'Last week' : `${-offset} weeks ago`;

  const go = (next: number) => { setPrevious({ week, measure }); setOffset(next); };
  const pick = (m: MeasureId) => { setPrevious({ week, measure }); setMeasure(m); };
  // The scan starts from the picture that was showing, so it reads as the display redrawing.
  const from = previous ? { ...previous.week, grid: { ...week.grid, [measure]: previous.week.grid[previous.measure] } } : null;

  return (
    <section aria-label={`${studio}, ${title.toLowerCase()}`} className={`block-studio-week @container/block grid w-full gap-20 p-20 rounded-surface-radius-hero recipe-surface-raise ${className ?? ''}`}>
      <header className="flex flex-wrap items-center justify-between gap-12">
        <div className="grid gap-2">
          <h2 className="m-0 type-display text-ink"><SwapText value={title} /></h2>
          <p className="m-0 type-meta text-ink2">{studio} · <SwapText value={`${dayMonth.format(week.start)} – ${dayMonth.format(end)}`} /></p>
        </div>
        <div className="flex items-center gap-4">
          <Tooltip label="Week before">
            <IconButton variant="ghost" label="Week before" icon={<ChevronIcon turn={90} />} disabled={offset <= -7} onClick={() => go(offset - 1)} />
          </Tooltip>
          <Tooltip label="Week after">
            <IconButton variant="ghost" label="Week after" icon={<ChevronIcon turn={270} />} disabled={offset >= 0} onClick={() => go(offset + 1)} />
          </Tooltip>
        </div>
      </header>

      <Readouts week={week} last={last} measure={measure} onMeasureChange={pick} versus={offset === 0 ? 'this time last week' : 'the week before'} />

      <div className="grid gap-20 @min-[44rem]/block:grid-cols-[auto_1fr]">
        <div className="grid min-w-0 justify-items-center gap-12 overflow-x-auto p-16 rounded-card recipe-well-field">
          <span className="justify-self-start type-title text-ink"><SwapText value={`${chosen.label}, hour by hour`} /></span>
          <Matrix week={week} previous={from} measure={chosen} />
        </div>
        <section aria-label="Recognizer" className="grid content-start gap-12">
          <div className="flex items-baseline justify-between gap-8">
            <h3 className="m-0 type-title text-ink">Recognizer</h3>
            <span className="type-meta text-ink3">confirmed of recognised</span>
          </div>
          <div className="grid gap-x-20 gap-y-12 @min-[34rem]/block:grid-cols-2">
          {week.kinds.map((k) => (
            <Meter
              key={k.kind}
              label={<span className="flex justify-between gap-8"><span>{k.kind}</span><span className="tabular-nums text-ink3"><SwapText value={`${k.confirmed} of ${k.recognised}`} /></span></span>}
              value={Math.round((k.confirmed / k.recognised) * 100)}
              segments={12}
              warn={1.01}
              danger={1.01}
            />
          ))}
          </div>
        </section>
      </div>

      <footer className="flex items-center gap-8 border-t border-rule pt-12 type-meta text-ink2">
        <Led kind="live" size="small" />
        <span>Synced with the canvas · {offset === 0 ? 'live' : 'a finished week'}</span>
      </footer>
    </section>
  );
}
