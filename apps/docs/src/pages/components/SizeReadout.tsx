import * as React from 'react';
import { useDialKit } from 'dialkit';
import { SizeReadout } from '@unlocalhosted/metalui';
import reactSource from '../../../../../packages/metalui/src/components/size-readout/size-readout.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/size-readout/size-readout.css?raw';
import agentGuide from '../../../../../packages/metalui/src/components/size-readout/size-readout.agent.md?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalSizeReadout.swift?raw';
import { Bench, PageHeader, Rules, Section, SourceTabs } from '../../ui/doc';
import { SwiftCapture } from '../../ui/SwiftCapture';

export default function SizeReadoutPage() {
  const d = useDialKit('Size readout', { width: [320, 20, 900, 1], height: [214, 20, 900, 1], count: [1, 1, 20, 1], zoom: [100, 25, 400, 25] });
  return (
    <>
      <PageHeader title="Size readout" lede="A graphite pill that reads a measured value: an object's size, a multi-selection's count, a copy, a zoom level. It is the KAMUI-14 readout; the Selection frame places one under its object, and this is the same pill on its own." />
      <Section title="Readings" lede="Dials: the size, the count, the zoom. Figures are tabular, so the pill never jitters as the value changes.">
        <Bench caption="size · multi · copied · zoom">
          <div className="flex flex-wrap items-center justify-center gap-24">
            <SizeReadout width={d.width} height={d.height} />
            <SizeReadout width={d.width} height={d.height} count={Math.max(2, d.count)} />
            <SizeReadout width={130} height={215} copied="PNG" />
            <SizeReadout value={`${d.zoom} %`} aria-label={`Zoom ${d.zoom} percent`} />
          </div>
        </Bench>
        <SwiftCapture name="size-readout" maxWidth={560} />
      </Section>
      <Section title="Source">
        <SourceTabs tabs={[
          { id: 'react', label: 'React', code: reactSource },
          { id: 'css', label: 'CSS', code: cssSource },
          { id: 'swift', label: 'SwiftUI', code: swiftSource },
          { id: 'agent', label: 'Agent guide', code: agentGuide },
        ]} />
      </Section>
      <Section title="Rules">
        <Rules rules={[
          { id: 'Z1', title: 'It reads a measurement', body: 'Never a constant, never a sentence.', origin: 'Kamui 03 §7' },
          { id: 'Z2', title: 'Tabular figures', body: 'The readout role keeps every digit one width, so the pill holds still while it counts.', origin: 'FOUNDATIONS type' },
        ]} />
      </Section>
    </>
  );
}
