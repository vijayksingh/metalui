import * as React from 'react';
import { useDialKit } from 'dialkit';
import { CheckIcon } from '@unlocalhosted/metalui/icons';
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

const SIGNAL = tokens.foundations.signal;
const SWATCHES = ['green', 'green-deep', 'red', 'success', 'warning', 'photon', 'blue', 'gold'] as const;
const LEDS = ['led-green', 'led-amber', 'led-red', 'led-blue', 'led-off'] as const;

type Tint = { bone: string; graphite: string; kind: string; valence: string; feelings: string[]; moments: string[] };
const TINT = tokens.foundations.tint;
const TINTS = Object.entries(TINT).filter(([k]) => !k.startsWith('$') && k !== 'field-shift') as [string, Tint][];

// One real glyph per family, drawn from Kamui's life set (design/medium-icons) until the set
// itself lands in MetalUI (import plan 3.1). The tint colors the stroke; the vessel is its duotone.
const VESSEL = '<circle class="v d" style="--duo:0.17" cx="12" cy="12" r="9.3"/>';
const SPECIMEN: Record<string, { name: string; body: string }> = {
  ember: { name: 'happy', body: `${VESSEL}<path d="M6.8 13.2c2.2 0 2.8-4.6 5.2-4.6s3 4.6 5.2 4.6"/>` },
  blush: { name: 'loved', body: `${VESSEL}<circle cx="10.2" cy="12" r="3.1"/><circle cx="13.8" cy="12" r="3.1"/>` },
  tide: { name: 'calm', body: `${VESSEL}<path d="M6.4 11c1.01 -0.67 1.79 -0.67 2.8 0c1.01 0.67 1.79 0.67 2.8 0c1.01 -0.67 1.79 -0.67 2.8 0c1.01 0.67 1.79 0.67 2.8 0"/><path d="M8.8 14.4c0.76 -0.53 1.34 -0.53 2.1 0c0.76 0.53 1.34 0.53 2.1 0c0.76 -0.53 1.34 -0.53 2.1 0" style="opacity:.45"/>` },
  spark: { name: 'curious', body: `${VESSEL}<path d="M6.6 14.6c2.4 0 3.8-.8 4.6-2.2.9-1.7.1-3.4-1.2-3.2-1.5.2-1.2 2.5.6 2.9 2.2.5 4.2-.9 5.8-3.3"/><circle class="s" cx="16.9" cy="7.6" r="1"/>` },
  graphite: { name: 'focused', body: `${VESSEL}<circle cx="12" cy="12" r="3.8"/><circle class="s" cx="12" cy="12" r="1.2"/>` },
  dusk: { name: 'sad', body: `${VESSEL}<path d="M7 10c2.8.2 4.2 2 5.4 3.6 1 1.3 2.3 1.9 4.4 1.9"/>` },
  iris: { name: 'anxious', body: `${VESSEL}<path d="M6.6 13.2l1.2 -1.5l1.2 1.5l1.2 -1.5l1.2 1.5l1.2 -1.5l1.2 1.5l1.2 -1.5l1.2 1.5l1.2 -1.5"/>` },
};
const DATE = '<path class="f" style="--duo:.2" d="M12 19.8c-.3 0-8.4-4.9-8.4-10.5A4.4 4.4 0 0 1 12 7.1a4.4 4.4 0 0 1 8.4 2.2c0 5.6-8.1 10.5-8.4 10.5Z"/>';

function Glyph({ tint, body, size = 36, title }: { tint: string; body: string; size?: number; title: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={`mu-icon mu-tint-${tint}`}
      role="img"
      aria-label={title}
      dangerouslySetInnerHTML={{ __html: body }}
    />
  );
}

/** Every family on its real glyph, in both colorways, with a switch that turns tints off the way Increase Contrast does. */
function TintBench() {
  const [off, setOff] = React.useState(false);
  return (
    <div className="flex w-full flex-col items-center gap-20" data-mu-untinted={off ? '' : undefined}>
      <div className="grid w-full gap-16 xl:grid-cols-2">
        {(['bone', 'graphite'] as CW[]).map((cw) => (
          <div key={cw} data-mu-colorway={cw} className="material-raised flex flex-col gap-16 rounded-card p-24">
            <span className="type-label engraved">{cw}</span>
            <div className="grid grid-cols-4 gap-x-8 gap-y-16 text-ink sm:grid-cols-8">
              {TINTS.map(([t, q]) => (
                <div key={t} className="flex flex-col items-center gap-6 text-center">
                  <Glyph tint={t} body={SPECIMEN[t].body} title={`${SPECIMEN[t].name}, ${t}`} />
                  <span className="type-meta text-ink">{SPECIMEN[t].name}</span>
                  <span className="type-label engraved">{q.kind}</span>
                </div>
              ))}
              <div className="flex flex-col items-center gap-6 text-center">
                <Glyph tint="blush" body={DATE} title="date, blush" />
                <span className="type-meta text-ink">date</span>
                <span className="type-label engraved">moment</span>
              </div>
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

      <Section title="Signals" lede="Signals say something about the system’s state. One signal per object at most. Phosphor green marks intent, red is reserved for destruction, success always carries its check, and LEDs are radial, lit from the same top-left light. None of them carries meaning by hue alone.">
        <Bench caption="Phosphor · green-deep · destructive · success with its check · warning · photon · capture blue · keeper gold · LEDs">
          <div className="flex flex-col items-center gap-24">
            <div className="flex flex-wrap items-end justify-center gap-24">
              {SWATCHES.map((name) => (
                <div key={name} className="flex flex-col items-center gap-8">
                  <div className="grid size-56 place-items-center rounded-plate text-[#1B1B1D] shadow-[inset_0_0_0_.5px_rgba(0,0,0,.12)]" style={{ background: SHARED[name] }}>
                    {name === 'success' && <CheckIcon size={20} animate={false} title="Done" />}
                  </div>
                  <span className="type-label engraved">{name}</span>
                  <span className="type-readout text-ink2">{SHARED[name]}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-end justify-center gap-24">
              {LEDS.map((led) => (
                <div key={led} className="flex flex-col items-center gap-8">
                  <span className="size-12 rounded-full shadow-[0_0_0_.5px_rgba(0,0,0,.25)]" style={{ background: SHARED[led] }} />
                  <span className="type-label engraved">{led}</span>
                </div>
              ))}
            </div>
          </div>
        </Bench>
        <TokenTable
          rows={[
            ...Object.entries(SIGNAL)
              .filter(([k]) => !k.startsWith('$'))
              .map(([k, use]) => [`--mu-${k}`, k.startsWith('led-') ? 'radial' : SHARED[k as keyof typeof SHARED], use]),
            ['--mu-blue', SHARED.blue, 'The capture card, the one saturated hero surface.'],
            ['--mu-gold', SHARED.gold, 'Keeper ring, as a hairline only.'],
          ]}
        />
      </Section>

      <Section
        title="Feelings tints"
        lede="A tint colors the glyph’s stroke, and its duotone body follows, so the line itself evokes the feeling. The tint names the kind of feeling (joy, affection, calm, wonder, neutral, low, tension), never its strength: energy lives in the glyph’s shape and valence in its position, so a quiet feeling is never muted into brown or gray. Every stroke speaks at the orange’s voice and clears 3.3:1 on bone and 4.5:1 on graphite."
      >
        <Bench caption="One real glyph per family, plus a moment · the switch, or Increase Contrast, returns every glyph to ink">
          <TintBench />
        </Bench>
        <TokenTable
          head={['Token', 'Bone · graphite', 'Kind · carried by']}
          rows={TINTS.map(([t, q]) => [
            `--mu-tint-${t}`,
            <span key={t} className="inline-flex items-center gap-6 whitespace-nowrap">
              <span className="size-10 rounded-full" style={{ background: q.bone }} />
              <span className="size-10 rounded-full" style={{ background: q.graphite }} />
              {q.bone} · {q.graphite}
            </span>,
            `${q.kind} · ${[...q.feelings, ...q.moments.map((m) => `${m} (moment)`)].join(', ')}`,
          ])}
        />
        <Rules
          rules={[
            { id: 'C4', title: 'The stroke carries the feeling', body: 'A tint colors the glyph’s line; its duotone body follows at the usual opacity. Strokes are mixed at the orange’s chroma, deep enough for 3.3:1 on bone and light enough for 4.5:1 on graphite. No family sits on yellow, because a yellow deep enough to read on bone is brown. Words never take a tint.', origin: 'Ours · the Kamui life set’s stroke tint, with new pigments' },
            { id: 'C5', title: 'Color names the kind, never the strength', body: 'Joy, affection, calm, wonder, low and tension each have one pigment. How strong a feeling is shows in its shape. Moments that carry an unmistakable feeling take it too: a date, a friend, family and a gift are affection; a party is joy.', origin: 'Ours · replaces hue-is-valence, saturation-is-energy (Kamui 02 §3)' },
            { id: 'C6', title: 'Off under Increase Contrast, and by one setting', body: 'prefers-contrast: more returns every body to ink, and so does data-mu-untinted on any ancestor (.metalUntinted() in SwiftUI). The shape language reads without color.', origin: 'Ours' },
          ]}
        />
      </Section>
    </>
  );
}
