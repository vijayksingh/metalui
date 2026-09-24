'use client';

import * as React from 'react';
import { Toolbar } from '@base-ui/react/toolbar';
import { Surface } from '../../components/surface/surface';
import { Button } from '../../components/button/button';
import { Rule } from '../../components/rule/rule';
import './tool-strip.css';

/* ─────────────────────────────────────────────────────────
 * SELECTION TOOL STRIP (the reference design's #selTools): a composition on Base UI Toolbar
 *   Surface(graphite-strip, strip) › Button(strip) × n, Rule(graphite) + Button(strip-danger) for the one destructive verb
 *
 *   a click selection  rises 4 from the selection on the part spring (instant under Reduce Motion)
 *   hover / press      the strip cap's own: a soft light well; down 1 onto a dark well
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
    <Toolbar.Root
      aria-label={`Tools for ${label}`}
      render={<Surface material="graphite-strip" radius="strip" className={className ? `mu-toolstrip ${className}` : 'mu-toolstrip'} />}
    >
      {items.flatMap((it) => [
        it.destructive ? <Toolbar.Separator key={`${it.label}-rule`} render={<Rule tone="graphite" />} /> : null,
        <Toolbar.Button
          key={it.label}
          render={<Button cap={it.destructive ? 'strip-danger' : 'strip'} className="mu-toolstrip-button" />}
          disabled={it.disabled}
          aria-keyshortcuts={it.shortcut}
          title={it.shortcut ? `${it.label} · ${it.shortcut}` : undefined}
          onClick={it.onSelect}
        >
          {it.label}
        </Toolbar.Button>,
      ])}
    </Toolbar.Root>
  );
}
