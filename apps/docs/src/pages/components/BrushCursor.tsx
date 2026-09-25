import reactSource from '../../../../../packages/metalui/src/components/brush-cursor/brush-cursor.tsx?raw';
import cssSource from '../../../../../packages/metalui/src/components/theme.css?raw';
import agentSource from '../../../../../packages/metalui/src/components/brush-cursor/brush-cursor.agent.md?raw';
import { ComponentPage } from '../../ui/ComponentPage';
import { InkCanvas } from '../../ui/InkCanvas';
import { AssistLab } from '../../ui/AssistLab';
import { Bench } from '../../ui/doc';

export default function BrushCursorPage() {
  return (
    <ComponentPage
      title="Brush cursor"
      lede="While you draw or erase, the pointer becomes the brush: a dot in the ink colour exactly as wide as the stroke, or a dashed ring the size of what the eraser removes."
      play={{ lede: 'Draw, then switch to the eraser and rub a stroke out. Change the width and the zoom: the brush always matches the line you will make. Draw slowly for a wider line.', node: <InkCanvas /> }}
      more={[{
        id: 'assisted-ink',
        title: 'Assisted ink',
        lede: 'The pen helps while you write, like a hand on the elbow: slow, shaky movement is steadied, quick sure movement is left alone, corners stay sharp, a skid on landing is dropped, and when you lift, the ink finishes where your hand stopped. Nothing is redrawn after it appears. Try Shaky hand, then write yourself with Both on; the grey trace is what your hand did.',
        node: <Bench><AssistLab /></Bench>,
      }]}
      sources={[
        { id: 'react', label: 'React', code: reactSource },
        { id: 'css', label: 'CSS', code: cssSource },
        { id: 'agent', label: 'Agent guide', code: agentSource },
      ]}
      rules={[
        { id: 'BR1', title: 'The true size', body: 'The brush is the stroke width times the zoom, never a fixed icon.', origin: 'Native reference' },
        { id: 'BR2', title: 'No easing', body: 'It follows the pointer and changes size in the same frame. A brush that lagged would lie about the stroke.', origin: 'Ours' },
        { id: 'BR3', title: 'Readable on anything', body: 'A light ring and a dark edge, so the brush shows on light ink, dark ink, Bone and Graphite.', origin: 'Ours' },
      ]}
    />
  );
}
