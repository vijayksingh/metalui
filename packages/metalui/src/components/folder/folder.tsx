'use client';

import * as React from 'react';
import { Label } from '../label/label';

/* ─────────────────────────────────────────────────────────
 * FOLDER (the Soft Hardware sheet's stack folder)
 *
 * A thing on the canvas that holds blocks and takes little space. It is the closed state of a
 * container; unfolded, the same container is a region washed in the folder's colour.
 *
 *   shape     the back (translucent paper, no blur: the canvas shows softly through) and the flap
 *             taper slightly toward the bottom, like a pocket; their shadows are separate
 *             blurred layers, since the tapered outline is a clip. The flap is frosted
 *             glass: a clipped blur layer of its own (translateZ, back face hidden) under a
 *             see-through fill, so the blur keeps the pocket's shape while the flap hinges
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
const SHADE = 'folder-shade';
const BACK = 'mu-folder-back folder-back';
const FLAP_SHADE = 'folder-flap-shade';
const CARD = ['folder-card folder-card-1', 'folder-card folder-card-2', 'folder-card folder-card-3'];
const THUMB = 'folder-thumb';
const LINE = 'folder-line';
const FLAP = 'mu-folder-flap folder-flap';
const LAND = 'folder-land reduced-motion:animate-none';
const LABEL = 'folder-label';
const COUNT = 'mu-folder-count folder-count';

/* The outline, built once from the folder recipe's numbers (220 wide; back 150 tall + a 16 tab,
 * tapering 10 per side; flap 106 tall, tapering 12; radius 26). One path drives the clip of the
 * frosted body, its hairline edge and top light, and its shadow, so they always agree. */
const W = 220, R = 26;
const f2 = (n: number) => +n.toFixed(2);
function pocket(h: number, d: number, top = 0) {
  const k = R / h, y0 = top, y1 = top + h;
  return `M${R} ${y0}H${W - R}Q${W} ${y0} ${f2(W - d * k)} ${y0 + R}L${f2(W - d + d * k)} ${y1 - R}Q${W - d} ${y1} ${W - d - R} ${y1}`
    + `H${d + R}Q${d} ${y1} ${f2(d - d * k)} ${y1 - R}L${f2(d * k)} ${y0 + R}Q0 ${y0} ${R} ${y0}Z`;
}
function withTab(h: number, d: number, rise: number, tab: number) {
  const k = R / h, y0 = rise, y1 = rise + h, tr = 18;
  return `M0 ${tr}Q0 0 ${tr} 0H${tab - 14}C${tab - 4} 0 ${tab} ${y0} ${tab + 12} ${y0}`
    + `H${W - R}Q${W} ${y0} ${f2(W - d * k)} ${y0 + R}L${f2(W - d + d * k)} ${y1 - R}Q${W - d} ${y1} ${W - d - R} ${y1}`
    + `H${d + R}Q${d} ${y1} ${f2(d - d * k)} ${y1 - R}L0 ${y0 + R}Z`;
}
const BACK_D = withTab(150, 10, 16, 92);
const FLAP_D = pocket(106, 12);
const clip = (d: string): React.CSSProperties => ({ clipPath: `path('${d}')`, WebkitClipPath: `path('${d}')` });
const EDGE = 'folder-edge';

function Edge({ d, h, fill }: { d: string; h: number; fill?: boolean }) {
  return (
    <svg aria-hidden className={EDGE} viewBox={`0 0 ${W} ${h}`} preserveAspectRatio="none">
      {fill && <path d={d} className="folder-flap-fill" />}
      <path d={d} className="folder-edge-light" style={clip(d)} />
      <path d={d} className="folder-edge-line" />
    </svg>
  );
}

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
      <div aria-hidden className={SHADE}><div className="folder-shade-body" style={clip(BACK_D)} /></div>
      <div aria-hidden className={`${BACK} folder-layer`} style={clip(BACK_D)} />
      <div aria-hidden className="folder-frame"><Edge d={BACK_D} h={166} /></div>
      {cards.map((c, i) => (
        <div key={i} aria-hidden className={CARD[slot(i)]}>
          <div className={THUMB} style={{ background: bg(c.thumb) }} />
          <i className={`${LINE} folder-line-lg`} style={{ width: '70%' }} />
          <i className={c.link ? `${LINE} folder-line-blue` : LINE} />
          <i className={LINE} style={{ width: '60%' }} />
        </div>
      ))}
      <div aria-hidden className={FLAP_SHADE}><div className="folder-shade-body" style={clip(FLAP_D)} /></div>
      <div key={landed} aria-hidden className={landed ? `${FLAP} ${LAND}` : FLAP}>
        {/* The frost is its own clipped layer, so the blur keeps the pocket's shape while the flap hinges in 3D. */}
        <div className="folder-frost" style={clip(FLAP_D)} />
        <Edge d={FLAP_D} h={106} fill />
        <div className="folder-flap-content">
        <div className={LABEL}>
          <Label variant="title" as="b">{name}</Label>
          <Label variant="engraved">{`Folder · ${count} ${count === 1 ? 'block' : 'blocks'}`}</Label>
        </div>
        <span className={COUNT}>{count}</span>
        </div>
      </div>
    </div>
  );
});
