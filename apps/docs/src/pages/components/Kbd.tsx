import { Kbd } from '@unlocalhosted/metalui';
import reactSource from '../../../../../packages/metalui/src/components/kbd/kbd.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/kbd/kbd.css?raw';
import agentGuide from '../../../../../packages/metalui/src/components/kbd/kbd.agent.md?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalKbd.swift?raw';
import { Bench, PageHeader, Rules, Section, SourceTabs } from '../../ui/doc';
import { SwiftCapture } from '../../ui/SwiftCapture';

export default function KbdPage() {
  return (
    <>
      <PageHeader title="Keycap" lede="A key's glyph on a small raised cap, in the readout role: in a search well, a palette footer, a toast's Undo, a tooltip. Shown, never pressed." />
      <Section title="Where keys sit">
        <Bench caption="on a light surface · small in a footer · on a graphite strip · sunk in a toast's Undo">
          <div className="flex flex-col items-center gap-24">
            <span className="flex items-center gap-8"><Kbd>⌘</Kbd><Kbd>K</Kbd><Kbd>⇧</Kbd><Kbd>↩</Kbd><Kbd>⎋</Kbd><Kbd>V</Kbd></span>
            <span className="type-meta flex items-center gap-6 text-ink2"><Kbd size="small">↑</Kbd><Kbd size="small">↓</Kbd> move · <Kbd size="small">↩</Kbd> open · <Kbd size="small">⇧</Kbd><Kbd size="small">↩</Kbd> pin · <Kbd size="small">⎋</Kbd> close</span>
            <span className="mu-frost-graphite type-ui flex h-36 items-center gap-8 rounded-pill px-15 text-[#A6A6A9]">Search <Kbd surface="strip">⌘K</Kbd></span>
            <span className="type-ui flex h-44 items-center gap-8 rounded-pill bg-[rgba(30,30,33,.92)] pl-16 pr-6 text-[#F2F2F0]">Moved 3 blocks <span className="flex h-28 items-center gap-6 rounded-pill bg-white/10 pl-12 pr-4">Undo <Kbd surface="sunk">⌘Z</Kbd></span></span>
          </div>
        </Bench>
        <SwiftCapture name="kbd" maxWidth={480} />
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
          { id: 'K1', title: 'Glyphs, one cap per key', body: '⌘ ⌥ ⇧ ⌃ ⎋ ↩ ⌫ ↑ ↓ and single letters. A chord is two caps side by side (⌘ then K) or one cap with both glyphs where space is tight.', origin: 'Kamui 04 §9' },
          { id: 'K2', title: 'Shown, never pressed', body: 'A keycap has no hover or press. The control it labels is the button.', origin: 'Ours' },
        ]} />
      </Section>
    </>
  );
}
