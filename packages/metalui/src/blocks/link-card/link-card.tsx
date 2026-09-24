'use client';

import * as React from 'react';
import { GlassFace } from '../../components/glass-face/glass-face';
import { Chip } from '../../components/chip/chip';

/* ─────────────────────────────────────────────────────────
 * LINK CARD (the reference design's .linkobj): a custom block
 *   GlassFace › Screen tinted by the host (the link-card recipe) › Chip(glass, LED link) LINK
 *   + Chip(glass-action, a link) OPEN ↗ + the host and the path
 * Custom because the tinted screen and its type are drawn by no component. The card is not a click
 * target: only OPEN is, and it opens in a new tab.
 *
 *   plain     the host big, the path under it (no preview yet, a secret block, the past, a failure)
 *   preview   the page's title becomes the big line (2 lines at most); the host and path move into
 *             a small line with the site's icon; the page's image sits behind the tinted glow,
 *             shaded to the bottom so the words stay readable; the card grows to the preview
 *             height and the preview fades in on settle, so nothing jumps
 * ───────────────────────────────────────────────────────── */

/* The card's own colour is the recipe's tint unless a host passes one; the tinted screen replaces the
 * glass face's, and its type is the recipe's. The tag and action sit at the chip inset. */
const CARD = 'mu-linkcard w-link-card-width link-card-tint';
const SCREEN = 'mu-linkcard-screen box-border flex flex-col justify-end h-link-card-screen-height py-link-card-screen-pad-y px-link-card-screen-pad-x !recipe-link-card-screen link-card-grow reduced-motion:transition-none';
const TAG = 'mu-linkcard-tag !absolute left-link-card-chip-inset top-link-card-chip-inset';
const OPEN = 'mu-linkcard-open !absolute right-link-card-chip-inset top-link-card-chip-inset z-2';
const HOST = 'mu-linkcard-host type-link-card-host text-link-card-host-ink';
const PATH = 'mu-linkcard-path overflow-hidden text-ellipsis whitespace-nowrap uppercase type-link-card-path text-link-card-path-ink';
const TALL = '!h-link-card-preview-height';
const IMAGE = 'mu-linkcard-image pointer-events-none absolute inset-0 size-full object-cover opacity-link-card-preview-image-opacity link-card-preview-in';
const SHADE = 'pointer-events-none absolute inset-0 link-card-image-shade';
const TITLE = 'mu-linkcard-title relative link-card-title-clamp type-link-card-title text-link-card-title-ink link-card-preview-in';
const META = 'mu-linkcard-meta relative flex min-w-0 items-center gap-link-card-meta-gap text-link-card-meta-ink link-card-preview-in';
const ICON = 'size-link-card-meta-icon flex-none rounded-round';
const META_TEXT = 'min-w-0 overflow-hidden text-ellipsis whitespace-nowrap uppercase type-link-card-path';

/** What the backend found at the link (GET /preview): all optional. */
export interface LinkPreview {
  title?: string | null;
  description?: string | null;
  image?: string | null;
  icon?: string | null;
}

/** The hue (0-359) the reference derives from a host, for a host to tint the screen with:
 * the reference tints with that hue at the recipe's tint-saturation and tint-lightness. */
export function linkHueDegrees(host: string) {
  let h = 0;
  for (const c of host) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

export interface LinkCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  href: string;
  /** Default: the URL's host without www. */
  host?: string;
  /** Default: the URL's path and query; "/" when empty. */
  path?: string;
  /** The screen's tint, any CSS colour. Default: the recipe's tint. */
  hue?: string;
  /** The tag's word. Default LINK. */
  tag?: string;
  /** The action's words. Default OPEN ↗. */
  openLabel?: string;
  /** The page's title, image and icon from the backend. Never pass one for a secret block or in the past. */
  preview?: LinkPreview | null;
}

const parts = (href: string) => {
  try {
    const u = new URL(href);
    return { host: u.hostname.replace(/^www\./, ''), path: decodeURIComponent(u.pathname + u.search).replace(/^\/$/, '') };
  } catch {
    return { host: href, path: '' };
  }
};

/** A link as a glass object with one explicit Open action. */
export const LinkCard = React.forwardRef<HTMLDivElement, LinkCardProps>(function LinkCard(
  { href, host, path, hue, tag = 'LINK', openLabel = 'OPEN ↗', preview, className, style, ...props },
  ref,
) {
  const p = parts(href);
  const h = host ?? p.host;
  const shownPath = (path ?? p.path) || '/';
  const title = preview?.title?.trim() || null;
  return (
    <GlassFace.Root
      ref={ref}
      data-mu-self=""
      className={className ? `${CARD} ${className}` : CARD}
      style={hue ? ({ '--mu-self': hue, ...style } as React.CSSProperties) : style}
      {...props}
    >
      <GlassFace.Screen className={title ? `${SCREEN} ${TALL}` : SCREEN}>
        {title && preview?.image && <img src={preview.image} alt="" className={IMAGE} />}
        {title && preview?.image && <span aria-hidden className={SHADE} />}
        <Chip variant="glass" className={TAG}>
          <Chip.Lead led="link" />
          <Chip.Text>{tag}</Chip.Text>
        </Chip>
        <Chip as="a" variant="glass-action" className={OPEN} href={href} target="_blank" rel="noopener noreferrer">
          {openLabel}
        </Chip>
        {title ? (
          <>
            <div className={TITLE}>{title}</div>
            <div className={META}>
              {preview?.icon && <img src={preview.icon} alt="" className={ICON} />}
              <span className={META_TEXT}>{h}{shownPath !== '/' ? ` · ${shownPath}` : ''}</span>
            </div>
          </>
        ) : (
          <>
            <div className={HOST}>{h}</div>
            <div className={PATH}>{shownPath}</div>
          </>
        )}
      </GlassFace.Screen>
    </GlassFace.Root>
  );
});
