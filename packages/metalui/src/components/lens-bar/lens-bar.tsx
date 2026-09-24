'use client';

import * as React from 'react';
import { Toolbar } from '@base-ui/react/toolbar';
import { Segmented, type SegmentedOption } from '../segmented/segmented';
import './lens-bar.css';

/* ─────────────────────────────────────────────────────────
 * LENS BAR (Kamui 04 §4, the medium demo's #lensBar) on Base UI Toolbar
 *
 *   open     drops in one step from above, from .98, on the surface spring
 *            (Reduce Motion: surface resolves to a crossfade, it fades in place)
 *   asking   an amber LED and ASKING JEV while the answer is pending
 *   answered N MATCHES, and VIA JEV or LOCAL when words beyond the rules were judged
 *   views    a compact segmented control: in place · list · table · timeline · gallery
 *   pin      keeps the lens as a live region; close (or ⎋) ends it
 * The glyphs are passed in so the main entry stays free of the icon catalog.
 * ───────────────────────────────────────────────────────── */

export type LensMode = 'place' | 'list' | 'table' | 'timeline' | 'gallery';

const MODES: SegmentedOption<LensMode>[] = [
  { value: 'place', label: 'In Place' },
  { value: 'list', label: 'List' },
  { value: 'table', label: 'Table' },
  { value: 'timeline', label: 'Timeline' },
  { value: 'gallery', label: 'Gallery' },
];

export interface LensBarProps {
  /** The question, as written: "open tasks about the poster". Ellipsised at 340. */
  query: string;
  /** Blocks that match (omit for the me lens). */
  count?: number;
  /** Where the answer came from: asking (pending), jev, local; null when rules answered it all. */
  source?: 'asking' | 'jev' | 'local' | null;
  mode?: LensMode;
  onModeChange?: (mode: LensMode) => void;
  /** The views offered (the me lens has none). */
  modes?: LensMode[];
  /** Pin as a live region. Omit for a selection lens, which cannot be pinned. */
  onPin?: () => void;
  onClose: () => void;
  /** The glyphs at 14: { lens: <SearchIcon size={14}/>, pin: <PinIcon size={14}/>, close: <CloseIcon size={14}/> }. */
  glyphs: { lens: React.ReactNode; pin?: React.ReactNode; close: React.ReactNode };
  className?: string;
}

/** Names the question a lens asks and switches how the answer is shown. A lens never moves anything. */
export function LensBar({ query, count, source, mode = 'place', onModeChange, modes = MODES.map((m) => m.value), onPin, onClose, glyphs, className }: LensBarProps) {
  return (
    <Toolbar.Root aria-label={`Lens: ${query}`} className={['mu-lensbar', 'mu-frost-plate', className].filter(Boolean).join(' ')}>
      <span aria-hidden className="mu-lensbar-glyph">{glyphs.lens}</span>
      <span className="mu-lensbar-query type-title">{query}</span>
      {count !== undefined && (
        <span className="mu-type-label engraved" aria-live="polite">{count} {count === 1 ? 'MATCH' : 'MATCHES'}</span>
      )}
      {source === 'asking' && (
        <span className="mu-lensbar-note mu-type-label engraved"><span className="mu-lensbar-led" aria-hidden />ASKING JEV</span>
      )}
      {(source === 'jev' || source === 'local') && <span className="mu-type-label engraved">{source === 'jev' ? 'VIA JEV' : 'LOCAL'}</span>}
      {modes.length > 0 && (
        <Toolbar.Group>
          <Segmented aria-label="View" size="compact" value={mode} onValueChange={onModeChange} options={MODES.filter((m) => modes.includes(m.value))} />
        </Toolbar.Group>
      )}
      {onPin && glyphs.pin && (
        <Toolbar.Button className="mu-lensbar-icon" aria-label="Pin as a live region" title="Pin as a live region" onClick={onPin}>{glyphs.pin}</Toolbar.Button>
      )}
      <Toolbar.Button className="mu-lensbar-icon" aria-label="Close lens" title="Close · ⎋" onClick={onClose}>{glyphs.close}</Toolbar.Button>
    </Toolbar.Root>
  );
}
