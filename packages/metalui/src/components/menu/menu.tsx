'use client';

import * as React from 'react';
import { Menu as BaseMenu } from '@base-ui/react/menu';
import { ContextMenu as BaseContextMenu } from '@base-ui/react/context-menu';
import { Kbd } from '../kbd/kbd';

/* ─────────────────────────────────────────────────────────
 * MENU and CORRECTION POPOVER (the brief, 04 §8, §18; the reference design's #pop) on Base UI Menu
 *   open      from a trigger (6 below it) or at the pointer (right-click): fades in on settle
 *   heading   what the menu acts on, engraved: "NOTE · TASK BY RECOGNIZER 0.82"
 *   rows      pointer and keyboard share one highlighted state; ↑ ↓ and type-ahead; ↩ chooses
 *   choose    the row runs and the menu closes (fades on release); focus returns to the trigger
 *   ⎋ / click outside  closes, nothing runs
 * ───────────────────────────────────────────────────────── */

/* Styled with the theme's utilities (the menu recipe): a frosted plate that fades in on settle and out on
 * release; rows highlight under the pointer or the keys; destructive rows are red. */
const POSITIONER = 'mu-menu-positioner z-menu-z';
const PLATE = 'mu-menu min-w-menu-min-width p-menu-pad rounded-menu-radius outline-none recipe-menu backdrop-menu-blur menu-origin transition-opacity ease-settle duration-settle data-starting-style:opacity-0 data-ending-style:opacity-0 data-ending-style:ease-release data-ending-style:duration-release reduce-transparency:opaque-frost';
const HEADING = 'mu-menu-heading pt-menu-heading-pad-top px-menu-heading-pad-x pb-menu-heading-pad-bottom type-label engraved';
const ROW = 'mu-menu-row mu-icon-trigger flex items-center gap-menu-row-gap h-menu-row-height px-menu-row-pad rounded-menu-row-radius type-menu-row text-ink cursor-default outline-none select-none data-highlighted:recipe-menu-row-hover data-danger:text-red data-disabled:opacity-menu-row-disabled';
const GLYPH = 'mu-menu-glyph inline-grid flex-none text-ink2 in-data-danger:text-red [&>svg]:size-menu-row-glyph';
const LABEL = 'mu-menu-label flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap';
const KEY = 'mu-menu-key ml-menu-row-key-gap';
const SEP = 'mu-menu-sep h-menu-sep-thickness my-menu-sep-inset-y mx-menu-sep-inset-x recipe-menu-sep';

/** The menu's part classes, for stills of it outside a popup (docs, previews). */
export const menuParts = { PLATE, HEADING, ROW, GLYPH, LABEL, KEY, SEP } as const;

function offset() {
  if (typeof window === 'undefined') return 6;
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--mu-menu-offset')) || 6;
}

function Plate({ heading, children }: { heading?: string; children: React.ReactNode }) {
  return (
    <BaseMenu.Popup className={PLATE}>
      {heading ? (
        <BaseMenu.Group>
          <BaseMenu.GroupLabel className={HEADING}>{heading}</BaseMenu.GroupLabel>
          {children}
        </BaseMenu.Group>
      ) : children}
    </BaseMenu.Popup>
  );
}

export interface MenuProps {
  /** The control that opens it. It must accept a ref and props (a Button, an icon button). */
  trigger: React.ReactElement;
  /** What the menu acts on, as an engraving above the rows. */
  heading?: string;
  side?: 'bottom' | 'top' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  /** MenuItem and MenuSeparator. */
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/** A menu from a trigger: a frosted plate of rows 6 below it. */
export function Menu({ trigger, heading, side = 'bottom', align = 'start', children, open, onOpenChange }: MenuProps) {
  return (
    <BaseMenu.Root open={open} onOpenChange={onOpenChange ? (o) => onOpenChange(o) : undefined}>
      <BaseMenu.Trigger render={trigger} />
      <BaseMenu.Portal>
        <BaseMenu.Positioner className={POSITIONER} side={side} align={align} sideOffset={offset()} collisionPadding={8}>
          <Plate heading={heading}>{children}</Plate>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
}

export interface ContextMenuProps {
  /** The rows: MenuItem and MenuSeparator. */
  menu: React.ReactNode;
  /** What the menu acts on: for a correction, the cue's provenance. */
  heading?: string;
  /** The area that answers a right-click (or ⌃-click, or a long press). */
  children: React.ReactElement;
}

/**
 * The correction popover: right-click a cue (or anything) for a menu at the pointer. Corrections win
 * and are remembered; the host shows a toast with Undo after one.
 */
export function ContextMenu({ menu, heading, children }: ContextMenuProps) {
  return (
    <BaseContextMenu.Root>
      <BaseContextMenu.Trigger render={children} />
      <BaseContextMenu.Portal>
        <BaseContextMenu.Positioner className={POSITIONER} collisionPadding={8}>
          <Plate heading={heading}>{menu}</Plate>
        </BaseContextMenu.Positioner>
      </BaseContextMenu.Portal>
    </BaseContextMenu.Root>
  );
}

export interface MenuItemProps {
  /** Runs when chosen (click, ↩, or a release after press-and-drag). */
  onSelect?: () => void;
  /** The 14 glyph at the left. */
  icon?: React.ReactNode;
  /** The key at the right: "⌘Z". */
  shortcut?: string;
  /** A destructive action: red. */
  danger?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}

/** A 30 row. */
export function MenuItem({ onSelect, icon, shortcut, danger, disabled, children }: MenuItemProps) {
  return (
    <BaseMenu.Item className={ROW} onClick={onSelect} disabled={disabled} data-danger={danger ? '' : undefined}>
      {icon && <span aria-hidden className={GLYPH}>{icon}</span>}
      <span className={LABEL}>{children}</span>
      {shortcut && <Kbd size="small" className={KEY}>{shortcut}</Kbd>}
    </BaseMenu.Item>
  );
}

/** An engraved rule between groups of rows. */
export function MenuSeparator() {
  return <BaseMenu.Separator className={SEP} />;
}
