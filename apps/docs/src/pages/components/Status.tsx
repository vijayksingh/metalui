import { Led, StatusBadge } from '@unlocalhosted/metalui';
import reactSource from '../../../../../packages/metalui/src/components/status/status.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/theme.css?raw';
import agentGuide from '../../../../../packages/metalui/src/components/status/status.agent.md?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalStatus.swift?raw';
import { Bench, PageHeader, Rules, Section, SourceTabs } from '../../ui/doc';
import { SwiftCapture } from '../../ui/SwiftCapture';
import { StatusXray } from '../../ui/xray/StatusXray';

const KINDS = [['live', 'live · ok'], ['waiting', 'waiting · urgent'], ['failed', 'failed'], ['link', 'link kind'], ['off', 'off']] as const;

export default function StatusPage() {
  return (
    <>
      <PageHeader title="LED and status badge" lede="A tiny lamp lit from the top left, and a badge that names a state beside it. Five meanings, never colour alone: green live, amber waiting, red failed, blue a link, off idle. The badge is not a button; hover or focus it to see what fixes it." />
      <Section title="LEDs and badges">
        <Bench caption="the five LEDs · three badges (hover the offline one)">
          <div className="flex flex-col items-center gap-28">
            <div className="flex items-end gap-32">
              {KINDS.map(([k, l]) => (
                <figure key={k} className="flex flex-col items-center gap-8"><Led kind={k} /><figcaption className="type-label engraved">{l}</figcaption></figure>
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-12">
              <StatusBadge led="live">SYNC LIVE</StatusBadge>
              <StatusBadge led="waiting" hint="security add-generic-password -s example-service -a default -w">SYNC OFFLINE · ADD KEY TO KEYCHAIN</StatusBadge>
              <StatusBadge led="failed">SYNC · NO CONNECTION</StatusBadge>
            </div>
          </div>
        </Bench>
        <SwiftCapture name="status" maxWidth={620} />
      </Section>
      <Section id="x-ray" title="X-ray" lede="See what the lamp and the badge are made of. Click an icon to learn about one part and change it.">
        <StatusXray />
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
          { id: 'D1', title: 'Never colour alone', body: 'An LED sits beside the words that name the state.', origin: 'reference brief' },
          { id: 'D2', title: 'One LED per object', body: 'Green live, amber waiting, red failed, blue link, off idle; nothing else.', origin: 'reference brief' },
          { id: 'D3', title: 'Not pressable', body: 'The badge is a state; the fix is its hint, shown on hover and focus.', origin: 'reference design' },
        ]} />
      </Section>
    </>
  );
}
