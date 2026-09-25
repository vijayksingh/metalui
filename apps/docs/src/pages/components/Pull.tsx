import { Pull } from '@unlocalhosted/metalui';
import { GADGETS } from '@unlocalhosted/metalui/gadgets';
import pullSource from '../../../../../packages/metalui/src/components/pull/pull.tsx?raw';
import partSource from '../../../../../packages/metalui/src/gadgets/parts/pull.ts?raw';
import agentGuide from '../../../../../packages/metalui/src/components/pull/pull.agent.md?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalPull.swift?raw';
import { Bench, PageHeader, Rules, Section, SourceTabs } from '../../ui/doc';
import { SwiftCapture } from '../../ui/SwiftCapture';

export default function PullPage() {
  return (
    <>
      <PageHeader
        title="Pull"
        lede="A drawer's handle, seen from above: a metal bar standing out in front of the drawer front on two posts, lit on its upper curve and casting a small shadow; or a finger recess cut into the front. It has no state of its own: the drawer it is on moves it."
      />
      <Section title="Styles" lede="A bar for a drawer you pull often; a recess where nothing should stick out.">
        <Bench caption={`gadgets.pull · ${GADGETS.parts.pull.size.join(' × ')} · posts ${GADGETS.pull.posts[1]} in from each end · stands ${GADGETS.pull.standoff} out`}>
          <div className="flex flex-wrap items-end gap-24" data-testid="pull-looks">
            {(['bar', 'recess'] as const).map((s) => (
              <figure key={s} className="m-0 flex flex-col items-center gap-6">
                <Pull style={s} size={200} />
                <figcaption className="type-label engraved">{s}</figcaption>
              </figure>
            ))}
            <figure className="m-0 flex flex-col items-center gap-6">
              <Pull size={200} front={{ L: 0.62, C: 0.05, H: 140 }} />
              <figcaption className="type-label engraved">bar · on a drawer front</figcaption>
            </figure>
          </div>
        </Bench>
        <SwiftCapture name="pull" maxWidth={760} />
      </Section>
      <Section title="Rules">
        <Rules
          rules={[
            { id: 'E1', title: 'Only on what slides', body: 'A pull says: this comes out toward you. Put it on a drawer front, nowhere else.' },
            { id: 'E2', title: 'Metal, quiet', body: 'A bar is metal and a recess is the front itself. Neither wears the accent.' },
          ]}
        />
      </Section>
      <Section title="Source">
        <SourceTabs tabs={[
          { id: 'react', label: 'React', code: pullSource },
          { id: 'part', label: 'Drawing', code: partSource },
          { id: 'swift', label: 'SwiftUI', code: swiftSource },
          { id: 'agent', label: 'Agent guide', code: agentGuide },
        ]} />
      </Section>
    </>
  );
}
