import * as React from 'react';
import { SelectionFrame, ToolStrip } from '@unlocalhosted/metalui';
import reactSource from '../../../../../packages/metalui/src/components/tool-strip/tool-strip.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/tool-strip/tool-strip.css?raw';
import agentGuide from '../../../../../packages/metalui/src/components/tool-strip/tool-strip.agent.md?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalToolStrip.swift?raw';
import { Bench, PageHeader, Rules, Section, SourceTabs } from '../../ui/doc';
import { SwiftCapture } from '../../ui/SwiftCapture';

export default function ToolStripPage() {
  const [said, setSaid] = React.useState('Click a verb');
  const [shown, setShown] = React.useState(true);
  const verbs = ['Tasks', 'Summarise', 'Gather', 'Region', 'Export'].map((l) => ({ label: l, onSelect: () => setSaid(l) }));
  return (
    <>
      <PageHeader title="Tool strip" lede="Verbs over a selection: a graphite strip that rises above a click selection with Tasks, Summarise, Gather, Region, Export, and Send away set apart. A selection made by finishing is quiet and never raises it. Built on Base UI Toolbar." />
      <Section title="Over a selection" lede="Click the selection to raise the strip again (it rises 4 on the part spring).">
        <Bench caption={said} className="min-h-[260px] flex-col gap-12">
          <div className="h-36">{shown && <ToolStrip label="3 blocks" items={[...verbs, { label: 'Send away', destructive: true, onSelect: () => setSaid('Sent away 3 blocks · Undo') }]} />}</div>
          <button type="button" className="relative mt-12 rounded-card px-24 py-16 text-left material-raised" aria-selected onClick={() => { setShown(false); requestAnimationFrame(() => setShown(true)); }}>
            <span className="type-content text-ink">three blocks, selected</span>
            <SelectionFrame state="selected" radius={24} count={3} entrance={false} />
          </button>
        </Bench>
        <SwiftCapture name="tool-strip" maxWidth={560} />
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
          { id: 'T1', title: 'Only for a click selection', body: 'A selection made by finishing is quiet; never while dragging, resizing, in the past or with the palette open.', origin: 'DS-31' },
          { id: 'T2', title: 'Every verb says what it did', body: 'A toast names the result and offers Undo: Made 3 tasks, Sent away 3 blocks.', origin: 'Kamui 03 §11' },
          { id: 'T3', title: 'One destructive verb, last', body: 'After the engraved separator, in the warm red. Canvas delete is send away.', origin: 'DS-33' },
        ]} />
      </Section>
    </>
  );
}
