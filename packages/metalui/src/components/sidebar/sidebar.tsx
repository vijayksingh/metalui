'use client';

import * as React from 'react';
import { useRender } from '@base-ui/react/use-render';
import { SlidingIndicator } from '../../motion/indicator';
import { MorphIcon } from '../../icons/MorphIcon';
import { SwapText } from '../../motion/swap';
import { Tooltip } from '../tooltip/tooltip';

/* ─────────────────────────────────────────────────────────
 * SIDEBAR, an app's side place for moving between places
 *
 *   rest      a header, sections under engraved titles, items (a glyph and a word), a footer
 *   current   one lifted highlight under the current item (aria-current="page")
 *   choose    the highlight glides to the newly chosen item on the settle spring (free travel)
 *   collapse  to a rail: the words fade out on the release spring first, then the width settles to
 *             the rail; expanding, the width grows first and the words fade back in
 *   rail      each item keeps its name for assistive tech and shows it in a tooltip
 * Reduce Motion: width and words change at once; the highlight moves at once.
 * A place: it holds the ways to other places. It uses the row's lift, the label and the tooltip.
 * Slots: Sidebar.Root, Sidebar.Header, Sidebar.Section, Sidebar.Item, Sidebar.Footer, Sidebar.Toggle.
 * ───────────────────────────────────────────────────────── */

const ROOT = 'mu-sidebar relative flex h-full flex-none flex-col gap-sidebar-gap p-sidebar-pad overflow-hidden sidebar-width';
const LIST = 'mu-sidebar-list relative flex flex-1 flex-col gap-sidebar-gap min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain';
const SECTION = 'mu-sidebar-section flex flex-col gap-sidebar-section-gap';
const TITLE = 'mu-sidebar-title px-sidebar-section-title-pad type-label engraved sidebar-words';
const ITEM = 'mu-sidebar-item mu-icon-trigger relative z-1 flex items-center overflow-hidden gap-sidebar-item-gap h-sidebar-item-height px-sidebar-item-pad-x rounded-sidebar-item-radius type-ui text-ink2 no-underline outline-none transition-colors duration-settle pointer-hover:text-ink aria-[current=page]:text-ink focus-visible:focus-ring [&>svg]:size-sidebar-item-glyph [&>svg]:flex-none';
const WORDS = 'mu-sidebar-words min-w-0 sidebar-words';
const GLIDE = 'rounded-sidebar-item-radius recipe-row-list-hover';
const EDGE = 'mu-sidebar-edge flex flex-col gap-sidebar-section-gap';

const Ctx = React.createContext({ collapsed: false });

export interface SidebarProps {
  /** A rail of glyphs instead of glyphs and words. */
  collapsed?: boolean;
  /** Names the navigation: "Spaces". */
  'aria-label': string;
  children: React.ReactNode;
  className?: string;
}

function Root({ collapsed = false, className, children, ...aria }: SidebarProps) {
  // Header and footer stay put; the sections scroll between them.
  const kids = React.Children.toArray(children);
  const head = kids.filter((k) => React.isValidElement(k) && k.type === Header);
  const foot = kids.filter((k) => React.isValidElement(k) && k.type === Footer);
  const body = kids.filter((k) => !head.includes(k) && !foot.includes(k));
  return (
    <Ctx.Provider value={{ collapsed }}>
      <nav aria-label={aria['aria-label']} data-collapsed={collapsed ? '' : undefined} className={className ? `${ROOT} ${className}` : ROOT}>
        {head}
        <div className={LIST}>
          <SlidingIndicator spring="settle" className={GLIDE} />
          {body}
        </div>
        {foot}
      </nav>
    </Ctx.Provider>
  );
}

function Header({ children }: { children: React.ReactNode }) {
  return <div className={EDGE}>{children}</div>;
}

function Footer({ children }: { children: React.ReactNode }) {
  return <div className={EDGE}>{children}</div>;
}

function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  const id = React.useId();
  return (
    <div role="group" aria-labelledby={title ? id : undefined} className={SECTION}>
      {title && <span id={id} className={TITLE}>{title}</span>}
      {children}
    </div>
  );
}

export interface SidebarItemProps extends useRender.ComponentProps<'a'> {
  /** The glyph (16), from the icon set. */
  icon: React.ReactNode;
  /** The word; also the item's name in the rail. */
  children: string;
  /** The current place. */
  active?: boolean;
}

function Item({ icon, children, active, render, className, ...props }: SidebarItemProps) {
  const { collapsed } = React.useContext(Ctx);
  const el = useRender({
    render,
    defaultTagName: 'a',
    props: {
      ...props,
      'aria-current': active ? 'page' : undefined,
      'aria-label': collapsed ? children : undefined,
      className: className ? `${ITEM} ${className}` : ITEM,
      children: (
        <>
          <span aria-hidden inert className="inline-grid flex-none">{icon}</span>
          <span className={WORDS}>{children}</span>
        </>
      ),
    },
  });
  // Always the same tree (a tooltip disabled while expanded), so collapsing fades the words in place.
  return <Tooltip label={children} side="right" disabled={!collapsed}>{el}</Tooltip>;
}

export interface SidebarToggleProps {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  /** Optional custom artwork; omitted uses the shared Sidebar ↔ Sidebar Rail pair. */
  icon?: React.ReactNode;
}

/** Collapses the sidebar to a rail and back. */
function Toggle({ collapsed, onCollapsedChange, icon }: SidebarToggleProps) {
  const label = collapsed ? 'Expand the sidebar' : 'Collapse to a rail';
  const button = (
    <button type="button" aria-label={label} aria-expanded={!collapsed} className={`${ITEM} border-0 bg-transparent cursor-pointer`} onClick={() => onCollapsedChange(!collapsed)}>
      <span aria-hidden inert className="inline-grid flex-none">{icon ?? <MorphIcon name={collapsed ? 'sidebar-collapsed' : 'sidebar'} size={16} />}</span>
      <span className={WORDS}><SwapText value={collapsed ? 'Expand' : 'Collapse'} /></span>
    </button>
  );
  return <Tooltip label={label} side="right" disabled={!collapsed}>{button}</Tooltip>;
}

export const Sidebar = Object.assign(Root, { Header, Section, Item, Footer, Toggle, Root });
