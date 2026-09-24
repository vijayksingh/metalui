import * as React from 'react';
import { useDialKit } from 'dialkit';
import { HoverEngraving, type EngravingStatus } from '@unlocalhosted/metalui';
import reactSource from '../../../../../packages/metalui/src/blocks/hover-engraving/hover-engraving.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/theme.css?raw';
import agentGuide from '../../../../../packages/metalui/src/blocks/hover-engraving/hover-engraving.agent.md?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalHoverEngraving.swift?raw';
import { Bench, PageHeader, Rules, Section, SourceTabs } from '../../ui/doc';
import { SwiftCapture } from '../../ui/SwiftCapture';

const LIST: { text: string; kind: string; details: string[]; tags?: string[]; status?: { led: EngravingStatus; text: string } }[] = [
  { text: 'slept badly, up at 5', kind: 'LOG', details: ['07:40', 'SLEEP 6 H', 'ALSO TIRED'], status: { led: 'live', text: 'RECOGNIZER ✓' } },
  { text: 'send the poster tomorrow 4pm', kind: 'TASK', details: ['TOMORROW 16:00'], tags: ['poster'], status: { led: 'live', text: 'RECOGNIZER ✓' } },
  { text: 'lunch with Priya', kind: 'LUNCH? 0.71', details: [], status: { led: 'waiting', text: 'ASKING…' } },
  { text: 'sk-live-4f9a…', kind: 'NOT SENT', details: ['LOOKS LIKE A SECRET'], status: { led: 'off', text: 'KEPT ON THIS MAC' } },
];

export default function HoverEngravingPage() {
  const d = useDialKit('Hover engraving', { selected: false, placement: { type: 'select', options: ['beside', 'below'], default: 'beside' } });
  return (
    <>
      <PageHeader
        title="Hover engraving"
        lede="A block's identity, shown on a dwell, never on a pass. Rest the pointer on a block for 420 ms and a frosted pill appears beside its first line, engraved: its kind, when it was written, its edits, the other events it mentions, its derived tags and what the recognizer made of it. Pass over and nothing happens."
      />

      <Section title="A stacked list" lede="Pass the pointer down the list quickly: nothing shows. Rest on one line: its engraving appears beside it, never over the line below. Dials: select a block (it hides), and the placement.">
        <Bench caption={`${d.placement} · dwell 420 ms · ${d.selected ? 'first block selected' : 'nothing selected'}`} className="min-h-[260px] justify-start">
          <div className="flex flex-col gap-8" data-testid="eng-list">
            {LIST.map((b, i) => (
              <div key={b.text} className="mu-icon-trigger relative w-fit rounded-plate py-4 pr-8" aria-describedby={`eng-${i}`} data-block={i}>
                <span className="type-content text-ink">{b.text}</span>
                <HoverEngraving id={`eng-${i}`} kind={b.kind} details={b.details} tags={b.tags} status={b.status} placement={d.placement as 'beside'} open={d.selected && i === 0 ? false : undefined} />
              </div>
            ))}
          </div>
        </Bench>
        <Bench tone="page" caption="Stills · shown at once">
          <div className="flex flex-col gap-40 py-8">
            {LIST.map((b, i) => (
              <div key={b.text} className="relative w-fit">
                <span className="type-content text-ink">{b.text}</span>
                <HoverEngraving kind={b.kind} details={b.details} tags={b.tags} status={b.status} open immediate />
              </div>
            ))}
          </div>
        </Bench>
      </Section>

      <Section title="SwiftUI" lede="MetalHoverEngraving from the same tokens; .metalHoverEngraving(_:) adds the dwell.">
        <SwiftCapture name="hover-engraving" maxWidth={620} />
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
        <Rules
          rules={[
            { id: 'H1', title: 'A dwell, not a pass', body: '420 ms of hover before it shows; nothing on the way out.', origin: 'reference design' },
            { id: 'H2', title: 'Beside the first line', body: 'Never under a text block, where it would cover the next line of a list. Under a material block only.', origin: 'DS-31' },
            { id: 'H3', title: 'Hidden while selected or writing', body: 'The ring and readout speak then.', origin: 'reference brief' },
            { id: 'H4', title: 'It repeats, it never informs alone', body: 'The label role never carries information on its own; the engraving names what the block already shows, and is the block’s description for assistive tech.', origin: 'DS-06' },
          ]}
        />
      </Section>
    </>
  );
}
