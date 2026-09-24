'use client';

import * as React from 'react';
import './region.css';

/* ─────────────────────────────────────────────────────────
 * REGION (Kamui 04 §7, the medium demo's .region)
 *
 * rest    a sunk well; the head names it, says the rule it carries, counts what is inside
 * over    a block is dragged above it: green fill, 1 pt ring, the rule reads "drop to mark tasks done"
 *         (fill and ring cross-fade on settle); the dropped block lands on the object spring (the host's)
 * dim     an in-place lens has no match inside: .35
 * past    it did not exist at the scrubbed time: 0, and it takes no pointer
 * lens    a pinned lens: a frosted plate listing its matches as rows
 * rename  the name becomes a field; Enter commits, Escape restores
 * Radius: hero (30) when the short side is at least 240, else card (24).
 * ───────────────────────────────────────────────────────── */

export interface RegionProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The region's name; its rule follows from it (Done, To do, Doing, a date, anything else tags). */
  name: string;
  /** What the rule does, as the head says it: "marks tasks done", "tags them #poster". */
  rule?: string;
  /** What the rule does to a block dropped now: "drop to mark tasks done". Shown while over. */
  dropRule?: string;
  /** Blocks inside. */
  count?: number;
  over?: boolean;
  dim?: boolean;
  past?: boolean;
  /** A pinned lens: a frosted plate whose body lists rows. */
  lens?: boolean;
  /** Renaming: the name is a field. */
  renaming?: boolean;
  onRename?: (name: string) => void;
  onRenameCancel?: () => void;
  /** The region's size, to pick its radius from the ladder. */
  width: number;
  height: number;
  /** A pinned lens region's rows. */
  children?: React.ReactNode;
}

/** A drawn rectangle with a name that carries a rule. Placement is meaning, and reversible. */
export const Region = React.forwardRef<HTMLDivElement, RegionProps>(function Region(
  { name, rule, dropRule, count, over, dim, past, lens, renaming, onRename, onRenameCancel, width, height, className, style, children, ...props },
  ref,
) {
  const bigAt = typeof window === 'undefined' ? 240 : parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--mu-region-big-at')) || 240;
  const [draft, setDraft] = React.useState(name);
  React.useEffect(() => { if (renaming) setDraft(name); }, [renaming, name]);
  return (
    <div
      ref={ref}
      role="group"
      aria-label={name ? `Region ${name}${rule ? `, ${rule}` : ''}` : 'Unnamed region'}
      data-over={over ? '' : undefined}
      data-dim={dim ? '' : undefined}
      data-past={past ? '' : undefined}
      data-lens={lens ? '' : undefined}
      data-big={Math.min(width, height) >= bigAt ? '' : undefined}
      className={className ? `mu-region ${className}` : 'mu-region'}
      style={{ width, height, ...style }}
      {...props}
    >
      <div className="mu-region-head">
        {renaming ? (
          <input
            autoFocus
            aria-label="Region name"
            className="mu-region-name type-title"
            value={draft}
            placeholder="name this region"
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => onRename?.(draft.trim())}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); onRename?.(draft.trim()); }
              if (e.key === 'Escape') { e.preventDefault(); onRenameCancel?.(); }
            }}
          />
        ) : (
          <span className="mu-region-name type-title" data-placeholder="name this region" data-empty={name ? undefined : ''}>{name}</span>
        )}
        <span className="mu-region-rule mu-type-label engraved">{over && dropRule ? dropRule : rule}</span>
        {count ? <span className="mu-region-count type-readout">{count}</span> : null}
      </div>
      {lens && <div className="mu-region-body">{children}</div>}
    </div>
  );
});

export interface RegionRowProps extends React.HTMLAttributes<HTMLDivElement> {
  checked?: boolean;
  /** A leading dimple (a Dimple) for task rows. */
  lead?: React.ReactNode;
  /** A trailing engraving: the day, a count. */
  meta?: React.ReactNode;
}

/** A row in a pinned lens region. Ticking its dimple ticks the real block. */
export function RegionRow({ checked, lead, meta, className, children, ...props }: RegionRowProps) {
  return (
    <div tabIndex={0} data-checked={checked ? '' : undefined} className={className ? `mu-region-row type-ui ${className}` : 'mu-region-row type-ui'} {...props}>
      {lead}
      <span className="mu-region-row-text">{children}</span>
      {meta && <span className="mu-region-row-meta mu-type-label engraved">{meta}</span>}
    </div>
  );
}
