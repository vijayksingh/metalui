import reactSource from '../../../../../packages/metalui/src/components/lasso/lasso.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/theme.css?raw';
import agentSource from '../../../../../packages/metalui/src/components/lasso/lasso.agent.md?raw';
import { ComponentPage } from '../../ui/ComponentPage';
import { SnapCanvas } from '../../ui/SnapCanvas';
import { LassoXray } from '../../ui/xray/LassoXray';

export default function LassoPage() {
  return (
    <ComponentPage
      title="Lasso"
      lede="The box you draw by dragging on empty space. Everything it touches is selected when you let go, and a small readout under it counts how many."
      play={{ lede: 'Drag on empty space, not on a note. Change the zoom: the line and the count stay the same size.', caption: 'touching is enough', node: <SnapCanvas lasso /> }}
      xray={<LassoXray />}
      sources={[
        { id: 'react', label: 'React', code: reactSource },
        { id: 'css', label: 'CSS', code: cssSource },
        { id: 'agent', label: 'Agent guide', code: agentSource },
      ]}
      rules={[
        { id: 'LS1', title: 'Touching is enough', body: 'A note counts as soon as the box touches it. Nobody should have to fit a whole note inside.', origin: 'Native reference' },
        { id: 'LS2', title: 'Count only what is there', body: 'The readout counts what the box touches now, and shows nothing when that is none.', origin: 'Native reference' },
        { id: 'LS3', title: 'Quiet', body: 'A hairline and a faint fill. No moving dashes, no glow.', origin: 'Native reference' },
      ]}
    />
  );
}
