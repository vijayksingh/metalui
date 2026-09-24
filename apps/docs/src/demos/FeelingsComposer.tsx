import * as React from 'react';
import { useDialKit } from 'dialkit';
import { LifeIcon, LIFE_CATALOG, TINT_NAMES, type LifeIconName, type TintName } from '@unlocalhosted/metalui/icons/life';

/* The feelings language as a construction (docs/ICON-GRAMMAR.md §K): the vessel plus marks chosen
 * by four variables. The composer draws a feeling from its values with the set's own strokes, so a
 * new feeling (relieved, restless, afraid) is authored by choosing values, not drawn freehand. */

export type Position = 'lifted' | 'centred' | 'sunk';
export type Shape = 'none' | 'flat' | 'smooth' | 'sharp';
export type Level = 'none' | 'low' | 'full' | 'brimming';
export type Dots = 'none' | 'held' | 'spread' | 'fading' | 'alone';
export interface FeelingValues { position: Position; shape: Shape; level: Level; dots: Dots }

const Y: Record<Position, number> = { lifted: 11, centred: 12.6, sunk: 15 };
const LEVEL_Y: Record<Exclude<Level, 'none'>, number> = { low: 16.4, full: 11.8, brimming: 8.6 };

/** A wave of `n` half-periods of width `w` starting at x0, amplitude a, on line y (the calm stroke). */
const wave = (x0: number, y: number, w: number, a: number, n: number) => {
  let d = `M${x0} ${y}`;
  for (let i = 0; i < n; i++) {
    const s = i % 2 ? 1 : -1;
    d += `c${(w * 0.36).toFixed(2)} ${(s * a).toFixed(2)} ${(w * 0.64).toFixed(2)} ${(s * a).toFixed(2)} ${w} 0`;
  }
  return d;
};

export function composeFeeling(v: FeelingValues): string {
  const vessel = '<circle class="v d" style="--duo:.17" cx="12" cy="12" r="9.3"/>';
  const y = Y[v.position];
  const marks: string[] = [];
  if (v.level !== 'none') {
    const ly = LEVEL_Y[v.level];
    marks.push(`<clipPath id="&-in"><circle cx="12" cy="12" r="9.3"/></clipPath><g clip-path="url(#&-in)"><path class="d" style="--duo:.3" d="M2 ${ly}h20V22H2Z"/></g>`);
    marks.push(`<path d="${v.level === 'brimming' ? wave(5.6, ly + 0.3, 2.14, 1.46, 6) : wave(6.9, ly, 2.05, 0.4, 5)}"/>`);
  }
  if (v.shape === 'flat') marks.push(`<path d="M8.4 ${y}h7.2"/>`);
  if (v.shape === 'smooth') marks.push(`<path d="${wave(6.4, y, 2.8, 0.67, 4)}"/>`);
  if (v.shape === 'sharp') marks.push(`<path d="M6.6 ${y + 0.8}l2.2-4.6 1.8 5.8 2.4-6.8 1.8 5.4 2.6-3.4"/>`);
  if (v.dots === 'held') marks.push('<circle cx="12" cy="12" r="3.8"/><circle class="s" cx="12" cy="12" r="1.2"/>');
  if (v.dots === 'spread') marks.push('<circle class="s" cx="8.8" cy="9.6" r="1.15"/><circle class="s" cx="15.4" cy="10.8" r="1.15"/><circle class="s" cx="11" cy="15.2" r="1.15"/>');
  if (v.dots === 'fading') marks.push(`<circle class="s" cx="8.4" cy="${y}" r="1.1"/><circle class="s" cx="12" cy="${y}" r="1.1" style="opacity:.6"/><circle class="s" cx="15.6" cy="${y}" r="1.1" style="opacity:.3"/>`);
  if (v.dots === 'alone') marks.push('<circle class="s" cx="14.6" cy="14.6" r="1.3"/>');
  return vessel + marks.join('');
}

/** The existing feelings the four variables express, with their values (reference design 05 §3). */
export const FEELING_VALUES: Partial<Record<LifeIconName, FeelingValues>> = {
  calm: { position: 'lifted', shape: 'smooth', level: 'none', dots: 'none' },
  happy: { position: 'centred', shape: 'smooth', level: 'none', dots: 'none' },
  angry: { position: 'centred', shape: 'sharp', level: 'none', dots: 'none' },
  dull: { position: 'sunk', shape: 'flat', level: 'none', dots: 'none' },
  sad: { position: 'sunk', shape: 'smooth', level: 'none', dots: 'none' },
  bored: { position: 'centred', shape: 'none', level: 'none', dots: 'fading' },
  drained: { position: 'centred', shape: 'none', level: 'low', dots: 'none' },
  grateful: { position: 'centred', shape: 'none', level: 'full', dots: 'none' },
  overwhelmed: { position: 'centred', shape: 'none', level: 'brimming', dots: 'none' },
  focused: { position: 'centred', shape: 'none', level: 'none', dots: 'held' },
  distracted: { position: 'centred', shape: 'none', level: 'none', dots: 'spread' },
  lonely: { position: 'centred', shape: 'none', level: 'none', dots: 'alone' },
};

function Composed({ body, size, tint, title }: { body: string; size: number; tint: TintName | null; title: string }) {
  const uid = `fc${React.useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      role="img"
      aria-label={title}
      className={`mu-life${tint ? ` mu-tint-${tint}` : ''}`}
      dangerouslySetInnerHTML={{ __html: body.replace(/&-/g, `${uid}-`) }}
    />
  );
}

export function FeelingsComposer() {
  const d = useDialKit('Feelings composer', {
    position: { type: 'select', options: ['lifted', 'centred', 'sunk'], default: 'lifted' },
    shape: { type: 'select', options: ['none', 'flat', 'smooth', 'sharp'], default: 'smooth' },
    level: { type: 'select', options: ['none', 'low', 'full', 'brimming'], default: 'none' },
    dots: { type: 'select', options: ['none', 'held', 'spread', 'fading', 'alone'], default: 'none' },
    tint: { type: 'select', options: ['none', ...TINT_NAMES], default: 'tide' },
  });
  const values = d as unknown as FeelingValues & { tint: string };
  const tint = values.tint === 'none' ? null : (values.tint as TintName);
  const body = composeFeeling(values);
  const match = (Object.entries(FEELING_VALUES) as [LifeIconName, FeelingValues][]).find(
    ([, v]) => v.position === values.position && v.shape === values.shape && v.level === values.level && v.dots === values.dots,
  )?.[0];

  return (
    <div className="flex w-full flex-col gap-24">
      <div className="flex flex-wrap items-center justify-center gap-32 text-icon">
        <figure className="flex flex-col items-center gap-8">
          <Composed body={body} size={120} tint={tint} title="Composed feeling" />
          <figcaption className="type-label engraved">
            {values.position} · {values.shape} · {values.level} · {values.dots}
          </figcaption>
        </figure>
        <p className="type-doc-prose max-w-[36ch] text-ink2">
          {match
            ? <>These values are <b className="font-semibold text-ink">{LIFE_CATALOG[match].label.toLowerCase()}</b>. Set the dials to any feeling below; a combination with no name yet is a feeling to author.</>
            : 'No feeling in the set has these values yet: this is a new feeling, authored by choosing its values.'}
        </p>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(128px,1fr))] gap-12" data-testid="feelings-values">
        {(Object.entries(FEELING_VALUES) as [LifeIconName, FeelingValues][]).map(([name, v]) => {
          const t = LIFE_CATALOG[name].tint;
          return (
            <figure key={name} data-feeling={name} className="flex flex-col items-center gap-6 rounded-plate p-8 text-icon">
              <div className="flex items-center gap-8">
                <Composed body={composeFeeling(v)} size={32} tint={t} title={`${name}, composed`} />
                <LifeIcon name={name} size={32} title={`${name}, authored`} />
              </div>
              <figcaption className="flex flex-col items-center gap-2 text-center">
                <span className="type-meta text-ink">{name}</span>
                <span className="type-label engraved">{[v.position, v.shape, v.level, v.dots].filter((x) => x !== 'none').join(' · ')}</span>
              </figcaption>
            </figure>
          );
        })}
      </div>
    </div>
  );
}
