'use client';

import * as React from 'react';
import { Menu as BaseMenu } from '@base-ui/react/menu';
import { ContextMenu as BaseContextMenu } from '@base-ui/react/context-menu';
import { Kbd } from '../kbd/kbd';
import './menu.css';

/* ─────────────────────────────────────────────────────────
 * MENU and CORRECTION POPOVER (Kamui 03 §5, 04 §8, §18; the medium demo's #pop) on Base UI Menu
 *   open      from a trigger (6 below it) or at the pointer (right-click): fades in on settle
 *   heading   what the menu acts on, engraved: "NOTE · TASK BY JEV 0.82"
 *   rows      pointer and keyboard share one highlighted state; ↑ ↓ and type-ahead; ↩ chooses
 *   choose    the row runs and the menu closes (fades on release); focus returns to the trigger
 *   ⎋ / click outside  closes, nothing runs
 * ───────────────────────────────────────────────────────── */

function offset() {
  if (typeof window === 'undefined') return 6;
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--mu-menu-offset')) || 6;
}

function Plate({ heading, children }: { heading?: string; children: React.ReactNode }) {
  return (
    <BaseMenu.Popup className="mu-menu">
      {heading ? (
        <BaseMenu.Group>
          <BaseMenu.GroupLabel className="mu-menu-heading mu-type-label">{heading}</BaseMenu.GroupLabel>
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
        <BaseMenu.Positioner className="mu-menu-positioner" side={side} align={align} sideOffset={offset()} collisionPadding={8}>
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
        <BaseContextMenu.Positioner className="mu-menu-positioner" collisionPadding={8}>
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
    <BaseMenu.Item className="mu-menu-row mu-type-ui mu-icon-trigger" onClick={onSelect} disabled={disabled} data-danger={danger ? '' : undefined}>
      {icon && <span aria-hidden className="mu-menu-glyph">{icon}</span>}
      <span className="mu-menu-label">{children}</span>
      {shortcut && <Kbd size="small" className="mu-menu-key">{shortcut}</Kbd>}
    </BaseMenu.Item>
  );
}

/** An engraved rule between groups of rows. */
export function MenuSeparator() {
  return <BaseMenu.Separator className="mu-menu-sep" />;
}
