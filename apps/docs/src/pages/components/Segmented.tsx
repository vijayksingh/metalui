import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Segmented } from '@unlocalhosted/metalui';
import reactSource from '../../../../../packages/metalui/src/components/segmented/segmented.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/segmented/segmented.css?raw';
import agentGuide from '../../../../../packages/metalui/src/components/segmented/segmented.agent.md?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalSegmented.swift?raw';
import { Bench, PageHeader, Rules, Section, SourceTabs } from '../../ui/doc';
import { SwiftCapture } from '../../ui/SwiftCapture';
import { SegmentedXray } from '../../ui/xray/SegmentedXray';

const VIEWS = ['place', 'list', 'table', 'timeline', 'gallery'].map((v) => ({ value: v, label: v }));

export default function SegmentedPage() {
  const [view, setView] = React.useState('place');
  const d = useDialKit('Segmented', { size: { type: 'select', options: ['regular', 'compact'], default: 'regular' }, count: [5, 2, 5, 1], disabled: false });
  return (
    <>
      <PageHeader
        title="Segmented control"
        lede="Pick one of a few options. All options are always visible. The chosen one sits on a raised thumb that slides when you pick another. Built on Base UI RadioGroup."
      />
      <Section title="Playground" lede="Click or use the arrow keys. Dials: the size (28 regular, 24 compact), how many segments, disabled.">
        <Bench caption={`${d.size} · ${view}`}>
          <Segmented aria-label="Lens view" size={d.size as 'regular'} disabled={d.disabled} value={view} onValueChange={setView} options={VIEWS.slice(0, d.count)} />
        </Bench>
        <Bench tone="page" caption="regular 28 · compact 24 · disabled">
          <div className="flex flex-col items-center gap-24">
            <Segmented aria-label="Colorway" defaultValue="bone" options={[{ value: 'bone', label: 'Bone' }, { value: 'graphite', label: 'Graphite' }]} />
            <Segmented aria-label="View" size="compact" defaultValue="list" options={VIEWS} />
            <Segmented aria-label="Scale" disabled defaultValue="day" options={[{ value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }]} />
          </div>
        </Bench>
        <SwiftCapture name="segmented" maxWidth={520} />
      </Section>
      <Section id="x-ray" title="X-ray" lede="See what the control is made of. Click an icon to learn about one part and change it.">
        <SegmentedXray />
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
          { id: 'SG1', title: 'Two to five short options', body: 'More, or options that need words, belong in a menu or select.', origin: 'Ours' },
          { id: 'SG2', title: 'The thumb glides on part', body: 'The track has ends, so the thumb may overshoot against the stop (Transitions T3). First paint places it without motion.', origin: 'MetalUI T3' },
          { id: 'SG3', title: 'Pill rule padding', body: 'Text first, h/2 − 1: 13 at 28, 11 at 24.', origin: 'FOUNDATIONS R2' },
        ]} />
      </Section>
    </>
  );
}
