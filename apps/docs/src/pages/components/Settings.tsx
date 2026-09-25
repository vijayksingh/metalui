import * as React from 'react';
import { Button, Switcher, Settings, StatusBadge, Switch } from '@unlocalhosted/metalui';
import reactSource from '../../../../../packages/metalui/src/blocks/settings/settings.tsx?raw';
import agentSource from '../../../../../packages/metalui/src/blocks/settings/settings.agent.md?raw';
import { ComponentPage } from '../../ui/ComponentPage';

function SettingsView() {
  const [sync, setSync] = React.useState(true);
  const [usage, setUsage] = React.useState(false);
  const [colorway, setColorway] = React.useState('bone');
  return (
    <div style={{ width: 'min(560px, 100%)' }}>
      <Settings>
        <Settings.Section title="Sync">
          <Settings.Row id="s-sync" name="Sync this canvas" detail={sync ? 'Your other devices see changes within a second.' : 'Changes stay on this device.'}>
            <Switch aria-labelledby="s-sync" checked={sync} onCheckedChange={setSync} />
          </Settings.Row>
          <Settings.Row name="Account" detail="you@example.com">
            <StatusBadge led="live">Signed in</StatusBadge>
          </Settings.Row>
        </Settings.Section>
        <Settings.Section title="Look">
          <Settings.Row name="Colorway" detail="Bone is light, Graphite is dark.">
            <Switcher size="compact" aria-label="Colorway" value={colorway} onValueChange={setColorway} options={[{ value: 'bone', label: 'Bone' }, { value: 'graphite', label: 'Graphite' }]} />
          </Settings.Row>
        </Settings.Section>
        <Settings.Section title="Storage and backup">
          <Settings.Row name="Storage used" detail="1 240 blocks on this device">
            <span className="type-readout text-ink2">38.4 MB</span>
          </Settings.Row>
          <Settings.Row name="Backup" detail="One encrypted file with everything on this device.">
            <Button>Download</Button>
            <Button>Restore…</Button>
          </Settings.Row>
        </Settings.Section>
        <Settings.Section title="Shortcuts">
          <Settings.Keys name="Search and actions" keys={['⌘', 'K']} />
          <Settings.Keys name="Fit everything" keys={['⇧', '1']} />
          <Settings.Keys name="Back to 100 %" keys={['⌘', '0']} />
        </Settings.Section>
        <Settings.Section title="Privacy">
          <Settings.Row id="s-usage" name="Share usage counts" detail="How often features are used. Never what you write.">
            <Switch aria-labelledby="s-usage" checked={usage} onCheckedChange={setUsage} />
          </Settings.Row>
        </Settings.Section>
      </Settings>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ComponentPage
      title="Settings"
      lede="An app's settings as sections of rows. Each row says what the setting is in plain words, adds one line of detail, and has one control on the right."
      play={{ lede: 'Everything here works: switch sync off and read its detail change, pick a colorway, hover a row and notice it does not light up; only its control acts.', node: <SettingsView /> }}
      sources={[
        { id: 'react', label: 'React', code: reactSource },
        { id: 'agent', label: 'Agent guide', code: agentSource },
      ]}
      rules={[
        { id: 'ST1', title: 'One control per row', body: 'A switch, a switcher, a button or a value. Never two kinds in one row.', origin: 'Ours' },
        { id: 'ST2', title: 'Plain names', body: '"Sync this canvas", not "Enable synchronisation".', origin: 'Ours' },
        { id: 'ST3', title: 'The detail is what happens', body: 'One line: what it does, or what it is now.', origin: 'Ours' },
        { id: 'ST4', title: 'Rows do not light up', body: 'Only the control acts, so the row stays still under the pointer.', origin: 'Ours' },
      ]}
    />
  );
}
