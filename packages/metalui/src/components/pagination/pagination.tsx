'use client';

import { Icon } from '../../icons/Icon';
import { SlidingIndicator } from '../../motion/indicator';
import { trackParts } from '../switcher/switcher';

/* ─────────────────────────────────────────────────────────
 * PAGINATION, moving through pages of results
 *
 *   rest      the switcher's sunk track: previous key, page numbers, next key
 *   current   the switcher's raised thumb under the current page (aria-current="page")
 *   choose    another page: the thumb glides there on the part spring (a track with ends)
 *   long      first and last pages, the current one and its neighbours; quiet ellipses between
 *   ends      the previous or next key is disabled on the first or last page
 *   focus     the switcher's focus ring on each key
 * Reduce Motion: the thumb moves at once.
 * The track, thumb and keys are the switcher recipe; pagination adds the page window.
 * ───────────────────────────────────────────────────────── */

const { TRACK, THUMB, OPTION } = trackParts;
const KEY = `mu-icon-trigger ${OPTION.regular} justify-center min-w-pagination-page-min-width tabular-nums`;
const GAP = 'mu-pagination-gap inline-grid place-items-center min-w-pagination-page-min-width type-switcher-option text-ink3 select-none';
const ARROW = 'size-pagination-arrow-size';

export interface PaginationProps {
  /** The page shown, from 1. */
  page: number;
  /** How many pages there are. */
  count: number;
  onPageChange: (page: number) => void;
  /** Pages on each side of the current one (1). */
  siblings?: number;
  'aria-label'?: string;
  className?: string;
}

/** The page numbers to show, with null for a gap. */
export function pageWindow(page: number, count: number, siblings = 1): (number | null)[] {
  const out: (number | null)[] = [];
  const lo = Math.max(2, page - siblings);
  const hi = Math.min(count - 1, page + siblings);
  out.push(1);
  if (lo > 2) out.push(lo === 3 ? 2 : null);
  for (let p = lo; p <= hi; p++) out.push(p);
  if (hi < count - 1) out.push(hi === count - 2 ? count - 1 : null);
  if (count > 1) out.push(count);
  return out;
}

/** Moving through pages of results. */
export function Pagination({ page, count, onPageChange, siblings = 1, className, ...aria }: PaginationProps) {
  const pages = pageWindow(page, count, siblings);
  const go = (p: number) => { if (p >= 1 && p <= count && p !== page) onPageChange(p); };
  return (
    <nav aria-label={aria['aria-label'] ?? 'Pagination'} className={className ? `mu-pagination ${className}` : 'mu-pagination'}>
      <div className={`${TRACK} items-center`}>
        <SlidingIndicator className={THUMB} />
        <button type="button" className={KEY} aria-label="Previous page" disabled={page <= 1} data-disabled={page <= 1 ? '' : undefined} onClick={() => go(page - 1)}><Icon name="chevron" turn={90} className={ARROW} /></button>
        {pages.map((p, i) => (p == null ? (
          <span key={`gap-${i}`} aria-hidden className={GAP}>…</span>
        ) : (
          <button
            key={p}
            type="button"
            className={KEY}
            aria-label={`Page ${p}`}
            aria-current={p === page ? 'page' : undefined}
            data-checked={p === page ? '' : undefined}
            onClick={() => go(p)}
          >
            {p}
          </button>
        )))}
        <button type="button" className={KEY} aria-label="Next page" disabled={page >= count} data-disabled={page >= count ? '' : undefined} onClick={() => go(page + 1)}><Icon name="chevron" turn={270} className={ARROW} /></button>
      </div>
    </nav>
  );
}
