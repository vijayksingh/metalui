'use client';

import * as React from 'react';
import { NumberField as BaseNumberField } from '@base-ui/react/number-field';
import { Mark, useReadingLine, type MarkKind, type MarkMeaning } from '../mark/mark';
import { Tooltip, TooltipProvider } from '../tooltip/tooltip';
import { SwapText } from '../../motion/swap';
import { haptic } from '../../motion/haptic';
import { useReducedMotion } from '../../motion/reduced';
import { useIsoLayoutEffect } from '../../motion/layout-effect';
import './numeric-cue.css';

/** Canonical quantity and a presentation unit. Conversion preserves the canonical quantity. */
export interface NumericCueValue { value: number; unit: string }
export interface NumericCueUnit {
  id: string;
  label: string;
  /** Canonical quantity per displayed unit: minutes=1, hours=60. Host supplies all factors. */
  factor: number;
  step?: number;
  smallStep?: number;
  largeStep?: number;
  /** Display and lossless source are deliberately independent host contracts. */
  format: (displayed: number) => string;
  source: (displayed: number) => string;
}
export interface NumericCueProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'onChange' | 'defaultValue'> {
  value: NumericCueValue;
  units: readonly NumericCueUnit[];
  onValueChange: (value: NumericCueValue) => void;
  label: string;
  /** Include every possible raw/formatted face in every unit. Measured only at font/layout changes. */
  footprint: readonly string[];
  min: number;
  max: number;
  kind?: Extract<MarkKind, 'date' | 'duration' | 'amount' | 'measurement'>;
  meaning?: MarkMeaning;
  raw?: boolean;
  /** Resolved semantic words, shown by the existing Mark chip and included in the spoken value. */
  resolved?: string;
  /** Suppress visual help when a source/provenance host supplies it; keyboard instructions remain. */
  hint?: boolean;
  locale?: string;
  numberFormat?: Intl.NumberFormatOptions;
  /** Keep formatted words while focused; numeric keys/scrub remain operable, text insertion is blocked. */
  allowTyping?: boolean;
  inputAria?: Pick<React.AriaAttributes, 'aria-haspopup' | 'aria-expanded' | 'aria-controls' | 'aria-describedby'>;
  disabled?: boolean;
  readOnly?: boolean;
  name?: string;
  onBegin?: (() => void) | (() => boolean);
  onSourceChange?: ((words: string) => void) | ((words: string) => boolean);
  onCommit?: () => void;
  /** External controlled changes invalidate a gesture without restoring its obsolete value. */
  onCancel?: (reason: 'escape' | 'external' | 'pointer') => void;
}
interface Gesture { initial: NumericCueValue; source: string; expected: NumericCueValue; x: number; y: number; unitSteps: number; axis?: 'value' | 'unit'; cancelled?: boolean }
const same = (a: NumericCueValue, b: NumericCueValue) => a.unit === b.unit && a.value === b.value;

/** An inline, host-controlled numeric cue. Base UI owns the spinbutton, typing and vertical scrub. */
export const NumericCue = React.forwardRef<HTMLSpanElement, NumericCueProps>(function NumericCue({
  value, units, onValueChange, label, footprint, min, max, kind = 'measurement', meaning,
  raw = false, resolved, hint = true, locale, numberFormat, allowTyping = true, inputAria, disabled = false, readOnly = false, name,
  onBegin, onSourceChange, onCommit, onCancel, className, style, ...props
}, forwardedRef) {
  const root = React.useRef<HTMLSpanElement>(null);
  const input = React.useRef<HTMLInputElement>(null);
  const gesture = React.useRef<Gesture | null>(null);
  const current = React.useRef(value);
  const cancelledInput = React.useRef(false);
  const callbacks = React.useRef({ onValueChange, onBegin, onSourceChange, onCommit, onCancel });
  callbacks.current = { onValueChange, onBegin, onSourceChange, onCommit, onCancel };
  current.current = value;
  const [held, setHeld] = React.useState(false);
  const reading = useReadingLine();
  const footprintPlan = JSON.stringify(footprint);
  const [typing, setTyping] = React.useState(false);
  const [width, setWidth] = React.useState<number>();
  const reduced = useReducedMotion(root.current);
  const unit = units.find(u => u.id === value.unit) ?? units[0];
  if (!unit || units.some(u => !Number.isFinite(u.factor) || u.factor <= 0) || min > max || !footprint.length) {
    throw new Error('NumericCue requires valid positive unit factors, bounds and an explicit footprint.');
  }
  const begin = () => {
    if (disabled || readOnly) return false;
    if (gesture.current) return !gesture.current.cancelled;
    const selected = units.find(u => u.id === current.current.unit)!;
    if (callbacks.current.onBegin?.() === false) return false;
    gesture.current = { initial: { ...current.current }, source: selected.source(current.current.value / selected.factor), expected: { ...current.current }, x: 0, y: 0, unitSteps: 0 };
    return true;
  };
  const finish = () => {
    const active = gesture.current;
    gesture.current = null;
    setHeld(false);
    if (active && !active.cancelled) callbacks.current.onCommit?.();
  };
  const publish = (next: NumericCueValue, detent = false) => {
    if (disabled || readOnly || cancelledInput.current || gesture.current?.cancelled || !Number.isFinite(next.value)) return;
    const selected = units.find(u => u.id === next.unit);
    if (!selected) return;
    const bounded = { value: Math.max(min, Math.min(max, next.value)), unit: next.unit };
    if (same(bounded, gesture.current?.expected ?? current.current)) return;
    if (!begin()) return;
    if (gesture.current) gesture.current.expected = bounded;
    if (callbacks.current.onSourceChange?.(selected.source(bounded.value / selected.factor)) === false) { cancel('external'); return; }
    current.current = bounded;
    callbacks.current.onValueChange(bounded);
    if (detent) haptic('detent');
  };
  const cancel = (reason: 'escape' | 'external' | 'pointer') => {
    const active = gesture.current;
    if (!active || active.cancelled) return;
    active.cancelled = true;
    cancelledInput.current = true;
    if (reason !== 'external') {
      current.current = active.initial;
      callbacks.current.onValueChange(active.initial);
      callbacks.current.onSourceChange?.(active.source);
    }
    callbacks.current.onCancel?.(reason);
    setHeld(false);
    setTyping(false);
    gesture.current = null;
    input.current?.blur();
    try { document.exitPointerLock(); } catch { /* Pointer lock is optional. */ }
  };
  const convert = (direction: number) => {
    const active = gesture.current;
    if (disabled || readOnly || active?.cancelled) return;
    if (!begin()) return;
    const state = active?.expected ?? current.current;
    const index = units.findIndex(u => u.id === state.unit);
    const next = units[Math.max(0, Math.min(units.length - 1, index + direction))];
    if (next) publish({ value: state.value, unit: next.id }, true);
  };
  useIsoLayoutEffect(() => {
    const active = gesture.current;
    if (active && !same(value, active.expected)) cancel('external');
    if ((disabled || readOnly) && active) cancel('external');
  }, [value.value, value.unit, disabled, readOnly]);
  // One font measurement per footprint/font change. No layout reads during a gesture or drum frame.
  useIsoLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    let disposed = false;
    const measure = () => {
      if (disposed) return;
      const font = getComputedStyle(element);
      const canvas = document.createElement('canvas').getContext('2d');
      if (!canvas) return;
      canvas.font = `${font.fontStyle} ${font.fontWeight} ${font.fontSize} ${font.fontFamily}`;
      const spacing = parseFloat(font.letterSpacing) || 0;
      const glyphWidth = reading && meaning ? (parseFloat(font.getPropertyValue('--mu-r-button-compact-glyph')) || 0) + (parseFloat(font.getPropertyValue('--mu-space-4')) || 0) : 0;
      setWidth(Math.ceil(Math.max(...footprint.map(words => canvas.measureText(words).width + Math.max(0, words.length - 1) * spacing))) + glyphWidth);
    };
    measure();
    document.fonts.ready.then(measure);
    document.fonts.addEventListener('loadingdone', measure);
    return () => { disposed = true; document.fonts.removeEventListener('loadingdone', measure); };
  }, [footprintPlan, reading, meaning]);
  React.useEffect(() => {
    if (!held) return;
    const owner = root.current?.ownerDocument.defaultView ?? window;
    const threshold = parseFloat(getComputedStyle(root.current!).getPropertyValue('--mu-space-16')) || 16;
    const move = (event: PointerEvent) => {
      const active = gesture.current;
      if (!active || active.cancelled) return;
      active.x += event.movementX;
      active.y += event.movementY;
      if (!active.axis && Math.max(Math.abs(active.x), Math.abs(active.y)) >= 2) active.axis = Math.abs(active.x) > Math.abs(active.y) ? 'unit' : 'value';
      if (active.axis !== 'unit') return;
      const stops = Math.trunc(active.x / threshold);
      const direction = Math.sign(stops - active.unitSteps);
      while (active.unitSteps !== stops) {
        active.unitSteps += direction;
        convert(direction);
      }
    };
    const up = () => finish();
    const abort = () => cancel('pointer');
    owner.addEventListener('pointermove', move, true);
    owner.addEventListener('pointerup', up, true);
    owner.addEventListener('pointercancel', abort, true);
    return () => { owner.removeEventListener('pointermove', move, true); owner.removeEventListener('pointerup', up, true); owner.removeEventListener('pointercancel', abort, true); };
  }, [held, units, min, max, disabled, readOnly]);
  const words = unit.source(value.value / unit.factor);
  const formatted = unit.format(value.value / unit.factor);
  const help = `${label} · Drag vertically to change; horizontally to convert. ↑/↓ step; Shift large, Alt small. Alt+←/→ converts. Escape cancels.`;
  return <BaseNumberField.Root render={<span />} ref={node => { root.current = node; if (typeof forwardedRef === 'function') forwardedRef(node); else if (forwardedRef) forwardedRef.current = node; }}
    value={value.value / unit.factor} min={min / unit.factor} max={max / unit.factor} step={unit.step ?? 1} smallStep={unit.smallStep ?? .1} largeStep={unit.largeStep ?? 10}
    disabled={disabled} readOnly={readOnly} name={name} locale={locale} format={numberFormat}
    className={`mu-numeric-cue numeric-cue relative inline-block has-[input:focus-visible]:focus-ring align-baseline${className ? ` ${className}` : ''}`}
    style={{ ...style, width: reading && !held && !typing ? undefined : width }} data-held={held || undefined} data-typing={typing || undefined} data-reduced={reduced || undefined} data-unit={unit.id}
    onValueChange={(amount, details) => {
      if (amount === null || (!allowTyping && details.reason !== 'keyboard' && details.reason !== 'scrub')) return;
      if (details.reason === 'scrub') {
        const event = details.event as PointerEvent;
        const active = gesture.current;
        if (active && !active.axis && (event.movementX || event.movementY)) active.axis = Math.abs(event.movementX) > Math.abs(event.movementY) ? 'unit' : 'value';
        if (!active || active.axis === 'unit') return;
      }
      publish({ value: amount * unit.factor, unit: unit.id }, details.reason === 'scrub' || details.reason === 'keyboard');
    }} onValueCommitted={() => { if (!held) finish(); }} {...props}>
    <TooltipProvider><Tooltip label={help} disabled={disabled || !!resolved || !hint} wrap><BaseNumberField.ScrubArea direction="vertical"
      className="mu-numeric-cue-face block cursor-ns-resize"
      onPointerDownCapture={() => {
        if (disabled || readOnly) return;
        cancelledInput.current = false;
        // Finish the previous field's blur transaction before capturing this source range.
        input.current?.focus({ preventScroll: true });
        setTyping(false);
        if (begin()) setHeld(true);
      }}
      onDoubleClick={() => { if (allowTyping && !readOnly && !disabled) { setTyping(true); input.current?.focus(); } }}>
      <Mark kind={kind} meaning={meaning} meaningLabel={`${label}, ${formatted}`} raw={raw || disabled || readOnly} resolved={hint ? resolved : undefined} data-reveal={hint && held && resolved ? true : undefined} className="block">
        <SwapText value={raw ? words : formatted} />
      </Mark>
    </BaseNumberField.ScrubArea></Tooltip></TooltipProvider>
    <BaseNumberField.Input {...inputAria} ref={input} role="spinbutton" aria-label={label} aria-valuemin={min / unit.factor} aria-valuemax={max / unit.factor} aria-valuenow={value.value / unit.factor} aria-valuetext={resolved ? `${formatted}, ${resolved}` : `${formatted}, ${unit.label}`} title={hint ? help : undefined}
      className="mu-numeric-cue-input absolute inset-0 w-full bg-transparent p-0 border-0 rounded-none text-inherit font-inherit focus-visible:focus-ring"
      onFocus={() => { if (!held) { cancelledInput.current = false; if (begin()) setTyping(allowTyping); } }} onBlur={() => { setTyping(false); finish(); }}

      onBeforeInput={event => { if (!allowTyping) event.preventDefault(); }} onPaste={event => { if (!allowTyping) event.preventDefault(); }}
      onKeyDown={event => {
        if (disabled || readOnly) return;
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); cancel('escape'); input.current?.blur(); }
        else if (event.altKey && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) { event.preventDefault(); cancelledInput.current = false; convert(event.key === 'ArrowLeft' ? -1 : 1); finish(); }
        else if (event.key === 'Enter') { event.preventDefault(); setTyping(false); finish(); input.current?.blur(); }
        else if (!allowTyping && event.key.length === 1 && !event.ctrlKey && !event.metaKey) event.preventDefault();
        else { cancelledInput.current = false; begin(); }
      }} />
    {held && <span aria-hidden className="mu-numeric-cue-scale absolute left-0 bottom-full mb-mu-space-2 rounded-tooltip-radius px-tooltip-pad-x py-tooltip-pad-y recipe-tooltip text-tooltip-ink type-tooltip whitespace-nowrap">
      <span className="inline-flex gap-mu-related"><span>−</span><span>│</span><span>{formatted}</span><span>│</span><span>+</span></span>
    </span>}
  </BaseNumberField.Root>;
});
