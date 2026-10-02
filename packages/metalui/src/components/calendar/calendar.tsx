'use client';

import * as React from 'react';
import { SwapText } from '../../motion/swap';
import { buttonClasses } from '../button/button';
import { Popover } from '../popover/popover';

/* ─────────────────────────────────────────────────────────
 * CALENDAR and DATE PICKER, a month to choose a day from
 *
 *   grid      weekday initials, then six rows of days (always six: the height never jumps)
 *   hover     a day sinks a touch into the switcher's track look (only the chosen day stands raised)
 *   today     a small green lamp under its number
 *   choose    the chosen day takes the switcher's raised thumb look and lands into it on the part
 *             spring (a day is not a track: the choice lands where it is, never glides across weeks)
 *   month     the title turns on the drum (up for later, down for earlier); the grid comes in two
 *             grid steps from the side you are heading to as it fades in, on the settle spring
 *   keys      arrows by day and week, Page Up / Down by month, Home / End to the week's ends,
 *             Enter or Space chooses; moving past the month turns it
 *   limits    days outside the month in ink3; days out of range disabled at 40 %
 *   picker    a form field that opens the calendar in a popover; choosing closes it and the
 *             field's text turns on the drum
 * Reduce Motion: the grid arrives and the choice lands at once; the fades stay.
 * ───────────────────────────────────────────────────────── */

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const addMonths = (d: Date, n: number) => {
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return new Date(target.getFullYear(), target.getMonth(), Math.min(d.getDate(), last));
};
const sameDay = (a: Date | null | undefined, b: Date | null | undefined) => !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const monthKey = (d: Date) => d.getFullYear() * 12 + d.getMonth();

/** The first day of the week for a locale, as a JS day (0 Sunday … 6 Saturday). */
function weekStartOf(locale?: string) {
  try {
    const loc = new Intl.Locale(locale ?? navigator.language) as Intl.Locale & { getWeekInfo?: () => { firstDay: number }; weekInfo?: { firstDay: number } };
    const first = loc.getWeekInfo?.().firstDay ?? loc.weekInfo?.firstDay ?? 1;
    return first % 7;
  } catch {
    return 1;
  }
}

const ROOT = 'mu-calendar inline-grid max-w-full gap-calendar-head-gap p-calendar-pad select-none';
const HEAD = 'mu-calendar-head flex items-center justify-between gap-calendar-head-gap h-calendar-head-height';
const TITLE = 'mu-calendar-title type-title text-ink';
const STEP = `${buttonClasses('standard', 'compact')} mu-calendar-step px-0! w-calendar-head-height justify-center`;
const GRID_WRAP = 'mu-calendar-body relative';
const TABLE = 'mu-calendar-grid calendar-grid';
const WEEKDAY = 'mu-calendar-weekday size-calendar-day-size p-0 type-meta text-ink3 text-center';
const CELL = 'p-0';
const DAY = 'mu-calendar-day relative z-1 grid place-items-center size-calendar-day-size rounded-calendar-day-radius border-0 bg-transparent type-ui tabular-nums text-ink cursor-pointer outline-none transition-row hover:not-data-selected:recipe-switcher data-selected:recipe-switcher-thumb data-selected:text-ink data-selected:calendar-land focus-visible:focus-ring data-outside:text-ink3 disabled:opacity-calendar-disabled disabled:cursor-default data-today:calendar-today data-unavailable:opacity-calendar-disabled data-unavailable:cursor-not-allowed';

export type CalendarMode = 'single' | 'range' | 'multiple';
export interface DateRange { start: Date | null; end: Date | null }
export type CalendarValue<M extends CalendarMode = 'single'> = M extends 'range' ? DateRange : M extends 'multiple' ? Date[] : Date | null;

export interface CalendarProps<M extends CalendarMode = 'single'> {
  mode?: M;
  value?: CalendarValue<M>;
  defaultValue?: CalendarValue<M>;
  onValueChange?: (value: M extends 'single' ? Date : CalendarValue<M>) => void;
  month?: Date;
  onMonthChange?: (month: Date) => void;
  defaultMonth?: Date;
  min?: Date;
  max?: Date;
  /** Unavailable days remain focusable and explain why they cannot be chosen. */
  isDateUnavailable?: (date: Date) => boolean;
  unavailableLabel?: string;
  /** Inclusive number of calendar days in a completed range. */
  minDays?: number;
  maxDays?: number;
  locale?: string;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** ISO-8601 week numbers (Monday week, week one contains 4 January). */
  weekNumbers?: boolean;
  months?: number;
  /** A description also announced with the day; true uses “Has events”. */
  markedDays?: (date: Date) => string | boolean;
  readOnly?: boolean;
  autoFocus?: boolean;
  'aria-label'?: string;
  className?: string;
}

function firstChosen(value: Date | Date[] | DateRange | null | undefined): Date | null {
  return value instanceof Date ? value : Array.isArray(value) ? value[0] ?? null : value?.start ?? null;
}
const dayKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const dayCount = (start: Date, end: Date) => Math.round((Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()) - Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())) / 86400000) + 1;
function orderedRange(start: Date, end: Date): DateRange { return start <= end ? { start, end } : { start: end, end: start }; }
function isoWeek(date: Date) {
  const thursday = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  thursday.setUTCDate(thursday.getUTCDate() + 4 - (thursday.getUTCDay() || 7));
  return Math.ceil((((thursday.getTime() - Date.UTC(thursday.getUTCFullYear(), 0, 1)) / 86400000) + 1) / 7);
}

/** A calendar control for a single day, an inclusive range, or several independent days. */
export function Calendar<M extends CalendarMode = 'single'>({ mode = 'single' as M, value, defaultValue, onValueChange, month: controlledMonth, onMonthChange, defaultMonth, min, max, isDateUnavailable, unavailableLabel = 'Unavailable', minDays = 1, maxDays, locale, weekStartsOn, weekNumbers = false, months = 1, markedDays, readOnly = false, autoFocus, className, ...aria }: CalendarProps<M>) {
  const empty = mode === 'multiple' ? [] : mode === 'range' ? { start: null, end: null } : null;
  const [own, setOwn] = React.useState<CalendarValue<M>>((defaultValue ?? empty) as CalendarValue<M>);
  const chosen = value !== undefined ? value : own;
  const chosenDay = firstChosen(chosen);
  const range = mode === 'range' ? chosen as DateRange : null;
  const today = startOfDay(new Date());
  const count = Math.max(1, Math.trunc(months));
  const [ownMonth, setOwnMonth] = React.useState(() => startOfMonth(controlledMonth ?? defaultMonth ?? chosenDay ?? today));
  const month = startOfMonth(controlledMonth ?? ownMonth);
  const [focused, setFocused] = React.useState<Date>(() => startOfDay(chosenDay ?? defaultMonth ?? today));
  const [preview, setPreview] = React.useState<Date | null>(null);
  const [dir, setDir] = React.useState<'later' | 'earlier' | null>(null);
  const moved = React.useRef(autoFocus ?? false);
  const grids = React.useRef<HTMLDivElement>(null);
  const gridFocused = React.useRef(false);
  const titleId = React.useId();
  const [jump, setJump] = React.useState(false);
  const first = weekStartsOn ?? weekStartOf(locale);
  const full = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const titleFormat = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' });
  const out = (d: Date) => (min != null && d < startOfDay(min)) || (max != null && d > startOfDay(max));
  const unavailable = (d: Date) => !!isDateUnavailable?.(d);
  const validRange = (candidate: DateRange) => {
    if (!candidate.start || !candidate.end) return false;
    const length = dayCount(candidate.start, candidate.end);
    if (length < Math.max(1, minDays) || (maxDays != null && length > maxDays)) return false;
    for (let d = candidate.start; d <= candidate.end; d = addDays(d, 1)) if (out(d) || unavailable(d)) return false;
    return true;
  };
  const pending = range?.start && !range.end ? range.start : null;
  const shownRange = pending && preview ? orderedRange(pending, preview) : range;
  const previewValid = !pending || !preview || !!shownRange && validRange(shownRange);
  const visibleMonth = monthKey(month);
  const visible = (d: Date) => monthKey(d) >= visibleMonth && monthKey(d) < visibleMonth + count;
  const panels = Array.from({ length: count }, (_, index) => {
    const at = addMonths(month, index);
    const lead = (at.getDay() - first + 7) % 7;
    return { at, days: Array.from({ length: 42 }, (_, i) => addDays(at, i - lead)) };
  });
  const days = panels.flatMap(({ at, days }) => count > 1 ? days.filter((d) => monthKey(d) === monthKey(at)) : days);
  const active = days.find((d) => sameDay(d, focused) && !out(d))
    ?? days.find((d) => sameDay(d, chosenDay) && !out(d))
    ?? days.find((d) => monthKey(d) === visibleMonth && !out(d))
    ?? days.find((d) => !out(d));

  const showMonth = (next: Date) => {
    const at = startOfMonth(next);
    if (monthKey(at) === visibleMonth) return;
    if (controlledMonth === undefined) setOwnMonth(at);
    onMonthChange?.(at);
  };
  const go = (next: Date, byKey: boolean) => {
    const clamped = min && next < startOfDay(min) ? startOfDay(min) : max && next > startOfDay(max) ? startOfDay(max) : next;
    if (!visible(clamped)) showMonth(clamped);
    moved.current = byKey;
    setFocused(clamped);
    if (pending) setPreview(clamped);
  };
  const stepMonth = (step: number) => {
    const target = addMonths(month, step);
    target.setDate(Math.min((active ?? focused).getDate(), new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()));
    moved.current = false;
    setFocused(target);
    setPreview(null);
    showMonth(target);
  };
  const choose = (d: Date) => {
    if (out(d) || unavailable(d) || readOnly) return;
    let next: Date | Date[] | DateRange | null = d;
    if (mode === 'multiple') {
      const selected = chosen as Date[];
      next = selected.some((v) => sameDay(v, d)) ? selected.filter((v) => !sameDay(v, d)) : [...selected, d].sort((a, b) => a.getTime() - b.getTime());
    } else if (mode === 'range') {
      if (pending) {
        const candidate = orderedRange(pending, d);
        if (!validRange(candidate)) return;
        next = candidate;
      } else next = { start: d, end: null };
    }
    if (value === undefined) setOwn(next as CalendarValue<M>);
    setPreview(null);
    go(d, true);
    onValueChange?.(next as M extends 'single' ? Date : CalendarValue<M>);
  };
  const valueDay = chosenDay ? startOfDay(chosenDay).getTime() : null;
  const seenValue = React.useRef(valueDay);
  const seenMonth = React.useRef(visibleMonth);
  React.useLayoutEffect(() => {
    if (seenValue.current !== valueDay) {
      seenValue.current = valueDay;
      if (chosenDay) {
        if (!sameDay(chosenDay, focused)) setFocused(startOfDay(chosenDay));
        if (controlledMonth === undefined && !visible(chosenDay)) setOwnMonth(startOfMonth(chosenDay));
      }
    }
    if (seenMonth.current !== visibleMonth) {
      setDir(visibleMonth > seenMonth.current ? 'later' : 'earlier');
      seenMonth.current = visibleMonth;
    }
  });
  React.useEffect(() => {
    if (!moved.current && !gridFocused.current) return;
    grids.current?.querySelector<HTMLButtonElement>('button[tabindex="0"]')?.focus();
    moved.current = false;
  }, [focused, visibleMonth]);
  const onKey = (e: React.KeyboardEvent) => {
    if (!active) return;
    const map: Record<string, () => Date> = {
      ArrowLeft: () => addDays(active, -1), ArrowRight: () => addDays(active, 1),
      ArrowUp: () => addDays(active, -7), ArrowDown: () => addDays(active, 7),
      PageUp: () => addMonths(active, e.shiftKey ? -12 : -1), PageDown: () => addMonths(active, e.shiftKey ? 12 : 1),
      Home: () => addDays(active, -((active.getDay() - first + 7) % 7)), End: () => addDays(active, 6 - ((active.getDay() - first + 7) % 7)),
    };
    if (map[e.key]) { e.preventDefault(); go(map[e.key](), true); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(active); }
    else if (e.key === 'Escape' && pending) { setPreview(null); }
  };
  const arrive = dir === 'later' ? 'calendar-arrive-later' : dir === 'earlier' ? 'calendar-arrive-earlier' : '';
  return <div className={className ? `${ROOT} ${className}` : ROOT} aria-label={aria['aria-label']} role="group">
    <div className={HEAD}>
      <button type="button" className={STEP} aria-label="Previous month" onClick={() => stepMonth(-1)} disabled={min != null && month <= startOfMonth(min)}><svg aria-hidden viewBox="0 0 10 10" className="size-calendar-step-glyph" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M6.25 2 3.25 5l3 3" /></svg></button>
      <Popover open={jump} onOpenChange={setJump}>
        <Popover.Trigger><button type="button" aria-label={`Choose month and year: ${titleFormat.format(month)}`} className="border-0 bg-transparent p-0 cursor-pointer rounded-calendar-day-radius focus-visible:focus-ring"><span id={titleId} aria-live="polite" className={dir === 'earlier' ? `${TITLE} swap-down` : TITLE}><SwapText value={titleFormat.format(month)} /></span></button></Popover.Trigger>
        <Popover.Content><div className="mu-stack p-mu-space-12">
          <label className="mu-cluster type-ui text-ink">Year <input aria-label="Calendar year" type="number" value={month.getFullYear()} min={min?.getFullYear() ?? 1} max={max?.getFullYear() ?? 9999} className="recipe-well-field rounded-field-regular-radius h-field-regular-height p-mu-space-8 type-ui text-ink" onChange={(e) => { const year = Number(e.currentTarget.value); if (year >= (min?.getFullYear() ?? 1) && year <= (max?.getFullYear() ?? 9999)) showMonth(new Date(year, month.getMonth(), 1)); }} /></label>
          <div className="mu-auto-grid gap-mu-space-4">{Array.from({ length: 12 }, (_, i) => { const d = new Date(month.getFullYear(), i, 1); return <button type="button" className={buttonClasses('standard', 'compact')} key={i} disabled={!!min && monthKey(d) < monthKey(min) || !!max && monthKey(d) > monthKey(max)} onClick={() => { showMonth(d); setFocused(d); setJump(false); }}>{new Intl.DateTimeFormat(locale, { month: 'long' }).format(d)}</button>; })}</div>
        </div></Popover.Content>
      </Popover>
      <button type="button" className={STEP} aria-label="Next month" onClick={() => stepMonth(1)} disabled={max != null && monthKey(month) + count - 1 >= monthKey(max)}><svg aria-hidden viewBox="0 0 10 10" className="size-calendar-step-glyph" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M3.75 2 6.75 5l-3 3" /></svg></button>
    </div>
    <div ref={grids} className="mu-cluster items-start gap-mu-group" onMouseLeave={() => setPreview(null)}>
      {panels.map(({ at, days }, index) => <div className={GRID_WRAP} key={monthKey(at)}>
        {count > 1 && <div id={`${titleId}-${index}`} className="type-ui text-ink text-center">{titleFormat.format(at)}</div>}
        <table role="grid" aria-labelledby={count > 1 ? `${titleId}-${index}` : titleId} aria-multiselectable={mode !== 'single' || undefined} aria-readonly={readOnly || undefined} className={`${TABLE} ${arrive}`} onKeyDown={onKey} onFocusCapture={() => { gridFocused.current = true; }} onBlurCapture={(e) => { if (!grids.current?.contains(e.relatedTarget as Node)) gridFocused.current = false; }}>
          <thead><tr>{weekNumbers && <th scope="col" className={WEEKDAY} abbr="ISO week number">Wk</th>}{days.slice(0, 7).map((d, i) => <th key={i} scope="col" abbr={new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(d)} className={WEEKDAY}>{new Intl.DateTimeFormat(locale, { weekday: 'narrow' }).format(d)}</th>)}</tr></thead>
          <tbody>{Array.from({ length: 6 }, (_, r) => <tr key={r}>
            {weekNumbers && <th scope="row" className={WEEKDAY} aria-label={`ISO week ${isoWeek(addDays(days[r * 7], (1 - first + 7) % 7))}`}>{isoWeek(addDays(days[r * 7], (1 - first + 7) % 7))}</th>}
            {days.slice(r * 7, r * 7 + 7).map((d) => {
              if (count > 1 && monthKey(d) !== monthKey(at)) return <td key={d.getTime()} className={CELL} />;
              const inside = !!shownRange?.start && !!shownRange.end && d >= shownRange.start && d <= shownRange.end && previewValid;
              const selected = mode === 'multiple' ? (chosen as Date[]).some((v) => sameDay(v, d)) : mode === 'range' ? !!range?.start && (sameDay(d, range.start) || !!range.end && d >= range.start && d <= range.end) : sameDay(d, chosenDay);
              const endpoint = inside && (sameDay(d, shownRange?.start) || sameDay(d, shownRange?.end));
              const mark = markedDays?.(d);
              const blocked = unavailable(d);
              return <td key={d.getTime()} role="gridcell" aria-selected={selected} className={`${CELL}${inside ? ' calendar-range-cell' : ''}`} data-range-start={inside && sameDay(d, shownRange?.start) ? '' : undefined} data-range-end={inside && sameDay(d, shownRange?.end) ? '' : undefined} data-preview={pending && inside ? '' : undefined}>
                <button type="button" tabIndex={sameDay(d, active) ? 0 : -1} className={`${DAY}${mark ? ' calendar-marked' : ''}`} aria-label={`${full.format(d)}${blocked ? `, ${unavailableLabel}` : ''}${mark ? `, ${typeof mark === 'string' ? mark : 'Has events'}` : ''}`} aria-disabled={blocked || undefined} aria-current={sameDay(d, today) ? 'date' : undefined} data-today={sameDay(d, today) ? '' : undefined} data-selected={selected && (!inside || endpoint) ? '' : undefined} data-unavailable={blocked ? '' : undefined} data-outside={monthKey(d) !== monthKey(at) ? '' : undefined} disabled={out(d)} onClick={() => choose(d)} onMouseEnter={() => { if (pending) setPreview(d); }} onFocus={() => { if (!sameDay(d, focused)) setFocused(d); if (pending) setPreview(d); }}>{d.getDate()}</button>
              </td>;
            })}
          </tr>)}</tbody>
        </table>
      </div>)}
    </div>
    {pending && <span aria-live="polite" className="type-meta text-ink3">{preview && !previewValid ? `Choose ${minDays}${maxDays ? `–${maxDays}` : ' or more'} available days` : 'Choose the end date'}</span>}
  </div>;
}

const PICKER = 'mu-date-picker relative inline-flex items-center gap-field-regular-gap h-field-regular-height min-w-calendar-picker-min-width pl-field-regular-pad-left pr-field-regular-pad-right rounded-field-regular-radius box-border border-0 recipe-well-field type-ui text-field-field-ink text-left cursor-pointer outline-none focus-visible:focus-ring-flush data-popup-open:focus-ring-flush disabled:opacity-field-state-disabled disabled:cursor-default data-invalid:invalid-ring';

export interface DatePickerProps extends Omit<CalendarProps, 'autoFocus' | 'aria-label'> {
  /** Shown when no day is chosen. */
  placeholder?: string;
  /** Names the field for assistive tech. */
  'aria-label': string;
  invalid?: boolean;
  disabled?: boolean;
  /** How the chosen day is written in the field. */
  format?: Intl.DateTimeFormatOptions;
}

/** A form field that opens a calendar. */
export function DatePicker({ value, defaultValue, onValueChange, placeholder = 'Choose a day', invalid, disabled, format = { day: 'numeric', month: 'short', year: 'numeric' }, locale, className, ...rest }: DatePickerProps) {
  const [own, setOwn] = React.useState<Date | null>(defaultValue ?? null);
  const chosen = value !== undefined ? value : own;
  const [open, setOpen] = React.useState(false);
  const text = chosen ? new Intl.DateTimeFormat(locale, format).format(chosen) : placeholder;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Popover.Trigger>
        <button type="button" disabled={disabled} aria-label={`${rest['aria-label']}: ${chosen ? text : 'none chosen'}`} aria-invalid={invalid || undefined} data-invalid={invalid ? '' : undefined} className={className ? `${PICKER} ${className}` : PICKER}>
          <svg aria-hidden viewBox="0 0 14 14" className="size-field-regular-glyph flex-none text-ink2" fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round"><rect x="2" y="3" width="10" height="9" rx="2" /><path d="M2 6h10M5 1.5v3M9 1.5v3" /></svg>
          <span className={chosen ? 'flex-1' : 'flex-1 text-field-field-hint'}><SwapText value={text} /></span>
        </button>
      </Popover.Trigger>
      <Popover.Content align="start">
        <Calendar
          {...rest}
          locale={locale}
          value={chosen}
          autoFocus
          aria-label={rest['aria-label']}
          onValueChange={(d) => {
            if (value === undefined) setOwn(d);
            onValueChange?.(d);
            setOpen(false);
          }}
        />
      </Popover.Content>
    </Popover>
  );
}

