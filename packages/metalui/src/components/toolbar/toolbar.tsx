'use client';

import * as React from 'react';
import { Toolbar as BaseToolbar } from '@base-ui/react/toolbar';
import { Toggle } from '@base-ui/react/toggle';
import { Tooltip, TooltipProvider } from '../tooltip/tooltip';
import { Kbd } from '../kbd/kbd';

/* ─────────────────────────────────────────────────────────
 * TOOLBAR and TOOL BUTTON on Base UI Toolbar + Toggle + Tooltip
 *   enter     one nest from its edge on the surface spring
 *   hover     the glyph plays its pose (the tool is its trigger); a tooltip after 120 ms: "Select · V"
 *   press     down 1 into a well, 50 ms; back on release
 *   latched   stays pressed, a 4 pt green LED top right; state changes at once
 *   focus     a 1.5 ring with no offset (a dense strip); arrows move between tools
 * ───────────────────────────────────────────────────────── */

export interface ToolbarProps {
  /** frost (the colorway's frosted strip) or graphite (the dark strip, in both colorways). */
  variant?: 'frost' | 'graphite';
  'aria-label': string;
  className?: string;
  children: React.ReactNode;
}

/* Styled with the theme's utilities (the toolbar recipe's own drawings): the frosted strip or the graphite
 * dock, and its tools, separators and search well per variant through a group variant. */
const STRIP = {
  frost: 'mu-toolbar group/toolbar inline-flex items-center toolbar-enter toolbar-frost material-frost-strip',
  graphite: 'mu-toolbar group/toolbar inline-flex items-center toolbar-enter gap-toolbar-gap p-toolbar-pad rounded-toolbar-radius recipe-toolbar backdrop-toolbar-blur',
};
const TOOL = 'mu-tool mu-icon-trigger relative grid place-items-center p-0 border-0 cursor-pointer tap-highlight-none toolbar-frost-tool group-data-[variant=graphite]/toolbar:toolbar-graphite-tool data-disabled:opacity-button-disabled data-disabled:cursor-default';
const SEP = 'mu-toolbar-sep toolbar-frost-sep group-data-[variant=graphite]/toolbar:toolbar-graphite-sep';
const SEARCH = 'mu-toolbar-search flex items-center border-0 cursor-text [&>.mu-kbd]:ml-auto toolbar-frost-search group-data-[variant=graphite]/toolbar:toolbar-graphite-search';

/** A strip of tools: 48 tall, a capsule. */
export function Toolbar({ variant = 'frost', className, children, ...props }: ToolbarProps) {
  return (
    <TooltipProvider>
      <BaseToolbar.Root
        aria-label={props['aria-label']}
        data-variant={variant}
        className={className ? `${STRIP[variant]} ${className}` : STRIP[variant]}
      >
        {children}
      </BaseToolbar.Root>
    </TooltipProvider>
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
    <BaseToolbar.Button className={TOOL} aria-label={label} aria-keyshortcuts={shortcut} disabled={disabled} onClick={onClick}>
      {icon}
    </BaseToolbar.Button>
  ) : (
    <BaseToolbar.Button
      render={<Toggle pressed={pressed} onPressedChange={(p) => onPressedChange?.(p)} />}
      className={TOOL}
      aria-label={label}
      aria-keyshortcuts={shortcut}
      disabled={disabled}
      onClick={onClick}
    >
      {icon}
    </BaseToolbar.Button>
  );
  return <Tooltip label={label} shortcut={shortcut}>{button}</Tooltip>;
}

/** An engraved rule between groups of tools. */
export function ToolbarSeparator() {
  return <BaseToolbar.Separator className={SEP} />;
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
    <BaseToolbar.Button className={SEARCH} onClick={onOpen} aria-keyshortcuts="Meta+K">
      {icon}
      {placeholder}
      <Kbd surface="plain">{shortcut}</Kbd>
    </BaseToolbar.Button>
  );
}
