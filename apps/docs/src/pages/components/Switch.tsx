import * as React from 'react';
import { Switch } from '@unlocalhosted/metalui';
import reactSource from '../../../../../packages/metalui/src/components/switch/switch.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/theme.css?raw';
import agentSource from '../../../../../packages/metalui/src/components/switch/switch.agent.md?raw';
import { ComponentPage } from '../../ui/ComponentPage';

export default function SwitchPage() {
  const [on, setOn] = React.useState(true);
  return (
    <ComponentPage
      title="Switch"
      lede="For a setting that is on or off and takes effect at once. The thumb slides on a spring and the track fills green. Press and hold: the thumb already stretches toward where it is going."
      play={{ lede: 'Click them, or Tab to one and press Space.', caption: 'regular · small · disabled', node: (
        <div className="flex items-center gap-28" style={{ zoom: 1.6 }}>
          <Switch aria-label="Regular" checked={on} onCheckedChange={setOn} />
          <Switch aria-label="Small" size="small" defaultChecked />
          <Switch aria-label="Disabled" disabled defaultChecked />
        </div>
      ) }}
      sources={[
        { id: 'react', label: 'React', code: reactSource },
        { id: 'css', label: 'CSS', code: cssSource },
        { id: 'agent', label: 'Agent guide', code: agentSource },
      ]}
      rules={[
        { id: 'SW1', title: 'It acts at once', body: 'If the change needs Save or a confirmation, it is not a switch.', origin: 'Ours' },
        { id: 'SW2', title: 'Say what is on', body: 'Its label reads "Sync this canvas", not "Enable sync".', origin: 'Ours' },
        { id: 'SW3', title: 'The thumb has a stop', body: 'It slides on the part spring and may overshoot a little against the end, like a real switch.', origin: 'Reference design' },
      ]}
    />
  );
}
