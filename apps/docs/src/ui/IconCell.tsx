import * as React from 'react';
import { Link } from 'react-router';
import { Icon } from '@unlocalhosted/metalui/icons';
import { LifeIcon } from '@unlocalhosted/metalui/icons/life';
import type { ICON_PAGES } from '../app/icon-pages';
import { useCatalogTransition } from '../app/catalog-transition';
import './icon-cell.css';

export type IconPage = typeof ICON_PAGES[number];

/** One glyph in a tray: hovering or focusing it plays its act; opening it flies the glyph and its name
 * into the glyph's page. `state` carries the browsing context the breadcrumbs return to. */
export function IconCell({ icon, size = 32, state }: { icon: IconPage; size?: number; state?: Record<string, unknown> }) {
  const card = React.useRef<HTMLAnchorElement>(null);
  useCatalogTransition(icon.to, card, '.icon-entry-label', '.icon-entry-specimen > svg');
  // Product glyphs play on focus-visible themselves; life glyphs play on their host's hover, so
  // keyboard focus lends the cell that hover.
  const lend = (event: React.FocusEvent<HTMLAnchorElement>) => { if (icon.kind === 'life' && event.currentTarget.matches(':focus-visible')) event.currentTarget.setAttribute('data-hover', ''); };
  const take = (event: React.FocusEvent<HTMLAnchorElement>) => event.currentTarget.removeAttribute('data-hover');
  return <Link ref={card} to={icon.to} viewTransition className="icon-entry mu-icon-trigger" state={state} onFocus={lend} onBlur={take}>
    <span className="icon-entry-specimen" aria-hidden="true">{icon.kind === 'life' ? <LifeIcon name={icon.name} size={size} /> : <Icon name={icon.name} size={size} />}</span>
    <span className="icon-entry-label">{icon.label}</span>
  </Link>;
}

/** A sunk tray of glyph cells sized for `size`. */
export function IconTray({ icons, size = 32, state, label }: { icons: IconPage[]; size?: number; state?: Record<string, unknown>; label?: string }) {
  return <div className="icon-directory" role={label ? 'group' : undefined} aria-label={label} style={{ '--icon-tile': `${size + 72}px` } as React.CSSProperties}>
    {icons.map(icon => <IconCell key={icon.to} icon={icon} size={size} state={state} />)}
  </div>;
}
