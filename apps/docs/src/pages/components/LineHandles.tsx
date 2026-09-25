import * as React from 'react';
import { LineHandles, inkColor } from '@unlocalhosted/metalui';
import reactSource from '../../../../../packages/metalui/src/components/line-handles/line-handles.tsx?raw';
import agentSource from '../../../../../packages/metalui/src/components/line-handles/line-handles.agent.md?raw';
import { ComponentPage } from '../../ui/ComponentPage';

type P = { x: number; y: number };

function Play() {
  const [ends, setEnds] = React.useState<{ from: P; to: P }>({ from: { x: 120, y: 230 }, to: { x: 460, y: 90 } });
  const [hover, setHover] = React.useState(false);
  const [selected, setSelected] = React.useState(false);
  const drag = React.useRef<'from' | 'to' | null>(null);
  const box = React.useRef<HTMLDivElement>(null);
  const at = (e: React.PointerEvent): P => { const r = box.current!.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const { from, to } = ends, g = Math.atan2(to.y - from.y, to.x - from.x), L = 12;
  const head = `M${to.x - L * Math.cos(g - 0.5)} ${to.y - L * Math.sin(g - 0.5)}L${to.x} ${to.y}L${to.x - L * Math.cos(g + 0.5)} ${to.y - L * Math.sin(g + 0.5)}`;
  return (
    <div
      ref={box}
      className="snap-canvas"
      style={{ height: 320, touchAction: 'none' }}
      onPointerDown={() => setSelected(false)}
      onPointerMove={(e) => { const k = drag.current; if (k) setEnds((s) => ({ ...s, [k]: at(e) })); }}
      onPointerUp={() => (drag.current = null)}
    >
      <svg width={1} height={1} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <path d={`M${from.x} ${from.y}L${to.x} ${to.y}${head}`} fill="none" stroke={inkColor('ink')} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        <path d={`M${from.x} ${from.y}L${to.x} ${to.y}`} stroke="transparent" strokeWidth={18} style={{ cursor: 'pointer' }}
          onPointerEnter={() => setHover(true)} onPointerLeave={() => setHover(false)}
          onPointerDown={(e) => { e.stopPropagation(); setSelected(true); }} />
      </svg>
      <LineHandles from={from} to={to} state={selected ? 'selected' : hover ? 'hover' : 'rest'}
        onHandlePointerDown={(end, e) => { e.stopPropagation(); try { box.current!.setPointerCapture(e.pointerId); } catch { /* a synthetic pointer */ } drag.current = end; }} />
    </div>
  );
}

export default function LineHandlesPage() {
  return (
    <ComponentPage
      title="Line handles"
      lede="A drawn line or arrow is its two ends, so when you select it you get two handles."
      play={{ lede: 'Hover the arrow, click it to select it, then drag either end.', node: <Play /> }}
      sources={[
        { id: 'react', label: 'React', code: reactSource },
        { id: 'agent', label: 'Agent guide', code: agentSource },
      ]}
      rules={[
        { id: 'LH1', title: 'Two ends, not a box', body: 'Lines and arrows never get the eight-handle frame. You change a line by moving its ends.', origin: 'DRAWING.md §6' },
        { id: 'LH2', title: 'One language', body: 'The same halo and handles as a connector, so every selection on the canvas looks alike.', origin: 'Ours' },
      ]}
    />
  );
}
