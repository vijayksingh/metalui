import * as React from 'react';
import { MorphIcon, MORPH_GLYPH_NAMES, morphAt, morphFrame, morphPlan, type MorphFrame, type MorphGlyphName } from '@unlocalhosted/metalui/icons';

/** A frame drawn statically: the same rendering MorphIcon uses, at a fixed progress. */
function Still({ frame, size = 32 }: { frame: MorphFrame; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <g transform={`rotate(${frame.angle.toFixed(3)} 12 12)`}>
        {frame.strokes.map((s, i) => (
          <polyline key={i} points={s.points.map(([x, y]) => `${x},${y}`).join(' ')} opacity={s.opacity} />
        ))}
      </g>
    </svg>
  );
}

const PAIRS: [MorphGlyphName, MorphGlyphName][] = [
  ['copy', 'check'],
  ['plus', 'close'],
  ['menu', 'close'],
  ['play', 'pause'],
  ['arrow-right', 'arrow-down'],
  ['arrow-right', 'check'],
  ['chevron-down', 'chevron-up'],
  ['download', 'check'],
  ['minus', 'plus'],
];
const STEPS = [0, 0.25, 0.5, 0.75, 1];

/** Filmstrips: each pair at five points along its morph, so the in-between shapes can be judged. */
export function MorphFilmstrips() {
  return (
    <div className="grid w-full gap-x-32 gap-y-16 md:grid-cols-2">
      {PAIRS.map(([a, b]) => {
        const p = morphPlan(morphFrame(a), a, b);
        return (
          <div key={`${a}-${b}`} data-md="row" className="flex items-center gap-12 text-icon">
            <span className="type-readout w-[132px] shrink-0 text-ink2">{a} → {b}</span>
            {STEPS.map((s) => <Still key={s} frame={morphAt(p, s)} />)}
            <span className="type-label engraved">{p.kind}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Pick any glyph; the live glyph morphs from whatever is on screen. */
export function MorphPlayground({ size = 96 }: { size?: number }) {
  const [name, setName] = React.useState<MorphGlyphName>('copy');
  return (
    <div className="flex w-full flex-col items-center gap-24">
      <button
        type="button"
        aria-label={`${name}: morph to the next glyph`}
        onClick={() => setName((n) => MORPH_GLYPH_NAMES[(MORPH_GLYPH_NAMES.indexOf(n) + 1) % MORPH_GLYPH_NAMES.length])}
        className="grid cursor-pointer place-items-center text-icon hover:text-ink"
      >
        <MorphIcon name={name} size={size} />
      </button>
      <div role="radiogroup" aria-label="Glyph" className="flex max-w-[560px] flex-wrap justify-center gap-6">
        {MORPH_GLYPH_NAMES.map((g) => (
          <button
            key={g}
            type="button"
            role="radio"
            aria-checked={g === name}
            aria-label={g}
            onClick={() => setName(g)}
            className={['grid size-36 cursor-pointer place-items-center rounded-row transition-colors duration-150', g === name ? 'material-pressed text-ink' : 'material-cap text-icon hover:text-ink'].join(' ')}
          >
            <MorphIcon name={g} size={16} />
          </button>
        ))}
      </div>
    </div>
  );
}
