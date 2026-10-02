'use client';
import * as React from 'react';
import { NumericCue, type NumericCueProps, type NumericCueUnit } from '../numeric-cue/numeric-cue';
import { Calendar } from '../calendar/calendar';
import { Popover } from '../popover/popover';
import { haptic } from '../../motion/haptic';
import './date-cue.css';

const DAY = 24 * 60 * 60 * 1000;
function utcDay(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new Error('DateCue requires civil dates in YYYY-MM-DD form.');
  const date = new Date(0); date.setUTCFullYear(Number(match[1]), Number(match[2]) - 1, Number(match[3])); date.setUTCHours(0, 0, 0, 0);
  if (date.getUTCFullYear() < 1 || date.toISOString().slice(0, 10) !== value) throw new Error('DateCue requires valid civil dates.');
  return date;
}
const ordinal = (value: string) => utcDay(value).getTime() / DAY;
const civil = (number: number) => new Date(Math.round(number) * DAY).toISOString().slice(0, 10);
const localDay = (value: string) => { const date = utcDay(value); const local = new Date(0); local.setFullYear(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()); local.setHours(0, 0, 0, 0); return local; };
const fromLocal = (date: Date) => `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/** Default English source grammar; the explicit today snapshot makes nearby words unambiguous. */
export function relativeDateWords(value: string, today: string): string {
  const delta = ordinal(value) - ordinal(today);
  if (delta === -1) return 'yesterday';
  if (delta === 0) return 'today';
  if (delta === 1) return 'tomorrow';
  if (Math.abs(delta) <= 7) {
    const weekday = new Intl.DateTimeFormat('en', { weekday: 'long', timeZone: 'UTC' }).format(utcDay(value));
    return `${delta < 0 ? 'last' : 'next'} ${weekday}`;
  }
  return value;
}
export interface DateCueProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'onChange'> {
  value: string;
  today: string;
  min: string;
  max: string;
  footprint: readonly string[];
  label: string;
  onValueChange: (day: string) => void;
  format?: (day: string) => string;
  source?: (day: string) => string;
  locale?: string;
  raw?: boolean;
  hint?: boolean;
  inputAria?: NumericCueProps['inputAria'];
  disabled?: boolean;
  readOnly?: boolean;
  onBegin?: () => void;
  onSourceChange?: (words: string) => void;
  onCommit?: () => void;
  onCancel?: NumericCueProps['onCancel'];
}

/** An operable civil day. Day arithmetic crosses DST without adding an instant's 24 hours. */
export const DateCue = React.forwardRef<HTMLSpanElement, DateCueProps>(function DateCue({ value, today, min, max, footprint, label, onValueChange,
  format, source, locale = 'en-GB', raw, hint = true, inputAria, disabled = false, readOnly = false, onBegin, onSourceChange, onCommit, onCancel, className, ...props }, forwardedRef) {
  const root = React.useRef<HTMLSpanElement>(null);
  const changed = React.useRef(false);
  const capturedWords = React.useRef<string | undefined>(undefined);
  const pending = React.useRef<(() => void) | null>(null);
  const [open, setOpen] = React.useState(false);
  const popupId = React.useId();
  const hintId = React.useId();
  const sourceWords = React.useCallback((day: string) => source?.(day) ?? relativeDateWords(day, today), [source, today]);
  const resolved = React.useCallback((day: string) => new Intl.DateTimeFormat(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(utcDay(day)), [locale]);
  const display = React.useCallback((day: string) => {
    if (format) return format(day);
    if (Math.abs(ordinal(day) - ordinal(today)) <= 7) return sourceWords(day);
    return new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short', year: day.slice(0, 4) !== today.slice(0, 4) ? 'numeric' : undefined, timeZone: 'UTC' }).format(utcDay(day));
  }, [format, today, sourceWords, locale]);
  const units = React.useMemo<readonly NumericCueUnit[]>(() => [{ id: 'day', label: 'calendar day', factor: 1, step: 1, smallStep: 1, largeStep: 7,
    format: amount => display(civil(amount)), source: amount => sourceWords(civil(amount)) }], [display, sourceWords]);
  const stopHold = React.useCallback(() => { pending.current?.(); pending.current = null; }, []);
  React.useEffect(() => stopHold, [stopHold]);
  React.useEffect(() => { if (disabled || readOnly) { stopHold(); setOpen(false); } }, [disabled, readOnly, stopHold]);
  const input = React.useCallback(() => root.current?.querySelector<HTMLInputElement>('input[type="text"]') ?? null, []);
  const openCalendar = () => {
    if (disabled || readOnly) return;
    stopHold();
    try { document.exitPointerLock(); } catch { /* A normal touch press does not use pointer lock. */ }
    setOpen(true);
  };
  const hold = (event: React.PointerEvent<HTMLSpanElement>) => {
    props.onPointerDownCapture?.(event);
    if (event.defaultPrevented || disabled || readOnly || event.button !== 0) return;
    stopHold();
    const owner = root.current?.ownerDocument.defaultView ?? window;
    const css = getComputedStyle(root.current!);
    const delay = parseFloat(css.getPropertyValue('--mu-r-button-hold-duration'));
    const tolerance = parseFloat(css.getPropertyValue('--mu-space-2'));
    if (!Number.isFinite(delay) || delay <= 0) return;
    let distance = 0;
    const cancel = () => stopHold();
    const move = (movement: PointerEvent) => { distance += Math.abs(movement.movementX) + Math.abs(movement.movementY); if (distance >= tolerance) stopHold(); };
    const timer = owner.setTimeout(openCalendar, delay);
    owner.addEventListener('pointermove', move, true); owner.addEventListener('pointerup', cancel, true); owner.addEventListener('pointercancel', cancel, true);
    pending.current = () => { owner.clearTimeout(timer); owner.removeEventListener('pointermove', move, true); owner.removeEventListener('pointerup', cancel, true); owner.removeEventListener('pointercancel', cancel, true); };
  };
  const begin = () => { changed.current = false; capturedWords.current = sourceWords(value); };
  const write = (words: string) => { if (!changed.current && words === capturedWords.current) return; if (!changed.current) { changed.current = true; onBegin?.(); } onSourceChange?.(words); };
  const commit = () => { if (changed.current) onCommit?.(); changed.current = false; };
  return <Popover open={open} onOpenChange={(next, details) => {
    if (!next && details.reason === 'outside-press' && details.event.target instanceof Node && root.current?.contains(details.event.target)) { details.cancel(); return; }
    setOpen(next);
  }}>
    <NumericCue {...props} ref={element => { root.current = element; if (typeof forwardedRef === 'function') forwardedRef(element); else if (forwardedRef) forwardedRef.current = element; }}
      value={{ value: ordinal(value), unit: 'day' }} units={units} min={ordinal(min)} max={ordinal(max)} footprint={footprint} label={label}
      allowTyping={false} hint={hint} resolved={resolved(value)} kind="date" meaning="time" locale={locale} raw={raw} disabled={disabled} readOnly={readOnly}
      inputAria={{ ...inputAria, 'aria-haspopup': 'dialog', 'aria-expanded': open, 'aria-controls': open ? popupId : undefined, 'aria-describedby': [hintId, inputAria?.['aria-describedby']].filter(Boolean).join(' ') }}
      className={`mu-date-cue date-cue${className ? ` ${className}` : ''}`} onValueChange={next => { const day = civil(next.value); if (day !== value) onValueChange(day); }}
      onBegin={begin} onSourceChange={write} onCommit={commit} onCancel={reason => { if (changed.current) onCancel?.(reason); changed.current = false; }}
      onPointerDownCapture={hold} onKeyDownCapture={event => {
        props.onKeyDownCapture?.(event);
        if (event.defaultPrevented || disabled || readOnly) return;
        if (event.altKey && event.key === 'ArrowDown' || event.key === ' ' || event.key === 'Enter') { event.preventDefault(); event.stopPropagation(); openCalendar(); }
      }} title={hint ? `${resolved(value)} · Hold or Alt+Down for Calendar` : undefined} />
    <span id={hintId} className="sr-only">{resolved(value)}. Drag or arrow keys change days; Shift changes weeks. Hold, Alt+Down, Enter or Space opens Calendar.</span>
    <Popover.Content id={popupId} anchor={input} finalFocus={input} initialFocus={() => root.current?.ownerDocument.querySelector<HTMLButtonElement>(`#${CSS.escape(popupId)} button[data-selected]`) ?? false} align="start">
      <Popover.Title>{label}</Popover.Title>
      <Popover.Description>{resolved(value)}</Popover.Description>
      <Calendar aria-label={`${label} calendar`} value={localDay(value)} min={localDay(min)} max={localDay(max)} locale={locale}
        onValueChange={date => { if (!date || disabled || readOnly) return; const next = fromLocal(date); if (next !== value) { onBegin?.(); onValueChange(next); onSourceChange?.(sourceWords(next)); onCommit?.(); haptic('detent'); } setOpen(false); }} />
    </Popover.Content>
  </Popover>;
});
