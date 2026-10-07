'use client';

import * as React from 'react';
import { Menubar as BaseMenubar } from '@base-ui/react/menubar';
import { Menu } from '../menu/menu';
import { SlidingIndicator } from '../../motion/indicator';

/* ─────────────────────────────────────────────────────────
 * MENUBAR, an app's commands under a few words across the top
 *
 *   rest      quiet text keys (File, Edit, View); a hovered key lifts on its own (the list row's
 *             lifted look)
 *   open      a key opens the menu's frosted plate below it
 *   across    while a menu is open, one highlight glides between the keys on the settle spring as
 *             the pointer or ← → move across; the next menu opens at once as the last one fades
 *             on release, as a native bar does
 *   close     Esc or a click outside closes it; focus returns to the key
 * Reduce Motion: the highlight moves at once.
 * The plates and rows are the menu's; the menubar recipe adds the keys.
 * Slots: Menubar.Root, Menubar.Menu.
 * ───────────────────────────────────────────────────────── */

const BAR = 'mu-menubar relative inline-flex items-center gap-menubar-gap p-menubar-pad';
const KEY = 'mu-menubar-key relative z-1 inline-flex items-center h-menubar-key-height px-menubar-key-pad-x rounded-menubar-key-radius border-0 bg-transparent type-ui text-ink cursor-default outline-none select-none pointer-hover:not-data-popup-open:recipe-row-list-hover focus-visible:focus-ring disabled:opacity-button-disabled data-disabled:opacity-button-disabled';
const GLIDE = 'rounded-menubar-key-radius recipe-row-list-hover';

export interface MenubarProps extends Omit<BaseMenubar.Props, 'className'> {
  'aria-label'?: string;
  className?: string;
}

function Root({ className, children, ...props }: MenubarProps) {
  return (
    <BaseMenubar className={className ? `${BAR} ${className}` : BAR} {...props}>
      <SlidingIndicator activeSelector="[data-popup-open]" watch={['data-popup-open']} spring="settle" className={GLIDE} />
      {children}
    </BaseMenubar>
  );
}

export interface MenubarMenuProps {
  /** The word on the bar: "File". */
  label: string;
  /** MenuItem and MenuSeparator. */
  children: React.ReactNode;
  heading?: string;
  disabled?: boolean;
}

/** One word on the bar and the menu it opens. */
function MenubarMenu({ label, children, heading, disabled }: MenubarMenuProps) {
  return (
    <Menu heading={heading} trigger={<button type="button" disabled={disabled} className={KEY}>{label}</button>}>
      {children}
    </Menu>
  );
}

export const Menubar = Object.assign(Root, { Menu: MenubarMenu, Root });
