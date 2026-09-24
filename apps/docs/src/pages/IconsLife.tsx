import * as React from 'react';
import { useDialKit } from 'dialkit';
import { LifeIcon, LIFE_CATALOG, LIFE_CATEGORIES, LIFE_ICON_NAMES, searchLifeIcons, type LifeCategory, type LifeIconName } from '@unlocalhosted/metalui/icons/life';
import { Bench, Code, CopyButton, PageHeader, Rules, Section, TokenTable } from '../ui/doc';

const pascal = (n: string) => n.split('-').map((p) => p[0].toUpperCase() + p.slice(1)).join('');
const CATS = Object.keys(LIFE_CATEGORIES) as LifeCategory[];

/** The static SVG for a glyph, as the generator exports it. */
function useSvg(name: LifeIconName) {
  const [svg, setSvg] = React.useState('');
  React.useEffect(() => {
    let live = true;
    fetch(`/icons/life/svg/${name}.svg`).then((r) => r.text()).then((t) => live && setSvg(t)).catch(() => {});
    return () => { live = false; };
  }, [name]);
  return svg;
}

export default function IconsLife() {
  const [query, setQuery] = React.useState('');
  const [picked, setPicked] = React.useState<LifeIconName>('breakfast');
  const d = useDialKit('Life icons', {
    tints: true,
    animate: true,
    detailSize: [120, 48, 200, 4],
  });
  const found = React.useMemo(() => new Set(searchLifeIcons(query)), [query]);
  const ranked = React.useMemo(() => searchLifeIcons(query), [query]);
  const g = LIFE_CATALOG[picked];
  const svg = useSvg(picked);
  const tint = d.tints ? undefined : (false as const);
  const jsx = `import { Life${pascal(picked)}Icon } from '@unlocalhosted/metalui/icons/life';\nimport '@unlocalhosted/metalui/icons/life.css';\n\n<Life${pascal(picked)}Icon size={16} />`;
  const swift = `MetalLifeIcon(.${picked.replace(/-(\w)/g, (_, c) => c.toUpperCase())}, size: 16)`;

  return (
    <>
      <PageHeader
        title="Life icons"
        lede={`${LIFE_ICON_NAMES.length} glyphs for what a day is made of: meals, sleep, the body, feelings, work, people, places, making, money, chores, the time of day and the weather. Same construction as the product set. Each has one short hover interaction and no press, because a glyph on a line is not a control. Feelings carry a tint that names the kind of feeling. Search by any word a person might write: "brekkie" finds breakfast.`}
      />

      <Section title="The set">
        <div className="flex flex-col gap-24">
          <label className="material-well flex h-40 w-full max-w-[420px] items-center gap-8 rounded-pill px-15">
            <span className="sr-only">Search life icons</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search: brekkie, gym, knackered…"
              className="type-ui w-full bg-transparent text-ink outline-none placeholder:text-ink3"
            />
            <span className="type-readout shrink-0 text-ink2" aria-live="polite">{found.size}</span>
          </label>
          {query && (
            <div className="flex flex-col gap-8" data-testid="life-results">
              <span className="type-label engraved px-4">Best match first</span>
              <div className="flex flex-wrap gap-8">
                {ranked.slice(0, 12).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPicked(n)}
                    className="mu-icon-trigger material-cap type-ui flex h-32 cursor-pointer items-center gap-6 rounded-pill px-12 text-ink"
                  >
                    <LifeIcon name={n} size={16} tint={tint} animate={d.animate} />
                    {LIFE_CATALOG[n].label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {CATS.map((cat) => {
            const names = LIFE_ICON_NAMES.filter((n) => LIFE_CATALOG[n].category === cat && found.has(n));
            if (!names.length) return null;
            return (
              <div key={cat} className="flex flex-col gap-12">
                <div className="flex items-baseline gap-8 px-4">
                  <span className="type-label engraved">{LIFE_CATEGORIES[cat]}</span>
                  <span className="type-readout text-ink2">{names.length}</span>
                </div>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(168px,1fr))] gap-8">
                  {names.map((name) => {
                    const r = LIFE_CATALOG[name];
                    const on = picked === name;
                    return (
                      <button
                        key={name}
                        data-md="row"
                        data-glyph={name}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setPicked(name)}
                        className={['mu-icon-trigger group flex cursor-pointer flex-col gap-8 rounded-plate p-10 text-left transition-[background,box-shadow] duration-200', on ? 'material-raised' : 'hover:bg-[color-mix(in_srgb,var(--mu-ink)_4%,transparent)]'].join(' ')}
                      >
                        <span className="flex items-end gap-10 text-icon group-hover:text-ink">
                          <span className="material-well grid size-40 place-items-center rounded-row">
                            <LifeIcon name={name} size={24} tint={tint} animate={d.animate} />
                          </span>
                          <LifeIcon name={name} size={16} tint={tint} animate={d.animate} />
                          <LifeIcon name={name} size={14} tint={tint} animate={d.animate} />
                        </span>
                        <span className="flex flex-col gap-2">
                          <span className="type-ui text-ink">{r.label}</span>
                          <span className="type-meta line-clamp-2 text-ink2">{r.hover}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {!found.size && <p className="prose-body text-ink2">Nothing means “{query}” yet. Try the thing itself: coffee, run, tired.</p>}
        </div>
      </Section>

      <Section title={g.label} lede={`Hover: ${g.hover} (${g.hoverMs} ms). ${g.tint ? `Tint: ${g.tint}.` : 'Ink, no tint.'} Recognised by ${g.hook}.`}>
        <div className="grid items-start gap-16 lg:grid-cols-[320px_1fr] [&>*]:min-w-0">
          <Bench caption={`${picked} · 24 · 16 tuned · 14`}>
            <div className="mu-icon-trigger flex cursor-pointer flex-col items-center gap-16 text-icon hover:text-ink" data-testid="life-detail">
              <LifeIcon name={picked} size={d.detailSize} tint={tint} animate={d.animate} title={g.label} />
              <div className="flex items-end gap-16">
                <LifeIcon name={picked} size={24} tint={tint} animate={d.animate} />
                <LifeIcon name={picked} size={16} tint={tint} animate={d.animate} />
                <LifeIcon name={picked} size={14} tint={tint} animate={d.animate} />
              </div>
            </div>
          </Bench>
          <div className="flex flex-col gap-16">
            <div className="flex flex-wrap gap-8">
              <CopyButton text={svg} label="Copy SVG" />
              <CopyButton text={picked} label="Copy name" />
            </div>
            <TokenTable
              head={['Field', 'Value']}
              mono={[0]}
              rows={[
                ['synonyms', g.synonyms.join(', ')],
                ['valence · energy', g.valence ? `${g.valence} · ${g.energy}` : '–'],
                ['SF Symbol', `mu.life.${picked} · mu.life.${picked}.16`],
              ]}
            />
            <Code label="React" code={jsx} />
            <Code label="SwiftUI" code={swift} />
          </div>
        </div>
      </Section>

      <Section title="On a line" lede="One glyph per block, trailing after a middle dot in ink3, ink2 when the block is hovered; feelings carry their tint. The block is the glyph’s host: hovering anywhere on it plays the glyph.">
        <Bench tone="page" caption="Three blocks · hover each line">
          <div className="flex flex-col gap-8">
            {([['slept badly, up at 5', 'bad-night'], ['brekkie with Sam before work', 'breakfast'], ['feeling calm after the walk', 'calm']] as [string, LifeIconName][]).map(([text, n]) => (
              <p key={n} className="mu-icon-trigger group type-content cursor-default text-ink">
                {text}
                <span className="text-ink3"> · </span>
                <span className="inline-block align-[-2.5px] text-ink3 group-hover:text-ink2">
                  <LifeIcon name={n} size={16} tint={tint} animate={d.animate} />
                </span>
              </p>
            ))}
          </div>
        </Bench>
      </Section>

      <Section title="Rules">
        <Rules
          rules={[
            { id: 'L1', title: 'One glyph per block, trailing', body: 'The first recognised event wins; the others are named in the hover engraving. Never a chip for a glyph, never while writing, so a glyph cannot move text.', origin: 'Kamui 03 §3, DS-27' },
            { id: 'L2', title: 'Hover only, never a press', body: 'Each glyph has one short interaction (0.4–1.2 s) that plays once or twice and never loops. The host (the block, a row) is the trigger. Under reduced motion it stays still.', origin: 'Kamui MAPPING.md' },
            { id: 'L3', title: 'Sizes by place', body: '16, the tuned cut at stroke 1.85, trailing a block; 14 on the day strip; 24 in a well beside a metric.', origin: 'Kamui 05 §5' },
            { id: 'L4', title: 'Only feelings are tinted', body: 'Feelings, the two energy states and a few moments with an unmistakable feeling carry their tint on the stroke. Everything else is ink. Tints go with one setting and under Increase Contrast; the shape still carries the meaning.', origin: 'DS-42' },
            { id: 'L5', title: 'Import from the subpath', body: '@unlocalhosted/metalui/icons/life keeps the main entry small; import its CSS once.', origin: 'Ours' },
          ]}
        />
      </Section>
    </>
  );
}
