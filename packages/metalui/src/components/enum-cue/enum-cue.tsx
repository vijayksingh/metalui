'use client';
import * as React from 'react';
import { mergeProps } from '@base-ui/react/merge-props';
import { Button as BaseButton } from '@base-ui/react/button';
import { Icon } from '../../icons/Icon';
import type { IconName } from '../../icons/catalog.generated';
import { haptic } from '../../motion/haptic';
import { SPRINGS } from '../../motion/springs.generated';
import { SwapText } from '../../motion/swap';
import { Tooltip } from '../tooltip/tooltip';
import { Mark, useReadingLine } from '../mark/mark';
import { MARK_GLYPH_SIZE } from '../mark/identity.generated';
import { ENUM_CUE_STOP } from './gesture.generated';

export interface EnumCueChoice {
  /** Complete words written into the host source, such as #todo. */
  value: string;
  label?: string;
  glyph?: IconName;
  /** Explicit state tint; defaults to neutral ink. Identity hashing never chooses enum state colour. */
  tint?: string;
}
export interface EnumCueProps extends Omit<React.ComponentPropsWithoutRef<typeof BaseButton>, 'children' | 'value' | 'onChange' | 'render' | 'nativeButton'> {
  value: string;
  choices: readonly EnumCueChoice[];
  label: string;
  disabled?: boolean;
  readOnly?: boolean;
  raw?: boolean;
  /** Optional host transaction flag; closing it invalidates a gesture after unrelated source typing. */
  editing?: boolean;
  className?: string;
  /** Keep the gesture hint off when an enclosing provenance tooltip owns help. */
  hint?: boolean;
  onBegin?: () => boolean | void;
  onChange: (words: string) => boolean | void;
  onCommit?: () => void;
  /** Restores the host's captured source/selection. Without this, cancellation emits the original words. */
  onCancel?: () => void;
}
type Gesture = { kind: 'pointer' | 'keyboard' | 'wheel'; original: string; current: string; index: number; y: number; moved: boolean; pointer?: number; wheel: number; vocabulary: string };

/* ENUM CUE STORYBOARD
 * rest    complete source words in the Mark tab; every permitted word reserves the same footprint
 * hold    adjacent host choices appear above/below, outside the source line; no continuous work
 * detent  a 24-space stop changes words once and requests one shared haptic; the drum turns
 * release one host history transaction ends; the instrument disappears
 * cancel  Escape, lost capture or unmount restores the host snapshot
 * Reduced motion uses the drum's existing crossfade; no travelling instrument or spin.
 */
export const EnumCue = React.forwardRef<HTMLElement, EnumCueProps>(function EnumCue(props, forwardedRef) {
  const reading = useReadingLine();
  const { value, choices, label, disabled = false, readOnly = false, raw = false, hint = true, className, editing: _editing, onBegin: _begin, onChange: _change, onCommit: _commit, onCancel: _cancel, ...triggerProps } = props;
  const root = React.useRef<HTMLElement>(null);
  React.useImperativeHandle(forwardedRef, () => root.current!, []);
  const callbacks = React.useRef(props); callbacks.current = props;
  const gesture = React.useRef<Gesture | null>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const ignoreClick = React.useRef(false);
  const [held, setHeld] = React.useState(false);
  const index = choices.findIndex(choice => choice.value === value);
  const choice = choices[index];
  const vocabulary = JSON.stringify(choices.map(item => item.value));
  const validChoices = choices.every(item => !!item.value) && new Set(choices.map(item => item.value)).size === choices.length;
  const mutable = validChoices && !disabled && !readOnly && index >= 0 && choices.length > 1;
  function clearTimer() { if (timer.current) clearTimeout(timer.current); timer.current = null; }
  function begin(kind: Gesture['kind'], y = 0, pointer?: number) {
    if (gesture.current) return gesture.current.kind === kind;
    const p = callbacks.current, currentIndex = p.choices.findIndex(item => item.value === p.value);
    if (p.disabled || p.readOnly || currentIndex < 0 || p.choices.length < 2 || new Set(p.choices.map(item => item.value)).size !== p.choices.length || p.onBegin?.() === false) return false;
    gesture.current = { kind, original: p.value, current: p.value, index: currentIndex, y, pointer, moved: false, wheel: 0, vocabulary: JSON.stringify(p.choices.map(item => item.value)) };
    setHeld(true); return true;
  }
  function land(at: number) {
    const g = gesture.current, p = callbacks.current;
    if (!g) return;
    const next = p.choices[((at % p.choices.length) + p.choices.length) % p.choices.length]?.value;
    if (!next || next === g.current) return;
    g.current = next; if (p.onChange(next) === false) { cancel(false); return; } haptic('detent');
  }
  function step(amount: number) { const g = gesture.current; if (g) land(callbacks.current.choices.findIndex(item => item.value === g.current) + amount); }
  function commit() { if (!gesture.current) return; clearTimer(); gesture.current = null; setHeld(false); callbacks.current.onCommit?.(); }
  function cancel(restore = true, render = true) {
    const g = gesture.current; if (!g) return;
    clearTimer(); gesture.current = null; if (render) setHeld(false);
    if (callbacks.current.onCancel) callbacks.current.onCancel(); else if (restore) callbacks.current.onChange(g.original);
  }
  const runtime = React.useRef({ begin, step, commit, cancel }); runtime.current = { begin, step, commit, cancel };
  React.useEffect(() => {
    const g = gesture.current;
    if (g && (value !== g.current || !mutable || vocabulary !== g.vocabulary || props.editing === false)) runtime.current.cancel(false);
  }, [value, mutable, vocabulary, props.editing]);
  React.useEffect(() => {
    const element = root.current;
    if (!element) return;
    const wheel = (event: WheelEvent) => {
      // A normal scroll over text stays a page scroll. Focus explicitly gives this control the wheel.
      if (document.activeElement !== element || !event.deltaY || !runtime.current.begin('wheel')) return;
      event.preventDefault();
      const g = gesture.current!;
      g.wheel += event.deltaY * (event.deltaMode === WheelEvent.DOM_DELTA_PIXEL ? 1 : ENUM_CUE_STOP);
      const stops = Math.trunc(g.wheel / ENUM_CUE_STOP);
      if (stops) { g.wheel -= stops * ENUM_CUE_STOP; runtime.current.step(stops); }
      clearTimer(); timer.current = setTimeout(runtime.current.commit, SPRINGS.release.duration * 1000);
    };
    element.addEventListener('wheel', wheel, { passive: false });
    return () => { element.removeEventListener('wheel', wheel); runtime.current.cancel(true, false); clearTimer(); };
  }, []);
  const current = choice ?? { value };
  const own = 'mu-enum-cue relative inline-grid align-baseline border-0 bg-transparent p-0 type-content text-ink select-none touch-none cursor-ns-resize focus-visible:focus-ring data-disabled:opacity-field-state-disabled data-disabled:cursor-default';
  const name = current.label && current.label !== current.value ? `${current.label} (${current.value})` : current.value;
  const controlProps: React.ComponentPropsWithoutRef<typeof BaseButton> & Record<`data-${string}`, unknown> = {
    disabled: disabled || readOnly || !choice || !validChoices, focusableWhenDisabled: readOnly,
    'data-readonly': readOnly || undefined, 'data-held': held || undefined, 'data-value': value,
    'aria-label': `${label}: ${name}`,
    'aria-description': ['Click or Space cycles. Up and Down step. Focus to scroll, or hold and drag vertically. Escape cancels a held edit.', triggerProps['aria-description']].filter(Boolean).join(' '),
    className: className ? `${own} ${className}` : own,
    onClick: event => { if (ignoreClick.current && event.detail > 0) { ignoreClick.current = false; return; } ignoreClick.current = false; if (begin('keyboard')) { step(1); commit(); } },
    onPointerDown: event => {
      if (event.button !== 0 || !mutable) return;
      event.currentTarget.focus({ preventScroll: true });
      if (!begin('pointer', event.clientY, event.pointerId)) return;
      ignoreClick.current = false; event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId);
    },
    onPointerMove: event => {
      const g = gesture.current; if (!g || g.kind !== 'pointer' || g.pointer !== event.pointerId) return;
      const stops = Math.round((g.y - event.clientY) / ENUM_CUE_STOP);
      if (stops) g.moved = true;
      land(g.index + stops);
    },
    onPointerUp: event => {
      const g = gesture.current; if (!g || g.kind !== 'pointer' || g.pointer !== event.pointerId) return;
      if (!g.moved) step(1);
      ignoreClick.current = true; commit(); event.currentTarget.releasePointerCapture(event.pointerId);
    },
    onPointerCancel: () => { ignoreClick.current = true; cancel(); },
    onLostPointerCapture: () => { if (gesture.current?.kind === 'pointer') ignoreClick.current = true; cancel(); },
    onBlur: () => { if (gesture.current?.kind === 'pointer') ignoreClick.current = true; cancel(); },
    onKeyDown: event => {
      if (event.key === 'Escape' && gesture.current) { event.preventDefault(); ignoreClick.current = gesture.current.kind === 'pointer'; cancel(); return; }
      if (!mutable || ![' ', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
      event.preventDefault(); if (begin('keyboard')) step(event.key === 'ArrowUp' ? -1 : 1);
    },
    onKeyUp: event => { if ([' ', 'ArrowUp', 'ArrowDown'].includes(event.key) && gesture.current?.kind === 'keyboard') { event.preventDefault(); commit(); } },
  };
  const control = <BaseButton {...mergeProps(triggerProps, controlProps)} ref={root}>
    {(!reading || held) && choices.map(item => <span key={item.value} aria-hidden className={`invisible col-start-1 row-start-1 whitespace-nowrap${reading ? ' inline-flex items-baseline gap-mu-space-4 px-cue-tag-pad-x' : ''}`}>{reading && choices.some(choice => choice.glyph) && <span className="w-button-compact-glyph flex-none" />}{item.value}</span>)}
    <span className="col-start-1 row-start-1 justify-self-start"><Mark kind="tag" raw={raw} meaningGlyph={reading && current.glyph ? <Icon name={current.glyph} size={MARK_GLYPH_SIZE} /> : undefined} style={{ '--mu-cue-identity': current.tint ?? 'var(--mu-ink3)' } as React.CSSProperties}>{value.startsWith('#') ? <><span className="mu-mark-hash">#</span><SwapText value={value.slice(1)} /></> : <SwapText value={value} />}</Mark></span>
    {!reading && !raw && !held && current.glyph && <span aria-hidden className="mark-semantic-glyph"><Icon name={current.glyph} size={MARK_GLYPH_SIZE} /></span>}
    {held && choices.length > 1 && <span data-enum-instrument aria-hidden className="pointer-events-none absolute inset-0 type-meta text-ink2 whitespace-nowrap">
      <span className="absolute left-0 bottom-full mb-mu-space-8">{choices[(index - 1 + choices.length) % choices.length]?.label ?? choices[(index - 1 + choices.length) % choices.length]?.value}</span>
      <span className="absolute left-0 top-full mt-mu-space-8">{choices[(index + 1) % choices.length]?.label ?? choices[(index + 1) % choices.length]?.value}</span>
    </span>}
  </BaseButton>;
  return <Tooltip label="Space cycles · Up/Down steps · Focus to scroll · Hold and drag" disabled={!hint || held || !mutable} wrap>{control}</Tooltip>;
});
