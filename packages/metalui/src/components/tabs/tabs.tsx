'use client';

import * as React from 'react';
import { Tabs as BaseTabs } from '@base-ui/react/tabs';
import { SlidingIndicator } from '../../motion/indicator';
import { trackParts } from '../switcher/switcher';

/* ─────────────────────────────────────────────────────────
 * TABS on Base UI Tabs: switch which panel is shown
 *
 * Use it when each option owns a panel (React / Agent guide, the pages of Settings).
 * Picking a value with no panel of its own is the Switcher; a long list is a Select.
 *
 *   list      the switcher track: a well, tabs in ink2, the active one a raised thumb in ink
 *   hover     the label turns ink
 *   switch    the thumb glides to the new tab on the part spring (a track with ends, so it
 *             may overshoot against the stop); the new panel comes in from the side the thumb
 *             went: 6 px drift and a fade on the settle spring. The old panel leaves at once.
 *   first     the first panel shows without motion
 *   focus     a 1.5 ring on the tab; ← → move and choose, Home / End jump; Tab goes into the panel
 *   disabled  40 %
 * Reduce Motion: the thumb moves at once and the panel only fades.
 * ───────────────────────────────────────────────────────── */

export interface TabItem<V extends string = string> {
  value: V;
  label: React.ReactNode;
  /** A leading glyph at the size the height gives (12 in 24, 14 in 28). */
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps<V extends string = string> {
  value?: V;
  defaultValue?: V;
  onValueChange?: (value: V) => void;
  children: React.ReactNode;
  className?: string;
}

export interface TabListProps<V extends string = string> {
  items: TabItem<V>[];
  /** compact is 24 tall (in a panel head, a strip), regular 28. */
  size?: 'compact' | 'regular';
  'aria-label': string;
  className?: string;
}

export interface TabPanelProps<V extends string = string> {
  value: V;
  children: React.ReactNode;
  /** Keep the panel in the page while hidden (for state that must survive a switch). */
  keepMounted?: boolean;
  className?: string;
}

const PANEL = 'mu-tabs-panel tabs-panel';
const join = (a: string, b?: string) => (b ? `${a} ${b}` : a);

/** Holds the active tab; put a TabList and one TabPanel per tab anywhere inside. */
export function Tabs<V extends string = string>({ value, defaultValue, onValueChange, children, className }: TabsProps<V>) {
  return (
    <BaseTabs.Root value={value} defaultValue={defaultValue} onValueChange={(v) => onValueChange?.(v as V)} className={className}>
      {children}
    </BaseTabs.Root>
  );
}

/** The tabs, on the switcher track with its gliding thumb. */
export function TabList<V extends string = string>({ items, size = 'regular', className, ...props }: TabListProps<V>) {
  return (
    <BaseTabs.List activateOnFocus aria-label={props["aria-label"]} data-size={size} className={join(trackParts.TRACK, className)}>
      <SlidingIndicator className={trackParts.THUMB} />
      {items.map((t) => (
        <BaseTabs.Tab key={t.value} value={t.value} disabled={t.disabled} className={trackParts.OPTION[size]}>
          {t.icon}
          {t.label}
        </BaseTabs.Tab>
      ))}
    </BaseTabs.List>
  );
}

/** One tab's panel; it drifts in from the side the thumb went. */
export function TabPanel<V extends string = string>({ value, children, keepMounted, className }: TabPanelProps<V>) {
  return (
    <BaseTabs.Panel value={value} keepMounted={keepMounted} className={join(PANEL, className)}>
      {children}
    </BaseTabs.Panel>
  );
}
