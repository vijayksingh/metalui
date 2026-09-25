import * as React from 'react';
import { Link } from 'react-router';
import { Button, Folder, LinkCard, Region, Select, SelectionFrame, Switcher } from '@unlocalhosted/metalui';
import { PageHeader, Rules, Section, Bench } from '../ui/doc';
import { LayerSorter } from '../ui/LayerSorter';
import { LAYERS, membersOf, partLabel } from '../app/parts';
import './layers.css';

/* HOW IT FITS TOGETHER: the six layers of docs/COMPOSITION.md, taught with one live scene.
 * Pick a layer and everything in the scene that belongs to it is outlined. */

type LayerId = 'foundation' | (typeof LAYERS)[number]['layer'];

const ABOUT: Record<LayerId, { label: string; what: string; test: string; scene: string }> = {
  foundation: {
    label: 'Foundations',
    what: 'Values and rules: colour, type, spacing, radius, elevation, materials and springs.',
    test: 'A value, not a shape.',
    scene: 'Every colour, radius, shadow and spring in the scene. Nothing on screen is drawn without one.',
  },
  part: {
    label: 'Parts',
    what: 'The pieces cut from the materials: a well, a plate, a label, a glyph, an LED, a keycap.',
    test: 'Has a look but no job. Never used alone.',
    scene: "The region's name, rule and count, the folder's count, and the link's tag with its LED.",
  },
  component: {
    label: 'Components',
    what: 'Controls with one job, the same in any app: a button, a select, tabs, a menu.',
    test: 'You operate it to change something else.',
    scene: 'The Unfold button and the sort select.',
  },
  object: {
    label: 'Objects',
    what: "Things with a body that stand for a person's stuff: a folder, a card, a connector.",
    test: 'You could hold it. It stays on the canvas.',
    scene: 'The folder and the link card.',
  },
  instrument: {
    label: 'Instruments',
    what: 'What your hand uses, and what the canvas draws while you work: the selection frame, the lasso, a cursor.',
    test: 'Shows up only while you act. Gone when you stop.',
    scene: 'The selection frame and its size readout. It is here only now, as if you had picked up the folder; an instrument shows up only while you act.',
  },
  place: {
    label: 'Places',
    what: 'Where things live: a region, a lens, the past.',
    test: 'Has area. Holds objects. You go in or look through.',
    scene: 'The region that holds both.',
  },
};

const ORDER: LayerId[] = ['foundation', 'part', 'component', 'object', 'instrument', 'place'];

const PEEKS = [
  { id: 'poster', thumb: 'linear-gradient(135deg,#F2A56B,#E0673C 60%,#9E3B25)' },
  { id: 'type', thumb: 'radial-gradient(60% 60% at 30% 30%,#7FA8FF,#2B3F8F)', link: true },
  { id: 'night', thumb: 'linear-gradient(160deg,#3D4B45,#1E2623)' },
];

const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'name', label: 'By name' },
];

function Scene() {
  const [lit, setLit] = React.useState<LayerId>('object');
  const [sort, setSort] = React.useState('newest');
  return (
    <div className="flex w-full flex-col items-center gap-24">
      <Switcher aria-label="Show a layer" size="compact" value={lit} onValueChange={setLit} options={ORDER.map((id) => ({ value: id, label: ABOUT[id].label }))} />
      <div className="layers-scene flex flex-col items-center gap-20" data-lit={lit}>
        <div className="relative">
          <div data-layer="place" className="layers-mark rounded-card">
            <Region name="moodboard" rule="folders and links" count={2} width={540} height={300} />
          </div>
          <div className="absolute inset-0 flex items-end justify-center gap-40 pb-24">
            <div data-layer="object" className="layers-mark relative rounded-plate">
              <Folder name="poster refs" count={3} peeks={PEEKS} hue="violet" />
              {lit === 'instrument' && (
                <span data-layer="instrument" className="pointer-events-none absolute inset-0 rounded-plate">
                  <SelectionFrame state="selected" radius={18} readout size={{ width: 168, height: 150 }} />
                </span>
              )}
            </div>
            <div data-layer="object" className="layers-mark rounded-plate">
              <LinkCard href="https://are.na/moodboard/posters" host="are.na" path="/moodboard/posters" />
            </div>
          </div>
        </div>
        <div data-layer="component" className="layers-mark flex items-center gap-12 rounded-row">
          <Button>Unfold</Button>
          <Select aria-label="Sort" size="compact" options={SORTS} value={sort} onValueChange={setSort} />
        </div>
      </div>
      <p className="type-doc-prose max-w-[60ch] text-center text-ink2">
        <b className="text-ink">{ABOUT[lit].label}.</b> {ABOUT[lit].scene}
      </p>
    </div>
  );
}

function Ladder() {
  return (
    <ol className="flex flex-col">
      {ORDER.map((id, i) => {
        const a = ABOUT[id];
        const members = id === 'foundation' ? [] : membersOf(id);
        return (
          <li key={id} className="grid grid-cols-[2ch_1fr] gap-x-16 border-b border-[var(--mu-rule)] py-16 last:border-0">
            <span className="type-label engraved pt-4">{i + 1}</span>
            <div className="flex flex-col gap-6">
              <span className="type-title">{a.label}</span>
              <span className="type-doc-prose max-w-[64ch] text-ink2">{a.what}</span>
              <span className="type-doc-prose max-w-[64ch]"><span className="type-label engraved">Test</span> {a.test}</span>
              {id === 'foundation' ? (
                <span className="type-doc-prose text-ink2"><Link to="/foundations">The foundation pages</Link></span>
              ) : (
                <span className="type-doc-prose max-w-[64ch] text-ink2">
                  {members.flatMap((m, k) => [
                    k > 0 ? ', ' : null,
                    m.page ? <Link key={m.name} to={m.page}>{partLabel(m)}</Link> : <span key={m.name}>{partLabel(m)}</span>,
                  ])}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

const DOWN = [
  { layer: 'Places', body: 'A region holds the folder. The region is where it lives on the canvas.' },
  { layer: 'Objects', body: 'The folder is the thing: you drag things into it and carry it around.' },
  { layer: 'Parts', body: 'It is made of a frosted plate for the flap, a back panel, labels for the name and count, and the cards that peek out.' },
  { layer: 'Foundations', body: 'Those take the frost material, the hinge spring that swings the flap, the ink colours and the card radius.' },
];

const LINES = [
  { id: 'L1', title: 'Physical is the style, not the layer', body: 'Everything in MetalUI is Soft Hardware: a button is a cap, a switch is a lever. So looking physical never decides where something goes. What it is to the person does.' },
  { id: 'L2', title: 'Component or object', body: 'A control changes something else. An object is the thing. You do not put a button in a folder, and you do not press a card to change a setting.' },
  { id: 'L3', title: 'Object or instrument', body: 'An object stays when you let go. A selection frame, a snap guide or a cursor does not.' },
  { id: 'L4', title: 'Only from the layers before', body: 'A part never uses a component, and a component never uses an object. The layer check fails the build when that breaks, so the order above is always true.' },
];

export default function Layers() {
  return (
    <>
      <PageHeader
        title="How it fits together"
        lede="MetalUI is six layers. Each one is built only from the layers before it: values make parts, parts make controls and things, and things live in places."
      />
      <Section title="One scene, six layers" lede="Pick a layer. Everything in the scene that belongs to it is outlined.">
        <Bench className="min-h-[520px]">
          <Scene />
        </Bench>
      </Section>
      <Section title="The six layers" lede="What each layer is, the test that puts something in it, and what is in it today.">
        <Ladder />
      </Section>
      <Section title="How to decide" lede="Ask the six questions in order and stop at the first yes. The order matters: a keycap looks like something you press, but the second question catches it first.">
        <Bench>
          <LayerSorter />
        </Bench>
      </Section>
      <Section title="One thing, all the way down" lede="Follow the folder from where it lives to what it is made of.">
        <ol className="flex flex-col">
          {DOWN.map((d) => (
            <li key={d.layer} className="grid grid-cols-[14ch_1fr] gap-x-16 border-b border-[var(--mu-rule)] py-12 last:border-0">
              <span className="type-label engraved pt-4">{d.layer}</span>
              <span className="type-doc-prose max-w-[60ch]">{d.body}</span>
            </li>
          ))}
        </ol>
        <p className="type-doc-prose max-w-[64ch] pt-16 text-ink2">
          Two more layers act on it without being part of it: the selection frame (an instrument) shows up only while you hold it, and the Unfold button (a component) is how you open it.
        </p>
      </Section>
      <Section title="Where the lines are">
        <Rules rules={LINES} />
      </Section>
      <Section title="Adding something new">
        <ol className="type-doc-prose flex max-w-[64ch] list-decimal flex-col gap-8 pl-20">
          <li>Find its layer with the tests above. When two seem to fit, it goes in the earlier one unless that clearly fails.</li>
          <li>If it needs a look no part has, make the part first.</li>
          <li>Name the layer in its <code>meta.json</code>. The nav and the layer check read it from there.</li>
        </ol>
      </Section>
    </>
  );
}
