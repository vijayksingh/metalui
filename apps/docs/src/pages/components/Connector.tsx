import reactSource from '../../../../../packages/metalui/src/components/connector/connector.tsx?raw';
import agentSource from '../../../../../packages/metalui/src/components/connector/connector.agent.md?raw';
import { ComponentPage } from '../../ui/ComponentPage';
import { ConnectorLab } from '../../ui/ConnectorLab';

export default function ConnectorPage() {
  return (
    <ComponentPage
      title="Connector"
      lede="A line or arrow that joins two blocks. Move a block and the line follows it."
      play={{ lede: 'Drag a block hard and let go: the elastic line bends and whips back. Switch to Current or Stardust to show a flow, and pick which way it runs.', node: <ConnectorLab /> }}
      sources={[
        { id: 'react', label: 'React', code: reactSource },
        { id: 'agent', label: 'Agent guide', code: agentSource },
      ]}
      rules={[
        { id: 'CN1', title: 'Quiet at rest', body: 'At rest a connector is only its ink and its label. The dots and halo show on hover.', origin: 'Ours' },
        { id: 'CN2', title: 'Same frame', body: 'When a block moves, the path is re-routed in the same frame. The line never trails the block.', origin: 'DRAWING.md DR-07' },
        { id: 'CN3', title: 'Solid or hollow', body: 'A solid dot is an end on a block. A hollow dot is a free end.', origin: 'Ours' },
      ]}
    />
  );
}
