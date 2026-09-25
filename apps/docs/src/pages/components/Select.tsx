import * as React from 'react';
import { Select, Toolbar, ToolButton, ToolbarSeparator } from '@unlocalhosted/metalui';
import { CheckIcon, DuplicateIcon, SendAwayIcon, ShareIcon, SelectIcon } from '@unlocalhosted/metalui/icons';
import reactSource from '../../../../../packages/metalui/src/components/select/select.tsx?raw';
import agentSource from '../../../../../packages/metalui/src/components/select/select.agent.md?raw';
import { ComponentPage } from '../../ui/ComponentPage';

const ICONS = [
  { value: 'none', label: 'No icon' },
  { value: 'share', label: 'Share', lead: <ShareIcon size={14} /> },
  { value: 'duplicate', label: 'Duplicate', lead: <DuplicateIcon size={14} /> },
  { value: 'send-away', label: 'Send away', lead: <SendAwayIcon size={14} /> },
  { value: 'check', label: 'Check', lead: <CheckIcon size={14} /> },
];

const dot = (c: string) => <span style={{ display: 'block', width: 10, height: 10, borderRadius: 99, background: c, boxShadow: 'inset 0 0 0 .5px rgba(0,0,0,.15)' }} />;
const FOLDERS = [
  { label: 'Recent', options: [
    { value: 'poster', label: 'poster refs', lead: dot('#D9C8EA') },
    { value: 'ui', label: 'UI libraries', lead: dot('#C9DAEF') },
  ] },
  { label: 'All folders', options: [
    { value: 'lingerie', label: 'Lingerie', lead: dot('#F0D2C8') },
    { value: 'recipes', label: 'Recipes', lead: dot('#F1E0BD') },
    { value: 'garden', label: 'Garden', lead: dot('#CFE3CE') },
    { value: 'archive', label: 'Archive', lead: dot('#E1DFD9'), disabled: true },
  ] },
];

function Play() {
  const [icon, setIcon] = React.useState('share');
  const [folder, setFolder] = React.useState<string | null>(null);
  const [tried, setTried] = React.useState(false);
  return (
    <div className="flex w-full flex-col items-center gap-24">
      <div className="flex flex-wrap items-end justify-center gap-24">
        <label className="flex flex-col gap-6"><span className="eng">Icon</span>
          <Select aria-label="Icon" options={ICONS} value={icon} onValueChange={setIcon} />
        </label>
        <label className="flex flex-col gap-6"><span className="eng">Move to folder</span>
          <Select aria-label="Move to folder" options={FOLDERS} value={folder} onValueChange={setFolder} placeholder="Choose a folder" invalid={tried && !folder} />
        </label>
        <button type="button" className="eng" onClick={() => setTried(true)} style={{ background: 'none', border: 0, cursor: 'pointer' }}>try without choosing</button>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-24">
        <Toolbar aria-label="Dense strip" variant="frost">
          <ToolButton label="Select" shortcut="V" icon={<SelectIcon size={16} />} pressed onPressedChange={() => {}} />
          <ToolbarSeparator />
          <Select size="compact" aria-label="Icon (compact)" options={ICONS} value={icon} onValueChange={setIcon} />
        </Toolbar>
        <Select aria-label="Disabled" options={ICONS} value="duplicate" disabled />
      </div>
    </div>
  );
}

export default function SelectPage() {
  return (
    <ComponentPage
      title="Select"
      lede="Pick one value from a list: an icon, a folder, a preset. It is a well that holds the value, and it opens a frosted list with your choice over it."
      play={{ lede: 'Open one with a click or with ↵ and the arrow keys. Type a letter to jump. Try the compact one in the strip, and press "try without choosing" to see the missing-value ring.', node: <Play /> }}
      sources={[
        { id: 'react', label: 'React', code: reactSource },
        { id: 'agent', label: 'Agent guide', code: agentSource },
      ]}
      rules={[
        { id: 'SE1', title: 'A value, not an action', body: 'A select holds a value, so it is a well like a field. An action belongs in a Menu, from a button.', origin: 'Ours' },
        { id: 'SE2', title: 'Few options side by side', body: 'Two to four short options that fit are a Segmented. Use a select when the list is longer or the labels are long.', origin: 'Ours' },
        { id: 'SE3', title: 'The choice stays in place', body: 'The list opens with the chosen row over the trigger, so the eye does not have to find it again.', origin: 'macOS pop-up button' },
        { id: 'SE4', title: 'Latched is the green LED', body: 'The chosen row shows the same green LED as a latched tool, not a checkmark.', origin: 'Soft Hardware' },
      ]}
    />
  );
}
