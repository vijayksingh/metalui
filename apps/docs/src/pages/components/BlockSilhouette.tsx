import reactSource from '../../../../../packages/metalui/src/components/block-silhouette/block-silhouette.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/theme.css?raw';
import agentSource from '../../../../../packages/metalui/src/components/block-silhouette/block-silhouette.agent.md?raw';
import { ComponentPage } from '../../ui/ComponentPage';
import { FarCanvas, KindPairs } from '../../ui/FarCanvas';

export default function BlockSilhouettePage() {
  return (
    <ComponentPage
      title="Block silhouette"
      lede="How a block looks when you zoom far out. Below 35 %, every block turns into one flat shape that still tells you what it is, so a canvas with thousands of blocks stays smooth."
      play={{ lede: 'Drag the zoom below the mark and let go. The blocks turn into silhouettes when you let go, never while you are still zooming.', node: <FarCanvas /> }}
      more={[{ id: 'kinds', title: 'Every kind', lede: 'Left: the block. Right: its silhouette. Text keeps only the shape of its lines; a link keeps its colour; a region keeps its name, large.', node: <KindPairs /> }]}
      sources={[
        { id: 'react', label: 'React', code: reactSource },
        { id: 'css', label: 'CSS', code: cssSource },
        { id: 'agent', label: 'Agent guide', code: agentSource },
      ]}
      rules={[
        { id: 'BS1', title: 'Swap when the zoom settles', body: 'Silhouettes replace blocks when you let go of the zoom, never in the middle of a pinch.', origin: 'Native reference' },
        { id: 'BS2', title: 'Still says what it is', body: 'Each kind keeps one clue: the shape of its lines, its colour, its glass, its name.', origin: 'Ours' },
        { id: 'BS3', title: 'Cheap on purpose', body: 'One flat shape each: no text except a region name, no shadows beyond a hairline.', origin: 'Native reference' },
        { id: 'BS4', title: 'One threshold for everyone', body: 'Both apps read 35 % from the shared core, so a shared canvas looks the same to everyone.', origin: 'Ours' },
      ]}
    />
  );
}
