import * as React from 'react';
import { Link } from 'react-router';
import { Icon } from '@unlocalhosted/metalui/icons';
import { LifeIcon, LIFE_CATALOG } from '@unlocalhosted/metalui/icons/life';
import { motionReduced } from '@unlocalhosted/metalui';
import type { IconPage } from './IconCell';
import './icon-plate.css';

/* ─────────────────────────────────────────────────────────
 * ICON PLATE · the library's specimen header
 *
 * Eight glyphs on raised keycaps in a sunk plate, each a link to its page.
 *      0ms   page settles
 *    500ms   the first key plays its act; each next key starts 140ms after the last,
 *            a run across the keys, once
 *    after   at rest: a key plays when hovered or focused, sinks when pressed
 * Reduced motion: no run, no acts; the keys are still links.
 * ───────────────────────────────────────────────────────── */

const RUN = { delay: 500, step: 140 };

function playKey(key: HTMLElement, icon: IconPage) {
  if (icon.kind === 'product') {
    // The product player starts its act on the trigger's pointerenter (not touch).
    key.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
    return;
  }
  // A life glyph plays while its host carries hover; lend it for the length of its act.
  const ms = LIFE_CATALOG[icon.name as keyof typeof LIFE_CATALOG].hoverMs;
  key.setAttribute('data-hover', '');
  window.setTimeout(() => { if (!key.matches(':hover, :focus-visible')) key.removeAttribute('data-hover'); }, ms + 300);
}

export function IconPlate({ icons }: { icons: IconPage[] }) {
  const plate = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const keys = [...(plate.current?.querySelectorAll<HTMLElement>('.icon-key') ?? [])];
    if (!keys.length || motionReduced(plate.current)) return;
    const timers = keys.map((key, i) => window.setTimeout(() => playKey(key, icons[i]), RUN.delay + i * RUN.step));
    return () => timers.forEach(window.clearTimeout);
  }, [icons]);
  // Life glyphs only play on their host's hover; keyboard focus lends it, as in the library tray.
  const lend = (event: React.FocusEvent<HTMLElement>) => { if (event.currentTarget.matches(':focus-visible')) event.currentTarget.setAttribute('data-hover', ''); };
  const take = (event: React.FocusEvent<HTMLElement>) => event.currentTarget.removeAttribute('data-hover');
  return <div ref={plate} className="icon-plate" role="group" aria-label="Featured icons">
    {icons.map(icon => <Link key={icon.to} to={icon.to} viewTransition className="icon-key mu-icon-trigger" aria-label={icon.label} onFocus={icon.kind === 'life' ? lend : undefined} onBlur={icon.kind === 'life' ? take : undefined}>
      {icon.kind === 'life' ? <LifeIcon name={icon.name} size={28} /> : <Icon name={icon.name} size={28} />}
    </Link>)}
  </div>;
}
