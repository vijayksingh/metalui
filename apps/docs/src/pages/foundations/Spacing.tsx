import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Icon, type IconName } from '@unlocalhosted/metalui/icons';
import { F } from '../../lib/tokens';
import { Bench, Code, PageHeader, Rules, Section, TokenTable, copyJSON } from '../../ui/doc';

const MULTIPLIERS = F.space.filter((v) => v > 0).map((v) => v / 4);

const ROWS: { icon: IconName; label: string; meta: string }[] = [
  { icon: 'note', label: 'the font on the train poster', meta: '↵' },
  { icon: 'group', label: 'poster refs', meta: '3 IMG' },
  { icon: 'link', label: 'lanterns.photo/poster', meta: 'LINK' },
];

const FOUNDATIONS = [
  { title: 'Typography', href: '/foundations/typography', body: 'Choose a complete type role before arranging the text around it.' },
  { title: 'Radius', href: '/foundations/radius', body: 'Nest corners using the same inset that separates their surfaces.' },
  { title: 'Materials', href: '/foundations/materials', body: 'Keep fills and shadow stacks together while layout arranges the objects.' },
];

export default function Spacing() {
  const d = useDialKit(
    'Spacing',
    {
      base: [4, 2, 8, 1],
      scaleView: [3, 1, 4, 0.5],
      guides: true,
      layout: {
        panelWidth: [760, 180, 760, 20],
        columnMin: [F.layout['column-min'], 180, 320, 20],
      },
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
        lede={`A ${d.base}-point base, with 2 and 6 for fine work. Use gap-mu-space-12 for the shared 12-point step, or name the relationship with gap-mu-related. Component dimensions keep their own recipe tokens.`}
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
          <Bench caption="Palette composition · every gap is a relationship">
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

      <Section id="layout" title="Compose with layout rules" lede="Tailwind stays the styling system. A stack groups related content; a cluster wraps whole actions; an adaptive grid fits the space its parent gives it. None adds motion or changes reading order.">
        <div className="mu-stack gap-mu-group">
          <div data-testid="layout-stack" className="mu-stack">
            <h3 className="m-0 type-doc-subheading">Related content stays together</h3>
            <p className="m-0 type-doc-prose text-ink2">The stack uses the related gap. Choose a group or section gap when the meaning changes.</p>
          </div>
          <nav aria-label="Related foundations" data-testid="layout-cluster" className="mu-cluster">
            {FOUNDATIONS.map((f) => <a key={f.href} href={f.href} className="max-w-full whitespace-nowrap rounded-row bg-s-lo px-mu-space-12 py-mu-space-8 type-doc-caption text-ink no-underline hover:underline focus-visible:outline-solid focus-visible:outline-green-deep">{f.title}</a>)}
          </nav>
          <div>
            <p className="type-doc-caption text-ink2">Change panel width and column minimum in the Spacing dial panel. Columns adapt even while the browser stays wide.</p>
            <div data-testid="layout-grid-host" className="max-w-full" style={{ width: d.layout.panelWidth }}>
              <nav aria-label="Foundation reading paths" data-testid="layout-grid" className="mu-auto-grid gap-mu-related" style={{ '--mu-layout-column-min': `${d.layout.columnMin}px` } as React.CSSProperties}>
                {FOUNDATIONS.map((f) => (
                  <a key={f.href} href={f.href} className="mu-stack gap-mu-space-8 min-w-0 rounded-card material-raised p-mu-space-16 text-ink no-underline focus-visible:outline-solid focus-visible:outline-green-deep">
                    <span className="type-doc-subheading">{f.title}</span>
                    <span className="type-doc-caption text-ink2">{f.body}</span>
                  </a>
                ))}
              </nav>
            </div>
          </div>
          <Code lang="tsx" code={'<section className="mu-stack gap-mu-section">\n  <div className="mu-cluster gap-mu-related">{/* Actions */}</div>\n  <div className="mu-auto-grid">{/* Existing cards */}</div>\n</section>'} />
        </div>
      </Section>

      <Section id="shared-tokens" title="Shared layout contract" lede="The same spacing ladder generates CSS variables, namespaced Tailwind utilities, and Swift MetalSpace values. Gap roles point into that ladder; they do not introduce a second scale.">
        <TokenTable head={['Meaning', 'Tailwind', 'CSS / Swift']} rows={[
          ...Object.entries(F.layout.gap).map(([name, step]) => [name, `gap-mu-${name}`, `--mu-layout-gap-${name} · ${step}px · MetalLayout.gap${name[0].toUpperCase()}${name.slice(1)}`]),
          ['Specific approved step', 'gap-mu-space-12 / p-mu-space-12', '--mu-space-12 · MetalSpace.s12'],
          ['Preferred grid track', 'mu-auto-grid', `--mu-layout-column-min · ${F.layout['column-min']}px · MetalLayout.columnMin`],
        ]} />
        <p className="type-doc-prose text-ink2">Import the package stylesheet for the base layout classes and shared gap/padding utilities. A Tailwind v4 source integration also compiles ordinary variants such as @md:gap-mu-group, with @container on an ancestor. Layout responds to available space; viewport queries remain useful for the application shell.</p>
        <p className="type-doc-prose text-ink2">Shared gaps describe content relationships. A button’s icon gap, a menu’s row spacing, and press travel remain component recipe decisions. Our typography roles include their own line heights: inspect line boxes together with external gaps instead of imposing one mathematical ratio on every control.</p>
      </Section>

      <Section title="Rules">
        <Rules
          rules={[
            { id: 'S1', title: 'Name the gap, not the number', body: 'Components use a relationship (icon ↔ label, items, groups), and the relationship has one value. Two gaps that mean the same thing are always equal.' },
            { id: 'S2', title: 'Tight inside, generous between', body: 'Rows sit 2 apart and groups 12 apart; objects sit 24 apart. The hierarchy should read from spacing before type does any work.' },
            { id: 'S3', title: 'Insets come from the radius', body: 'A slab’s content inset is ⅔ of its radius, and a pill’s text starts at h/2 − 1. Neither is picked by eye.' },
            { id: 'S4', title: 'Arrange without repainting', body: 'Use one layout rule per element, then add a named gap or alignment. Layout never supplies a new material, state machine, or component.', origin: 'Adapted · Lism CSS layout patterns' },
            { id: 'S5', title: 'Fit the parent before adding breakpoints', body: 'Let actions wrap and grid tracks fit their parent. Use a Tailwind container variant only when structure changes; keep DOM and keyboard order aligned.', origin: 'Adapted · Lism CSS intrinsic layouts and container queries' },
          ]}
        />
      </Section>
    </>
  );
}
