import * as React from 'react';
import { useDialKit } from 'dialkit';
import { Toolbar, ToolbarSearch, ToolbarSeparator, ToolButton } from '@unlocalhosted/metalui';
import { DrawIcon, RegionIcon, SearchIcon, SelectIcon, TextIcon, UndoIcon, ZoomInIcon } from '@unlocalhosted/metalui/icons';
import reactSource from '../../../../../packages/metalui/src/components/toolbar/toolbar.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/toolbar/toolbar.css?raw';
import agentGuide from '../../../../../packages/metalui/src/components/toolbar/toolbar.agent.md?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalToolbar.swift?raw';
import { Bench, PageHeader, Rules, Section, SourceTabs } from '../../ui/doc';
import { SwiftCapture } from '../../ui/SwiftCapture';

const TOOLS = [
  { id: 'select', label: 'Select', key: 'V', icon: <SelectIcon size={16} /> },
  { id: 'write', label: 'Write', key: 'T', icon: <TextIcon size={16} /> },
  { id: 'region', label: 'Region', key: 'R', icon: <RegionIcon size={16} /> },
  { id: 'ink', label: 'Ink', key: 'P', icon: <DrawIcon size={16} /> },
];

function Strip({ variant }: { variant: 'frost' | 'graphite' }) {
  const [tool, setTool] = React.useState('select');
  return (
    <Toolbar aria-label="Tools" variant={variant}>
      {TOOLS.map((t) => (
        <ToolButton key={t.id} label={t.label} shortcut={t.key} icon={t.icon} pressed={tool === t.id} onPressedChange={() => setTool(t.id)} />
      ))}
      <ToolbarSeparator />
      <ToolButton label="Zoom in" shortcut="⌘=" icon={<ZoomInIcon size={16} />} onClick={() => {}} />
      <ToolButton label="Undo" shortcut="⌘Z" icon={<UndoIcon size={16} />} onClick={() => {}} />
      <ToolbarSeparator />
      <ToolbarSearch onOpen={() => {}} icon={<SearchIcon size={14} />} />
    </Toolbar>
  );
}

export default function ToolbarPage() {
  const d = useDialKit('Toolbar', { variant: { type: 'select', options: ['graphite', 'frost'], default: 'graphite' } });
  return (
    <>
      <PageHeader title="Toolbar and tool button" lede="A capsule strip of circular tool caps. The active tool sits pressed with a green LED; each tool shows its name and key after 120 ms; the glyphs play their hover from the whole cap. The medium uses the graphite strip in both colorways. Built on Base UI Toolbar, Toggle and Tooltip." />
      <Section title="Playground" lede="Pick a tool, hover for its tooltip, press the momentary ones, tab in and use the arrows. Dial: graphite or frost.">
        <Bench caption={`${d.variant} strip · 48 tall · tools 36`} className="min-h-[200px]">
          <Strip variant={d.variant as 'graphite'} />
        </Bench>
        <Bench tone="page" caption="graphite and frost, over the page">
          <div className="flex flex-col items-center gap-20">
            <Strip variant="graphite" />
            <Strip variant="frost" />
          </div>
        </Bench>
        <SwiftCapture name="toolbar" maxWidth={620} />
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
          { id: 'B1', title: 'Every tool has a name and a key', body: 'Icon-only tools always carry a tooltip with the key and an accessible name.', origin: 'Kamui 04 §2' },
          { id: 'B2', title: 'Tool state is instant', body: 'A hundred times a day: only the press travels, one point, on release.', origin: 'MetalUI M6' },
          { id: 'B3', title: 'A strip is a capsule', body: '36 tools in a 6 nest make 48 at radius 24.', origin: 'FOUNDATIONS containers' },
        ]} />
      </Section>
    </>
  );
}
