import * as React from 'react';
import { Drum, Slider, type DrumProps } from '@unlocalhosted/metalui';
import { GADGETS } from '@unlocalhosted/metalui/gadgets';
import drumSource from '../../../../../packages/metalui/src/components/drum/drum.tsx?raw';
import partSource from '../../../../../packages/metalui/src/gadgets/parts/drum.ts?raw';
import agentGuide from '../../../../../packages/metalui/src/components/drum/drum.agent.md?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalDrum.swift?raw';
import { Bench, PageHeader, Rules, Section, SourceTabs } from '../../ui/doc';
import { SwiftCapture } from '../../ui/SwiftCapture';

const LOOKS: { label: string; props: DrumProps }[] = [
  { label: '0 · ceramic', props: { value: 0 } },
  { label: '7 · ceramic', props: { value: 7 } },
  { label: '9.5 · between', props: { value: 9.5 } },
  { label: '3 · accent', props: { value: 3, accent: true } },
  { label: '4 · clay', props: { value: 4, face: 'clay' } },
];

export default function DrumPage() {
  const [value, setValue] = React.useState(8.6);
  return (
    <>
      <PageHeader
        title="Drum"
        lede="A numbered wheel seen through a window. Its strip wraps from 9 into 0, it darkens where the cylinder turns away at the top and bottom, and a glint lies across its upper curve. Its value can stand between two digits, as a real drum does while it rolls."
      />
      <Section title="Digits" lede="Whole digits sit centred in the window; between two, both show, cut by the window's edges. The digit you read first wears the accent.">
        <Bench caption={`gadgets.drum · 52 × 88 · pitch ${GADGETS.drum.pitch} · mono ${GADGETS.drum.weight}`}>
          <div className="flex flex-wrap items-end gap-24" data-testid="drum-looks">
            {LOOKS.map((l) => (
              <figure key={l.label} className="m-0 flex flex-col items-center gap-6">
                <Drum {...l.props} size={120} />
                <figcaption className="type-label engraved">{l.label}</figcaption>
              </figure>
            ))}
          </div>
        </Bench>
        <SwiftCapture name="drum" maxWidth={760} />
      </Section>
      <Section title="Turn it" lede="Drag the value past 9: the strip runs on into 0 without an end. In a gadget the roll mechanism turns it, with a tick at each digit.">
        <Bench caption={`value ${value.toFixed(2)}`}>
          <div className="flex flex-wrap items-center gap-24">
            <Drum value={value} size={200} data-testid="drum-turn" />
            <div className="w-[280px]">
              <Slider.Root value={value} min={0} max={10} step={0.01} onValueChange={(v) => setValue(v as number)}><Slider.Track /><Slider.Knob aria-label="Value" /></Slider.Root>
            </div>
          </div>
        </Bench>
      </Section>
      <Section title="Rules">
        <Rules
          rules={[
            { id: 'D1', title: 'Counts, not measures', body: 'A drum counts. A level or a proportion is a needle or a fader.' },
            { id: 'D2', title: 'Forward through 9', body: 'Counting up, a drum runs on from 9 into 0; it never turns back through 8.' },
            { id: 'D3', title: 'One accent', body: 'Only the digit you read first wears the accent.' },
          ]}
        />
      </Section>
      <Section title="Source">
        <SourceTabs tabs={[
          { id: 'react', label: 'React', code: drumSource },
          { id: 'part', label: 'Drawing', code: partSource },
          { id: 'swift', label: 'SwiftUI', code: swiftSource },
          { id: 'agent', label: 'Agent guide', code: agentGuide },
        ]} />
      </Section>
    </>
  );
}
