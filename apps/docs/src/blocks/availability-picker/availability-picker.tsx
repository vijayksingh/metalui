'use client';

import * as React from 'react';
import { Radio as BaseRadio } from '@base-ui/react/radio';
import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group';
import { Avatar, Button, Calendar, useReducedMotion, EmptyState, Led, Select, SwapText, Switcher } from '@unlocalhosted/metalui';
import { ClockIcon, LinkIcon, MorphIcon } from '@unlocalhosted/metalui/icons';

/* ─────────────────────────────────────────────────────────
 * AVAILABILITY PICKER · booking a call with someone, in three moves: a day, a time, Confirm
 *
 *   rest      a raised slab in three columns: the host (disc, name, the call's length and what
 *             it is for, a length switch); the month (from today to six weeks out; days with no
 *             free time in ink3); the chosen day's free times as a column of keys, under a
 *             time zone select
 *
 *   length    15 · 30 · 60 min (the switch's thumb glides on the part spring)
 *      0 ms   the heading's length turns on the drum
 *      0 ms   the keys come up one step as they fade in, top to bottom (settle, stagger 24 ms)
 *
 *   day       choosing a day in the month (click, or the arrows and Enter)
 *      0 ms   the day's heading turns on the drum
 *      0 ms   the keys come in two grid steps from the side the calendar moved (a later day from
 *             the right, an earlier one from the left) as they fade in (settle, stagger 24 ms);
 *             a latched time lets go (it belonged to the other day)
 *             a day with nothing free says so, with a key to the next free day
 *
 *   zone      the select re-labels every time; each key's figures turn on the drum, top to bottom
 *             (stagger 12 ms); the summary's time and zone turn with them
 *
 *   time      choosing a time: its key latches (sinks and holds on the part spring, its lamp
 *             lights; the key held before rises). The Confirm row opens under the columns (settle)
 *             with the summary, "Thu 2 Oct · 14:30–15:00 Lisbon time", and the Confirm key
 *
 *   confirm   0 ms   the key goes down and stays down; its glyph morphs calendar → clock and the
 *                    label turns to "Booking…"; its lamp waits
 *          ~900 ms   (the sample wait, or your onBook) the glyph morphs clock → check, the label
 *                    turns to "Booked"; the columns step back to a dim, still layer (settle); a
 *                    Change key comes in beside it; a polite status says what was booked
 *   change   the columns come back, the key rises, the glyph morphs back to the calendar, and
 *            focus returns to the Confirm key
 *
 * Reduce Motion: everything changes at once; no key travels, the drum crossfades.
 * Layout follows the block's own width (a container): three columns from 56rem; from 36rem the
 * host sits across the top of the month and the times; under that everything stacks and the
 * times wrap in rows.
 * ───────────────────────────────────────────────────────── */

const TIMING = {
  keyStagger:     24,   // ms between time keys arriving, top to bottom
  keyStaggerCap:  8,    // keys after this many arrive with the eighth (the column never trails)
  relabelStagger: 12,   // ms between key labels turning when the zone changes
  booking:        900,  // ms of the sample wait before "Booked" (onBook replaces it)
};

const SCHEDULE = {
  from:        9 * 60,        // the host's day starts (minutes, host time)
  to:          17 * 60 + 30,  // and ends
  busy:        0.42,          // chance a half hour is already taken
  fullyBooked: 0.12,          // chance a weekday has nothing left
  notice:      60,            // minutes: today's times start at least this far ahead
  weeksAhead:  6,             // the last bookable day
};

/* ── Sample data ───────────────────────────────────────────── */

type Length = '15' | '30' | '60';
const LENGTHS: { value: Length; label: string }[] = [
  { value: '15', label: '15 min' },
  { value: '30', label: '30 min' },
  { value: '60', label: '60 min' },
];

const ZONES: { value: string; city: string }[] = [
  { value: 'Europe/Lisbon', city: 'Lisbon' },
  { value: 'Europe/London', city: 'London' },
  { value: 'Europe/Berlin', city: 'Berlin' },
  { value: 'America/New_York', city: 'New York' },
  { value: 'America/Los_Angeles', city: 'Los Angeles' },
  { value: 'Asia/Kolkata', city: 'Kolkata' },
];

export interface Host {
  name: string;
  role: string;
  /** Their IANA time zone: the free times are their working hours. */
  zone: string;
  /** What the call is for, in a line. */
  about: string;
}

const ANA: Host = {
  name: 'Ana Rocha',
  role: 'Design engineer',
  zone: 'Europe/Lisbon',
  about: 'A first look at what you are building: where it is stuck, and what we would do next.',
};

/** A small seeded random, so the sample times are the same on every visit. */
function seeded(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const dayKey = (d: Date) => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();

/** The host's free half hours on a day (minutes after midnight, host time). Weekends are empty. */
function freeHalfHours(day: Date) {
  const weekday = day.getDay();
  if (weekday === 0 || weekday === 6) return [];
  const r = seeded(dayKey(day));
  if (r() < SCHEDULE.fullyBooked) return [];
  const cells: number[] = [];
  for (let m = SCHEDULE.from; m < SCHEDULE.to; m += 30) if (r() > SCHEDULE.busy) cells.push(m);
  return cells;
}

/* ── Time zones ────────────────────────────────────────────── */

const parts = new Map<string, Intl.DateTimeFormat>();
/** How far a zone's wall clock is ahead of UTC at an instant (ms). */
function offsetOf(at: number, zone: string) {
  let f = parts.get(zone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', { timeZone: zone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' });
    parts.set(zone, f);
  }
  const p = Object.fromEntries(f.formatToParts(new Date(at)).map((x) => [x.type, x.value]));
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - at;
}

/** The instant a wall-clock time on a day happens in a zone. */
function instantIn(day: Date, minutes: number, zone: string) {
  const wall = Date.UTC(day.getFullYear(), day.getMonth(), day.getDate(), 0, minutes);
  const guess = wall - offsetOf(wall, zone);
  return wall - offsetOf(guess, zone);
}

/** The instants a call of this length can start on a day: every free half hour with room after it. */
function startsOn(day: Date, length: Length, host: Host, now: number) {
  const cells = freeHalfHours(day);
  const free = new Set(cells);
  const need = Math.ceil(Number(length) / 30);
  return cells
    .filter((m) => Array.from({ length: need }, (_, k) => m + k * 30).every((c) => free.has(c)))
    .map((m) => instantIn(day, m, host.zone))
    .filter((at) => at >= now + SCHEDULE.notice * 60_000);
}

const clock = (zone: string) => new Intl.DateTimeFormat('en-GB', { timeZone: zone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const shortDay = (zone: string) => new Intl.DateTimeFormat('en-GB', { timeZone: zone, weekday: 'short', day: 'numeric', month: 'short' });
const longDay = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
const offsetName = (zone: string, at: number) => new Intl.DateTimeFormat('en-GB', { timeZone: zone, timeZoneName: 'shortOffset' }).formatToParts(new Date(at)).find((p) => p.type === 'timeZoneName')?.value ?? '';

/* ── Motion helpers ────────────────────────────────────────── */

/** A spring's duration (ms, zero under Reduce Motion) and curve, read from the element's own tokens. */
function spring(el: Element, name: 'settle' | 'part') {
  const s = getComputedStyle(el);
  const ms = parseFloat(s.getPropertyValue(`--mu-spring-${name}-d`)) * 1000 * (parseFloat(s.getPropertyValue(`--mu-travel-${name}`)) || 0);
  return { ms, easing: s.getPropertyValue(`--mu-spring-${name}`).trim() || 'ease-out' };
}

/** A value that follows another after a delay: labels turn one after another, top to bottom. */
function useLater<T>(value: T, ms: number) {
  const [later, setLater] = React.useState(value);
  React.useEffect(() => {
    if (!ms) { setLater(value); return; }
    const t = window.setTimeout(() => setLater(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return later;
}

/**
 * The keys arrive when the list changes: from the side the calendar moved for a new day, up one
 * step for a new length. The first list, and a new zone, arrive in place.
 */
function useArrival(list: React.RefObject<HTMLElement | null>, day: number, length: Length) {
  const last = React.useRef<{ day: number; length: Length } | null>(null);
  React.useLayoutEffect(() => {
    const was = last.current;
    last.current = { day, length };
    const el = list.current;
    if (!el || !was || (was.day === day && was.length === length)) return;
    const { ms, easing } = spring(el, 'settle');
    if (ms <= 0) return;
    const step = parseFloat(getComputedStyle(el).getPropertyValue('--mu-motion-content')) || 8;
    const x = was.day === day ? 0 : day > was.day ? step : -step;
    const y = x ? 0 : step / 2;
    el.querySelectorAll<HTMLElement>('[data-arrive]').forEach((key, i) => {
      // Interrupted: a key still arriving starts over from the new side.
      key.getAnimations().forEach((a) => { if (a.id === 'arrive') a.cancel(); });
      key.animate(
        [{ opacity: 0, transform: `translate(${x}px, ${y}px)` }, { opacity: 1, transform: 'none' }],
        { id: 'arrive', duration: ms, easing, delay: Math.min(i, TIMING.keyStaggerCap) * TIMING.keyStagger, fill: 'backwards' },
      );
    });
  }, [list, day, length]);
}

/* ── Time keys ─────────────────────────────────────────────── */

// The Toggle's latching key (the button cap, toggle-travel), as a radio: Base UI's Radio gives the
// group its arrows and roving focus; data-pressed gives the key its latch.
const KEY = 'mu-toggle box-border inline-flex items-center justify-center gap-button-gap h-button-height px-button-pad rounded-pill m-0 border-0 whitespace-nowrap cursor-pointer select-none antialiased tap-highlight-none type-ui tabular-nums text-ink recipe-button transition-button toggle-travel data-pressed:recipe-button-pressed not-data-disabled:active:recipe-button-pressed outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-deep';

function TimeKey({ at, zone, chosen, delay }: { at: number; zone: string; chosen: boolean; delay: number }) {
  const label = useLater(clock(zone).format(at), delay);
  return (
    <BaseRadio.Root value={String(at)} data-arrive="" data-pressed={chosen ? '' : undefined} className={KEY} aria-label={clock(zone).format(at)}>
      <Led kind={chosen ? 'live' : 'off'} size="small" />
      <SwapText value={label} />
    </BaseRadio.Root>
  );
}

/* ── The block ─────────────────────────────────────────────── */

export interface Booking {
  /** When the call starts and ends. */
  start: Date;
  end: Date;
  /** The zone the person chose to read it in. */
  zone: string;
}

export interface AvailabilityPickerProps {
  host?: Host;
  /** Book the call. The key waits while this runs; without it a short sample wait stands in. */
  onBook?: (booking: Booking) => Promise<void> | void;
  className?: string;
}

type Phase = 'choosing' | 'booking' | 'booked';

/** Book a call with someone: a length, a day in the next six weeks, one of their free times, Confirm. */
export function AvailabilityPicker({ host = ANA, onBook, className }: AvailabilityPickerProps) {
  const today = React.useMemo(() => startOfDay(new Date()), []);
  const last = React.useMemo(() => addDays(today, SCHEDULE.weeksAhead * 7), [today]);
  const now = React.useMemo(() => Date.now(), []);
  const [length, setLength] = React.useState<Length>('30');
  const startsFor = React.useCallback((d: Date, l: Length = length) => startsOn(d, l, host, now), [length, host, now]);
  const nextFree = React.useCallback((from: Date) => {
    for (let d = from; d <= last; d = addDays(d, 1)) if (startsFor(d).length) return d;
    return null;
  }, [last, startsFor]);

  const [day, setDay] = React.useState<Date>(() => nextFree(today) ?? today);
  const [zone, setZone] = React.useState(host.zone);
  const [time, setTime] = React.useState<number | null>(null);
  const [phase, setPhase] = React.useState<Phase>('choosing');
  const [root, setRoot] = React.useState<HTMLElement | null>(null);
  const reduced = useReducedMotion(root);
  const list = React.useRef<HTMLDivElement>(null);
  const confirmKey = React.useRef<HTMLElement>(null);
  const headingId = React.useId();

  const starts = React.useMemo(() => startsFor(day), [startsFor, day]);
  useArrival(list, dayKey(day), length);

  // A new day lets go of the time; a new length keeps it when it still fits.
  const chooseDay = (d: Date) => { setDay(d); setTime(null); };
  const chooseLength = (l: Length) => {
    setLength(l);
    if (time != null && !startsOn(day, l, host, now).includes(time)) setTime(null);
  };
  const jumpTo = (d: Date) => {
    chooseDay(d);
    requestAnimationFrame(() => list.current?.querySelector<HTMLElement>('[role=radio]')?.focus());
  };

  const end = time != null ? time + Number(length) * 60_000 : null;
  const city = ZONES.find((z) => z.value === zone)?.city ?? zone;
  const summary = time != null && end != null ? `${shortDay(zone).format(time)} · ${clock(zone).format(time)}–${clock(zone).format(end)}` : '';

  const confirm = async () => {
    if (time == null || end == null || phase !== 'choosing') return;
    setPhase('booking');
    const booking = { start: new Date(time), end: new Date(end), zone };
    if (onBook) await onBook(booking);
    else await new Promise((done) => window.setTimeout(done, TIMING.booking));
    setPhase('booked');
  };
  const change = () => {
    setPhase('choosing');
    requestAnimationFrame(() => confirmKey.current?.focus());
  };


  const open = time != null;
  const booked = phase === 'booked';
  const free = nextFree(addDays(day, 1));
  const zoneOptions = ZONES.map((z) => ({ value: z.value, label: `${z.city} (${offsetName(z.value, starts[0] ?? now)})` }));

  return (
    <section ref={setRoot} aria-label={`Book a call with ${host.name}`} className={`@container/block grid w-full rounded-surface-radius-hero recipe-surface-raise ${className ?? ''}`}>
      <div
        inert={booked}
        className={`grid gap-24 p-20 transition-opacity duration-settle ease-settle reduced-motion:transition-none @xl/block:grid-cols-[auto_minmax(0,1fr)] @4xl/block:grid-cols-[minmax(0,17rem)_auto_12rem] @4xl/block:justify-between ${booked ? 'opacity-60' : ''}`}
      >
        {/* The host: one column; across the top (identity and length on one line) when there are two */}
        <div className="grid content-start gap-16 @xl/block:col-span-2 @xl/block:grid-cols-[minmax(0,1fr)_auto] @4xl/block:col-span-1 @4xl/block:grid-cols-1">
          <div className="flex items-center gap-12 @xl/block:row-start-1 @4xl/block:row-start-auto">
            <Avatar name={host.name} size="large" presence="live" />
            <div className="grid gap-2">
              <span className="type-ui text-ink">{host.name}</span>
              <span className="type-meta text-ink2">{host.role}</span>
            </div>
          </div>
          <div className="grid content-start gap-8 @xl/block:col-span-2 @xl/block:row-start-2 @4xl/block:col-span-1 @4xl/block:row-start-auto">
            <h2 className="m-0 type-display text-ink"><SwapText value={`${length} min call`} /></h2>
            <p className="m-0 max-w-[40ch] type-body text-ink2">{host.about}</p>
            <ul className="m-0 mt-4 grid list-none gap-6 p-0 type-meta text-ink2">
              <li className="flex items-center gap-8"><ClockIcon size={14} animate={false} className="text-ink3" /><SwapText value={`${length} minutes`} /></li>
              <li className="flex items-center gap-8"><LinkIcon size={14} animate={false} className="text-ink3" />Video call, link sent on booking</li>
            </ul>
          </div>
          <div className="grid justify-items-start gap-6 @xl/block:col-start-2 @xl/block:row-start-1 @xl/block:justify-items-end @xl/block:self-center @4xl/block:col-start-auto @4xl/block:row-start-auto @4xl/block:justify-items-start">
            <span className="type-meta text-ink3">Length</span>
            <Switcher size="compact" aria-label="Length" value={length} onValueChange={chooseLength} options={LENGTHS} />
          </div>
        </div>

        {/* The month */}
        <div className="justify-self-start">
          <Calendar aria-label="Day" value={day} onValueChange={chooseDay} min={today} max={last} locale="en-GB" isDateUnavailable={(d) => startsFor(d).length === 0} unavailableLabel="No available times" />
        </div>

        {/* The day's times */}
        <div className="grid min-w-0 content-start gap-12 @xl/block:flex @xl/block:flex-col @xl/block:pt-calendar-pad @xl/block:[contain:size] @xl/block:min-h-full">
          <div className="grid gap-2">
            <h3 id={headingId} className="m-0 type-title text-ink"><SwapText value={longDay.format(day)} /></h3>
            <span className="type-meta text-ink3">
              <SwapText value={starts.length ? `${starts.length} free · ${length} min` : 'Nothing free'} />
            </span>
          </div>
          <Select size="compact" aria-label="Time zone" value={zone} onValueChange={setZone} options={zoneOptions} className="w-full" />
          <div ref={list} className="-m-4 min-h-0 flex-1 overflow-y-auto p-4">
            {starts.length ? (
              <BaseRadioGroup
                aria-label={`Free times, ${longDay.format(day)}`}
                value={time == null ? null : String(time)}
                onValueChange={(v) => setTime(v == null ? null : Number(v))}
                className="grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-8 @4xl/block:grid-cols-1"
              >
                {starts.map((at, i) => (
                  <TimeKey key={at} at={at} zone={zone} chosen={at === time} delay={reduced ? 0 : i * TIMING.relabelStagger} />
                ))}
              </BaseRadioGroup>
            ) : (
              <EmptyState
                compact
                title="No times this day"
                className="flex-col items-start gap-8"
                action={free ? (
                  <Button size="compact" onClick={() => jumpTo(free)} icon={<MorphIcon name="chevron" turn={270} />}>
                    {`Next free day, ${shortDay(host.zone).format(instantIn(free, 12 * 60, host.zone))}`}
                  </Button>
                ) : undefined}
              />
            )}
          </div>
        </div>
      </div>

      {/* Confirm: opens under the columns once a time is latched */}
      <div
        inert={!open}
        className="grid transition-[grid-template-rows,opacity] duration-settle ease-settle reduced-motion:transition-none"
        style={{ gridTemplateRows: open ? '1fr' : '0fr', opacity: open ? 1 : 0 }}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-12 border-t border-rule px-20 py-16">
            <div className="grid min-w-0 gap-2">
              <span className="type-ui text-ink tabular-nums">
                <SwapText value={summary || '·'} /> <span className="text-ink2"><SwapText value={`${city} time`} /></span>
              </span>
              <span className="type-meta text-ink2">
                <SwapText value={booked ? `Booked with ${host.name} · the invite is on its way` : `${length} min with ${host.name}`} />
              </span>
            </div>
            <div className="flex w-full items-center gap-8 @md/block:w-auto [&>*:last-child]:flex-1 @md/block:[&>*:last-child]:flex-none">
              {booked && <Button cap="strip" onClick={change} className="animate-[mu-empty-state-arrive_var(--mu-spring-settle-d)_var(--mu-spring-settle)_both] reduced-motion:animate-none">Change</Button>}
              <Button
                ref={confirmKey}
                cap="primary"
                onClick={confirm}
                aria-disabled={phase !== 'choosing' || undefined}
                aria-busy={phase === 'booking' || undefined}
                data-held={phase !== 'choosing' ? '' : undefined}
                className="data-held:translate-y-button-travel data-held:recipe-button-primary-pressed data-held:cursor-default"
                icon={<MorphIcon name={phase === 'booked' ? 'check' : phase === 'booking' ? 'clock' : 'calendar'} />}
              >
                <SwapText value={phase === 'booked' ? 'Booked' : phase === 'booking' ? 'Booking…' : 'Confirm'} />
              </Button>
            </div>
          </div>
        </div>
      </div>
      <p role="status" className="sr-only">
        {phase === 'booking' ? `Booking ${summary}, ${city} time…` : booked ? `Booked: ${summary}, ${city} time, with ${host.name}.` : ''}
      </p>
    </section>
  );
}
