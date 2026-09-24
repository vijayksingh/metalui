import * as React from 'react';
import { useDialKit } from 'dialkit';
import { tokens, worstContrast } from '../../lib/tokens';
import { Bench, PageHeader, Rules, Section, TokenTable, copyJSON } from '../../ui/doc';

type CW = 'bone' | 'graphite';
const C = tokens.colorways;
const SHARED = tokens.shared;
const alphaOf = (rgba: string) => Number(rgba.match(/,\s*([\d.]+)\)$/)?.[1] ?? 1);
const ENGRAVE_BASE: Record<CW, string> = { bone: '40,38,32', graphite: '255,255,255' };

/** Every surface an ink can sit on in a colorway; the floor is checked against the worst. */
const surfaces = (cw: CW) => {
  const c = C[cw];
  return [c['s-hi'], c.s, c['s-lo'], c['well-top'], c['well-bot'], cw === 'bone' ? SHARED.page : SHARED['page-dark']];
};

const SURFACE_KEYS = ['s-hi', 's', 's-lo', 'well-top', 'well-bot'] as const;

function Led({ ok }: { ok: boolean }) {
  return (
    <span
      className="inline-block size-6 shrink-0 rounded-full shadow-[0_0_0_.5px_rgba(0,0,0,.25)]"
      style={{ background: ok ? 'var(--mu-led-green)' : 'var(--mu-led-red)' }}
    >
      <span className="sr-only">{ok ? 'passes' : 'fails'}</span>
    </span>
  );
}

const TINTS = Object.entries(tokens.foundations.tint).filter(([k]) => !k.startsWith('$') && k !== 'field-shift') as [
  string,
  { valence: string; energy: string; feelings: string[] },
][];

/** The feelings vessel (r 9.3 on the 24 grid, 1.7 wire, duotone body), standing in for a feelings glyph. */
function Vessel({ tint }: { tint: string }) {
  return (
    <svg viewBox="0 0 24 24" width={32} height={32} aria-hidden="true" className={`mu-tint-${tint}`} fill="none" stroke="currentColor" strokeWidth={1.7}>
      <circle cx="12" cy="12" r="9.3" fill="currentColor" fillOpacity="calc(.14 * var(--mu-duo-k, 1))" />
    </svg>
  );
}

/** Five tints in both colorways, with a switch that turns them off the way Increase Contrast does. */
function TintBench() {
  const [off, setOff] = React.useState(false);
  return (
    <div className="flex w-full flex-col items-center gap-20" data-mu-untinted={off ? '' : undefined}>
      <div className="grid w-full gap-16 md:grid-cols-2">
        {(['bone', 'graphite'] as CW[]).map((cw) => (
          <div key={cw} data-mu-colorway={cw} className="material-raised flex flex-col gap-16 rounded-card p-24">
            <span className="type-label engraved">{cw}</span>
            <div className="grid grid-cols-5 gap-8 text-icon">
              {TINTS.map(([t]) => (
                <div key={t} className="flex flex-col items-center gap-6">
                  <Vessel tint={t} />
                  <span className="type-meta text-ink2">{t}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        aria-pressed={off}
        onClick={() => setOff((v) => !v)}
        className={['type-ui h-28 cursor-pointer rounded-pill px-13 text-ink', off ? 'material-pressed' : 'material-cap'].join(' ')}
      >
        {off ? 'Tints off' : 'Tints on'}
      </button>
    </div>
  );
}

export default function Color() {
  const d = useDialKit(
    'Color & ink',
    {
      bone: {
        ink: C.bone.ink,
        ink2: C.bone.ink2,
        ink3: C.bone.ink3,
        engraveAlpha: [alphaOf(C.bone.engrave), 0.2, 0.9, 0.01],
      },
      graphite: {
        ink: C.graphite.ink,
        ink2: C.graphite.ink2,
        ink3: C.graphite.ink3,
        engraveAlpha: [alphaOf(C.graphite.engrave), 0.2, 0.9, 0.01],
      },
      floors: {
        ink: [7, 3, 12, 0.5],
        ink2: [4.5, 3, 7, 0.5],
        ink3: [3, 2, 4.5, 0.5],
      },
      copy: { type: 'action', label: 'Copy ink tokens' },
    },
    {
      onAction: (a) => {
        if (a !== 'copy') return;
        copyJSON(
          Object.fromEntries(
            (['bone', 'graphite'] as CW[]).map((cw) => [
              cw,
              { ink: d[cw].ink, ink2: d[cw].ink2, ink3: d[cw].ink3, engrave: `rgba(${ENGRAVE_BASE[cw]},${d[cw].engraveAlpha})` },
            ]),
          ),
        );
      },
    },
  );

  const inkVars = (cw: CW) =>
    ({
      '--mu-ink': d[cw].ink,
      '--mu-ink2': d[cw].ink2,
      '--mu-ink3': d[cw].ink3,
      '--mu-engrave': `rgba(${ENGRAVE_BASE[cw]},${d[cw].engraveAlpha})`,
    }) as React.CSSProperties;

  const rows = (cw: CW) => {
    const s = surfaces(cw);
    return [
      { key: 'ink', job: 'Content, titles, active state', color: d[cw].ink, floor: d.floors.ink, sample: 'the font on the train poster' },
      { key: 'ink2', job: 'Meta, counts, readouts, placeholders', color: d[cw].ink2, floor: d.floors.ink2, sample: 'Edited today at 8:52 · 11 words' },
      { key: 'ink3', job: 'Quiet only: disabled, decorative hints', color: d[cw].ink3, floor: d.floors.ink3, sample: 'Disabled · no information' },
      { key: 'engrave', job: 'Engraved labels', color: `rgba(${ENGRAVE_BASE[cw]},${d[cw].engraveAlpha})`, floor: d.floors.ink3, sample: 'Stack · 3 blocks', label: true },
    ].map((r) => ({ ...r, ratio: worstContrast(r.color, s) }));
  };

  return (
    <>
      <PageHeader
        title="Color & ink"
        lede="Two colorways share one set of objects. Text is set in four inks whose contrast is measured on the worst surface each one can sit on, so a label that passes on a raised card still passes in a well."
      />

      <Section title="Colorways" lede="Bone and Graphite are finishes, not themes. Each supplies the same surfaces: a highlight, body and low edge for raised material, and a top and bottom for wells.">
        <div className="grid gap-16 md:grid-cols-2 [&>*]:min-w-0">
          {(['bone', 'graphite'] as CW[]).map((cw) => (
            <div key={cw} data-md="row" data-mu-colorway={cw} className="flex flex-col gap-12 rounded-card p-24" style={{ background: cw === 'bone' ? SHARED.page : SHARED['page-dark'] }}>
              <div className="flex items-baseline justify-between">
                <span className="type-title text-ink">{cw === 'bone' ? 'Bone' : 'Graphite'}</span>
                <span className="type-readout text-ink2">{cw === 'bone' ? SHARED.page : SHARED['page-dark']}</span>
              </div>
              <div className="grid grid-cols-5 gap-8 text-icon">
                {SURFACE_KEYS.map((k) => (
                  <div key={k} className="flex flex-col gap-6">
                    <div className="h-48 rounded-row shadow-[inset_0_0_0_.5px_rgba(0,0,0,.08)]" style={{ background: C[cw][k] }} />
                    <span className="type-label engraved">{k}</span>
                    <span className="type-readout text-ink2">{C[cw][k]}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Ink" lede="Each row shows the ink's text, its worst-case contrast, and whether it meets its floor. Change the inks or the floors in the dial panel to see the ratios update.">
        <div className="grid gap-16 xl:grid-cols-2 [&>*]:min-w-0">
          {(['bone', 'graphite'] as CW[]).map((cw) => (
            <div key={cw} data-mu-colorway={cw} style={inkVars(cw)} className="material-raised flex flex-col rounded-card p-16">
              {rows(cw).map((r) => (
                <div key={r.key} data-md="row" className="grid grid-cols-[1fr_auto] items-center gap-12 border-b border-[var(--mu-rule)] py-12 last:border-0">
                  <div className="flex min-w-0 flex-col gap-4">
                    <span className={r.label ? 'type-label engraved' : 'type-ui'} style={r.label ? undefined : { color: r.color }}>{r.sample}</span>
                    <span className="type-meta text-ink2">{r.key} · {r.job}</span>
                  </div>
                  <div className="flex items-center gap-8">
                    <span className="type-readout text-ink">{r.ratio.toFixed(1)}</span>
                    <span className="type-readout text-ink2">≥ {r.floor}</span>
                    <Led ok={r.ratio >= r.floor} />
                  </div>
                </div>
              ))}
              <span data-md="row" className="type-label engraved pt-8">{cw} · worst surface</span>
            </div>
          ))}
        </div>
        <Rules
          rules={[
            { id: 'C1', title: 'If a reader needs it, it is ink2 or darker', body: 'Counts, timestamps, placeholders and readouts are ink2 (at least 4.5:1). ink3 never carries information on its own.' },
            { id: 'C2', title: 'Floors hold on the worst surface', body: 'Ratios are measured against every surface an ink can land on: raised highs and lows, both ends of a well, and the page.' },
            { id: 'C3', title: 'Emphasis is weight, not color', body: 'Search matches and key words go to weight 600 with the 1.5pt green underline. No highlighter fills and no colored text for emphasis.' },
          ]}
        />
      </Section>

      <Section title="Signals" lede="One signal per object at most. Phosphor green marks intent; red is reserved for destruction; LEDs are radial, lit from the same top-left light.">
        <Bench caption="Phosphor · green-deep · destructive · capture blue · keeper gold · LEDs">
          <div className="flex flex-wrap items-end justify-center gap-24">
            {[
              ['green', SHARED.green],
              ['green-deep', SHARED['green-deep']],
              ['red', SHARED.red],
              ['blue', SHARED.blue],
              ['gold', SHARED.gold],
            ].map(([name, hex]) => (
              <div key={name} className="flex flex-col items-center gap-8">
                <div className="size-56 rounded-plate shadow-[inset_0_0_0_.5px_rgba(0,0,0,.12)]" style={{ background: hex }} />
                <span className="type-label engraved">{name}</span>
                <span className="type-readout text-ink2">{hex}</span>
              </div>
            ))}
            {(['led-green', 'led-amber', 'led-red'] as const).map((led) => (
              <div key={led} className="flex flex-col items-center gap-8">
                <div className="grid size-56 place-items-center">
                  <span className="size-12 rounded-full shadow-[0_0_0_.5px_rgba(0,0,0,.25)]" style={{ background: SHARED[led] }} />
                </div>
                <span className="type-label engraved">{led}</span>
                <span className="type-readout text-ink2">radial</span>
              </div>
            ))}
          </div>
        </Bench>
        <TokenTable
          rows={[
            ['--mu-green', SHARED.green, 'Intent: focus ring fills, live state, toggle on.'],
            ['--mu-green-deep', SHARED['green-deep'], 'Rings, carets and ticks on light surfaces; the focus outline.'],
            ['--mu-red', SHARED.red, 'Destructive only.'],
            ['--mu-blue', SHARED.blue, 'The capture card, the one saturated hero surface.'],
            ['--mu-gold', SHARED.gold, 'Keeper ring, as a hairline only.'],
          ]}
        />
      </Section>

      <Section
        title="Valence tints"
        lede="Five tints color the glyphs that carry a feeling or an energy, and nothing else. Hue carries valence: warm is pleasant, cool is unpleasant. Saturation carries energy: vivid is activated, muted is settled. Neutral is graphite, which is ink2 by design. There is no red and no green, so a feeling never reads as destructive or as intent."
      >
        <Bench caption="The feelings vessel in each tint · Increase Contrast, or the switch, returns every glyph to ink">
          <TintBench />
        </Bench>
        <TokenTable
          rows={TINTS.map(([t, q]) => [
            `--mu-tint-${t}`,
            `${C.bone[`tint-${t}` as keyof (typeof C)['bone']]} · ${C.graphite[`tint-${t}` as keyof (typeof C)['bone']]}`,
            `${q.valence} · ${q.energy}: ${q.feelings.join(', ')}. Glyph at ${(['bone', 'graphite'] as CW[])
              .map((cw) => `${worstContrast(C[cw][`tint-${t}` as keyof (typeof C)['bone']], surfaces(cw)).toFixed(1)}:1`)
              .join(' / ')} on the worst surface.`,
          ])}
        />
        <Rules
          rules={[
            { id: 'C4', title: 'Glyphs only, never words', body: 'Apply .mu-tint-<name> (or .metalTint(_:) in SwiftUI) to the glyph. The duotone body follows through currentColor. The label beside it stays ink.' },
            { id: 'C5', title: 'Feelings and energy only', body: 'A tint says how something feels, never what state it is in. Status is an LED, intent is phosphor, destruction is red.' },
            { id: 'C6', title: 'Off under Increase Contrast, and by one setting', body: 'prefers-contrast: more returns tinted glyphs to the surrounding ink, and so does data-mu-untinted on any ancestor (.metalUntinted() in SwiftUI). The shape language has to read without color.' },
          ]}
        />
      </Section>
    </>
  );
}
