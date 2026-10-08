'use client';

import * as React from 'react';
import { useRender } from '@base-ui/react/use-render';

/* ─────────────────────────────────────────────────────────
 * CARD, a person's thing held on a raised plate
 *
 *   rest      the raised surface: optional media, a title, a line, a footer of actions
 *   link      a card that goes somewhere takes its link on the title, stretched over the whole card
 *             (one clear link for assistive tech); footer actions stay their own buttons above it
 *   hover     only a card with a link moves: it lifts one grid step on the settle spring and its
 *             ambient shadow grows (the hover lift, T5a), still again once the pointer leaves
 *   pressed   it comes back down (press time)
 *   focus     the green ring, from the title's link
 *   selected  one of a set: the green ring, 3 out
 * Reduce Motion: no lift; the shadow still grows.
 * An object: it stands for a person's thing. It uses the raised surface.
 * Slots: Card.Root, Card.Media, Card.Title, Card.Description, Card.Footer.
 * ───────────────────────────────────────────────────────── */

const ROOT = 'mu-card relative grid gap-card-gap p-card-pad rounded-surface-radius-card recipe-surface-raise card-lift has-[.mu-card-link:focus-visible]:focus-ring data-selected:card-selected';
const MEDIA = 'mu-card-media h-card-media card-media-bleed';
const TITLE = 'mu-card-title static m-0 type-title text-ink text-balance';
const LINK = 'mu-card-link static text-inherit no-underline outline-none card-stretch';
const HEADINGS = { 2: 'h2', 3: 'h3', 4: 'h4' } as const;
const DESCRIPTION = 'mu-card-description m-0 type-body text-ink2';
const FOOTER = 'mu-card-footer relative z-1 flex flex-wrap items-center gap-card-footer-gap mt-card-footer-gap';

export interface CardRootProps extends React.HTMLAttributes<HTMLElement> {
  /** One of a set, chosen: the green ring. */
  selected?: boolean;
  /** The element: an article by default. */
  render?: useRender.ComponentProps<'article'>['render'];
}

function Root({ selected, render, className, ...props }: CardRootProps) {
  return useRender({
    render,
    defaultTagName: 'article',
    props: { ...props, 'data-selected': selected ? '' : undefined, 'aria-current': selected ? 'true' : undefined, className: className ? `${ROOT} ${className}` : ROOT },
  });
}

function Media({ className, alt = '', ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  return <img alt={alt} className={className ? `${MEDIA} ${className}` : MEDIA} {...props} />;
}

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /** Where the card goes: makes the whole card its link. */
  href?: string;
  /** Your own link element (a router's link), used with the stretched link's look. */
  render?: React.ReactElement;
  /** The heading level (3). */
  level?: 2 | 3 | 4;
}

function Title({ href, render, level = 3, className, children, ...props }: CardTitleProps) {
  const Tag = HEADINGS[level];
  const link = render
    ? React.cloneElement(render as React.ReactElement<{ className?: string; children?: React.ReactNode }>, { className: LINK, children })
    : href != null ? <a href={href} className={LINK}>{children}</a> : children;
  return <Tag className={className ? `${TITLE} ${className}` : TITLE} {...props}>{link}</Tag>;
}

function Description({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={className ? `${DESCRIPTION} ${className}` : DESCRIPTION} {...props} />;
}

function Footer({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={className ? `${FOOTER} ${className}` : FOOTER} {...props} />;
}

export const Card = Object.assign(Root, { Media, Title, Description, Footer, Root });
