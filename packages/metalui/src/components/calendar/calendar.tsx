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

const ROOT = 'mu-calendar inline-grid gap-calendar-head-gap p-calendar-pad select-none';
const HEAD = 'mu-calendar-head flex items-center justify-between gap-calendar-head-gap h-calendar-head-height';
const TITLE = 'mu-calendar-title type-title text-ink';
const STEP = `${buttonClasses('standard', 'compact')} mu-calendar-step px-0! w-calendar-head-height justify-center`;
const GRID_WRAP = 'mu-calendar-body relative';
const TABLE = 'mu-calendar-grid calendar-grid';
const WEEKDAY = 'mu-calendar-weekday size-calendar-day-size p-0 type-meta text-ink3 text-center';
const CELL = 'p-0';
const DAY = 'mu-calendar-day relative z-1 grid place-items-center size-calendar-day-size rounded-calendar-day-radius border-0 bg-transparent type-ui tabular-nums text-ink cursor-pointer outline-none transition-row hover:not-data-selected:recipe-switcher data-selected:recipe-switcher-thumb data-selected:text-ink data-selected:calendar-land focus-visible:focus-ring data-outside:text-ink3 disabled:opacity-calendar-disabled disabled:cursor-default data-today:calendar-today';

export interface CalendarProps {
  value?: Date | null;
  defaultValue?: Date | null;
  onValueChange?: (value: Date) => void;
  /** The displayed month, controlled independently of the chosen day. */
  month?: Date;
  onMonthChange?: (month: Date) => void;
  /** The month shown first (the value's, or today's). */
  defaultMonth?: Date;
  /** The earliest and latest days that can be chosen. */
  min?: Date;
  max?: Date;
  /** A locale for names and the first day of the week (the browser's by default). */
  locale?: string;
  /** Put focus on the chosen day (or today) when it mounts: for a calendar opened in a picker. */
  autoFocus?: boolean;
  'aria-label'?: string;
  className?: string;
}

/** A month to choose a day from. */
export function Calendar({ value, defaultValue, onValueChange, month: controlledMonth, onMonthChange, defaultMonth, min, max, locale, autoFocus, className, ...aria }: CalendarProps) {
  const [own, setOwn] = React.useState<Date | null>(defaultValue ?? null);
  const chosen = value !== undefined ? value : own;
  const today = startOfDay(new Date());
  const [ownMonth, setOwnMonth] = React.useState(() => startOfMonth(controlledMonth ?? defaultMonth ?? chosen ?? today));
  const month = startOfMonth(controlledMonth ?? ownMonth);
  const [focused, setFocused] = React.useState<Date>(() => startOfDay(chosen ?? defaultMonth ?? today));
  const [dir, setDir] = React.useState<'later' | 'earlier' | null>(null);
  const moved = React.useRef(autoFocus ?? false);
  const grid = React.useRef<HTMLTableElement>(null);
  const gridFocused = React.useRef(false);
  const titleId = React.useId();

  const first = weekStartOf(locale);
  const lead = (month.getDay() - first + 7) % 7;
  const days = Array.from({ length: 42 }, (_, i) => addDays(month, i - lead));
  const weekdays = days.slice(0, 7).map((d) => ({ short: new Intl.DateTimeFormat(locale, { weekday: 'narrow' }).format(d), long: new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(d) }));
  const title = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(month);
  const full = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const out = (d: Date) => (min != null && d < startOfDay(min)) || (max != null && d > startOfDay(max));

  // Selection, displayed month and roving focus are separate: focusing an adjacent day
  // must leave its button mounted until the pointer click selects it.
  const go = (next: Date, byKey: boolean) => {
    const clamped = min && next < startOfDay(min) ? startOfDay(min) : max && next > startOfDay(max) ? startOfDay(max) : next;
    if (monthKey(clamped) !== monthKey(month)) {
      if (controlledMonth === undefined) setOwnMonth(startOfMonth(clamped));
      onMonthChange?.(startOfMonth(clamped));
    }
    moved.current = byKey;
    setFocused(clamped);
  };
  const stepMonth = (step: number) => {
    const target = addMonths(month, step);
    const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
    target.setDate(Math.min((active ?? focused).getDate(), last));
    go(target, false);
  };
  const choose = (d: Date) => {
    if (out(d)) return;
    if (value === undefined) setOwn(d);
    go(d, true);
    onValueChange?.(d);
  };

  const valueDay = value ? startOfDay(value).getTime() : null;
  const seenValue = React.useRef(valueDay);
  const visibleMonth = monthKey(month);
  const seenMonth = React.useRef(visibleMonth);
  // External value changes reveal the chosen day unless the host controls the month.
  React.useLayoutEffect(() => {
    if (seenValue.current !== valueDay) {
      seenValue.current = valueDay;
      if (value) {
        if (!sameDay(value, focused)) setFocused(startOfDay(value));
        if (controlledMonth === undefined && monthKey(value) !== visibleMonth) {
          setOwnMonth(startOfMonth(value));
        }
      }
    }
    if (seenMonth.current !== visibleMonth) {
      setDir(visibleMonth > seenMonth.current ? 'later' : 'earlier');
      seenMonth.current = visibleMonth;
    }
  });

  // Even when the host keeps a controlled month fixed, its grid retains one tab stop.
  const active = days.find((d) => sameDay(d, focused) && !out(d))
    ?? days.find((d) => sameDay(d, chosen) && !out(d))
    ?? days.find((d) => d.getMonth() === month.getMonth() && !out(d))
    ?? days.find((d) => !out(d));

  // Keyboard moves carry focus with them.
  React.useEffect(() => {
    if (!moved.current && !gridFocused.current) return;
    grid.current?.querySelector<HTMLButtonElement>('button[tabindex="0"]')?.focus();
    moved.current = false;
  }, [focused, visibleMonth]);

  const onKey = (e: React.KeyboardEvent) => {
    if (!active) return;
    const map: Record<string, () => Date> = {
      ArrowLeft: () => addDays(active, -1),
      ArrowRight: () => addDays(active, 1),
      ArrowUp: () => addDays(active, -7),
      ArrowDown: () => addDays(active, 7),
      PageUp: () => addMonths(active, e.shiftKey ? -12 : -1),
      PageDown: () => addMonths(active, e.shiftKey ? 12 : 1),
      Home: () => addDays(active, -((active.getDay() - first + 7) % 7)),
      End: () => addDays(active, 6 - ((active.getDay() - first + 7) % 7)),
    };
    if (map[e.key]) {
      e.preventDefault();
      go(map[e.key](), true);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      choose(active);
    }
  };

  const arrive = dir === 'later' ? 'calendar-arrive-later' : dir === 'earlier' ? 'calendar-arrive-earlier' : '';
  return (
    <div className={className ? `${ROOT} ${className}` : ROOT} aria-label={aria['aria-label']} role="group">
      <div className={HEAD}>
        <button type="button" className={STEP} aria-label="Previous month" onClick={() => stepMonth(-1)} disabled={min != null && month <= startOfMonth(min)}>
          <svg aria-hidden viewBox="0 0 10 10" className="size-calendar-step-glyph" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M6.25 2 3.25 5l3 3" /></svg>
        </button>
        <span id={titleId} aria-live="polite" className={dir === 'earlier' ? `${TITLE} swap-down` : TITLE}><SwapText value={title} /></span>
        <button type="button" className={STEP} aria-label="Next month" onClick={() => stepMonth(1)} disabled={max != null && month >= startOfMonth(max)}>
          <svg aria-hidden viewBox="0 0 10 10" className="size-calendar-step-glyph" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M3.75 2 6.75 5l-3 3" /></svg>
        </button>
      </div>
      <div className={GRID_WRAP}>
        <table ref={grid} key={monthKey(month)} role="grid" aria-labelledby={titleId} className={`${TABLE} ${arrive}`} onKeyDown={onKey}
          onFocusCapture={() => { gridFocused.current = true; }}
          onBlurCapture={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) gridFocused.current = false; }}
        >
          <thead>
            <tr>{weekdays.map((w, i) => <th key={i} scope="col" abbr={w.long} className={WEEKDAY}>{w.short}</th>)}</tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }, (_, r) => (
              <tr key={r}>
                {days.slice(r * 7, r * 7 + 7).map((d) => {
                  const selected = sameDay(d, chosen);
                  return (
                    <td key={d.getTime()} role="gridcell" aria-selected={selected} className={CELL}>
                      <button
                        type="button"
                        tabIndex={sameDay(d, active) ? 0 : -1}
                        className={DAY}
                        aria-label={full.format(d)}
                        aria-current={sameDay(d, today) ? 'date' : undefined}
                        data-today={sameDay(d, today) ? '' : undefined}
                        data-selected={selected ? '' : undefined}
                        data-outside={d.getMonth() !== month.getMonth() ? '' : undefined}
                        disabled={out(d)}
                        onClick={() => choose(d)}
                        onFocus={() => { if (!sameDay(d, focused)) setFocused(d); }}
                      >
                        {d.getDate()}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
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

