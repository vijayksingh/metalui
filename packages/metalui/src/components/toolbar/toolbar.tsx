'use client';

import * as React from 'react';
import { Toolbar as BaseToolbar } from '@base-ui/react/toolbar';
import { Toggle } from '@base-ui/react/toggle';
import { Tooltip } from '@base-ui/react/tooltip';
import { Kbd } from '../kbd/kbd';
import './toolbar.css';

/* ─────────────────────────────────────────────────────────
 * TOOLBAR and TOOL BUTTON (KAMUI-01/02) on Base UI Toolbar + Toggle + Tooltip
 *   enter     one nest from its edge on the surface spring
 *   hover     the glyph plays its pose (the tool is its trigger); a tooltip after 120 ms: "Select · V"
 *   press     down 1 into a well, 50 ms; back on release
 *   latched   stays pressed, a 4 pt green LED top right; state changes at once
 *   focus     a 1.5 ring with no offset (a dense strip); arrows move between tools
 * ───────────────────────────────────────────────────────── */

export interface ToolbarProps {
  /** frost (the colorway's frosted strip) or graphite (the medium's dark strip, in both colorways). */
  variant?: 'frost' | 'graphite';
  'aria-label': string;
  className?: string;
  children: React.ReactNode;
}

/** A strip of tools: 48 tall, a capsule. */
export function Toolbar({ variant = 'frost', className, children, ...props }: ToolbarProps) {
  return (
    <Tooltip.Provider delay={parseFloat(typeof window === 'undefined' ? '120' : getComputedStyle(document.documentElement).getPropertyValue('--mu-toolbar-tip-delay-ms')) || 120}>
      <BaseToolbar.Root
        aria-label={props['aria-label']}
        data-variant={variant}
        className={['mu-toolbar', variant === 'graphite' ? 'mu-frost-graphite' : 'mu-frost-strip', className].filter(Boolean).join(' ')}
      >
        {children}
      </BaseToolbar.Root>
    </Tooltip.Provider>
  );
}

function Tip({ label, shortcut, children }: { label: string; shortcut?: string; children: React.ReactElement }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger render={children} />
      <Tooltip.Portal>
        <Tooltip.Positioner side="top" sideOffset={10}>
          <Tooltip.Popup className="mu-tool-tip mu-type-label">{shortcut ? `${label} · ${shortcut}` : label}</Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

export interface ToolButtonProps {
  /** The tool's name: its accessible name and tooltip. */
  label: string;
  /** The key, in the tooltip and aria-keyshortcuts: "V". */
  shortcut?: string;
  /** The glyph at 16, e.g. <SelectIcon size={16} />. */
  icon: React.ReactNode;
  /** Latched (the active tool). Omit for a momentary action. */
  pressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  onClick?: () => void;
  disabled?: boolean;
}

/** A circular tool cap. Latched tools sit pressed with a green LED. */
export function ToolButton({ label, shortcut, icon, pressed, onPressedChange, onClick, disabled }: ToolButtonProps) {
  const button = pressed === undefined ? (
    <BaseToolbar.Button className="mu-tool mu-icon-trigger" aria-label={label} aria-keyshortcuts={shortcut} disabled={disabled} onClick={onClick}>
      {icon}
    </BaseToolbar.Button>
  ) : (
    <BaseToolbar.Button
      render={<Toggle pressed={pressed} onPressedChange={(p) => onPressedChange?.(p)} />}
      className="mu-tool mu-icon-trigger"
      aria-label={label}
      aria-keyshortcuts={shortcut}
      disabled={disabled}
      onClick={onClick}
    >
      {icon}
    </BaseToolbar.Button>
  );
  return <Tip label={label} shortcut={shortcut}>{button}</Tip>;
}

/** An engraved rule between groups of tools. */
export function ToolbarSeparator() {
  return <BaseToolbar.Separator className="mu-toolbar-sep" />;
}

export interface ToolbarSearchProps {
  /** Opens the command palette. */
  onOpen: () => void;
  placeholder?: string;
  icon?: React.ReactNode;
  shortcut?: string;
}

/** The search well in the strip: opens the palette. */
export function ToolbarSearch({ onOpen, placeholder = 'Search or ask', icon, shortcut = '⌘K' }: ToolbarSearchProps) {
  return (
    <BaseToolbar.Button className="mu-toolbar-search type-ui" onClick={onOpen} aria-keyshortcuts="Meta+K">
      {icon}
      {placeholder}
      <Kbd surface="strip">{shortcut}</Kbd>
    </BaseToolbar.Button>
  );
}
