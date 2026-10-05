import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Button } from '@unlocalhosted/metalui';
import { Icon, ICON_CATALOG, ICON_NAMES, MorphIcon, type IconName, type MorphTurn } from '@unlocalhosted/metalui/icons';
import { Bench, Code, PageHeader, Rules, Section } from '../ui/doc';
import { Link } from 'react-router';

const CATEGORIES = ['Tools', 'Actions', 'Status'] as const;
const TRANSFER = [
  ['save', 'Retain a document in its storage case.'],
  ['download', 'Receive content into this device.'],
  ['upload', 'Transfer content to the service.'],
  ['send', 'Dispatch a message to its recipient.'],
  ['copy', 'Take a paper copy to the clipboard.'],
  ['external', 'Open a resource outside this context.'],
] as const;
const CONTROLS = [
  ['settings', 'Adjust values along their rails.'],
  ['filter', 'Narrow the result stream.'],
  ['sort', 'Order the result rows.'],
  ['eye', 'Reveal the value through its lens.'],
  ['eye-off', 'Conceal the value behind a shutter.'],
  ['lock', 'Secure access with a closed shackle.'],
] as const;
const ENVIRONMENT = [
  ['info', 'Read the information in its window.'],
  ['warning', 'Attend to an alert in its triangle.'],
  ['sun', 'Show daylight with a complete lit disc.'],
  ['moon', 'Show night with a shaded crescent.'],
  ['sidebar', 'Toggle the navigation rail in its window.'],
] as const;
const IDENTITY = [
  ['stop', 'Stop the current operation at its pad.'],
  ['attach', 'Catch a file in the paperclip jaw.'],
  ['retry', 'Try the operation again along its return route.'],
  ['person', 'Identify a profile or assignee by its portrait.'],
  ['bell', 'Signal a notification with one bell contact.'],
  ['palette', 'Choose the paint or appearance family.'],
] as const;
const LEVELS = [
  ['volume', 'Adjust the sound level at its speaker.'],
  ['brightness', 'Adjust the light level inside its lamp.'],
] as const;
const pascal = (n: string) => n.split('-').map((p) => p[0].toUpperCase() + p.slice(1)).join('');

export default function Icons() {
  const [rail, setRail] = React.useState(false);
  const [sequence, setSequence] = React.useState(0);
  const [picked, setPicked] = React.useState<IconName>('send-away');
  const d = useDialKit('Icons', {
    size: [16, 12, 48, 1],
    stroke: [1.7, 1, 2.6, 0.05],
    duotone: [1, 0, 2.5, 0.05],
    animate: true,
    detailSize: [120, 48, 200, 4],
  });
  const ic = ICON_CATALOG[picked];
  const act = 'motion' in ic ? ic.motion : undefined;
  const glyphStyle = { '--sw': d.stroke, '--mu-duo-k': d.duotone } as React.CSSProperties;
  const jsx = `import { ${pascal(picked)}Icon } from '@unlocalhosted/metalui/icons';\n\n<${pascal(picked)}Icon size={${d.size}} />`;

  return (
    <>
      <PageHeader
        title="Icons"
        lede={`${ICON_NAMES.length} glyphs, monoline with a duotone fill, on a 24 grid with a 1.7 stroke. Every glyph performs one act: its parts do what it means, as objects with weight, on the same springs as the rest of MetalUI. Hover, focus or click a key and the act plays through once.`}
      />

      <Section id="on-demand" title="A result can play its glyph" lede="Increment act after a host action completes. The glyph plays once; it ignores requests while playing, stops when unmounted, and stays still under either motion switch.">
        <div className="mu-cluster gap-mu-related">
          <Icon name="check" act={sequence} data-testid="demand-icon" />
          <Button onClick={() => setSequence(n => n + 1)}>Play result</Button>
        </div>
        <Code lang="tsx" code={`<Icon name="check" act={resultSequence} />
// Increment resultSequence when the work succeeds.`} />
      </Section>
      <Section id="transfer-record" title="Transfer and record" lede="Choose the glyph by where the content goes. Save retains it; download receives it; upload crosses the upper boundary; send dispatches a message; copy takes a second sheet; external leaves the current window.">
        <div className="mu-auto-grid" data-testid="transfer-family">
          {TRANSFER.map(([name, meaning]) => (
            <button key={name} type="button" className="mu-icon-trigger mu-cluster gap-mu-related p-mu-space-12 text-left rounded-plate hover:material-well"
              aria-label={`${ICON_CATALOG[name].label}: ${meaning}`} aria-pressed={picked === name} onClick={() => setPicked(name)} data-transfer={name}>
              <span className="mu-cluster gap-mu-space-8 text-icon" aria-hidden>
                <Icon name={name} size={16} />
                <Icon name={name} size={24} />
              </span>
              <span className="mu-stack gap-mu-space-2">
                <span className="type-ui text-ink">{ICON_CATALOG[name].label}</span>
                <span className="type-meta text-ink2">{meaning}</span>
              </span>
            </button>
          ))}
        </div>
      </Section>
      <Section id="adjust-visibility" title="Adjustment and visibility" lede="Rails adjust values; a funnel narrows results; an ordering shaft sorts them. Eye and Eye-off share a lens while its shutter changes visibility; Lock secures access.">
        <div className="mu-auto-grid" data-testid="controls-family">
          {CONTROLS.map(([name, meaning]) => (
            <button key={name} type="button" className="mu-icon-trigger mu-cluster gap-mu-related p-mu-space-12 text-left rounded-plate hover:material-well"
              aria-label={`${ICON_CATALOG[name].label}: ${meaning}`} aria-pressed={picked === name} onClick={() => setPicked(name)} data-control={name}>
              <span className="mu-cluster gap-mu-space-8 text-icon" aria-hidden>
                <Icon name={name} size={16} />
                <Icon name={name} size={24} />
              </span>
              <span className="mu-stack gap-mu-space-2">
                <span className="type-ui text-ink">{ICON_CATALOG[name].label}</span>
                <span className="type-meta text-ink2">{meaning}</span>
              </span>
            </button>
          ))}
        </div>
      </Section>
      <Section id="status-environment" title="Status and environment" lede="Information uses a round window; warnings use a triangle. Daylight and night keep distinct silhouettes. A sidebar rail slides inside its window, and the same glyph turns for a rail on the opposite side.">
        <div className="mu-auto-grid" data-testid="environment-family">
          {ENVIRONMENT.map(([name, meaning]) => (
            <button key={name} type="button" className="mu-icon-trigger mu-cluster gap-mu-related p-mu-space-12 text-left rounded-plate hover:material-well"
              aria-label={`${ICON_CATALOG[name].label}: ${meaning}`} aria-pressed={picked === name} onClick={() => setPicked(name)} data-environment={name}>
              <span className="mu-cluster gap-mu-space-8 text-icon" aria-hidden>
                <Icon name={name} size={16} />
                <Icon name={name} size={24} />
              </span>
              <span className="mu-stack gap-mu-space-2">
                <span className="type-ui text-ink">{ICON_CATALOG[name].label}</span>
                <span className="type-meta text-ink2">{meaning}</span>
              </span>
            </button>
          ))}
        </div>
      </Section>
      <Section id="action-identity" title="Actions and identity" lede="Stop ends an operation; Retry makes another attempt. Attach catches a file. Person names a profile, Bell a notification, and Palette a paint family. Their moving parts describe a single contact and rest.">
        <div className="mu-auto-grid" data-testid="identity-family">
          {IDENTITY.map(([name, meaning]) => (
            <button key={name} type="button" className="mu-icon-trigger mu-cluster gap-mu-related p-mu-space-12 text-left rounded-plate hover:material-well"
              aria-label={`${ICON_CATALOG[name].label}: ${meaning}`} aria-pressed={picked === name} onClick={() => setPicked(name)} data-identity={name}>
              <span className="mu-cluster gap-mu-space-8 text-icon" aria-hidden>
                <Icon name={name} size={16} />
                <Icon name={name} size={24} />
              </span>
              <span className="mu-stack gap-mu-space-2">
                <span className="type-ui text-ink">{ICON_CATALOG[name].label}</span>
                <span className="type-meta text-ink2">{meaning}</span>
              </span>
            </button>
          ))}
        </div>
      </Section>
      <Section id="signal-levels" title="Signal levels" lede="A speaker names sound level; a half-lit lamp names light level. These are adjustments. Bell names a notification, while Sun and Moon name daylight and night.">
        <div className="mu-auto-grid" data-testid="levels-family">
          {LEVELS.map(([name, meaning]) => (
            <button key={name} type="button" className="mu-icon-trigger mu-cluster gap-mu-related p-mu-space-12 text-left rounded-plate hover:material-well"
              aria-label={`${ICON_CATALOG[name].label}: ${meaning}`} aria-pressed={picked === name} onClick={() => setPicked(name)} data-level={name}>
              <span className="mu-cluster gap-mu-space-8 text-icon" aria-hidden>
                <Icon name={name} size={16} />
                <Icon name={name} size={24} />
              </span>
              <span className="mu-stack gap-mu-space-2">
                <span className="type-ui text-ink">{ICON_CATALOG[name].label}</span>
                <span className="type-meta text-ink2">{meaning}</span>
              </span>
            </button>
          ))}
        </div>
      </Section>
      <Section id="sidebar-panels" title="A panel becomes a rail" lede="The window keeps its shell while the navigation boundary moves inward. Word marks withdraw when collapsed. Mirroring the physical side is a separate choice.">
        <div data-testid="sidebar-glyph-family" className="mu-stack gap-mu-space-16">
          <span className="mu-cluster gap-mu-space-16 text-icon" aria-hidden>{(['sidebar', 'sidebar-collapsed'] as const).map((name) => <span key={name} className="mu-cluster gap-mu-space-8">{[14, 16, 24].map((size) => <Icon key={size} name={name} size={size} />)}</span>)}</span>
          <Button aria-label={rail ? 'Expand navigation panel' : 'Collapse navigation panel'} aria-expanded={!rail} onClick={() => setRail((v) => !v)} icon={<MorphIcon name={rail ? 'sidebar-collapsed' : 'sidebar'} size={16} />}>{rail ? 'Expand' : 'Collapse'}</Button>
        </div>
      </Section>
      <Section id="confirmation" title="A committed edit" lede="Spark acknowledges an edit only after its host commits the value. One contact opens its four-point receipt; it keeps the whole shape at rest and with reduced motion.">
        <button type="button" data-testid="confirmation-glyph" className="mu-icon-trigger mu-cluster gap-mu-related p-mu-space-12 rounded-plate hover:material-well" aria-label="Spark: committed edit">
          <span className="mu-cluster gap-mu-space-12 text-icon" aria-hidden>{[14, 16, 24].map((size) => <Icon key={size} name="spark" size={size} />)}</span>
          <span className="type-meta text-ink2">14px / 16px / 24px</span>
        </button>
      </Section>
      <Section id="amount" title="Amount" lede="The coin names a monetary amount without assuming its currency. Two minted rims enclose a stamp; one short tilt reveals its edge and restores the face.">
        <button type="button" data-testid="amount-glyph" aria-label="Coin: monetary amount" className="mu-icon-trigger mu-cluster gap-mu-related p-mu-space-12 rounded-plate hover:material-well">
          <Icon name="coin" size={16} /><Icon name="coin" size={24} /><span className="type-ui text-ink">$40 · €36</span>
        </button>
      </Section>
      <Section id="playback" title="Playback" lede="Play advances or resumes a transport; Pause holds its amount for resumption. Both remain complete when motion is reduced, and perform one short act when their host is handled.">
        <div className="mu-cluster gap-mu-related" data-testid="playback-family">
          {(['play', 'pause'] as const).map(name => (
            <button key={name} type="button" className="mu-icon-trigger mu-cluster gap-mu-related p-mu-space-12 text-left rounded-plate hover:material-well"
              aria-label={name === 'play' ? 'Play: advance or resume' : 'Pause: hold for resumption'} aria-pressed={picked === name} onClick={() => setPicked(name)} data-playback={name}>
              <Icon name={name} size={16} /><Icon name={name} size={24} />
              <span className="type-ui text-ink">{ICON_CATALOG[name].label}</span>
            </button>
          ))}
          <button type="button" className="mu-icon-trigger mu-cluster gap-mu-related p-mu-space-12 rounded-plate hover:material-well"
            aria-label="Change transport state" onClick={() => setPicked(picked === 'pause' ? 'play' : 'pause')} data-testid="playback-morph">
            <MorphIcon name={picked === 'pause' ? 'pause' : 'play'} /><span className="type-ui text-ink">Change transport state</span>
          </button>
        </div>
      </Section>
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

      <Section title={ic.label} lede={act ? `${act.caption} ${act.stages.join(' → ')}.` : `Hover: ${ic.hover}. Press: ${ic.press}.`}>
        <div className="grid items-start gap-16 lg:grid-cols-[320px_1fr] [&>*]:min-w-0">
          <Bench caption={act ? `${picked} · one act, ${act.duration}ms` : `${picked} · press track ${ic.pressMs}ms`}>
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

      <Turns />

      <Section id="morph" title="Morph" lede={<>Icons that change state morph into the next glyph instead of being swapped. The playground, live controls, filmstrips, strain and the morph rules have <Link to="/icons/morph">their own page</Link>.</>} />

      <Section title="Rules">
        <Rules
          rules={[
            { id: 'I1', title: 'The size follows the control', body: '12 in 20–24 controls, 14 in 28–32, 16 in 36–40, 20 in 44 and up.' },
            { id: 'I2', title: 'The control is the trigger', body: 'Inside any element with the mu-icon-trigger class (MetalUI Buttons already have it), the glyph plays its act from that element’s hover, keyboard focus and click, once through, even if the pointer leaves.' },
            { id: 'I3', title: 'Decorative unless titled', body: 'Without a title the glyph is hidden from assistive tech; label the control instead. Under reduced motion it stays still.' },
            { id: 'I9', title: 'New icons follow the grammar', body: 'One body and one to three marks, 40–90 units of wire on the keyline, at most one clearance, its act authored on its own parts. docs/ICON-GRAMMAR.md has the build spec, the evidence, and the process: lint it, score its strain against its neighbours, then author it.', origin: 'Ours; the idea of a shared construction is adapted from Benji Taylor' },
            { id: 'I10', title: 'Every glyph performs one act', body: 'An icon’s motion is its meaning played on its own parts: anticipate, act, settle, with a small response where the action lands. Parts have mass and real pivots and move on the system’s springs; the act starts and ends exactly at the drawn glyph. The same data plays on the web, in the standalone SVG and in SwiftUI. docs/ICON-MOTION.md has the format and the rules.', origin: 'Adapted from Dither Icons' },
          ]}
        />
      </Section>
    </>
  );
}

const TURNS: { turn: MorphTurn; label: string }[] = [
  { turn: 0, label: 'down · 0' },
  { turn: 90, label: 'left · 90' },
  { turn: 180, label: 'up · 180' },
  { turn: 270, label: 'right · 270' },
];

/** One chevron, four directions: a set direction turns the Icon; a changing one morphs. */
function Turns() {
  const [open, setOpen] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  return (
    <Section id="turn" title="Turn" lede="A direction is not a new glyph. The chevron is drawn once, pointing down, and turn points it left, up or right; its act turns with it, so the thrust always goes the way it points. When the direction is the state, the glyph morphs to the turned one.">
      <div className="grid gap-16 lg:grid-cols-2 [&>*]:min-w-0">
        <Bench caption="Icon · turn={0 | 90 | 180 | 270} · hover one">
          <div className="flex flex-wrap items-end justify-center gap-24" data-testid="chevron-turns">
            {TURNS.map(({ turn, label }) => (
              <span key={turn} className="mu-icon-trigger flex cursor-pointer flex-col items-center gap-8 text-icon hover:text-ink">
                <Icon name="chevron" size={32} turn={turn} />
                <span className="type-doc-caption text-ink3">{label}</span>
              </span>
            ))}
          </div>
        </Bench>
        <Bench caption="MorphIcon · the turn is the state">
          <div className="flex flex-wrap items-center justify-center gap-24">
            <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="mu-icon-trigger flex cursor-pointer flex-col items-center gap-8 text-icon hover:text-ink" data-testid="chevron-disclose">
              <MorphIcon name="chevron" size={32} turn={open ? 180 : 0} />
              <span className="type-doc-caption text-ink3">{open ? 'open · 180, turned over' : 'closed · 0'}</span>
            </button>
            <button type="button" aria-expanded={expanded} onClick={() => setExpanded((v) => !v)} className="mu-icon-trigger flex cursor-pointer flex-col items-center gap-8 text-icon hover:text-ink" data-testid="chevron-expand">
              <MorphIcon name="chevron" size={32} turn={expanded ? 0 : 270} />
              <span className="type-doc-caption text-ink3">{expanded ? 'expanded · 0' : 'collapsed · 270, a quarter turn'}</span>
            </button>
          </div>
        </Bench>
      </div>
      <Code label="JSX" code={`import { ChevronIcon, MorphIcon } from '@unlocalhosted/metalui/icons';\n\n<ChevronIcon turn={270} />                           // a set direction: next\n<MorphIcon name="chevron" turn={open ? 180 : 0} />   // a direction that is state\n\n// SwiftUI: MetalIcon(.chevron).rotationEffect(.degrees(270))`} />
    </Section>
  );
}
