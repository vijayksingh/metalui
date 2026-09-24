'use client';

import * as React from 'react';

/* ─────────────────────────────────────────────────────────
 * BLOCK SILHOUETTE (far zoom; the native reference's layer-only LOD, per block kind)
 *
 * Below the far-zoom threshold (the core's lod_policy, 0.35) the canvas stops drawing blocks
 * and draws their silhouettes: one flat shape per block, no text, no shadows beyond a hairline,
 * cheap enough for thousands. Each kind stays recognisable:
 *
 *   text     bars where its lines are, no plate (a text block is words only at rest)
 *   code     its dark card with light bars inside
 *   link     its dark glass with the site's tint glowing from the top right
 *   swatch   its colour
 *   image    its average colour, lit a little from the top
 *   file     a light plate
 *   region   its tray with its name, set large enough to read at that zoom
 *
 *   enter    crossing the threshold (on the camera commit, never mid-gesture), silhouettes
 *            fade in on settle and the blocks they replace fade out; Reduce Motion: at once
 * The host sizes and places it in world coordinates, exactly where the block is.
 * ───────────────────────────────────────────────────────── */

export type SilhouetteKind = 'text' | 'code' | 'link' | 'swatch' | 'image' | 'file' | 'region';

export interface BlockSilhouetteProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  kind: SilhouetteKind;
  /** swatch: its hex. image: its average colour. link: the site's tint. */
  color?: string;
  /** region: its name. */
  label?: string;
  /** text and code: how many lines the block has, so the bars end where the words do. */
  lines?: number;
}

const ROOT = 'mu-silhouette relative box-border overflow-hidden animate-silhouette-in reduced-motion:animate-none';
const LOOK: Record<SilhouetteKind, string> = {
  text: 'rounded-silhouette-text-radius',
  code: 'rounded-silhouette-code-radius recipe-silhouette-code p-silhouette-code-pad',
  link: 'rounded-silhouette-link-radius recipe-silhouette-link',
  swatch: 'rounded-silhouette-swatch-radius recipe-silhouette-swatch',
  image: 'rounded-silhouette-image-radius recipe-silhouette-image',
  file: 'rounded-silhouette-file-radius recipe-silhouette-file',
  region: 'rounded-silhouette-region-radius recipe-silhouette-region p-silhouette-region-pad',
};
const TEXT_BARS = 'silhouette-text-bars w-full';
const CODE_BARS = 'silhouette-code-bars w-full';
const REGION_LABEL = 'block type-silhouette-region text-silhouette-region-ink whitespace-nowrap overflow-hidden text-ellipsis';

/** A block drawn from far away: one flat shape that still says what the block is. */
export const BlockSilhouette = React.forwardRef<HTMLDivElement, BlockSilhouetteProps>(function BlockSilhouette(
  { kind, color, label, lines, className, style, ...props },
  ref,
) {
  const self = color ? ({ '--mu-self': color } as React.CSSProperties) : undefined;
  // The bars stop after the block's last line: lines × the line pitch, else the whole block.
  const barsHeight = (pitch: string) => (lines ? { height: `calc(${lines} * var(${pitch}))` } : { height: '100%' });
  return (
    <div
      ref={ref}
      aria-hidden
      data-kind={kind}
      data-mu-self={color ? '' : undefined}
      className={[ROOT, LOOK[kind], className].filter(Boolean).join(' ')}
      style={{ ...self, ...style }}
      {...props}
    >
      {kind === 'text' && <div className={TEXT_BARS} style={barsHeight('--mu-r-silhouette-text-line')} />}
      {kind === 'code' && <div className={CODE_BARS} style={barsHeight('--mu-r-silhouette-code-line')} />}
      {kind === 'region' && label && <span className={REGION_LABEL}>{label}</span>}
    </div>
  );
});
