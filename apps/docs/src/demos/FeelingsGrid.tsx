import * as React from 'react';
import { useDialKit } from 'dialkit';
import { LifeIcon, LIFE_CATALOG, LIFE_ICON_NAMES, TINT_NAMES, type LifeIconName, type TintName } from '@unlocalhosted/metalui/icons/life';
import { tokens } from '../lib/tokens';

/* The circumplex: pleasantness across, activation up, every feeling at its values in its tint.
 * Colour names the kind of feeling (DS-42); position on the grid is valence and energy. */

const VALENCE = ['unpleasant', 'neutral', 'pleasant'] as const;
const ENERGY = ['hi', 'mid', 'lo'] as const;
const ENERGY_WORD = { hi: 'activated', mid: 'between', lo: 'settled' } as const;
const TINT = tokens.foundations.tint as unknown as Record<TintName, { bone: string; graphite: string; kind: string }>;
const SHIFT = tokens.foundations.tint['field-shift'];

const FEELINGS = LIFE_ICON_NAMES.filter((n) => LIFE_CATALOG[n].valence && LIFE_CATALOG[n].energy);

function Cell({ names, field }: { names: LifeIconName[]; field: number }) {
  return (
    <div className="flex min-h-[112px] flex-wrap content-center items-center justify-center gap-x-12 gap-y-10 p-10">
      {names.map((n) => {
        const t = LIFE_CATALOG[n].tint;
        return (
          <figure key={n} data-feeling={n} className="flex w-[64px] flex-col items-center gap-4">
            <span
              className="grid size-40 place-items-center rounded-row"
              style={t ? { background: `color-mix(in oklab, var(--mu-tint-${t}) ${field * 100}%, transparent)` } : undefined}
            >
              <LifeIcon name={n} size={24} title={n} />
            </span>
            <figcaption className="type-meta text-ink2">{n}</figcaption>
          </figure>
        );
      })}
    </div>
  );
}

function Grid({ colorway, field, untinted }: { colorway: 'bone' | 'graphite'; field: number; untinted: boolean }) {
  return (
    <div data-mu-colorway={colorway} data-mu-untinted={untinted ? '' : undefined} data-testid={`feelings-grid-${colorway}`} className="material-raised flex flex-col gap-12 rounded-card p-20 text-icon">
      <div className="flex items-baseline justify-between">
        <span className="type-label engraved">{colorway}</span>
        <span className="type-label engraved">activated ↑ · pleasant →</span>
      </div>
      <div className="grid grid-cols-[20px_repeat(3,1fr)] overflow-hidden">
        {ENERGY.map((e, row) => (
          <React.Fragment key={e}>
            <span className="type-label engraved flex items-center justify-center [writing-mode:vertical-rl] rotate-180">{ENERGY_WORD[e]}</span>
            {VALENCE.map((v, col) => (
              <div key={`${e}-${v}`} className={['border-[var(--mu-rule)]', col < 2 ? 'border-r' : '', row < 2 ? 'border-b' : ''].join(' ')}>
                <Cell names={FEELINGS.filter((n) => LIFE_CATALOG[n].valence === v && LIFE_CATALOG[n].energy === e)} field={field} />
              </div>
            ))}
          </React.Fragment>
        ))}
        <span />
        {VALENCE.map((v) => <span key={v} className="type-label engraved pt-8 text-center">{v}</span>)}
      </div>
    </div>
  );
}

export function FeelingsGrid() {
  const d = useDialKit('Feelings grid', {
    tints: true,
    fieldShift: [SHIFT.luminance, 0, 0.12, 0.005],
    // Every family's stroke in both colorways, tuned live on this grid only.
    families: Object.fromEntries(TINT_NAMES.map((t) => [t, { bone: TINT[t].bone, graphite: TINT[t].graphite }])) as Record<TintName, { bone: string; graphite: string }>,
  });
  const fams = d.families as Record<TintName, { bone: string; graphite: string }>;
  const css = (['bone', 'graphite'] as const)
    .map((cw) => `[data-testid="feelings-grid-${cw}"]{${TINT_NAMES.map((t) => `--mu-tint-${t}:${fams[t][cw]}`).join(';')}}`)
    .join('');
  return (
    <div className="flex w-full flex-col gap-16">
      <style>{css}</style>
      <div className="grid w-full gap-16 xl:grid-cols-2">
        <Grid colorway="bone" field={d.fieldShift} untinted={!d.tints} />
        <Grid colorway="graphite" field={d.fieldShift} untinted={!d.tints} />
      </div>
      <p className="type-meta text-ink2">
        Colour names the kind of feeling ({TINT_NAMES.map((t) => `${t} ${TINT[t].kind}`).join(', ')}); the cell is its valence and energy. Increase Contrast, or tints off, returns every glyph to ink and the shape still carries the feeling.
      </p>
    </div>
  );
}
