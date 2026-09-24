import * as React from 'react';
import { Checkbox } from '@unlocalhosted/metalui';
import { CheckboxXray } from '../../ui/xray/CheckboxXray';
import reactSource from '../../../../../packages/metalui/src/components/checkbox/checkbox.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/theme.css?raw';
import agentSource from '../../../../../packages/metalui/src/components/checkbox/checkbox.agent.md?raw';
import { ComponentPage } from '../../ui/ComponentPage';

export default function CheckboxPage() {
  const [done, setDone] = React.useState(false);
  return (
    <ComponentPage
      title={"Checkbox"}
      lede={"The small hole in the margin of a task. Tick it and a dark key fills the hole and a tick draws on. It can also be half done, or only suggested."}
      play={{ lede: "Tick the first task. The other two show the half-done and suggested looks.", caption: "rest \u00b7 done \u00b7 doing \u00b7 suggested", node: (
          <div className="flex flex-col gap-14" style={{ font: '500 15px/22px var(--sans)', zoom: 1.2 }}>
            <label className="flex items-center gap-10"><Checkbox checked={done} onCheckedChange={setDone} aria-label="Call the printer" /><span style={done ? { color: 'var(--ink3)', textDecoration: 'line-through' } : undefined}>call the printer about paper</span></label>
            <label className="flex items-center gap-10"><Checkbox doing aria-label="Pick the typeface" /><span>pick the typeface</span></label>
            <label className="flex items-center gap-10"><Checkbox ghost aria-label="Book the venue" /><span>book the venue</span></label>
          </div>
        ) }}
      xray={<CheckboxXray />}
      sources={[
        { id: 'react', label: "React", code: reactSource },
        { id: 'css', label: "CSS", code: cssSource },
        { id: 'agent', label: "Agent guide", code: agentSource },
      ]}
      rules={[
        { id: "CB1", title: "Only a person ticks it", body: "Ticking is always someone's own action, and it can be undone.", origin: 'Ours' },
        { id: "CB2", title: "Suggested is only an outline", body: "A task the app guessed never looks like a task you wrote.", origin: 'Ours' },
        { id: "CB3", title: "Give it a name", body: "Its accessible name is the task's text.", origin: 'Ours' },
      ]}
    />
  );
}
