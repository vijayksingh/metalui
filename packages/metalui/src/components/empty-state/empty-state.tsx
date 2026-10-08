'use client';

import * as React from 'react';

/* ─────────────────────────────────────────────────────────
 * EMPTY STATE, a place with nothing in it yet
 *
 *   rest      a glyph engraved in a sunk well, what would be here, how to start, one action
 *   arrive    when a place empties it rises one nest from below on the settle spring (T9), so it
 *             never snaps in; content arriving replaces it
 *   compact   one quiet line and the action, for small places (a panel, a table)
 * Reduce Motion: it fades in without travel.
 * A place: it holds the space where objects will be. It uses the well.
 * ───────────────────────────────────────────────────────── */

const ROOT = 'mu-empty-state grid justify-items-center gap-empty-state-gap max-w-empty-state-max-width mx-auto p-empty-state-pad text-center empty-state-arrive';
const WELL = 'mu-empty-state-well grid place-items-center size-empty-state-well-size rounded-empty-state-well-radius recipe-well-field text-ink3 [&>svg]:size-empty-state-well-glyph';
const TITLE = 'mu-empty-state-title m-0 type-title text-ink text-balance';
const LINE = 'mu-empty-state-description m-0 type-body text-ink2';
const ACTION = 'mu-empty-state-action mt-empty-state-action-gap flex flex-wrap justify-center gap-empty-state-gap';
const COMPACT = 'mu-empty-state flex flex-wrap items-center justify-center gap-empty-state-gap py-empty-state-gap type-body text-ink3 empty-state-arrive';

export interface EmptyStateProps {
  /** What would be here: "No regions yet". */
  title: string;
  /** How to start: "Draw a box around notes to make one." */
  description?: React.ReactNode;
  /** A glyph from the icon set, engraved in the well. */
  icon?: React.ReactNode;
  /** The one thing that starts it: usually a Button. */
  action?: React.ReactNode;
  /** One quiet line and the action, for small places. */
  compact?: boolean;
  className?: string;
}

/** A place with nothing in it yet, and how to start. */
export function EmptyState({ title, description, icon, action, compact, className }: EmptyStateProps) {
  if (compact) {
    return (
      <div role="status" className={className ? `${COMPACT} ${className}` : COMPACT}>
        <span>{title}{description ? <> · {description}</> : null}</span>
        {action}
      </div>
    );
  }
  return (
    <div role="status" className={className ? `${ROOT} ${className}` : ROOT}>
      {icon && <span aria-hidden className={WELL}>{icon}</span>}
      <p className={TITLE}>{title}</p>
      {description && <p className={LINE}>{description}</p>}
      {action && <div className={ACTION}>{action}</div>}
    </div>
  );
}
