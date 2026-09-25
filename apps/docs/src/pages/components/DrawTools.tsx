import * as React from 'react';
import { DrawTools, type DrawTool, type Ink, type InkWidth } from '@unlocalhosted/metalui';
import reactSource from '../../../../../packages/metalui/src/blocks/draw-tools/draw-tools.tsx?raw';
import picksSource from '../../../../../packages/metalui/src/components/draw-picks/draw-picks.tsx?raw';
import agentSource from '../../../../../packages/metalui/src/blocks/draw-tools/draw-tools.agent.md?raw';
import { ComponentPage } from '../../ui/ComponentPage';

function Play() {
  const [tool, setTool] = React.useState<DrawTool | null>('pen');
  const [ink, setInk] = React.useState<Ink>('ink');
  const [width, setWidth] = React.useState<InkWidth>('regular');
  return (
    <div className="flex w-full flex-col items-center gap-16">
      <DrawTools tool={tool} onToolChange={setTool} ink={ink} onInkChange={setInk} width={width} onWidthChange={setWidth} />
      <DrawTools variant="graphite" tool={tool} onToolChange={setTool} ink={ink} onInkChange={setInk} width={width} onWidthChange={setWidth} />
    </div>
  );
}

export default function DrawToolsPage() {
  return (
    <ComponentPage
      title="Draw tools"
      lede="The drawing part of the toolbar: eight tools, five inks and three widths in one strip."
      play={{ lede: 'Pick a tool, an ink and a width. Hover the tools to see what each one does. Pick the eraser: inks and widths fade, since it has neither.', node: <Play /> }}
      sources={[
        { id: 'react', label: 'React', code: reactSource },
        { id: 'css', label: 'Picks', code: picksSource },
        { id: 'agent', label: 'Agent guide', code: agentSource },
      ]}
      rules={[
        { id: 'DT1', title: 'A fixed set', body: 'Five inks and three widths. Never a free colour picker.', origin: 'DRAWING.md DR-06' },
        { id: 'DT2', title: 'One key each', body: 'P, N, M, L, A, R, O, E. V or Escape goes back to select.', origin: 'DRAWING.md DR-01' },
        { id: 'DT3', title: 'At once', body: 'Picking a tool, ink or width changes at once. You pick them many times a day.', origin: 'Toolbar' },
      ]}
    />
  );
}
