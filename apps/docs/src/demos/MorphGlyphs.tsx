import * as React from 'react';
import { Icon, ICON_CATALOG, ICON_NAMES, MorphGlyph, MorphIcon, morphAt, morphParts, planMorph, type IconName, type MorphFrame } from '@unlocalhosted/metalui/icons';

/** A frame drawn statically, with the same rendering MorphIcon uses. */
function Still({ frame, size = 32 }: { frame: MorphFrame; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
      <MorphGlyph frame={frame} />
    </svg>
  );
}

// Pairs a product actually switches between, then a few far ones to show any-to-any.
const PAIRS: [IconName, IconName][] = [
  ['synced', 'offline'],
  ['offline', 'sync-error'],
  ['paste', 'check'],
  ['duplicate', 'check'],
  ['zoom-in', 'zoom-out'],
  ['group', 'ungroup'],
  ['undo', 'redo'],
  ['more', 'close'],
  ['search', 'zoom-in'],
  ['link', 'check'],
  ['board', 'pin'],
  ['keeper', 'synced'],
];
const STEPS = [0, 0.2, 0.4, 0.6, 0.8, 1];

/** Filmstrips: each pair at six points along its morph, so the in-between glyphs can be judged. */
export function MorphFilmstrips() {
  return (
    <div className="grid w-full gap-x-32 gap-y-16 lg:grid-cols-2 [&>*]:min-w-0">
      {PAIRS.map(([a, b]) => {
        const plan = planMorph(morphParts(a), b);
        return (
          <div key={`${a}-${b}`} data-md="row" className="flex items-center gap-10 text-icon">
            <span className="type-readout w-[140px] shrink-0 text-ink2">{a} → {b}</span>
            {STEPS.map((s) => <Still key={s} frame={s === 1 ? morphParts(b) : morphAt(plan, s)} />)}
          </div>
        );
      })}
    </div>
  );
}

/** At rest a morph glyph is the authored icon: each pair here should be identical. */
export function MorphParity() {
  return (
    <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-12">
      {ICON_NAMES.map((n) => (
        <div key={n} data-md="skip" className="flex flex-col items-center gap-6 text-icon">
          <div className="flex gap-4">
            <Icon name={n} size={32} animate={false} strokeWidth={1.7} />
            <Still frame={morphParts(n)} />
          </div>
          <span className="type-meta text-ink3">{n}</span>
        </div>
      ))}
    </div>
  );
}

/** Pick any icon; the live glyph morphs from whatever is on screen. */
export function MorphPlayground({ size = 96 }: { size?: number }) {
  const [name, setName] = React.useState<IconName>('synced');
  return (
    <div className="flex w-full flex-col items-center gap-24">
      <button
        type="button"
        aria-label={`${ICON_CATALOG[name].label}: morph to the next icon`}
        onClick={() => setName((n) => ICON_NAMES[(ICON_NAMES.indexOf(n) + 1) % ICON_NAMES.length])}
        className="grid cursor-pointer place-items-center text-icon hover:text-ink"
      >
        <MorphIcon name={name} size={size} />
      </button>
      <div role="radiogroup" aria-label="Icon" className="flex max-w-[640px] flex-wrap justify-center gap-6">
        {ICON_NAMES.map((g) => (
          <button
            key={g}
            type="button"
            role="radio"
            aria-checked={g === name}
            aria-label={ICON_CATALOG[g].label}
            onClick={() => setName(g)}
            className={['grid size-36 cursor-pointer place-items-center rounded-row transition-colors duration-150', g === name ? 'material-pressed text-ink' : 'material-cap text-icon hover:text-ink'].join(' ')}
          >
            <Icon name={g} size={16} />
          </button>
        ))}
      </div>
    </div>
  );
}
