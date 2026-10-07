'use client';

import * as React from 'react';
import { Icon } from '../../icons/Icon';
import { Menu, MenuItem } from '../menu/menu';

/* ─────────────────────────────────────────────────────────
 * BREADCRUMBS, where you are, as a path you can climb
 *
 *   levels    the levels above in ui type and ink2 (ink on hover); the current one in ink, not a
 *             link (aria-current="page"); small engraved chevrons between, in ink3
 *   deeper    a new last crumb arrives one grid step from the right on the settle spring as it
 *             fades in (only changes move; the first render is still)
 *   up        the path simply shortens
 *   long      keeps the first level and the last two; the middle folds into a quiet key that opens
 *             a menu of the hidden levels
 *   focus     the green ring on each link
 * Reduce Motion: the new crumb fades in without travel.
 * ───────────────────────────────────────────────────────── */

export interface Crumb {
  /** Stable id for the level (its path works). */
  id: string;
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: Crumb[];
  /** More levels than this fold the middle into a menu (4). */
  max?: number;
  /** Render a level's link yourself (a router's link); gets the crumb and the props to spread. */
  renderLink?: (item: Crumb, props: React.AnchorHTMLAttributes<HTMLAnchorElement> & { className: string; children: React.ReactNode }) => React.ReactElement;
  /** Called when a folded level is chosen from the menu. */
  onNavigate?: (item: Crumb) => void;
  'aria-label'?: string;
  className?: string;
}

const NAV = 'mu-breadcrumbs';
const LIST = 'm-0 p-0 list-none flex flex-wrap items-center gap-breadcrumbs-gap type-ui';
const ITEM = 'mu-breadcrumb inline-flex items-center gap-breadcrumbs-gap data-arrive:breadcrumb-arrive';
const LINK = 'mu-breadcrumb-link text-ink2 no-underline outline-none transition-colors duration-settle pointer-hover:text-ink focus-visible:focus-ring';
const CURRENT = 'mu-breadcrumb-current text-ink';
const SEP = 'mu-breadcrumb-sep size-breadcrumbs-sep-size flex-none text-ink3';
const FOLD = 'mu-breadcrumb-fold mu-icon-trigger inline-grid place-items-center h-breadcrumbs-fold-height px-breadcrumbs-fold-pad rounded-breadcrumbs-fold-radius border-0 bg-transparent text-ink2 cursor-pointer outline-none pointer-hover:recipe-row-list-hover pointer-hover:text-ink focus-visible:focus-ring data-popup-open:recipe-row-list-hover';

function Sep() {
  return <Icon name="chevron" turn={270} size={16} animate={false} className={SEP} />;
}

/** Where you are, as a path you can climb. The last item is the current page. */
export function Breadcrumbs({ items, max = 4, renderLink, onNavigate, className, ...aria }: BreadcrumbsProps) {
  // Only changes move: remember which levels were already on screen.
  const seen = React.useRef<Set<string> | null>(null);
  const first = seen.current == null;
  const shown = new Set(seen.current ?? []);
  React.useEffect(() => { seen.current = new Set(items.map((i) => i.id)); });

  const folded = items.length > max ? items.slice(1, items.length - 2) : [];
  const visible = folded.length ? [items[0], null, ...items.slice(-2)] : items;
  const link = (item: Crumb) => {
    const props = { href: item.href, className: LINK, children: item.label };
    return renderLink ? renderLink(item, props) : <a {...props} />;
  };

  return (
    <nav aria-label={aria['aria-label'] ?? 'Breadcrumb'} className={className ? `${NAV} ${className}` : NAV}>
      <ol className={LIST}>
        {visible.map((item, i) => {
          const last = i === visible.length - 1;
          if (item == null) {
            return (
              <li key="fold" className={ITEM}>
                <Menu trigger={<button type="button" aria-label={`${folded.length} more levels`} className={FOLD}><Icon name="more" className="size-breadcrumbs-fold-glyph" /></button>}>
                  {folded.map((f) => <MenuItem key={f.id} onSelect={() => onNavigate?.(f)}>{f.label}</MenuItem>)}
                </Menu>
                <Sep />
              </li>
            );
          }
          const arrive = !first && !shown.has(item.id);
          return (
            <li key={item.id} className={ITEM} data-arrive={arrive ? '' : undefined}>
              {last ? <span aria-current="page" className={CURRENT}>{item.label}</span> : link(item)}
              {!last && <Sep />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
