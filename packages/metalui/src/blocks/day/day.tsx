'use client';

import * as React from 'react';
import { Surface } from '../../components/surface/surface';
import { Well } from '../../components/well/well';
import { useAwake } from '../../motion/awake';

/* ─────────────────────────────────────────────────────────
 * DAY: a custom block (an object). A tear-off page sunk into a raise slab.
 *   Day      the large widget: the date in dots at 3× (Saturday blue, Sunday amber), the month,
 *            the weekday and the clock in the pixel face down the side (the colon blinks each
 *            second), sixty small dots along the foot that fill with the minute; then the year so
 *            far (one dot a day, today pulsing), the days left and the moon, and one line for the day
 *   DayTile  the page alone: the date, the weekday and month, the days left and the moon
 * Tapping the large page tears it off: the number's dots fall away and the next day's settle in.
 * Reduced motion, or `animate={false}`, skips the tear to the next day and holds the blinks steady;
 * the seconds still count. Every ink is the day recipe's, per colorway.
 * ───────────────────────────────────────────────────────── */

export interface DayLine {
  text: string;
  /** Who said it, and where. */
  by: string;
}

/** The default lines, one a day by the day of the year. */
export const DAY_LINES: DayLine[] = [
  { text: 'How we spend our days is, of course, how we spend our lives.', by: 'Annie Dillard, The Writing Life' },
  { text: 'Tell me, what is it you plan to do with your one wild and precious life?', by: 'Mary Oliver, The Summer Day' },
  { text: 'The days are long, but the years are short.', by: 'Gretchen Rubin' },
  { text: 'First make a plan, then carry it out.', by: 'Helmuth von Moltke' },
  { text: 'What you do every day matters more than what you do once in a while.', by: 'Gretchen Rubin' },
  { text: 'Well begun is half done.', by: 'Aristotle, Politics' },
  { text: 'Nothing is worth more than this day.', by: 'Johann Wolfgang von Goethe' },
];

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MOON_PHASES = ['New moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous', 'Full moon', 'Waning gibbous', 'Last quarter', 'Waning crescent'];
const FULL_MOON = Date.UTC(2026, 8, 26, 16, 49);
const SYNODIC = 29.530589;
const TEAR_FRAMES = 14;
const TEAR_MS = 55;
const BEAT_MS = 250;
const MS_PER_DAY = 86400000;

// 5 × 7 digits, drawn in dots.
const DIGITS = [
  ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
  ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
  ['#####', '...#.', '..#..', '...#.', '....#', '#...#', '.###.'],
  ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
  ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  ['..##.', '.#...', '#....', '####.', '#...#', '#...#', '.###.'],
  ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
  ['.###.', '#...#', '#...#', '.####', '....#', '...#.', '.##..'],
];

const sq = (x: number, y: number, size: number, pitch: number, ox = 0, oy = 0) => {
  const o = (pitch - size) / 2;
  return `M${ox + x * pitch + o} ${oy + y * pitch + o}h${size}v${size}h-${size}Z`;
};
const rank = (i: number) => {
  const v = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return v - Math.floor(v);
};

interface PageGeometry { cols: number; rows: number; scale: number; x0: number; y0: number; digitGap: number; ox: number; perfFrom: number }
const LARGE: PageGeometry = { cols: 41, rows: 23, scale: 3, x0: 2, y0: 2, digitGap: 2, ox: 2, perfFrom: 1 };
const SMALL: PageGeometry = { cols: 21, rows: 21, scale: 2, x0: 0, y0: 2, digitGap: 1, ox: 0, perfFrom: 0 };

/** One frame of the page: perforations, the day's number, and (while tearing) the dots that fall. */
function page(g: PageGeometry, num: number, shown: number, leaving: boolean) {
  const cells = new Map<string, 'perf' | 'digit' | 'fall'>();
  for (let x = g.perfFrom; x < g.cols; x += 2) cells.set(`${x},0`, 'perf');
  const text = String(num).padStart(2, '0');
  let idx = 0;
  for (let d = 0; d < 2; d++) {
    const glyph = DIGITS[+text[d]];
    for (let gy = 0; gy < 7; gy++) for (let gx = 0; gx < 5; gx++) {
      if (glyph[gy][gx] !== '#') continue;
      for (let sy = 0; sy < g.scale; sy++) for (let sx = 0; sx < g.scale; sx++) {
        const cx = g.x0 + d * (5 * g.scale + g.digitGap) + gx * g.scale + sx;
        const cy = g.y0 + gy * g.scale + sy;
        const r = rank(idx++);
        if (r < shown) cells.set(`${cx},${cy}`, 'digit');
        else if (leaving && r < shown + 0.14 && cy + 1 < g.rows && !cells.has(`${cx},${cy + 1}`)) cells.set(`${cx},${cy + 1}`, 'fall');
      }
    }
  }
  const out = { off: '', perf: '', digit: '', fall: '' };
  for (let y = 0; y < g.rows; y++) for (let x = 0; x < g.cols; x++) out[cells.get(`${x},${y}`) ?? 'off'] += sq(x, y, 6, 8, g.ox);
  return out;
}

function moon(date: Date) {
  let age = ((date.getTime() - FULL_MOON) / MS_PER_DAY / SYNODIC + 0.5) % 1;
  if (age < 0) age += 1;
  const lit = (1 - Math.cos(age * 2 * Math.PI)) / 2;
  const out = { lit: '', dark: '', name: MOON_PHASES[Math.round(age * 8) % 8] };
  for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) {
    const dx = x - 3, dy = y - 3;
    if (dx * dx + dy * dy > 10) continue;
    const nx = dx / 3.2;
    const on = age < 0.5 ? nx >= 1 - 2 * lit : nx <= -(1 - 2 * lit);
    out[on ? 'lit' : 'dark'] += `M${x * 3 + 0.3} ${y * 3 + 0.3}h2.4v2.4h-2.4Z`;
  }
  return out;
}

function facts(date: Date) {
  const y = date.getFullYear(), m = date.getMonth(), dom = date.getDate(), wd = date.getDay();
  const start = new Date(y, 0, 1);
  const doy = Math.round((+new Date(y, m, dom) - +start) / MS_PER_DAY) + 1;
  const yearDays = Math.round((+new Date(y + 1, 0, 1) - +start) / MS_PER_DAY);
  return {
    y, m, dom, wd, doy, yearDays, left: yearDays - doy,
    long: `${WEEKDAYS[wd]} ${dom} ${MONTHS[m]} ${y}`,
    wdShort: WEEKDAYS[wd].slice(0, 3).toUpperCase(),
    monShort: MONTHS[m].slice(0, 3).toUpperCase(),
  };
}

const DATE_INK = { weekday: 'fill-day-ink-date', saturday: 'fill-day-ink-saturday', sunday: 'fill-day-ink-sunday' };
const DATE_TEXT = { weekday: 'text-day-ink-date', saturday: 'text-day-ink-saturday', sunday: 'text-day-ink-sunday' };
const inkOf = (wd: number, weekend: boolean) => (!weekend ? 'weekday' : wd === 6 ? 'saturday' : wd === 0 ? 'sunday' : 'weekday') as keyof typeof DATE_INK;

/** Now, on a beat; holds when `on` is false. */
function useNow(on: boolean, beat: number) {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    if (!on || typeof window === 'undefined') return;
    setNow(Date.now()); // catch up the moment it wakes
    const id = window.setInterval(() => setNow(Date.now()), beat);
    return () => window.clearInterval(id);
  }, [on, beat]);
  return now;
}

const useReduced = () => {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const q = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(q.matches);
    on();
    q.addEventListener('change', on);
    return () => q.removeEventListener('change', on);
  }, []);
  return reduced;
};

/* ── the parts ──────────────────────────────────────────── */

interface DayState {
  day: Date;
  next: Date;
  now: Date;
  f: ReturnType<typeof facts>;
  ink: keyof typeof DATE_INK;
  pulse: boolean;
  shown: number;
  leaving: boolean;
  tear: () => void;
}
const DayContext = React.createContext<DayState | null>(null);
const useDay = (part: string) => {
  const s = React.useContext(DayContext);
  if (!s) throw new Error(`Day.${part} sits inside Day.Root`);
  return s;
};

const CARD = 'mu-day flex flex-col w-day-width h-day-height p-day-pad gap-day-gap';
const PAGE = 'mu-day-page overflow-clip flex-none h-day-page-height rounded-day-page-radius';
const TEAR = 'mu-day-tear absolute top-day-page-tear-top start-day-page-tear-left w-day-page-tear-width h-day-page-tear-height m-0 p-0 border-0 bg-transparent cursor-pointer rounded-day-page-tear-radius focus-visible:focus-ring';
const SIDE = 'absolute top-day-page-side-top end-day-page-side-right w-day-page-side flex flex-col items-center';
const PIX = 'type-day-clock';

export interface DayRootProps extends React.HTMLAttributes<HTMLElement> {
  /** The day to show first (default today). Tearing moves forward from it. */
  date?: Date;
  /** Saturday's date in blue and Sunday's in amber (default true). */
  weekendInk?: boolean;
  /** The tear, the blinks and the pulse (default true). Reduced motion turns them off regardless. */
  animate?: boolean;
  /** Called with the new day after the page is torn off. */
  onTear?: (next: Date) => void;
}

/** The slab and the day it holds: the date, the clock and the tear, shared with every part inside. */
const Root = React.forwardRef<HTMLElement, DayRootProps>(function DayRoot(
  { date, weekendInk = true, animate = true, onTear, className, children, ...props },
  ref,
) {
  const reduced = useReduced();
  const still = reduced || !animate;
  const [watch, awake] = useAwake();
  const nowMs = useNow(awake, BEAT_MS);
  const slab = React.useCallback((el: HTMLElement | null) => {
    watch(el);
    if (typeof ref === 'function') ref(el);
    else if (ref) ref.current = el;
  }, [watch, ref]);
  const [offset, setOffset] = React.useState(0);
  const [frame, setFrame] = React.useState(-1);
  const base = date ?? new Date(nowMs);
  const day = new Date(base.getFullYear(), base.getMonth(), base.getDate() + offset);
  const next = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
  const f = facts(day);
  const now = new Date(nowMs);

  React.useEffect(() => {
    if (frame < 0) return;
    if (frame >= TEAR_FRAMES) { setFrame(-1); return; }
    const id = window.setTimeout(() => {
      if (frame + 1 === TEAR_FRAMES / 2) setOffset((o) => o + 1);
      setFrame(frame + 1);
    }, TEAR_MS);
    return () => window.clearTimeout(id);
  }, [frame]);

  let shown = 1, leaving = false;
  if (frame >= 0 && frame < TEAR_FRAMES / 2) { shown = 1 - (frame + 1) / (TEAR_FRAMES / 2); leaving = true; }
  else if (frame >= TEAR_FRAMES / 2) shown = (frame - TEAR_FRAMES / 2 + 1) / (TEAR_FRAMES / 2);

  const state: DayState = {
    day, next, now, f, ink: inkOf(f.wd, weekendInk), pulse: still || now.getMilliseconds() < 500, shown, leaving,
    tear: () => {
      if (frame >= 0) return;
      onTear?.(next);
      if (still) setOffset((o) => o + 1);
      else setFrame(0);
    },
  };
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    <DayContext.Provider value={state}>
      <Surface ref={slab} as="section" material="raise" radius="card" aria-label={`${f.long}, ${pad(now.getHours())}:${pad(now.getMinutes())}`} className={className ? `${CARD} ${className}` : CARD} {...props}>
        {children}
      </Surface>
    </DayContext.Provider>
  );
});

export interface DayPageProps extends Omit<React.HTMLAttributes<HTMLElement>, 'children'> {
  /** The clock down the side (default true). */
  clock?: boolean;
  /** The sixty dots of the minute along the foot (default true). */
  seconds?: boolean;
}

/** The page: the date in dots, the month and weekday (and the clock) down the side, the seconds along the foot. Tap it to tear. */
function Page({ clock = true, seconds = true, className, ...props }: DayPageProps) {
  const { f, now, next, ink, pulse, shown, leaving, tear } = useDay('Page');
  const p = page(LARGE, f.dom, shown, leaving);
  const pad = (n: number) => String(n).padStart(2, '0');
  const sec = now.getSeconds();
  const secs = { left: '', past: '', now: '' };
  if (seconds) for (let i = 0; i < 60; i++) secs[i < sec ? 'past' : i === sec ? (pulse ? 'now' : 'past') : 'left'] += sq(i, 0, 3.5, 5.3, 7, 185);
  return (
    <Well variant="field" className={className ? `${PAGE} ${className}` : PAGE} {...props}>
      <svg aria-hidden shapeRendering="crispEdges" viewBox="0 0 332 196" className="absolute inset-0 block size-full">
        <path d={p.off} className="fill-day-ink-off" />
        <path d={p.perf} className="fill-day-ink-hole" />
        <path data-part="date" d={p.digit} className={DATE_INK[ink]} />
        <path d={p.fall} className={`${DATE_INK[ink]} opacity-day-ink-fall-opacity`} />
        <path d={secs.left} className="fill-day-ink-left" />
        <path data-part="seconds" d={secs.past} className="fill-ink2" />
        <path d={secs.now} className="fill-day-ink-sunday" />
      </svg>
      <button type="button" className={TEAR} aria-label={`${f.long}. Tear off this page to go to ${WEEKDAYS[next.getDay()]} ${next.getDate()} ${MONTHS[next.getMonth()]}.`} onClick={tear} />
      <div aria-hidden className={SIDE}>
        <span className={`${PIX} text-ink`}>{f.monShort}</span>
        <span className={`${PIX} ${DATE_TEXT[ink]}`}>{f.wdShort}</span>
        {clock && (
          <>
            <span data-part="hours" className={`${PIX} text-ink mt-day-clock-gap`}>{pad(now.getHours())}</span>
            <svg aria-hidden viewBox="0 0 12 12" className={`block size-day-clock-colon my-day-clock-colon-gap ${pulse ? '' : 'opacity-day-clock-colon-dim'}`}>
              <path d="M3 1h6v4H3ZM3 7h6v4H3Z" className="fill-ink" />
            </svg>
            <span data-part="minutes" className={`${PIX} text-ink`}>{pad(now.getMinutes())}</span>
          </>
        )}
      </div>
    </Well>
  );
}

/** The year so far: one dot a day (today pulses), the days left in the pixel face, the day's number and the moon. */
function Year({ className, ...props }: Omit<React.HTMLAttributes<HTMLDivElement>, 'children'>) {
  const { f, day, pulse } = useDay('Year');
  const year = { left: '', past: '', today: '' };
  for (let k = 0; k < f.yearDays; k++) year[k < f.doy - 1 ? 'past' : k === f.doy - 1 ? (pulse ? 'today' : 'past') : 'left'] += sq(k % 27, Math.floor(k / 27), 3.5, 5);
  const own = 'flex items-center h-day-year-height gap-day-year-gap';
  return (
    <div className={className ? `${own} ${className}` : own} {...props}>
      <svg role="img" aria-label={`Day ${f.doy} of ${f.yearDays}: ${f.left} days left`} shapeRendering="crispEdges" viewBox="0 0 135 70" className="block flex-none w-day-year-width h-day-year-height">
        <path d={year.left} className="fill-day-ink-left" />
        <path d={year.past} className="fill-ink2" />
        <path data-part="today" d={year.today} className="fill-day-ink-sunday" />
      </svg>
      <div className="flex flex-col min-w-0 gap-day-text-gap">
        <div className="flex items-baseline gap-day-left-gap">
          <span className="type-day-left text-ink">{f.left}</span>
          <span className="type-lead text-ink">days left</span>
        </div>
        <span className="type-lead text-ink2">Day {f.doy} · {moon(day).name}</span>
      </div>
    </div>
  );
}

export interface DayLineProps extends Omit<React.HTMLAttributes<HTMLElement>, 'children'> {
  /** The lines to choose from, one a day by the day of the year (default DAY_LINES). */
  lines?: DayLine[];
  /** One line, whatever the day. */
  line?: DayLine;
}

/** One line for the day and who said it. */
function Line({ lines = DAY_LINES, line, className, ...props }: DayLineProps) {
  const { f } = useDay('Line');
  const chosen = line ?? (lines.length ? lines[f.doy % lines.length] : null);
  if (!chosen) return null;
  const own = 'm-0 flex flex-col gap-day-text-gap';
  return (
    <figure className={className ? `${own} ${className}` : own} {...props}>
      <blockquote className="m-0 type-title text-ink">{chosen.text}</blockquote>
      <figcaption className="type-meta text-ink2">{chosen.by}</figcaption>
    </figure>
  );
}

export interface DayProps extends Omit<DayRootProps, 'children'> {
  lines?: DayLine[];
}

/** The large day widget: Day.Root › Day.Page › Day.Year › Day.Line. */
const DayWidget = React.forwardRef<HTMLElement, DayProps>(function Day({ lines, ...props }, ref) {
  return (
    <Root ref={ref} {...props}>
      <Page />
      <Year />
      <Line lines={lines} />
    </Root>
  );
});

export const Day = Object.assign(DayWidget, { Root, Page, Year, Line });

/* ── the tile ───────────────────────────────────────────── */

const TILE = 'mu-day-tile size-day-tile-size p-day-tile-pad';
const TILE_PAGE = 'mu-day-page overflow-clip h-day-tile-screen rounded-day-page-radius';
const TILE_FOOT = 'absolute inset-x-day-tile-inset bottom-day-tile-foot flex items-end justify-between';

export interface DayTileProps extends Omit<React.HTMLAttributes<HTMLElement>, 'children'> {
  /** The day to show (default today, turning over at midnight). */
  date?: Date;
  /** Saturday's date in blue and Sunday's in amber (default true). */
  weekendInk?: boolean;
}

/** A small day tile: the date in dots, the weekday and month, the days left and the moon. */
export const DayTile = React.forwardRef<HTMLElement, DayTileProps>(function DayTile({ date, weekendInk = true, className, ...props }, ref) {
  const nowMs = useNow(!date, 60000);
  const day = date ?? new Date(nowMs);
  const f = facts(day);
  const p = page(SMALL, f.dom, 1, false);
  const ink = inkOf(f.wd, weekendInk);
  const phase = moon(day);
  return (
    <Surface ref={ref} as="section" material="raise" radius="card" role="img" aria-label={`${f.long}, ${phase.name}`} className={className ? `${TILE} ${className}` : TILE} {...props}>
      <Well variant="field" className={TILE_PAGE}>
        <svg aria-hidden shapeRendering="crispEdges" viewBox="0 0 168 168" className="absolute inset-0 block size-full">
          <path d={p.off} className="fill-day-ink-off" />
          <path d={p.perf} className="fill-day-ink-hole" />
          <path data-part="date" d={p.digit} className={DATE_INK[ink]} />
        </svg>
        <div className={TILE_FOOT}>
          <div className="flex flex-col gap-day-text-gap">
            <span className="type-label engraved">{f.wdShort} · {f.monShort}</span>
            <span className="type-readout text-ink2">{f.left} days left</span>
          </div>
          <svg aria-hidden shapeRendering="crispEdges" viewBox="0 0 21 21" className="block size-day-tile-moon">
            <path d={phase.dark} className="fill-day-ink-off" />
            <path d={phase.lit} className="fill-day-ink-moon" />
          </svg>
        </div>
      </Well>
    </Surface>
  );
});
