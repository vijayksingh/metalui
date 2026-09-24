import * as React from 'react';
import { LIFE_CATALOG, type LifeIconName } from './catalog.generated';
import type { TintName } from './tints.generated';
import './icons-life.generated.css';

/* ─────────────────────────────────────────────────────────
 * LIFE GLYPH PLAYBACK
 *
 * Hover   the host (nearest .mu-icon-trigger: a block, a row) or the glyph is hovered:
 *         each part plays its authored micro-interaction once or twice (0.4–1.2 s),
 *         poses ride the life spring (ζ .62, 500 ms); leaving reverses a pose.
 * Press   none: a glyph on a line is not a control.
 * Size    ≤ 16 px draws the tuned cut (stroke 1.85, simplified geometry where the
 *         master clogs), and it still plays its hover.
 * Reduced motion: static.
 * ───────────────────────────────────────────────────────── */

const SMALL = 16;

export interface LifeIconProps extends Omit<React.SVGProps<SVGSVGElement>, 'children' | 'name'> {
  /** Rendered size in px. 16 is the trailing glyph on a block, 14 the day strip, 24 a row slot. */
  size?: number;
  /** Accessible name. Without it the glyph is decorative (aria-hidden). */
  title?: string;
  /**
   * The feelings tint. Default: the glyph's own family from the manifest (feelings, the two energy
   * states and a few moments; null for everything else). `false` keeps it in the surrounding ink.
   */
  tint?: TintName | false;
  /** Set false to keep the glyph still (no hover). */
  animate?: boolean;
}

function markup(name: LifeIconName, uid: string, small: boolean) {
  const g = LIFE_CATALOG[name];
  const body16 = 'body16' in g ? g.body16 : undefined;
  const body = small && body16 ? body16 : g.body;
  return ((g.defs ? `<defs>${g.defs}</defs>` : '') + body).replace(/&-/g, `${uid}-`);
}

export const LifeIcon = React.forwardRef<SVGSVGElement, LifeIconProps & { name: LifeIconName }>(function LifeIcon(
  { name, size = 24, title, tint, animate = true, className, style, ...props },
  ref,
) {
  const uid = `mul${React.useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const record = LIFE_CATALOG[name];
  const small = size <= SMALL;
  const family = tint === false ? null : (tint ?? record.tint);
  const html = markup(name, uid, small) + (title ? `<title>${title.replace(/[<&]/g, '')}</title>` : '');
  const classes = ['mu-life', `mu-il-${name}`, family && `mu-tint-${family}`, className].filter(Boolean).join(' ');
  return (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={classes}
      style={small ? ({ '--sw': record.sw16, ...style } as React.CSSProperties) : style}
      data-static={animate ? undefined : ''}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
      {...props}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});

export function createLifeIcon(name: LifeIconName, displayName: string) {
  const Named = React.forwardRef<SVGSVGElement, LifeIconProps>(function NamedLifeIcon(props, ref) {
    return <LifeIcon ref={ref} name={name} {...props} />;
  });
  Named.displayName = displayName;
  return Named;
}

/** Finds life glyphs by name, label or synonym ("brekkie" finds breakfast), best match first. */
export function searchLifeIcons(query: string): LifeIconName[] {
  const q = query.trim().toLowerCase();
  if (!q) return Object.keys(LIFE_CATALOG) as LifeIconName[];
  const scored: [LifeIconName, number][] = [];
  for (const [name, g] of Object.entries(LIFE_CATALOG) as [LifeIconName, (typeof LIFE_CATALOG)[LifeIconName]][]) {
    const words = [name, g.label.toLowerCase(), ...g.synonyms.map((s) => s.toLowerCase())];
    const score = words.some((w) => w === q) ? 3 : words.some((w) => w.startsWith(q)) ? 2 : words.some((w) => w.includes(q)) ? 1 : 0;
    if (score) scored.push([name, score]);
  }
  return scored.sort((a, b) => b[1] - a[1]).map(([n]) => n);
}
