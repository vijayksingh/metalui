import * as React from 'react';
import { Tabs, TabList, TabPanel } from '@unlocalhosted/metalui';
import reactSource from '../../../../../packages/metalui/src/components/tabs/tabs.tsx?raw';
import agentSource from '../../../../../packages/metalui/src/components/tabs/tabs.agent.md?raw';
import { ComponentPage } from '../../ui/ComponentPage';

const SECTIONS = [
  { value: 'canvas', label: 'Canvas' },
  { value: 'sync', label: 'Sync' },
  { value: 'shortcuts', label: 'Shortcuts' },
  { value: 'about', label: 'About' },
] as const;

const BODY: Record<(typeof SECTIONS)[number]['value'], { title: string; rows: string[] }> = {
  canvas: { title: 'Canvas', rows: ['Snap to grid', 'Show the minimap', 'Hold to perfect shapes'] },
  sync: { title: 'Sync', rows: ['Signed in', 'Last synced a minute ago', 'Encrypted on this device'] },
  shortcuts: { title: 'Shortcuts', rows: ['Open the panel  ⌥ Space', 'New note  ⌘ N', 'Search  ⌘ K'] },
  about: { title: 'About', rows: ['Version 0.0', 'Made on a Mac', 'Licences'] },
};

function Play() {
  const [tab, setTab] = React.useState<(typeof SECTIONS)[number]['value']>('canvas');
  return (
    <Tabs value={tab} onValueChange={setTab} className="flex w-full max-w-420 flex-col items-center gap-16">
      <TabList aria-label="Settings" items={[...SECTIONS]} />
      {SECTIONS.map((s) => (
        <TabPanel key={s.value} value={s.value} className="w-full">
          <div className="material-stage rounded-plate px-16 py-12">
            <p className="type-label engraved pb-8">{BODY[s.value].title}</p>
            {BODY[s.value].rows.map((r) => <p key={r} className="type-ui py-6 text-ink2">{r}</p>)}
          </div>
        </TabPanel>
      ))}
    </Tabs>
  );
}

export default function TabsPage() {
  return (
    <ComponentPage
      title="Tabs"
      lede="Switch which panel is shown. The tabs sit on the same track as the Switcher, and the new panel comes in from the side you moved to."
      play={{ lede: 'Click a tab, or focus one and use ← →. Watch the panel come in from the side the thumb went.', node: <Play /> }}
      sources={[
        { id: 'react', label: 'React', code: reactSource },
        { id: 'agent', label: 'Agent guide', code: agentSource },
      ]}
      rules={[
        { id: 'TB1', title: 'Tabs own panels', body: 'Use Tabs when each option shows its own panel. Picking a value with no panel is a Switcher, even though they look the same.', origin: 'WAI-ARIA tabs' },
        { id: 'TB2', title: 'One look for one of a few', body: 'Tabs and the Switcher share the track and the gliding thumb, so choosing one of a few always feels the same.', origin: 'Ours' },
        { id: 'TB3', title: 'The panel follows the thumb', body: 'The new panel drifts in from the side the thumb went, so the eye knows which way it moved. The first panel shows without motion.', origin: 'Ours' },
        { id: 'TB4', title: 'Few and short', body: 'Five or six short tabs at most. More, or long labels, want a Select or a side list.', origin: 'Ours' },
      ]}
    />
  );
}
