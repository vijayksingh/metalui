import * as React from 'react';
import { IconButton } from '@unlocalhosted/metalui';
import { Icon } from '@unlocalhosted/metalui/icons';
import { IconButtonXray } from '../../ui/xray/IconButtonXray';
import reactSource from '../../../../../packages/metalui/src/components/icon-button/icon-button.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/theme.css?raw';
import swiftSource from '../../../../../swift/Sources/MetalUI/Components/MetalIconButton.swift?raw';
import agentSource from '../../../../../packages/metalui/src/components/icon-button/icon-button.agent.md?raw';
import { ComponentPage } from '../../ui/ComponentPage';

export default function IconButtonPage() {
  const [on, setOn] = React.useState(true);
  return (
    <ComponentPage
      title={"Icon button"}
      lede={"A button with only an icon. The tool kind is a dark cap that can stay pressed down with a small green light. There is also a flat ghost kind and a tiny mini kind."}
      play={{ lede: "Press the tool cap to latch it. Hover the ghost button. The mini one sits inside a chip.", caption: "tool \u00b7 ghost \u00b7 mini", node: (
          <div className="flex items-center gap-24" style={{ zoom: 1.3 }}>
            <span data-mu-colorway="graphite" className="material-frost-graphite inline-flex rounded-pill p-6"><IconButton variant="tool" label="Draw" icon={<Icon name="draw" size={16} />} pressed={on} onClick={() => setOn(!on)} /></span>
            <IconButton variant="ghost" label="More" icon={<Icon name="more" size={14} />} />
            <span className="inline-flex items-center gap-4 rounded-pill px-8 ring-1 ring-rule"><span className="type-ui text-ink2">Task?</span><IconButton variant="mini" accept label="Accept" icon={<>✓</>} /></span>
          </div>
        ) }}
      xray={<IconButtonXray />}
      sources={[
        { id: 'react', label: "React", code: reactSource },
        { id: 'css', label: "CSS", code: cssSource },
        { id: 'swift', label: "SwiftUI", code: swiftSource },
        { id: 'agent', label: "Agent guide", code: agentSource },
      ]}
      rules={[
        { id: "IB1", title: "Always name it", body: "An icon alone is not a name. Give it a label, and in a toolbar a tooltip with its key.", origin: 'Ours' },
        { id: "IB2", title: "Latched means in use", body: "Only the tool you are using stays down with its green light.", origin: 'Ours' },
        { id: "IB3", title: "Press is straight and fast", body: "It drops 1 pt in 50 ms, at a steady speed, and comes back when you let go.", origin: 'Ours' },
      ]}
    />
  );
}
