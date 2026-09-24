'use client';

import * as React from 'react';
import { GlassFace } from '../../components/glass-face/glass-face';
import { Chip } from '../../components/chip/chip';
import './link-card.css';

/* ─────────────────────────────────────────────────────────
 * LINK CARD (the reference design's .linkobj): a custom block
 *   GlassFace › Screen tinted by the host (the link-card recipe) › Chip(glass, LED link) LINK
 *   + Chip(glass-action, a link) OPEN ↗ + the host and the path
 * Custom because the tinted screen and its type are drawn by no component. The card is not a click
 * target: only OPEN is, and it opens in a new tab.
 * ───────────────────────────────────────────────────────── */

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
  { href, host, path, hue, tag = 'LINK', openLabel = 'OPEN ↗', className, style, ...props },
  ref,
) {
  const p = parts(href);
  const h = host ?? p.host;
  return (
    <GlassFace.Root
      ref={ref}
      data-mu-self=""
      className={className ? `mu-linkcard ${className}` : 'mu-linkcard'}
      style={hue ? ({ '--mu-self': hue, ...style } as React.CSSProperties) : style}
      {...props}
    >
      <GlassFace.Screen className="mu-linkcard-screen">
        <Chip variant="glass" className="mu-linkcard-tag">
          <Chip.Lead led="link" />
          <Chip.Text>{tag}</Chip.Text>
        </Chip>
        <Chip as="a" variant="glass-action" className="mu-linkcard-open" href={href} target="_blank" rel="noopener noreferrer">
          {openLabel}
        </Chip>
        <div className="mu-linkcard-host">{h}</div>
        <div className="mu-linkcard-path">{(path ?? p.path) || '/'}</div>
      </GlassFace.Screen>
    </GlassFace.Root>
  );
});
