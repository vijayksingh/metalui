import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Icon, ICON_CATALOG, ICON_NAMES, type IconName } from '@unlocalhosted/metalui/icons';
import { Bench, Code, PageHeader, Rules, Section } from '../ui/doc';
import { MorphFilmstrips, MorphParity, MorphPlayground } from '../demos/MorphGlyphs';

const CATEGORIES = ['Tools', 'Actions', 'Status'] as const;
const pascal = (n: string) => n.split('-').map((p) => p[0].toUpperCase() + p.slice(1)).join('');

export default function Icons() {
  const [picked, setPicked] = React.useState<IconName>('send-away');
  const d = useDialKit('Icons', {
    size: [16, 12, 48, 1],
    stroke: [1.7, 1, 2.6, 0.05],
    duotone: [1, 0, 2.5, 0.05],
    animate: true,
    detailSize: [120, 48, 200, 4],
  });
  const ic = ICON_CATALOG[picked];
  const glyphStyle = { '--sw': d.stroke, '--mu-duo-k': d.duotone } as React.CSSProperties;
  const jsx = `import { ${pascal(picked)}Icon } from '@unlocalhosted/metalui/icons';\n\n<${pascal(picked)}Icon size={${d.size}} />`;

  return (
    <>
      <PageHeader
        title="Icons"
        lede={`${ICON_NAMES.length} glyphs, monoline with a duotone fill, on a 24 grid with a 1.7 stroke. Every glyph has its own hover pose (a spring you can interrupt) and press gesture (played once). Hover a key to see its pose; press it to play its gesture.`}
      />

      <Section title="Glyphs">
        {CATEGORIES.map((cat) => {
          const names = ICON_NAMES.filter((n) => ICON_CATALOG[n].category === cat);
          return (
            <div key={cat} className="mb-24 flex flex-col gap-12">
              <div className="flex items-baseline gap-8 px-4">
                <span className="type-label engraved">{cat}</span>
                <span className="type-readout text-ink2">{names.length}</span>
              </div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-x-24 gap-y-8">
                {names.map((name) => {
                  const r = ICON_CATALOG[name];
                  const on = picked === name;
                  return (
                    <button
                      key={name}
                      data-md="row"
                      type="button"
                      aria-pressed={on}
                      onClick={() => setPicked(name)}
                      className="mu-icon-trigger group flex cursor-pointer items-center gap-12 rounded-plate p-6 text-left"
                    >
                      <span className="material-well inline-flex rounded-plate p-4">
                        <span
                          className={[
                            'relative grid size-40 place-items-center rounded-row text-icon transition-[transform,background,box-shadow,color] duration-200 group-hover:text-ink',
                            on ? 'material-pressed translate-y-px text-ink' : 'material-cap',
                          ].join(' ')}
                        >
                          <Icon name={name} size={d.size} animate={d.animate} style={glyphStyle} />
                          {on && <span aria-hidden className="absolute right-5 top-5 size-4 rounded-full bg-[image:var(--mu-led-green)] shadow-[0_0_0_.5px_rgba(0,0,0,.3)]" />}
                        </span>
                      </span>
                      <span className="flex min-w-0 flex-col gap-2">
                        <span className="type-ui text-ink">{r.label}</span>
                        <span className="type-meta truncate text-ink2">{r.hover}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </Section>

      <Section title={ic.label} lede={`Hover: ${ic.hover}. Press: ${ic.press}.`}>
        <div className="grid items-start gap-16 lg:grid-cols-[320px_1fr] [&>*]:min-w-0">
          <Bench caption={`${picked} · press track ${ic.pressMs}ms`}>
            <span className="mu-icon-trigger grid cursor-pointer place-items-center text-icon hover:text-ink">
              <Icon name={picked} size={d.detailSize} animate={d.animate} style={glyphStyle} title={ic.label} />
            </span>
          </Bench>
          <div className="flex flex-col gap-16">
            <Code label="JSX" code={jsx} />
            <div className="flex flex-wrap gap-16">
              <a className="type-ui text-ink" href={`/icons/svg/${picked}.svg`} download>Static SVG</a>
              <a className="type-ui text-ink" href={`/icons/svg/16/${picked}.svg`} download>16px cut</a>
              <a className="type-ui text-ink" href={`/icons/svg-animated/${picked}.svg`} download>Animated SVG</a>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Morph" lede="Any icon in the set becomes any other. The morph is made from what the icons are made of: wires at one weight with round caps, beads (the solid dots), and plates (the tinted and solid bodies). Each part pairs with the part it travels least to become. Wires bend at constant weight, beads draw out into wires, rings open where they meet their new ends, the tint follows the area a wire encloses. A part the next icon lacks gathers into the nearest wire that stays and vanishes into it; a part it gains buds from one. Nothing fades and nothing appears from empty space. Click the large icon to step through the set, or pick one.">
        <Bench caption="Live · every part on one settle spring (k380 c36)">
          <MorphPlayground />
        </Bench>
        <Bench tone="page" caption="Filmstrips · each pair at 0, 20, 40, 60, 80 and 100% of its morph">
          <MorphFilmstrips />
        </Bench>
        <Bench tone="page" caption="At rest · the authored icon (left) and the morph glyph (right) are the same drawing">
          <MorphParity />
        </Bench>
      </Section>

      <Section title="Rules">
        <Rules
          rules={[
            { id: 'I1', title: 'The size follows the control', body: '12 in 20–24 controls, 14 in 28–32, 16 in 36–40, 20 in 44 and up.' },
            { id: 'I2', title: 'The control is the trigger', body: 'Inside any element with the mu-icon-trigger class (MetalUI Buttons already have it), the glyph plays from that element’s hover and press.' },
            { id: 'I3', title: 'Decorative unless titled', body: 'Without a title the glyph is hidden from assistive tech; label the control instead. Under reduced motion it stays still.' },
            { id: 'I4', title: 'Icons that change state morph, they are never replaced', body: 'When a control’s icon changes (paste → check, synced → offline, zoom in → zoom out), use MorphIcon with the next icon’s name. Any icon can become any other; every part moves on one settle spring, from the same frame.', origin: 'Ours' },
            { id: 'I5', title: 'One material', body: 'A bead is a wire of zero length and a plate is a wire’s area filled, so the morph moves material and never swaps it: beads draw out, rings open and close with round caps, tint fills and drains with the area it sits in.', origin: 'Ours' },
            { id: 'I6', title: 'Nothing fades, nothing appears from nowhere', body: 'A part the next icon lacks gathers into the nearest point of a wire that stays, rides along with it and ends at its weight, inside it. A part the next icon gains buds from the nearest point of a wire that stays and grows out of it.', origin: 'Ours' },
          ]}
        />
      </Section>
    </>
  );
}
