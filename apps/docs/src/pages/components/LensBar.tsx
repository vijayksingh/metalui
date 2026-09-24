import * as React from 'react';
import { useDialKit } from 'dialkit';
import { LensBar, type LensMode } from '@unlocalhosted/metalui';
import { CloseIcon, PinIcon, SearchIcon } from '@unlocalhosted/metalui/icons';
import reactSource from '../../../../../packages/metalui/src/components/lens-bar/lens-bar.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/lens-bar/lens-bar.css?raw';
import agentGuide from '../../../../../packages/metalui/src/components/lens-bar/lens-bar.agent.md?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalLensBar.swift?raw';
import { Bench, PageHeader, Rules, Section, SourceTabs } from '../../ui/doc';
import { SwiftCapture } from '../../ui/SwiftCapture';

const GLYPHS = { lens: <SearchIcon size={14} />, pin: <PinIcon size={14} />, close: <CloseIcon size={14} /> };

export default function LensBarPage() {
  const [mode, setMode] = React.useState<LensMode>('place');
  const [open, setOpen] = React.useState(true);
  const d = useDialKit('Lens bar', {
    query: 'open tasks about the poster',
    count: [6, 0, 40, 1],
    source: { type: 'select', options: ['none', 'asking', 'jev', 'local'], default: 'jev' },
    reopen: { type: 'action', label: 'Open again' },
  }, { onAction: () => { setOpen(false); requestAnimationFrame(() => setOpen(true)); } });
  return (
    <>
      <PageHeader
        title="Lens bar"
        lede="While a lens is open, a frosted pill at the top names the question it asks, counts what matches, says where the answer came from, and switches between showing the matches in place and gathering them in a list, table, timeline or gallery. Pin keeps the lens on the canvas as a live region; close ends it. Built on Base UI Toolbar with the Segmented control."
      />
      <Section title="Playground" lede="Switch views, pin, close. Dials: the query, the count, the source, and Open again to replay the drop-in on the surface spring.">
        <Bench caption={`${mode} · ${d.source}`} className="min-h-[200px]">
          {open ? (
            <LensBar query={d.query} count={d.count} source={d.source === 'none' ? null : (d.source as 'jev')} mode={mode} onModeChange={setMode} onPin={() => setOpen(false)} onClose={() => setOpen(false)} glyphs={GLYPHS} />
          ) : (
            <span className="type-meta text-ink2">Closed. Use Open again in the dial panel.</span>
          )}
        </Bench>
        <Bench tone="page" caption="asking · the me lens (no views) · a selection lens (no pin)">
          <div className="flex flex-col items-center gap-20">
            <LensBar query="lunch this week" source="asking" onClose={() => {}} glyphs={GLYPHS} onPin={() => {}} />
            <LensBar query="me" modes={[]} onClose={() => {}} glyphs={GLYPHS} />
            <LensBar query="selection" count={3} onClose={() => {}} glyphs={GLYPHS} />
          </div>
        </Bench>
        <SwiftCapture name="lens-bar" />
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
          { id: 'L1', title: 'A lens never moves anything', body: 'In place dims what does not match; the other views gather matches in a panel without moving them.', origin: 'Kamui 03 §8' },
          { id: 'L2', title: 'Say where the answer came from', body: 'ASKING JEV while pending; VIA JEV or LOCAL when words beyond the rules were judged.', origin: 'Kamui demo' },
          { id: 'L3', title: 'It drops in, it does not bounce', body: 'A floating surface on the surface spring: one step from above, from .98.', origin: 'MetalUI T6' },
        ]} />
      </Section>
    </>
  );
}
