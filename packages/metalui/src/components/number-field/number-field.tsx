'use client';

import * as React from 'react';
import { Icon } from '../../icons/Icon';
import { NumberField as BaseNumberField } from '@base-ui/react/number-field';
import { buttonClasses } from '../button/button';
import { SwapText } from '../../motion/swap';
import { refuse } from '../../motion/refuse';
import { useIsoLayoutEffect } from '../../motion/layout-effect';

/* ─────────────────────────────────────────────────────────
 * NUMBER FIELD, a number you step, scrub or type, on Base UI NumberField
 *
 *   step      − and + are compact keycaps at the ends of a pill well; each press sinks the cap
 *             (the button press) and turns the value one drum step on the settle spring:
 *             + rolls up (the new number comes from below), − rolls down; holding repeats
 *   arrows    ↑ ↓ step the same way; Shift steps by 10
 *   scrub     drag the label sideways: each change turns the drum the way it went
 *   limit     at min or max that keycap disables; an arrow past it shakes only the digits
 *             on the refusal spring (a nest aside)
 *   type      plain text while typing (no drum); it commits and formats on blur
 *   invalid   the foundation's invalid ring on the group; aria-invalid on the input
 * Reduce Motion: the drum crossfades and nothing shakes.
 * The drum always holds the input's text; while it turns, the input's own text is hidden and the
 * drum shows over it.
 * Slots: NumberField.Root, NumberField.Label, NumberField.Group, NumberField.Decrement,
 * NumberField.Input, NumberField.Increment.
 * ───────────────────────────────────────────────────────── */

const ROOT = 'mu-number-field inline-grid gap-number-field-gap';
const LABEL = 'mu-number-field-label type-ui text-ink cursor-ew-resize select-none w-max';
const GROUP = 'mu-number-field-group group/nf inline-flex items-center h-number-field-height w-number-field-width p-number-field-pad box-border rounded-pill recipe-well-field focus-within:focus-ring-flush data-disabled:opacity-number-field-disabled relative data-invalid:invalid-ring';
const KEY = `${buttonClasses('standard', 'compact')} mu-number-field-key flex-none size-number-field-key-size px-0! justify-center type-ui group-data-disabled/nf:opacity-100!`;
const WINDOW = 'mu-number-field-window relative grid flex-1 min-w-0 h-full place-items-center overflow-clip';
const INPUT = 'mu-number-field-input text-entry col-start-1 row-start-1 w-full min-w-0 h-full p-0 border-0 outline-none bg-transparent text-center type-lead tabular-nums text-ink caret-field-field-caret data-[turning]:text-transparent';
const DRUM = 'mu-number-field-drum col-start-1 row-start-1 pointer-events-none type-lead tabular-nums text-ink';

const STEPPED = new Set(['increment-press', 'decrement-press', 'keyboard', 'wheel', 'scrub']);

export interface NumberFieldProps extends Omit<BaseNumberField.Root.Props, 'className' | 'children'> {
  /** The label above; drag it sideways to scrub. */
  label?: React.ReactNode;
  /** Accessible names for the keycaps. */
  decrementLabel?: string;
  incrementLabel?: string;
  /** The value will not be accepted: the foundation's invalid ring, and aria-invalid on the input. */
  invalid?: boolean;
  className?: string;
}

/** A number you step, scrub or type. */
function Root({ label, decrementLabel = 'Decrease', incrementLabel = 'Increase', invalid, className, onValueChange, value, defaultValue, min, max, ...props }: NumberFieldProps) {
  const input = React.useRef<HTMLInputElement>(null);
  const drum = React.useRef<HTMLSpanElement>(null);
  const [current, setCurrent] = React.useState<number | null>(value ?? defaultValue ?? null);
  const [face, setFace] = React.useState('');
  const [turn, setTurn] = React.useState<{ n: number; dir: 'up' | 'down' } | null>(null);
  const shown = value !== undefined ? value : current;
  const labelId = React.useId();

  // The drum shows exactly what the input shows (its formatted text), read after each render.
  useIsoLayoutEffect(() => { if (input.current) setFace(input.current.value); }, [shown]);

  // The input's own text comes back once the drum has settled.
  React.useEffect(() => {
    if (!turn) return;
    const ms = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--mu-spring-settle-d')) * 1000 || 440;
    const t = window.setTimeout(() => setTurn(null), ms);
    return () => clearTimeout(t);
  }, [turn]);

  return (
    <BaseNumberField.Root
      className={className ? `${ROOT} ${className}` : ROOT}
      value={value}
      defaultValue={defaultValue}
      min={min}
      max={max}
      onValueChange={(next, details) => {
        const prev = shown;
        if (value === undefined) setCurrent(next);
        if (STEPPED.has(details.reason) && prev != null && next != null && next !== prev) {
          setTurn((t) => ({ n: (t?.n ?? 0) + 1, dir: next > prev ? 'up' : 'down' }));
        }
        onValueChange?.(next, details);
      }}
      {...props}
    >
      {label != null && (
        <BaseNumberField.ScrubArea className="w-max">
          <span id={labelId} className={LABEL}>{label}</span>
        </BaseNumberField.ScrubArea>
      )}
      <BaseNumberField.Group className={GROUP} data-invalid={invalid ? '' : undefined}>
        <BaseNumberField.Decrement className={KEY} aria-label={decrementLabel}><Icon name="minus" size={16} className="size-number-field-key-glyph!" /></BaseNumberField.Decrement>
        <span className={turn?.dir === 'down' ? `${WINDOW} swap-down` : WINDOW} ref={drum}>
          <BaseNumberField.Input
            ref={input}
            className={INPUT}
            data-turning={turn ? '' : undefined}
            aria-labelledby={label != null ? labelId : undefined}
            aria-invalid={invalid || undefined}
            onKeyDown={(e) => {
              const up = e.key === 'ArrowUp', down = e.key === 'ArrowDown';
              if ((up && max != null && shown != null && shown >= max) || (down && min != null && shown != null && shown <= min)) refuse(drum.current);
            }}
          />
          <span aria-hidden className={turn ? DRUM : `${DRUM} invisible`}><SwapText value={face} /></span>
        </span>
        <BaseNumberField.Increment className={KEY} aria-label={incrementLabel}><Icon name="plus" size={16} className="size-number-field-key-glyph!" /></BaseNumberField.Increment>
      </BaseNumberField.Group>
    </BaseNumberField.Root>
  );
}

// Base UI hands its parts over as a namespace (`export * as NumberField`), so a bundler cannot tell a property read on
// it from a getter with effects; read them inside a call it is told is pure, and an app without NumberField ships none of it.
export const NumberField = Object.assign(Root, /* @__PURE__ */ (() => ({
  Label: BaseNumberField.ScrubArea,
  Group: BaseNumberField.Group,
  Decrement: BaseNumberField.Decrement,
  Input: BaseNumberField.Input,
  Increment: BaseNumberField.Increment,
  Root,
}))());
