'use client';

import * as React from 'react';
import { Select as BaseSelect } from '@base-ui/react/select';
import { menuParts, ListGlide } from '../menu/menu';

/* ─────────────────────────────────────────────────────────
 * SELECT on Base UI Select: one value from a list of named options
 *
 * Use it for a value picked from a list: an icon, a folder colour, where to move a block, a
 * preset. Two to four short options that fit side by side are a Switcher; a long list you
 * search is a combobox; an action is a Menu.
 *
 *   trigger   a raised cap like a button (it is clicked, not typed into): the value, and an
 *             up-down chevron (it opens over itself, like a Mac pop-up button)
 *   rest      the cap; the placeholder in ink3 when nothing is chosen
 *   hover     the cap lightens a little; the chevron darkens
 *   open      the cap stays pressed in; the chevron is ink
 *   focus     the focus ring (keyboard only)
 *   disabled  40 %, no pointer
 *   invalid   a thin red ring inside the cap (a required value is missing)
 *   list      the menu's frosted plate. With room, it opens with the chosen row over the
 *             trigger; without, below it. It grows from the trigger on the surface spring
 *             (scale .97 → 1, opacity), and fades out fast on close
 *   rows      the menu's rows under one highlight that glides row to row on the settle spring;
 *             pointer and keys move it; ↑ ↓, Home, End,
 *             type-ahead; ↩ or a click chooses and closes; ⎋ closes without choosing
 *   chosen    the green LED the system uses for latched, in a slot before the label
 * Two sizes: regular 32 (forms, settings rows), compact 28 (dense strips, toolbars).
 * Reduce Motion: the list fades only.
 * ───────────────────────────────────────────────────────── */

export interface SelectOption<V extends string = string> {
  value: V;
  label: string;
  /** A leading glyph or swatch, shown in the row and in the trigger. */
  lead?: React.ReactNode;
  disabled?: boolean;
}

export interface SelectGroup<V extends string = string> {
  /** An engraved heading over the group. */
  label: string;
  options: SelectOption<V>[];
}

export interface SelectProps<V extends string = string> {
  /** The options, flat or in labelled groups. */
  options: SelectOption<V>[] | SelectGroup<V>[];
  value?: V | null;
  defaultValue?: V;
  onValueChange?: (value: V) => void;
  /** Shown in ink3 while nothing is chosen. */
  placeholder?: string;
  size?: 'regular' | 'compact';
  disabled?: boolean;
  /** A required value is missing. */
  invalid?: boolean;
  /** Its accessible name, when no visible label names it. */
  'aria-label'?: string;
  /** For a form. */
  name?: string;
  className?: string;
}

const PRESS = 'not-data-disabled:active:translate-y-button-travel not-data-disabled:active:duration-button-press not-data-disabled:active:ease-linear';
const TRIGGER = {
  regular: `mu-select-trigger select-trigger select-regular recipe-button transition-button ${PRESS} not-data-disabled:active:recipe-button-pressed data-popup-open:recipe-button-pressed`,
  compact: `mu-select-trigger select-trigger select-compact recipe-button-compact transition-button-compact ${PRESS} not-data-disabled:active:recipe-button-compact-pressed data-popup-open:recipe-button-compact-pressed`,
};
const VALUE = 'mu-select-value select-value';
const CHEVRON = 'mu-select-chevron select-chevron';
const POSITIONER = 'mu-menu-positioner z-menu-z';
const POP = `${menuParts.PLATE} relative mu-select-pop select-pop`;
// The menu's live rows under its one gliding highlight.
const ROW = menuParts.LIVE_ROW;
const HEADING = menuParts.HEADING;
const SEP = menuParts.SEP;
const SLOT = 'select-led-slot';
const LED = 'mu-select-led select-led';

const isGroups = <V extends string>(o: SelectOption<V>[] | SelectGroup<V>[]): o is SelectGroup<V>[] => o.length > 0 && 'options' in o[0];

function offset() {
  if (typeof window === 'undefined') return 6;
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--mu-r-select-pop-offset')) || 6;
}

/** The up-down chevron: this list opens over its trigger. */
function Chevron() {
  return (
    <svg aria-hidden viewBox="0 0 12 12" className={CHEVRON} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 4.75 6 2.5l2.5 2.25M3.5 7.25 6 9.5l2.5-2.25" />
    </svg>
  );
}

function Row<V extends string>({ option }: { option: SelectOption<V> }) {
  return (
    <BaseSelect.Item value={option.value} disabled={option.disabled} className={ROW}>
      <span className={SLOT}><BaseSelect.ItemIndicator className={LED}>{null}</BaseSelect.ItemIndicator></span>
      {option.lead && <span aria-hidden className={menuParts.GLYPH}>{option.lead}</span>}
      <BaseSelect.ItemText className={menuParts.LABEL}>{option.label}</BaseSelect.ItemText>
    </BaseSelect.Item>
  );
}

/** One value from a list of named options: a raised cap that opens a frosted list. */
export function Select<V extends string = string>({
  options, value, defaultValue, onValueChange, placeholder, size = 'regular', disabled, invalid, className, name, ...aria
}: SelectProps<V>) {
  const flat = isGroups(options) ? options.flatMap((g) => g.options) : options;
  const byValue = React.useMemo(() => new Map(flat.map((o) => [o.value, o])), [flat]);
  return (
    <BaseSelect.Root<V>
      value={value}
      defaultValue={defaultValue}
      onValueChange={(v) => { if (v != null) onValueChange?.(v as V); }}
      disabled={disabled}
      name={name}
    >
      <BaseSelect.Trigger
        aria-label={aria['aria-label']}
        data-invalid={invalid ? '' : undefined}
        aria-invalid={invalid || undefined}
        className={className ? `${TRIGGER[size]} ${className}` : TRIGGER[size]}
      >
        <BaseSelect.Value className={VALUE} placeholder={placeholder}>
          {(v: V | null) => {
            const o = v != null ? byValue.get(v) : undefined;
            if (!o) return placeholder ?? '';
            return <>{o.lead && <span aria-hidden className={menuParts.GLYPH}>{o.lead}</span>}{o.label}</>;
          }}
        </BaseSelect.Value>
        <Chevron />
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner className={POSITIONER} sideOffset={offset()} collisionPadding={8}>
          <BaseSelect.Popup className={POP}>
            <ListGlide />
            {isGroups(options)
              ? options.flatMap((g, gi) => [
                  gi > 0 ? <BaseSelect.Separator key={`${g.label}-sep`} className={SEP} /> : null,
                  <BaseSelect.Group key={g.label}>
                    <BaseSelect.GroupLabel className={HEADING}>{g.label}</BaseSelect.GroupLabel>
                    {g.options.map((o) => <Row key={o.value} option={o} />)}
                  </BaseSelect.Group>,
                ])
              : options.map((o) => <Row key={o.value} option={o} />)}
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}
