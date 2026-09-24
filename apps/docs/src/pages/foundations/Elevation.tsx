import * as React from 'react';
import { useDialKit } from 'dialkit';
import { tokens } from '../../lib/tokens';
import { useColorway } from '../../app/colorway';
import { Bench, PageHeader, Rules, Section, copyJSON } from '../../ui/doc';

/** Splits a shadow list on top-level commas. */
const layers = (s: string) => {
  const out: string[] = []; let depth = 0, cur = '';
  for (const ch of s) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; } else cur += ch;
  }
  return cur.trim() ? [...out, cur.trim()] : out;
};

/** Scales the lengths of the outer (non-inset) layers; inner light stays as authored. */
const scaleOuter = (s: string, k: number) =>
  layers(s)
    .map((l) => (l.startsWith('inset') ? l : l.replace(/(-?[\d.]+)px/g, (_, n) => `${+(parseFloat(n) * k).toFixed(2)}px`)))
    .join(', ');

const LEVELS = [
  { n: '−1', name: 'Well', body: 'Inset: fields, tracks, slots, pressed caps.' },
  { n: '0', name: 'Canvas', body: 'The table objects rest on: page color and grain.' },
  { n: '1', name: 'Cap', body: 'Small raised parts: buttons, thumbs, keys.' },
  { n: '2', name: 'Raised', body: 'Cards and objects, 96 points and taller.' },
  { n: '3', name: 'Floating', body: 'Palette, menus, toast: frosted above other objects.' },
];

export default function Elevation() {
  const { colorway } = useColorway();
  const raise = tokens.colorways[colorway].raise;
  const d = useDialKit(
    'Elevation',
    {
      raised: { shadowScale: [1, 0, 2, 0.05] },
      floating: {
        blur: [22, 0, 48, 1],
        saturate: [1.6, 1, 2.5, 0.05],
        tint: [colorway === 'bone' ? 0.8 : 0.78, 0.4, 1, 0.01],
      },
      ruleE1: {
        height: [120, 24, 200, 2],
        material: { type: 'select', options: ['raised', 'cap'], default: 'raised' },
      },
      copy: { type: 'action', label: 'Copy elevation tokens' },
    },
    {
      onAction: (a) => {
        if (a === 'copy') copyJSON({ raise: scaleOuter(raise, d.raised.shadowScale), frost: { blur: d.floating.blur, saturate: d.floating.saturate, tint: d.floating.tint } });
      },
    },
  );

  const raisedStyle: React.CSSProperties = {
    background: 'linear-gradient(180deg, var(--mu-s-hi), var(--mu-s) 55%, var(--mu-s-lo))',
    boxShadow: scaleOuter(raise, d.raised.shadowScale),
  };
  const tintRGB = colorway === 'bone' ? '251,250,248' : '34,34,37';
  const floatStyle: React.CSSProperties = {
    background: `rgba(${tintRGB},${d.floating.tint})`,
    boxShadow: scaleOuter(raise, d.raised.shadowScale),
    backdropFilter: `blur(${d.floating.blur}px) saturate(${d.floating.saturate})`,
    WebkitBackdropFilter: `blur(${d.floating.blur}px) saturate(${d.floating.saturate})`,
  };
  const e1Short = d.ruleE1.height < 96;

  return (
    <>
      <PageHeader
        title="Elevation"
        lede="Depth is a material, never a lone shadow. Five levels, each a recipe of fill and light: highlight on the top edge, shade on the bottom, contact and ambient shadows below. The key light sits top left."
      />

      <Section title="Five levels">
        <Bench tone="page" caption="Well · canvas · cap · raised · floating">
          <div className="flex flex-wrap items-end justify-center gap-24">
            {LEVELS.map((l, i) => (
              <figure key={l.name} className="flex w-[132px] flex-col items-center gap-12">
                <div className="relative grid h-[96px] w-[132px] place-items-center">
                  {i === 0 && <div className="material-well size-full rounded-plate" />}
                  {i === 1 && <div className="size-full rounded-card border border-dashed border-[var(--mu-ink3)]" />}
                  {i === 2 && <span className="material-cap type-ui inline-flex h-32 items-center rounded-pill px-15 text-ink">Cap</span>}
                  {i === 3 && <div className="size-full rounded-card" style={raisedStyle} />}
                  {i === 4 && (
                    <>
                      <div className="absolute -left-12 -top-12 h-[60px] w-[72px] rounded-plate bg-[linear-gradient(135deg,#FF7B4D,#E8552A)]" />
                      <div className="absolute inset-0 rounded-card" style={floatStyle} />
                    </>
                  )}
                </div>
                <figcaption className="flex flex-col items-center gap-2 text-center">
                  <span className="type-readout text-ink">{l.n}</span>
                  <span className="type-label engraved">{l.name}</span>
                  <span className="type-meta text-ink2">{l.body}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </Bench>
      </Section>

      <Section title="E1 · Raised is for objects, cap is for controls" lede="The raised recipe’s ambient layers use large negative spreads (−16, −36). Below about 96 points those spreads shrink the shadow to nothing, and the surface goes flat. Drag the height in the dial panel and watch it happen.">
        <Bench tone="page" caption={`h${d.ruleE1.height} · ${d.ruleE1.material} · ${d.ruleE1.material === 'raised' && e1Short ? 'shadow collapsed: use cap' : 'reads as lifted'}`}>
          <div
            className={d.ruleE1.material === 'cap' ? 'material-cap' : ''}
            style={{ width: 280, height: d.ruleE1.height, borderRadius: Math.min(24, d.ruleE1.height / 2), ...(d.ruleE1.material === 'raised' ? raisedStyle : {}) }}
          />
        </Bench>
      </Section>

      <Section title="Rules">
        <Rules
          rules={[
            { id: 'E1', title: 'Raised is for objects, cap is for controls', body: 'Anything under about 96 points tall (buttons, pills, rows, badges) uses the cap recipe. Cards and objects use raised.' },
            { id: 'E2', title: 'Floating is always frosted', body: 'Palette, menus and toast blur what is behind them (22 blur, 1.6 saturate). They read as higher than raised without a heavier shadow.' },
            { id: 'E3', title: 'Pressing is a change of level', body: 'A pressed cap drops 1 point and becomes a well: its outer shadow collapses into an inner shade. That is the whole press effect.' },
            { id: 'E4', title: 'Dark frost needs density', body: 'Graphite frost over a light backdrop needs about 0.9 opacity, or it turns muddy grey.' },
          ]}
        />
      </Section>
    </>
  );
}
