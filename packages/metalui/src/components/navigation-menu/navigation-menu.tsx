'use client';

import * as React from 'react';
import { MorphIcon } from '../../icons/MorphIcon';
import { NavigationMenu as BaseNav } from '@base-ui/react/navigation-menu';

/* ─────────────────────────────────────────────────────────
 * NAVIGATION MENU, a site's sections across the top, with panels of links
 *
 *   keys      the menubar's quiet keys; a key with a panel carries a chevron that turns over on the
 *             settle spring while its panel is open; a plain link is a key too
 *   open      the panel, the menu's frosted plate, rises one nest into place on the surface spring
 *   across    moving to the next key: the plate slides under it and takes the new panel's size on
 *             the settle spring, while the content moves two grid steps the way you went and
 *             crossfades
 *   links     rows with a title and a line of description that lift on hover (the list row's look)
 *   close     Esc, moving away, or a choice: the plate fades on the release spring
 * Reduce Motion: size and place snap; content crossfades without travel.
 * Slots: NavigationMenu.Root, NavigationMenu.Item, NavigationMenu.Link.
 * ───────────────────────────────────────────────────────── */

const ROOT = 'mu-navigation-menu relative';
const LIST = 'm-0 p-menubar-pad list-none flex items-center gap-menubar-gap';
const KEY = 'mu-navigation-key inline-flex items-center gap-menubar-gap h-menubar-key-height px-menubar-key-pad-x rounded-menubar-key-radius border-0 bg-transparent type-ui text-ink no-underline cursor-default outline-none select-none pointer-hover:recipe-row-list-hover data-popup-open:recipe-row-list-hover focus-visible:focus-ring';
const CHEVRON = 'size-navigation-menu-chevron-size text-ink2';
const POSITIONER = 'mu-navigation-positioner z-menu-z navigation-menu-positioner';
// The menu plate's look (frost, radius) without its fade: this plate moves and resizes its own way.
const POPUP = 'mu-navigation-popup relative overflow-hidden rounded-menu-radius outline-none recipe-menu backdrop-menu-blur reduce-transparency:opaque-frost navigation-menu-popup';
const VIEWPORT = 'mu-navigation-viewport relative h-full w-full overflow-hidden';
const CONTENT = 'mu-navigation-content w-max p-navigation-menu-plate-pad navigation-menu-content data-ending-style:absolute data-ending-style:inset-0';
const PANEL_LINK = 'mu-navigation-link grid gap-navigation-menu-link-gap px-navigation-menu-link-pad-x py-navigation-menu-link-pad-y rounded-navigation-menu-link-radius no-underline outline-none transition-row pointer-hover:recipe-row-list-hover focus-visible:row-list-focus data-active:recipe-row-list-hover';

function offset() {
  if (typeof window === 'undefined') return 8;
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--mu-r-navigation-menu-plate-offset')) || 8;
}

export interface NavigationMenuProps extends Omit<BaseNav.Root.Props, 'className'> {
  'aria-label'?: string;
  className?: string;
}

function Root({ className, children, ...props }: NavigationMenuProps) {
  return (
    <BaseNav.Root className={className ? `${ROOT} ${className}` : ROOT} {...props}>
      <BaseNav.List className={LIST}>{children}</BaseNav.List>
      <BaseNav.Portal>
        <BaseNav.Positioner className={POSITIONER} sideOffset={offset()} collisionPadding={8}>
          <BaseNav.Popup className={POPUP}>
            <BaseNav.Viewport className={VIEWPORT} />
          </BaseNav.Popup>
        </BaseNav.Positioner>
      </BaseNav.Portal>
    </BaseNav.Root>
  );
}

export interface NavigationMenuItemProps {
  /** The key's word: "Components". */
  label: string;
  /** The panel: NavigationMenu.Link rows, in a grid if you like. */
  children: React.ReactNode;
}

/** A key that opens a panel of links. */
function Item({ label, children }: NavigationMenuItemProps) {
  return (
    <BaseNav.Item>
      <BaseNav.Trigger className={KEY} render={(props, state) => (
        <button {...props}>
          {label}
          <MorphIcon name="chevron" turn={state.open ? 180 : 0} className={CHEVRON} />
        </button>
      )} />
      <BaseNav.Content className={CONTENT}>{children}</BaseNav.Content>
    </BaseNav.Item>
  );
}

export interface NavigationMenuLinkProps extends Omit<BaseNav.Link.Props, 'className' | 'children'> {
  children: React.ReactNode;
  /** A line under the title, in a panel. */
  description?: React.ReactNode;
  /** A top-level key that goes somewhere (no panel). */
  top?: boolean;
  className?: string;
}

/** A link: a row in a panel (with an optional description), or a top-level key with `top`. */
function Link({ children, description, top, className, ...props }: NavigationMenuLinkProps) {
  if (top) {
    return (
      <BaseNav.Item>
        <BaseNav.Link className={className ? `${KEY} ${className}` : KEY} {...props}>{children}</BaseNav.Link>
      </BaseNav.Item>
    );
  }
  return (
    <BaseNav.Link className={className ? `${PANEL_LINK} ${className}` : PANEL_LINK} {...props}>
      <span className="type-ui text-ink">{children}</span>
      {description && <span className="type-body text-ink2">{description}</span>}
    </BaseNav.Link>
  );
}

export const NavigationMenu = Object.assign(Root, { Item, Link, Root });
