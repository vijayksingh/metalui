import { Bezel, type BezelProps } from '@unlocalhosted/metalui';
import { GADGETS, resolveFeel } from '@unlocalhosted/metalui/gadgets';
import bezelSource from '../../../../../packages/metalui/src/components/bezel/bezel.tsx?raw';
import partSource from '../../../../../packages/metalui/src/gadgets/parts/bezel.ts?raw';
import glassSource from '../../../../../packages/metalui/src/gadgets/parts/glass.ts?raw';
import agentGuide from '../../../../../packages/metalui/src/components/bezel/bezel.agent.md?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalBezel.swift?raw';
import { Bench, PageHeader, Rules, Section, SourceTabs } from '../../ui/doc';
import { SwiftCapture } from '../../ui/SwiftCapture';

// A find gadget's own glass (the search scope's): the face colour the feel resolves.
const search = resolveFeel({ job: 'find', feel: { v: 0.7, a: 0.8, w: 0.1 } });
const LOOKS: { label: string; props: BezelProps }[] = [
  { label: 'stone · round', props: { material: 'stone', color: search.body, glass: search.face } },
  { label: 'metal · round', props: { material: 'metal' } },
  { label: 'clay · square', props: { material: 'clay', opening: 'square', rings: false } },
];

export default function BezelPage() {
  return (
    <>
      <PageHeader
        title="Bezel"
        lede="An inset gadget's body: a frame around an opening where a glass face sits sunk below it. Where a slab gadget's parts stand on the slab, an inset gadget shows its working through glass: a sweeping beam, a needle, a glyph."
      />
      <Section title="Frames and glass" lede="Stone, metal or clay, round or square. The glass is light and icy, in the gadget's own face colour: the same feel as its body, in the glass face's ranges. The first is the search scope's.">
        <Bench caption={`gadgets.bezel · frame ${GADGETS.bezel.width} · sunk ${GADGETS.bezel.depth} · rings at ${GADGETS.glass.rings.join(', ')} of the radius`}>
          <div className="flex flex-wrap items-end gap-24" data-testid="bezel-looks">
            {LOOKS.map((l) => (
              <figure key={l.label} className="m-0 flex flex-col items-center gap-6">
                <Bezel {...l.props} size={180} />
                <figcaption className="type-label engraved">{l.label}</figcaption>
              </figure>
            ))}
          </div>
        </Bench>
        <SwiftCapture name="bezel" maxWidth={720} />
      </Section>
      <Section title="Detail by size">
        <Bench caption="96 px and up: lit frame, shaded wall, rings and glare · 48 px: softer · below: flat">
          <div className="flex flex-wrap items-end gap-20" data-testid="bezel-tiers">
            {[160, 96, 64, 32].map((s) => <figure key={s} className="m-0 flex flex-col items-center gap-6"><Bezel material="stone" color={search.body} glass={search.face} size={s} /><figcaption className="type-readout text-ink3">{s} px</figcaption></figure>)}
          </div>
        </Bench>
      </Section>
      <Section title="Rules">
        <Rules
          rules={[
            { id: 'Z1', title: 'The face sits below', body: 'An inset gadget\'s working is behind glass, below its frame. Nothing stands on the glass.' },
            { id: 'Z2', title: 'Light is inside', body: 'What glows (a beam, a blip) is drawn between the glass and its surface, so the rings and the glare lie over it.' },
            { id: 'Z3', title: 'Its own glass', body: 'The glass takes the gadget\'s face colour, never a generic tint.' },
          ]}
        />
      </Section>
      <Section title="Source">
        <SourceTabs tabs={[
          { id: 'react', label: 'React', code: bezelSource },
          { id: 'part', label: 'Frame', code: partSource },
          { id: 'glass', label: 'Glass', code: glassSource },
          { id: 'swift', label: 'SwiftUI', code: swiftSource },
          { id: 'agent', label: 'Agent guide', code: agentGuide },
        ]} />
      </Section>
    </>
  );
}
