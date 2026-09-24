import * as React from 'react';
import { useDialKit } from 'dialkit';
import { F } from '../../lib/tokens';
import { Bench, PageHeader, Rules, Section, TokenTable, copyJSON } from '../../ui/doc';

const NAMES = ['key', 'row', 'plate', 'card', 'hero', 'device'] as const;
const USES: Record<(typeof NAMES)[number], string> = {
  key: 'Keycaps, tags, checkbox',
  row: 'Rows, inner controls, small tiles',
  plate: 'Wells and plates nested in cards',
  card: 'Cards, palette, capture card, toolbar strip',
  hero: 'Swatch, bezel, empty-state card',
  device: 'Device bodies',
};
const MATERIAL = { raised: 'material-raised', cap: 'material-cap', well: 'material-well' } as const;

function classify(h: number, r: number, slabMax: number) {
  if (r >= h / 2 - 0.5) return { kind: 'Pill', ok: true };
  if (r <= slabMax * h) return { kind: 'Slab', ok: true };
  return { kind: 'Near-pill', ok: false };
}

export default function Radius() {
  const d = useDialKit(
    'Radius',
    {
      ladder: {
        step: [F.nest, 2, 10, 1],
        tile: [96, 64, 160, 2],
        material: { type: 'select', options: ['raised', 'cap', 'well'], default: 'raised' },
      },
      nest: {
        inset: [F.nest, 2, 12, 1],
        depth: [6, 2, 6, 1],
      },
      rules: {
        slabMax: [0.4, 0.25, 0.5, 0.01],
        pillPadOffset: [-1, -4, 4, 1],
      },
      classifier: {
        height: [44, 16, 96, 1],
        radius: [18, 0, 48, 1],
      },
      copy: { type: 'action', label: 'Copy radius tokens' },
    },
    {
      onAction: (a) => {
        if (a !== 'copy') return;
        copyJSON({
          radius: { ...Object.fromEntries(NAMES.map((n, i) => [n, d.ladder.step * (i + 1)])), pill: 999 },
          nest: d.nest.inset,
          slabMax: d.rules.slabMax,
          pillPadding: `h/2 ${d.rules.pillPadOffset >= 0 ? '+' : '−'} ${Math.abs(d.rules.pillPadOffset)}`,
        });
      },
    },
  );

  const ladder = NAMES.map((n, i) => ({ name: n, r: d.ladder.step * (i + 1) }));
  const depth = d.nest.depth;
  const outerR = d.ladder.step * depth;
  const cls = classify(d.classifier.height, d.classifier.radius, d.rules.slabMax);

  // Nested plates, outermost first: each inset by `inset` and losing `step` of radius.
  const nest = (level: number): React.ReactNode => {
    const r = outerR - d.ladder.step * level;
    const last = level === depth - 1;
    return (
      <div
        className={level % 2 === 0 ? 'material-raised' : 'material-well'}
        style={{ borderRadius: Math.max(r, 0), padding: last ? 0 : d.nest.inset, minHeight: last ? 72 : undefined }}
      >
        {last ? (
          <div className="grid h-full min-h-72 place-items-center text-center">
            <span className="type-readout text-ink2">
              {Array.from({ length: depth }, (_, i) => outerR - d.ladder.step * i).join(' → ')}
            </span>
          </div>
        ) : (
          nest(level + 1)
        )}
      </div>
    );
  };

  const pad = (h: number) => h / 2 + d.rules.pillPadOffset;

  return (
    <>
      <PageHeader
        title="Radius"
        lede={`One ladder, multiples of ${d.ladder.step}. The step equals the nest inset, so every nested shape lands back on the ladder. Three rules keep corners honest: nest, slab or pill, and concentric rings.`}
      />

      <Section title="The ladder">
        <Bench caption={`${ladder.map((l) => l.r).join(' · ')} · pill`}>
          <div className="flex flex-wrap items-end justify-center gap-16">
            {ladder.map((l) => (
              <figure key={l.name} className="flex flex-col items-center gap-12">
                <div className={MATERIAL[d.ladder.material as keyof typeof MATERIAL]} style={{ width: d.ladder.tile, height: d.ladder.tile, borderRadius: l.r }} />
                <figcaption className="flex flex-col items-center gap-2">
                  <span className="type-readout text-ink">{l.r}</span>
                  <span className="type-label engraved">{l.name}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </Bench>
        <TokenTable rows={ladder.map((l) => [`rounded-${l.name}`, `${l.r}px`, USES[l.name]]).concat([['rounded-pill', '999px', 'Buttons, segmented, badges, fields, toast']])} />
      </Section>

      <Section title="R1 · Nest" lede={`A surface that touches its container's corner is inset by ${d.nest.inset} and loses ${d.ladder.step} of radius. ${d.nest.inset === d.ladder.step ? 'Inset and step match, so the corners stay parallel.' : 'The inset no longer matches the step, so the gap between corners changes around the curve.'}`}>
        <Bench caption="Alternating raised and well, each step inset and reduced">
          <div className="w-[min(420px,100%)]">{nest(0)}</div>
        </Bench>
      </Section>

      <Section title="R2 · Slab or pill, never between" lede={`A shape of height h has either r ≤ ${d.rules.slabMax}h (a slab) or r = h/2 (a pill). Anything in between reads as a pill that failed to form. Use the classifier dials to try a shape.`}>
        <Bench caption={`Classifier · h${d.classifier.height} · r${d.classifier.radius} · ${cls.kind}`}>
          <div className="flex flex-col items-center gap-24">
            <div
              className={cls.ok ? 'material-cap' : ''}
              style={{
                width: 260,
                height: d.classifier.height,
                borderRadius: d.classifier.radius,
                border: cls.ok ? undefined : '1px dashed var(--mu-ink3)',
              }}
            />
            <div className="flex items-center gap-8">
              <span className="size-6 rounded-full shadow-[0_0_0_.5px_rgba(0,0,0,.25)]" style={{ background: cls.ok ? 'var(--mu-led-green)' : 'var(--mu-led-red)' }} />
              <span className="type-ui text-ink">{cls.kind}</span>
              <span className="type-readout text-ink2">r/h {(d.classifier.radius / d.classifier.height).toFixed(2)}</span>
            </div>
          </div>
        </Bench>
      </Section>

      <Section title="Pill padding" lede={`Text starts where the curve ends: padding = h/2 ${d.rules.pillPadOffset >= 0 ? '+' : '−'} ${Math.abs(d.rules.pillPadOffset)}. The ticks mark the tangent on each side. With an icon first, the icon sits centred in the end cap.`}>
        <Bench caption="Ticks mark where each end cap meets the straight edge">
          <div className="flex flex-col items-start gap-20">
            {[
              { h: 24, text: 'Synced', role: 'type-label' },
              { h: 28, text: 'Grouped', role: 'type-ui' },
              { h: 32, text: 'Cancel', role: 'type-ui' },
              { h: 44, text: 'Deleted 3 blocks', role: 'type-ui' },
            ].map((p) => (
              <div key={p.h} className="flex items-center gap-16">
                <span className={`material-cap relative inline-flex items-center rounded-pill text-ink ${p.role}`} style={{ height: p.h, paddingInline: pad(p.h) }}>
                  <i aria-hidden className="absolute -top-7 h-4 w-px bg-green-deep opacity-70" style={{ left: p.h / 2 }} />
                  <i aria-hidden className="absolute -top-7 h-4 w-px bg-green-deep opacity-70" style={{ right: p.h / 2 }} />
                  {p.text}
                </span>
                <span className="type-readout text-ink2">h{p.h} · pad {pad(p.h)}</span>
              </div>
            ))}
          </div>
        </Bench>
      </Section>

      <Section title="Rules">
        <Rules
          rules={[
            { id: 'R1', title: 'Nest', body: `Inset ${d.nest.inset}, radius −${d.ladder.step}: 36 → 30 → 24 → 18 → 12 → 6. Shapes that do not touch a corner (a row in the middle of a list) take the radius their height calls for.` },
            { id: 'R2', title: 'Slab or pill', body: `r ≤ ${d.rules.slabMax}h, or r = h/2. Toolbar buttons at h36 r15, the palette field at h36 r17 and the slats at h38 r16 all broke this; they become circles, pills and r12 slabs.` },
            { id: 'R3', title: 'Rings stay concentric', body: 'A ring offset by o from a shape of radius r has radius r + o. Focus: offset 2. Selection: offset 6, so a 24 card gets a 30 ring.' },
            { id: 'R4', title: 'Content inset is ⅔ r', body: 'r12 → 8, r18 → 12, r24 → 16, r30 → 20, r36 → 24. The first line clears the curve, and the gap looks even at corners and sides.' },
          ]}
        />
      </Section>
    </>
  );
}
