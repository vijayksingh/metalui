import { Bezel, Needle } from '@unlocalhosted/metalui';
import { GADGETS, resolveFeel } from '@unlocalhosted/metalui/gadgets';
import partSource from '../../../../../packages/metalui/src/gadgets/parts/needle.ts?raw';
import needleSource from '../../../../../packages/metalui/src/components/needle/needle.tsx?raw';
import agentGuide from '../../../../../packages/metalui/src/components/needle/needle.agent.md?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalNeedle.swift?raw';
import { Bench, PageHeader, Rules, Section, SourceTabs } from '../../ui/doc';
import { SwiftCapture } from '../../ui/SwiftCapture';

// The needle gauge's own glass: a signal gadget's face colour.
const today = resolveFeel({ job: 'signal', feel: { v: 0.6, a: 0.5, w: 0.45 }, material: 'metal' });
const LOOKS = [
  { label: '0.2', value: 0.2, threshold: 0.75 },
  { label: '0.5 · up', value: 0.5, threshold: 0.75 },
  { label: '0.9 · past the zone', value: 0.9, threshold: 0.75 },
  { label: '150° · 13 ticks', value: 0.35, arc: 150, ticks: 13 },
];

export default function NeedlePage() {
  return (
    <>
      <PageHeader
        title="Needle"
        lede="A tapered pointer on a pivot cap over a scale printed on the glass. The needle is the accent and stands just above the glass, so it casts a small shadow; the scale is the glass's own ink, with a zone past the threshold where the value becomes news."
      />
      <Section title="Values" lede="0 at the left end of the arc, straight up at a half, the right end at 1. In a gadget it swings there, overshoots a little and settles; the ends of its scale are pegs.">
        <Bench caption={`gadgets.needle · 96 long · taper ${GADGETS.needle.base} → ${GADGETS.needle.tip} · every ${GADGETS.needle.major}nd tick long`}>
          <div className="flex flex-wrap items-end gap-24" data-testid="needle-looks">
            {LOOKS.map((l) => (
              <figure key={l.label} className="m-0 flex flex-col items-center gap-6">
                <Bezel material="metal" color={today.body} glass={today.face} rings={false} size={180}>
                  <Needle value={l.value} arc={l.arc} ticks={l.ticks} threshold={l.threshold} glass={today.face} color={today.accent} />
                </Bezel>
                <figcaption className="type-label engraved">{l.label}</figcaption>
              </figure>
            ))}
          </div>
        </Bench>
        <SwiftCapture name="needle" maxWidth={760} />
      </Section>
      <Section title="Rules">
        <Rules
          rules={[
            { id: 'E1', title: 'Levels, not counts', body: 'A needle reads a level. A count is a Drum.' },
            { id: 'E2', title: 'A needle is silent', body: 'It makes no sound as it swings. The beeper says when it crosses the threshold.' },
            { id: 'E3', title: 'The zone is news', body: 'Mark a threshold only where crossing it means something.' },
          ]}
        />
      </Section>
      <Section title="Source">
        <SourceTabs tabs={[
          { id: 'react', label: 'React', code: needleSource },
          { id: 'part', label: 'Drawing', code: partSource },
          { id: 'swift', label: 'SwiftUI', code: swiftSource },
          { id: 'agent', label: 'Agent guide', code: agentGuide },
        ]} />
      </Section>
    </>
  );
}
