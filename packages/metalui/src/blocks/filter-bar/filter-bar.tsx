'use client';

import * as React from 'react';
import { Toolbar } from '@base-ui/react/toolbar';
import { Surface } from '../../components/surface/surface';
import { Glyph } from '../../components/glyph/glyph';
import { Label } from '../../components/label/label';
import { Led } from '../../components/status/status';
import { Switcher, type SwitcherOption } from '../../components/switcher/switcher';
import { IconButton } from '../../components/icon-button/icon-button';

/* ─────────────────────────────────────────────────────────
 * FILTER BAR (the reference design's #lensBar): a composition on Base UI Toolbar
 *   Surface(frost, pill) › Glyph + Label(query) + Label(engraved) count + Label(engraved) note
 *   + Switcher(compact) views + IconButton(ghost) pin, close
 *
 *   open      drops 8 from above, from .98, on the surface spring (a fade under Reduce Motion)
 *   pending   the note carries an amber LED
 *   view      the switcher thumb glides on the part spring
 * A filter never moves anything: it names the question and switches how the answer is shown.
 * ───────────────────────────────────────────────────────── */

/* Layout from the lensbar group; it drops one step from above, from .98, on the surface spring. */
const BAR = 'mu-filterbar inline-flex items-center gap-lensbar-gap h-lensbar-height pl-lensbar-pad-start pr-lensbar-pad-end animate-filterbar-in';
const QUERY = 'mu-filterbar-query max-w-lensbar-query-max overflow-hidden text-ellipsis';
const NOTE = 'mu-filterbar-note [&>.mu-led]:mr-lensbar-note-led-gap';

export type FilterView = 'place' | 'list' | 'table' | 'timeline' | 'gallery';

const VIEWS: SwitcherOption<FilterView>[] = [
  { value: 'place', label: 'In Place' },
  { value: 'list', label: 'List' },
  { value: 'table', label: 'Table' },
  { value: 'timeline', label: 'Timeline' },
  { value: 'gallery', label: 'Gallery' },
];

export interface FilterBarProps {
  /** The question, as written: "open tasks about the poster". Ellipsised at 340. */
  query: string;
  /** Items that match (omit when there is no count). */
  count?: number;
  /** Where the answer came from, engraved after the count: "VIA MODEL", "LOCAL"; pending shows an amber LED. */
  note?: { text: string; pending?: boolean } | null;
  view?: FilterView;
  onViewChange?: (view: FilterView) => void;
  /** The views offered (none: no switcher). */
  views?: FilterView[];
  /** Keep the filter (pin it as a live region). Omit when it cannot be kept. */
  onPin?: () => void;
  onClose: () => void;
  /** The glyphs at 14: { filter: <SearchIcon size={14}/>, pin: <PinIcon size={14}/>, close: <CloseIcon size={14}/> }. */
  glyphs: { filter: React.ReactNode; pin?: React.ReactNode; close: React.ReactNode };
  className?: string;
}

/** Names the question a filter asks and switches how the answer is shown. */
export function FilterBar({ query, count, note, view = 'place', onViewChange, views = VIEWS.map((m) => m.value), onPin, onClose, glyphs, className }: FilterBarProps) {
  return (
    <Toolbar.Root
      aria-label={`Filter: ${query}`}
      render={<Surface material="frost" radius="pill" className={className ? `${BAR} ${className}` : BAR} />}
    >
      <Glyph>{glyphs.filter}</Glyph>
      <Label variant="query" className={QUERY}>{query}</Label>
      {count !== undefined && (
        <Label variant="engraved" aria-live="polite">{count} {count === 1 ? 'MATCH' : 'MATCHES'}</Label>
      )}
      {note && (
        <Label variant="engraved" className={NOTE}>
          {note.pending && <Led kind="waiting" />}
          {note.text}
        </Label>
      )}
      {views.length > 0 && (
        <Toolbar.Group>
          <Switcher aria-label="View" size="compact" value={view} onValueChange={onViewChange} options={VIEWS.filter((m) => views.includes(m.value))} />
        </Toolbar.Group>
      )}
      {onPin && glyphs.pin && (
        <Toolbar.Button render={<IconButton variant="ghost" label="Pin as a live region" icon={glyphs.pin} title="Pin as a live region" />} onClick={onPin} />
      )}
      <Toolbar.Button render={<IconButton variant="ghost" label="Close" icon={glyphs.close} title="Close · ⎋" />} onClick={onClose} />
    </Toolbar.Root>
  );
}

/* The earlier names. A lens bar is a filter bar whose source ('asking', 'local', or any source's
 * name) becomes the note. */
export type LensMode = FilterView;
export interface LensBarProps extends Omit<FilterBarProps, 'note' | 'view' | 'onViewChange' | 'views' | 'glyphs'> {
  source?: string | null;
  mode?: FilterView;
  onModeChange?: (mode: FilterView) => void;
  modes?: FilterView[];
  glyphs: { lens: React.ReactNode; pin?: React.ReactNode; close: React.ReactNode };
}

export function LensBar({ source, mode, onModeChange, modes, glyphs, ...props }: LensBarProps) {
  const note = !source ? null : source === 'asking' ? { text: 'ASKING…', pending: true } : source === 'local' ? { text: 'LOCAL' } : { text: `VIA ${source.toUpperCase()}` };
  return <FilterBar {...props} note={note} view={mode} onViewChange={onModeChange} views={modes} glyphs={{ filter: glyphs.lens, pin: glyphs.pin, close: glyphs.close }} />;
}
