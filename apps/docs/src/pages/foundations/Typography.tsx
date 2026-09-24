import * as React from 'react';
import { useDialKit } from 'dialkit';
import { F, TYPE_ROLES, type TypeRole } from '../../lib/tokens';
import { Bench, PageHeader, Rules, Section, copyJSON } from '../../ui/doc';

const SAMPLES: Record<TypeRole, string> = {
  display: 'an empty pocket.',
  content: 'the font on the train poster was a condensed grotesk',
  title: 'poster refs',
  lead: 'Saved a link to Today',
  ui: 'Arrange as Timeline',
  body: 'grotesk vs. neo-grotesk for the header, and whether the caps need more room',
  meta: 'Edited today at 8:52 · 11 words',
  label: 'Stack · 3 blocks',
  readout: '⌘K   320 × 214   #FF6B3D   100%',
  code: 'if l && r { panel.toggle() }',
  pixel: '08:52',
};

const USES: Record<TypeRole, string> = {
  display: 'Empty-state headline',
  content: 'User-authored text in notes',
  title: 'Object titles',
  lead: 'Short sentences on objects',
  ui: 'Buttons, rows, segments, fields',
  body: 'Multi-line secondary text',
  meta: 'Timestamps, footnotes',
  label: 'Engravings, section headers',
  readout: 'Keycaps, counts, sizes, hex',
  code: 'Code screens',
  pixel: 'Widget displays only',
};

const FAMILY = { sans: 'var(--mu-sans)', mono: 'var(--mu-mono)', pixel: 'var(--mu-pixel)' } as const;
const em = (t: string) => parseFloat(t) || 0;

// One dial folder per role: size, line, weight, tracking (em).
const roleDials = Object.fromEntries(
  TYPE_ROLES.map((role) => {
    const r = F.type[role];
    return [
      role,
      {
        _collapsed: true,
        size: [r.size, 8, 56, 0.5],
        line: [r.line, 10, 64, 1],
        weight: [r.weight, 100, 900, 50],
        tracking: [em(r.tracking), -0.06, 0.2, 0.001],
      },
    ];
  }),
) as Record<TypeRole, { _collapsed: true; size: [number, number, number, number]; line: [number, number, number, number]; weight: [number, number, number, number]; tracking: [number, number, number, number] }>;

export default function Typography() {
  const d = useDialKit(
    'Typography',
    {
      sample: { type: 'text', default: '', placeholder: 'Type to replace every sample…' },
      axes: {
        monoWidth: [87.5, 75, 112.5, 0.5],
        codeWidth: [75, 75, 112.5, 0.5],
      },
      ...roleDials,
      copy: { type: 'action', label: 'Copy type roles' },
    },
    {
      onAction: (a) => {
        if (a !== 'copy') return;
        copyJSON(Object.fromEntries(TYPE_ROLES.map((role) => [role, { ...F.type[role], size: d[role].size, line: d[role].line, weight: d[role].weight, tracking: `${d[role].tracking}em` }])));
      },
    },
  );

  const style = (role: TypeRole): React.CSSProperties => {
    const r = F.type[role] as (typeof F.type)[TypeRole] & { uppercase?: boolean; tabular?: boolean; stretch?: string };
    const v = d[role];
    return {
      fontFamily: FAMILY[r.family as keyof typeof FAMILY],
      fontSize: v.size,
      lineHeight: `${v.line}px`,
      fontWeight: v.weight,
      letterSpacing: `${v.tracking}em`,
      fontStretch: r.family === 'mono' ? `${r.stretch === 'code' ? d.axes.codeWidth : d.axes.monoWidth}%` : undefined,
      textTransform: r.uppercase ? 'uppercase' : undefined,
      fontVariantNumeric: r.tabular ? 'tabular-nums' : undefined,
    };
  };

  return (
    <>
      <PageHeader
        title="Typography"
        lede="Three families, each with one job. Geist sets the interface and reading text. Martian Mono, using its width axis, sets engravings, readouts, keycaps and code. Doto, a dot-matrix face, is kept for widget displays. Seven roles cover every object; nothing else gets a size."
      />

      <Section title="Roles" lede="Every value on this page is live. Tune a role in the dial panel, or type in the sample field to try your own copy.">
        <div className="flex flex-col">
          {TYPE_ROLES.map((role) => {
            const v = d[role];
            return (
              <div key={role} data-md="row" className="grid grid-cols-[96px_1fr] items-baseline gap-x-24 gap-y-6 border-b border-[var(--mu-rule)] py-20 last:border-0 md:grid-cols-[96px_1fr_220px]">
                <span className="type-label engraved">{role}</span>
                <span className={role === 'body' || role === 'meta' ? 'text-ink2' : 'text-ink'} style={style(role)}>
                  {d.sample || SAMPLES[role]}
                </span>
                <span className="type-readout col-start-2 text-ink2 md:col-start-auto md:text-right">
                  {v.size}/{v.line} · {v.weight} · {(v.tracking * 100).toFixed(1)}%
                  <br />
                  <span className="type-meta">{USES[role]}</span>
                </span>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="The scale" lede="The sans sizes step 11 · 12.5 · 13.5 · 15 · 18, about ×1.1 per step: tight enough for dense hardware, with every step still visible. Lines sit on a 2-point grid.">
        <Bench caption="Sans steps at their role weights">
          <div className="flex flex-wrap items-baseline justify-center gap-x-32 gap-y-16">
            {(['meta', 'ui', 'title', 'content', 'display'] as TypeRole[]).map((role) => (
              <div key={role} className="flex flex-col items-center gap-8">
                <span className="text-ink" style={style(role)}>Aa</span>
                <span className="type-readout text-ink2">{d[role].size}</span>
              </div>
            ))}
          </div>
        </Bench>
      </Section>

      <Section title="Rules">
        <Rules
          rules={[
            { id: 'T1', title: 'Three weights', body: 'Sans uses 400, 500 and 600; mono uses 400 and 500. The old 560, 620 and 650 are retired.' },
            { id: 'T2', title: 'Emphasis by weight, never by size', body: 'A search match is 600 with the green underline; it keeps the size of the line it sits in.' },
            { id: 'T3', title: 'Mono has a width, not just a size', body: 'Martian Mono runs at 87.5% width for labels and readouts so its footprint matches the old SF Mono, and at 75% for code, which needs density.' },
            { id: 'T4', title: 'Counting numerals are tabular', body: 'Readouts that change (sizes, counts, zoom) use tabular figures so they do not jitter.' },
            { id: 'T5', title: 'Pixel only on displays', body: 'Doto appears on widget displays such as clocks, timers and counters, at 24 or 40. It is never used for interface text.' },
          ]}
        />
      </Section>
    </>
  );
}
