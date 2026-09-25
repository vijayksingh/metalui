import { Lid, type LidProps } from '@unlocalhosted/metalui';
import { GADGETS } from '@unlocalhosted/metalui/gadgets';
import { useDialKit } from 'dialkit';
import lidSource from '../../../../../packages/metalui/src/components/lid/lid.tsx?raw';
import partSource from '../../../../../packages/metalui/src/gadgets/parts/lid.ts?raw';
import agentGuide from '../../../../../packages/metalui/src/components/lid/lid.agent.md?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalLid.swift?raw';
import { Bench, PageHeader, Rules, Section, SourceTabs } from '../../ui/doc';
import { SwiftCapture } from '../../ui/SwiftCapture';

const LOOKS: { label: string; props: LidProps }[] = [
  { label: 'closed', props: {} },
  { label: `ajar · ${GADGETS.lid.ajar}°`, props: { open: GADGETS.lid.ajar } },
  { label: `open · ${GADGETS.lid.open}°`, props: { open: GADGETS.lid.open } },
  { label: 'armed · ajar', props: { open: GADGETS.lid.ajar, armed: true } },
  { label: 'armed · left hinge', props: { open: 40, armed: true, hinge: 'left' } },
];

export default function LidPage() {
  const dials = useDialKit('Lid', { open: [30, 0, GADGETS.lid.open, 1], armed: true, hinge: { type: 'select', options: ['back', 'left'], default: 'back' } });
  return (
    <>
      <PageHeader
        title="Lid"
        lede="A hinged flap over a bin's mouth, seen from above. Opened, it foreshortens toward its hinge and its shadow falls further out as the free edge rises. Armed, its underside is red, and the red glows into the gap as it opens: red belongs to the lamp and to the underside of a lid, never to a body."
      />
      <Section title="Looks" lede="open is degrees about the hinge. The flip mechanism's poses are ajar and open.">
        <Bench caption={`gadgets.lid · rubber · corners ${GADGETS.lid.radius} of the short side · shadow lifts ${GADGETS.lid.lift} of the height`}>
          <div className="flex flex-wrap items-end gap-24" data-testid="lid-looks">
            {LOOKS.map((l) => (
              <figure key={l.label} className="m-0 flex flex-col items-center gap-6">
                <Lid size={160} {...l.props} />
                <figcaption className="type-label engraved">{l.label}</figcaption>
              </figure>
            ))}
          </div>
        </Bench>
        <SwiftCapture name="lid" maxWidth={760} />
      </Section>
      <Section title="Tune" lede="Open it by hand: watch the red come up from under an armed lid.">
        <Bench caption={`${dials.open}° · ${dials.armed ? 'armed' : 'safe'} · hinge ${dials.hinge}`}>
          <div data-testid="lid-tune"><Lid size={260} open={dials.open} armed={dials.armed} hinge={dials.hinge as LidProps['hinge']} /></div>
        </Bench>
      </Section>
      <Section title="Rules">
        <Rules
          rules={[
            { id: 'E1', title: 'Heavy things only', body: 'A lid is for what is weighty to open: a bin, a vault. Light things slide.' },
            { id: 'E2', title: 'Red is under it', body: 'Danger shows as the red underside of an armed lid and in the lamp, never as a red body.' },
            { id: 'E3', title: 'Creak and thud', body: 'It creaks as it opens and thuds as it closes. Armed is silent.' },
          ]}
        />
      </Section>
      <Section title="Source">
        <SourceTabs tabs={[
          { id: 'react', label: 'React', code: lidSource },
          { id: 'part', label: 'Drawing', code: partSource },
          { id: 'swift', label: 'SwiftUI', code: swiftSource },
          { id: 'agent', label: 'Agent guide', code: agentGuide },
        ]} />
      </Section>
    </>
  );
}
