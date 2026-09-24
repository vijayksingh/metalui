import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Icon, type IconName } from '@unlocalhosted/metalui/icons';
import { F } from '../../lib/tokens';
import { Bench, PageHeader, Rules, Section, TokenTable, copyJSON } from '../../ui/doc';

const MULTIPLIERS = F.space.filter((v) => v > 0).map((v) => v / 4);

const ROWS: { icon: IconName; label: string; meta: string }[] = [
  { icon: 'note', label: 'the font on the train poster', meta: '↵' },
  { icon: 'group', label: 'poster refs', meta: '3 IMG' },
  { icon: 'link', label: 'lanterns.photo/poster', meta: 'LINK' },
];

export default function Spacing() {
  const d = useDialKit(
    'Spacing',
    {
      base: [4, 2, 8, 1],
      scaleView: [3, 1, 4, 0.5],
      guides: true,
      relationships: {
        nest: [6, 2, 12, 1],
        iconLabel: [6, 2, 12, 1],
        items: [8, 4, 16, 1],
        rows: [2, 0, 8, 1],
        groups: [12, 4, 24, 1],
        contentInset: [16, 8, 24, 1],
      },
      copy: { type: 'action', label: 'Copy spacing tokens' },
    },
    {
      onAction: (a) => {
        if (a === 'copy') copyJSON({ scale: MULTIPLIERS.map((m) => m * d.base), ...d.relationships });
      },
    },
  );
  const r = d.relationships;
  const guide = d.guides ? 'outline outline-1 outline-dashed outline-[rgba(63,185,122,.55)] outline-offset-0' : '';

  return (
    <>
      <PageHeader
        title="Spacing"
        lede={`A ${d.base}-point base, with 2 and 6 for fine work. Tokens are named by their value, so gap-12 is 12 points. Every recurring gap has a name and a single value.`}
      />

      <Section title="Scale">
        <Bench caption={`Scale · shown at ${d.scaleView}×`}>
          <div className="grid w-full max-w-[520px] grid-cols-[32px_1fr] items-center gap-x-12 gap-y-6">
            {[0.5, ...MULTIPLIERS].filter((m, i, a) => a.indexOf(m) === i).map((m) => {
              const v = m * d.base;
              return (
                <React.Fragment key={m}>
                  <span className="type-readout text-right text-ink">{v}</span>
                  <span className="material-well block h-8 overflow-hidden rounded-pill">
                    <i className="material-thumb block h-full rounded-pill" style={{ width: v * d.scaleView }} />
                  </span>
                </React.Fragment>
              );
            })}
          </div>
        </Bench>
      </Section>

      <Section title="Relationships" lede="An object built only from named gaps. Turn guides on in the dial panel to see each one, and change a value to see where it applies.">
        <div className="grid items-center gap-24 lg:grid-cols-[1fr_280px] [&>*]:min-w-0">
          <Bench caption="Palette fragment · every gap is a relationship">
            <div className="material-raised w-[300px] rounded-card" style={{ padding: r.nest }}>
              <div className={`material-well flex h-36 items-center rounded-pill px-14 ${guide}`} style={{ gap: r.iconLabel }}>
                <Icon name="search" size={16} className="text-ink2" />
                <span className="type-ui text-ink">poster</span>
              </div>
              <div className={`flex items-baseline justify-between ${guide}`} style={{ padding: `${r.groups}px 8px 4px` }}>
                <span className="type-label engraved">Blocks</span>
                <span className="type-readout text-ink2">3</span>
              </div>
              <div className="flex flex-col" style={{ gap: r.rows }}>
                {ROWS.map((row) => (
                  <div key={row.label} className={`flex h-32 items-center rounded-row px-8 ${guide}`} style={{ gap: r.iconLabel }}>
                    <Icon name={row.icon} size={14} className="text-ink2" />
                    <span className="type-ui flex-1 truncate text-ink">{row.label}</span>
                    <span className="type-readout text-ink2">{row.meta}</span>
                  </div>
                ))}
              </div>
              <div className={`flex justify-end ${guide}`} style={{ gap: r.items, paddingTop: r.groups }}>
                <span className="material-cap type-ui inline-flex h-28 items-center rounded-pill px-13 text-ink">Cancel</span>
                <span className="type-ui inline-flex h-28 items-center rounded-pill px-13 text-white" style={{ background: 'var(--mu-primary-bg)', boxShadow: 'var(--mu-primary-sh)' }}>Open</span>
              </div>
            </div>
          </Bench>
          <TokenTable
            head={['Relationship', 'Value']}
            rows={[
              ['Nest inset', r.nest],
              ['Icon ↔ label', r.iconLabel],
              ['Items in a row', r.items],
              ['Stacked rows', r.rows],
              ['Groups', r.groups],
              ['Content inset', `${r.contentInset} (⅔ r24)`],
              ['Objects side by side', 24],
            ]}
          />
        </div>
      </Section>

      <Section title="Rules">
        <Rules
          rules={[
            { id: 'S1', title: 'Name the gap, not the number', body: 'Components use a relationship (icon ↔ label, items, groups), and the relationship has one value. Two gaps that mean the same thing are always equal.' },
            { id: 'S2', title: 'Tight inside, generous between', body: 'Rows sit 2 apart and groups 12 apart; objects sit 24 apart. The hierarchy should read from spacing before type does any work.' },
            { id: 'S3', title: 'Insets come from the radius', body: 'A slab’s content inset is ⅔ of its radius, and a pill’s text starts at h/2 − 1. Neither is picked by eye.' },
          ]}
        />
      </Section>
    </>
  );
}
