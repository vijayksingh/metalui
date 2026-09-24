'use client';

import * as React from 'react';
import { Toolbar } from '@base-ui/react/toolbar';
import './tool-strip.css';

/* ─────────────────────────────────────────────────────────
 * SELECTION TOOL STRIP (Kamui 04 §11) on Base UI Toolbar
 *   a click selection  rises 4 from the selection on the part spring (instant under Reduce Motion)
 *   hover              a soft light well, white
 *   press              down 1 onto a dark well, 50 ms; back on release
 *   destructive        after an engraved separator, in the warm red
 * Never for a selection made by finishing (quiet), never while dragging, resizing or in the past.
 * ───────────────────────────────────────────────────────── */

export interface ToolStripItem {
  label: string;
  onSelect: () => void;
  /** The one destructive verb (Send away), set apart by an engraved separator. */
  destructive?: boolean;
  disabled?: boolean;
  /** The key, in the tooltip and aria-keyshortcuts. */
  shortcut?: string;
}

export interface ToolStripProps {
  items: ToolStripItem[];
  /** What the verbs act on, for assistive tech: "3 blocks". */
  label: string;
  className?: string;
}

/** Verbs over a selection. Tools compose, and never own the data before or after. */
export function ToolStrip({ items, label, className }: ToolStripProps) {
  return (
    <Toolbar.Root aria-label={`Tools for ${label}`} className={['mu-toolstrip', 'mu-frost-graphite', className].filter(Boolean).join(' ')}>
      {items.map((it) => (
        <React.Fragment key={it.label}>
          {it.destructive && <Toolbar.Separator className="mu-toolstrip-sep" />}
          <Toolbar.Button
            className="mu-toolstrip-button type-ui"
            data-destructive={it.destructive ? '' : undefined}
            disabled={it.disabled}
            aria-keyshortcuts={it.shortcut}
            title={it.shortcut ? `${it.label} · ${it.shortcut}` : undefined}
            onClick={it.onSelect}
          >
            {it.label}
          </Toolbar.Button>
        </React.Fragment>
      ))}
    </Toolbar.Root>
  );
}
