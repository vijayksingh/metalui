import * as React from 'react';
import { Cue, ProvenanceProvider, ProvenanceTooltip } from '@unlocalhosted/metalui';
import reactSource from '../../../../../packages/metalui/src/components/provenance-tooltip/provenance-tooltip.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/provenance-tooltip/provenance-tooltip.css?raw';
import agentGuide from '../../../../../packages/metalui/src/components/provenance-tooltip/provenance-tooltip.agent.md?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalProvenanceTooltip.swift?raw';
import { Bench, PageHeader, Rules, Section, SourceTabs } from '../../ui/doc';
import { SwiftCapture } from '../../ui/SwiftCapture';

export default function ProvenanceTooltipPage() {
  return (
    <>
      <PageHeader
        title="Provenance tooltip"
        lede="One hover away from every cue: where it came from. A rule, the recognizer with its confidence, a region, a cluster, a formula, or you. If the app guessed, the number is shown, because hidden confidence is a bug. Built on Base UI Tooltip."
      />

      <Section title="On a block" lede="Hover or tab to a cue. The first tooltip waits 380 ms; moving to the next cue shows it at once. A cue that shows its own value chip keeps its tooltip clear above it.">
        <Bench caption="rule · jev · region · you" className="min-h-[220px]">
          <ProvenanceProvider>
            <p className="type-content text-ink" data-testid="prov-block">
              Send{' '}
              <ProvenanceTooltip source="Rule" detail={['Tag']}>
                <Cue kind="tag" tabIndex={0}>#poster</Cue>
              </ProvenanceTooltip>{' '}
              <ProvenanceTooltip source="Rule" detail={['Date parser']} clearsChip>
                <Cue kind="date" resolved="TUE 30 SEP · 16:00" tabIndex={0}>tomorrow 4pm</Cue>
              </ProvenanceTooltip>
              , slept{' '}
              <ProvenanceTooltip source="Jev" detail={['0.82']} clearsChip>
                <Cue kind="measurement" resolved="SLEEP · 6 H" tabIndex={0}>6h</Cue>
              </ProvenanceTooltip>{' '}
              in{' '}
              <ProvenanceTooltip source="Region" detail={['Done']}>
                <Cue kind="derived-tag" tabIndex={0}>#done</Cue>
              </ProvenanceTooltip>{' '}
              by{' '}
              <ProvenanceTooltip source="You" detail={['Always coffee']}>
                <Cue kind="tag" tabIndex={0}>#coffee</Cue>
              </ProvenanceTooltip>
            </p>
          </ProvenanceProvider>
        </Bench>
        <Bench tone="page" caption="Stills">
          <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(200px,1fr))] justify-items-center gap-y-72 pt-48">
            {([['Rule', ['Hex']], ['Jev', ['0.91']], ['Region', ['Done']], ['Cluster', ['Poster']], ['Formula', []], ['You', []]] as [string, string[]][]).map(([s, d]) => (
              <ProvenanceTooltip key={s} source={s} detail={d} open>
                <span className="type-meta text-ink2">{s.toLowerCase()}</span>
              </ProvenanceTooltip>
            ))}
          </div>
        </Bench>
      </Section>

      <Section title="SwiftUI" lede="MetalProvenanceTooltip on the graphite frost; .metalProvenance(_:detail:) adds the 380 ms hover.">
        <SwiftCapture name="provenance-tooltip" maxWidth={560} />
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
            { id: 'V1', title: 'Every applied cue has provenance', body: 'One hover or one Tab away. A guess shows its number.', origin: 'Kamui 03 §5' },
            { id: 'V2', title: 'Clear of the value chip', body: 'A cue that shows its own resolved value on hover keeps its tooltip 34 above it.', origin: 'Kamui demo' },
            { id: 'V3', title: 'Information in the readout role', body: 'Provenance carries meaning on its own, so it is 10.5 mono, never the 9 pt label role.', origin: 'DS-06' },
          ]}
        />
      </Section>
    </>
  );
}
