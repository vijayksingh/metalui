'use client';

import * as React from 'react';
import { Label } from '../label/label';

/* ─────────────────────────────────────────────────────────
 * FOLDER (the Soft Hardware sheet's stack folder)
 *
 * A thing on the canvas that holds blocks and takes little space. It is the closed state of a
 * container; unfolded, the same container is a region washed in the folder's colour.
 *
 *   rest      the back panel with its tab; up to three of its blocks peek up as cards (-10,
 *             leaning 10°, 2°, -5°); the frosted flap tipped back 15° with the name, what it
 *             is and the count
 *   hover     (and keyboard focus) the cards rise and fan (-30/-37/-44, staggered 50 ms) on the
 *             object spring; the flap tips back to 45° on the hinge spring
 *   open      a block is dragged over it: the cards rise out (-86/-96/-106) and the flap opens
 *             to 55°, saying "drop in here"; also the first beat of unfolding
 *   landing   a block was dropped in: the flap swings shut past rest and settles (hinge spring);
 *             the count changes at once
 *   empty     no cards; the count reads 0
 *   colour    six soft paper stocks (neutral, red, amber, green, blue, violet); the frosted flap
 *             takes the colour through its blur. Neutral is the sheet exactly.
 *   press     double-click or Enter unfolds it (the host morphs it into its region)
 * Reduce Motion: poses change at once, no bounce.
 * ───────────────────────────────────────────────────────── */

export type FolderHue = 'neutral' | 'red' | 'amber' | 'green' | 'blue' | 'violet';

export interface FolderPeek {
  /** The card's picture: an image URL, or any CSS background (a gradient for a colour or a link's tint). */
  thumb?: string;
  /** A link card shows a blue line under its title. */
  link?: boolean;
}

export interface FolderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  name: string;
  /** How many blocks it holds. */
  count: number;
  /** Up to three of its blocks, front last. */
  peeks?: FolderPeek[];
  hue?: FolderHue;
  /** Opened wide: a block is dragged over it, or it is starting to unfold. */
  open?: boolean;
  /** Change this (a counter or a timestamp) each time a block lands in it: the flap swings shut. */
  landed?: number;
  /** Double-click or Enter: unfold it into its region. */
  onUnfold?: () => void;
}

const ROOT = 'mu-folder folder';
const BACK = 'mu-folder-back folder-back';
const CARD = ['folder-card folder-card-1', 'folder-card folder-card-2', 'folder-card folder-card-3'];
const THUMB = 'folder-thumb';
const LINE = 'folder-line';
const FLAP = 'mu-folder-flap folder-flap';
const LAND = 'folder-land reduced-motion:animate-none';
const LABEL = 'folder-label';
const COUNT = 'mu-folder-count folder-count';

const bg = (thumb?: string) => (!thumb ? undefined : /^(url\(|[a-z-]+-gradient\(|#|rgb|hsl)/.test(thumb) ? thumb : `url("${thumb}")`);

/** A folder on the canvas. */
export const Folder = React.forwardRef<HTMLDivElement, FolderProps>(function Folder(
  { name, count, peeks = [], hue = 'neutral', open, landed, onUnfold, className, onKeyDown, onDoubleClick, ...props },
  ref,
) {
  const cards = peeks.slice(-3);
  // The front card is always card 3, the one nearest the flap; fewer cards drop from the back.
  const slot = (i: number) => 3 - cards.length + i;
  return (
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      aria-label={`${name}, folder of ${count} ${count === 1 ? 'block' : 'blocks'}. Press Enter to open.`}
      data-hue={hue}
      data-open={open ? '' : undefined}
      className={className ? `${ROOT} ${className}` : ROOT}
      onDoubleClick={(e) => { onDoubleClick?.(e); onUnfold?.(); }}
      onKeyDown={(e) => { onKeyDown?.(e); if (e.key === 'Enter') { e.preventDefault(); onUnfold?.(); } }}
      {...props}
    >
      <div aria-hidden className={BACK} />
      {cards.map((c, i) => (
        <div key={i} aria-hidden className={CARD[slot(i)]}>
          <div className={THUMB} style={{ background: bg(c.thumb) }} />
          <i className={`${LINE} folder-line-lg`} style={{ width: '70%' }} />
          <i className={c.link ? `${LINE} folder-line-blue` : LINE} />
          <i className={LINE} style={{ width: '60%' }} />
        </div>
      ))}
      <div key={landed} aria-hidden className={landed ? `${FLAP} ${LAND}` : FLAP}>
        <div className={LABEL}>
          <Label variant="title" as="b">{name}</Label>
          <Label variant="engraved">{`Folder · ${count} ${count === 1 ? 'block' : 'blocks'}`}</Label>
        </div>
        <span className={COUNT}>{count}</span>
      </div>
    </div>
  );
});
