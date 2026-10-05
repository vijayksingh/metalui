import * as React from 'react';
import { Link } from 'react-router';
import { useDialKit } from 'dialkit';
import { Button, SwapText } from '@unlocalhosted/metalui';
import { MORPH_NAMES, MorphIcon, type MorphIconName, type MorphTurn } from '@unlocalhosted/metalui/icons';
import { MorphFilmstrips, MorphParity, MorphPlayground } from '../demos/MorphGlyphs';
import { Bench, Code, PageHeader, Rules, Section } from '../ui/doc';

/* ─────────────────────────────────────────────────────────
 * MORPH · the page for icons that change state
 *
 *   try it        the playground: any wire glyph becomes any other
 *   in controls   real Buttons whose glyph is their state; pressing one morphs it
 *   code          MorphIcon with the next name; a direction is a turn
 *   filmstrips    each pair at six points, with its strain
 *   at rest       the morph glyph and the authored icon are one drawing
 *   rules         the morph's grammar (moved here from the product guide)
 * Reduced motion: every glyph changes in place; the controls still change state.
 * ───────────────────────────────────────────────────────── */

type Control = { id: string; on: [MorphIconName, string]; off: [MorphIconName, string] };
const CONTROLS: Control[] = [
  { id: 'send', on: ['send', 'Send'], off: ['stop', 'Stop'] },
  { id: 'visibility', on: ['eye', 'Show'], off: ['eye-off', 'Hide'] },
  { id: 'sync', on: ['synced', 'Synced'], off: ['offline', 'Offline'] },
  { id: 'transport', on: ['play', 'Play'], off: ['pause', 'Pause'] },
  { id: 'count', on: ['plus', 'Add'], off: ['minus', 'Remove'] },
  { id: 'zoom', on: ['zoom-in', 'Zoom in'], off: ['zoom-out', 'Zoom out'] },
  { id: 'panel', on: ['sidebar', 'Collapse'], off: ['sidebar-collapsed', 'Expand'] },
  { id: 'paste', on: ['paste', 'Paste'], off: ['check', 'Pasted'] },
];

function MorphControl({ control }: { control: Control }) {
  const [flipped, setFlipped] = React.useState(false);
  const [name, label] = flipped ? control.off : control.on;
  return <Button data-morph-control={control.id} icon={<MorphIcon name={name} />} onClick={() => setFlipped(value => !value)}>
    <SwapText value={label} />
  </Button>;
}

function Disclosure() {
  const [open, setOpen] = React.useState(false);
  const turn: MorphTurn = open ? 180 : 0;
  return <Button aria-expanded={open} icon={<MorphIcon name="chevron" turn={turn} />} onClick={() => setOpen(value => !value)}>
    <SwapText value={open ? 'Less' : 'More'} />
  </Button>;
}

const USAGE = `import { MorphIcon } from '@unlocalhosted/metalui/icons';

// The glyph is the control's state: change the name, and it morphs from what is on screen.
<Button icon={<MorphIcon name={synced ? 'synced' : 'offline'} />}>
  <SwapText value={synced ? 'Synced' : 'Offline'} />
</Button>

// A direction is a turn of one glyph, never your own rotation.
<MorphIcon name="chevron" turn={open ? 180 : 0} />`;

const SWIFT = `MetalMorphIcon(synced ? .synced : .offline, size: 16)
MetalMorphIcon(.chevron, turn: open ? .up : .down)`;

export default function IconMorph() {
  const d = useDialKit('Morph playground', { size: [96, 48, 160, 8] });
  return <>
    <PageHeader title="Morph" kicker="Icons · Morph" lede={`When a control's icon changes state, the glyph becomes the next one: it never swaps. Any of the ${MORPH_NAMES.length} wire glyphs can morph into any other, on one settle spring, and an interrupted morph continues from what is on screen.`} />

    <Section id="try" title="Try it" lede="Pick a glyph, or click the large one to step through the family. Each part pairs with the part it takes least energy to become and rides there as one rigid thing.">
      <Bench caption="Live · every part on one settle spring (k380 c36)">
        <MorphPlayground size={d.size} />
      </Bench>
    </Section>

    <Section id="in-controls" title="In controls" lede="The glyph is the control's state, so pressing the control morphs it. The label turns on the drum alongside it.">
      <Bench caption="Press any control · reduced motion changes them in place">
        <div className="mu-cluster gap-mu-related justify-center">
          {CONTROLS.map(control => <MorphControl key={control.id} control={control} />)}
          <Disclosure />
        </div>
      </Bench>
    </Section>

    <Section id="code" title="Code">
      <div className="mu-stack gap-mu-related"><Code label="React" code={USAGE} /><Code label="SwiftUI" code={SWIFT} /></div>
    </Section>

    <Section id="filmstrips" title="Filmstrips" lede="Each pair at 0, 20, 40, 60, 80 and 100% of its morph, so the in-between glyphs can be judged. Strain under 1 reads as one object changing; between 1 and 2 as an honest transformation; at 2 and over the pair should not morph directly.">
      <Bench tone="page" caption="Pairs products actually switch between, then a few far ones">
        <MorphFilmstrips />
      </Bench>
    </Section>

    <Section id="at-rest" title="At rest" lede="When a morph settles it is the authored icon, exactly. Each pair below is the icon (left) and the morph's last frame (right).">
      <Bench tone="page" caption={`All ${MORPH_NAMES.length} glyphs of the morph family`}>
        <MorphParity />
      </Bench>
    </Section>

    <Section id="rules" title="Rules" lede={<>Which glyphs belong to the family and how a new one joins are in <Link to="/icons/guide">the product icon guide</Link> and docs/MORPH.md.</>}>
      <Rules rules={[
        { id: 'I4', title: 'Icons that change state morph, they are never replaced', body: 'When a control’s icon changes (paste → check, synced → offline, zoom in → zoom out), use MorphIcon with the next icon’s name. Any wire icon can become any other; every part moves on one settle spring, from the same frame, and an interrupted morph continues from the frame on screen.', origin: 'Ours' },
        { id: 'I5', title: 'One material, one depth', body: 'A bead is a wire of zero length and tint is the area a wire holds, so the morph moves material and never swaps it: beads draw out, rings open and close with round caps, tint fills and drains with its area, solid ink is conserved. Depth is live: a clearance travels with the part that casts it, so parts keep their distance while they move and nothing tears.', origin: 'Ours' },
        { id: 'I6', title: 'Nothing fades, nothing appears from nowhere', body: 'A part the next icon lacks tucks behind a body that can hide it, or gathers into the nearest point of a wire that stays and ends at its weight, inside it. A part the next icon gains emerges from behind a body or buds from a staying wire. A mirror pair (undo ↔ redo) turns over on its axis.', origin: 'Ours' },
        { id: 'I7', title: 'Strain says when not to morph', body: 'Every plan carries a strain (travel, lone material, topology, traits, crossing). Under 1 a change reads as one object; between 1 and 2 it is an honest transformation; at 2 and over the icons should be redrawn under the grammar, staged through a shared neighbour, or the control should ride the drum (SwapIcon). The filmstrips print it.', origin: 'Ours' },
        { id: 'I8', title: 'Character glyphs ride the drum', body: 'A solid glyph (the character glyph: a filled body with no wire) belongs to a different system and never morphs. A control switching to or from one uses SwapIcon (T1). The generator keeps such glyphs out of the morph family by structure, not by name.', origin: 'Ours' },
        { id: 'I11', title: 'A direction is a turn of one glyph', body: 'The chevron is drawn once, pointing down. turn={90 | 180 | 270} points it left, up or right, act and all, so its thrust always goes the way it points. When a control’s direction is its state (a disclosure opening), MorphIcon’s turn changes and the glyph morphs: a quarter turn rides a rigid carriage, a half turn turns over on its axis. Never rotate a glyph with your own CSS transition.', origin: 'Ours' },
      ]} />
    </Section>
  </>;
}
