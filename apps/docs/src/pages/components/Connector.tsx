import * as React from 'react';
import { Connector, Segmented, Surface, inkColor } from '@unlocalhosted/metalui';
import reactSource from '../../../../../packages/metalui/src/components/connector/connector.tsx?raw';
import agentSource from '../../../../../packages/metalui/src/components/connector/connector.agent.md?raw';
import { ComponentPage } from '../../ui/ComponentPage';

/* Two blocks and an arrow between them. Drag a block: the arrow re-attaches to the nearest edges
 * in the same frame. Hover the arrow, click it to select it, click empty space to let go. */

type Box = { x: number; y: number; w: number; h: number };

/** Where the line from a box's centre toward (tx, ty) leaves the box. */
function edgePoint(b: Box, tx: number, ty: number) {
  const cx = b.x + b.w / 2, cy = b.y + b.h / 2, dx = tx - cx, dy = ty - cy;
  const k = Math.min(Math.abs((b.w / 2) / (dx || 1e-6)), Math.abs((b.h / 2) / (dy || 1e-6)));
  return { x: cx + dx * k, y: cy + dy * k };
}

function Play() {
  const [a, setA] = React.useState<Box>({ x: 40, y: 60, w: 150, h: 70 });
  const [b, setB] = React.useState<Box>({ x: 330, y: 170, w: 150, h: 70 });
  const [state, setState] = React.useState<'rest' | 'hover' | 'selected'>('rest');
  const [end, setEnd] = React.useState('attached');
  const drag = React.useRef<{ which: 'a' | 'b'; dx: number; dy: number } | null>(null);
  const box = React.useRef<HTMLDivElement>(null);

  const free = { x: b.x + b.w / 2 + 40, y: b.y - 60 };
  const target = end === 'attached' ? { x: b.x + b.w / 2, y: b.y + b.h / 2 } : free;
  const p0 = edgePoint(a, target.x, target.y);
  const p1 = end === 'attached' ? edgePoint(b, a.x + a.w / 2, a.y + a.h / 2) : free;
  const ang = Math.atan2(p1.y - p0.y, p1.x - p0.x), L = 11;
  const head = `M${p1.x - L * Math.cos(ang - 0.5)} ${p1.y - L * Math.sin(ang - 0.5)}L${p1.x} ${p1.y}L${p1.x - L * Math.cos(ang + 0.5)} ${p1.y - L * Math.sin(ang + 0.5)}`;
  const d = `M${p0.x} ${p0.y}L${p1.x} ${p1.y}`;

  const at = (e: React.PointerEvent) => { const r = box.current!.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const down = (which: 'a' | 'b') => (e: React.PointerEvent) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    const p = at(e), s = which === 'a' ? a : b;
    drag.current = { which, dx: p.x - s.x, dy: p.y - s.y };
  };
  const move = (e: React.PointerEvent) => {
    const g = drag.current; if (!g) return;
    const p = at(e), set = g.which === 'a' ? setA : setB;
    set((s) => ({ ...s, x: p.x - g.dx, y: p.y - g.dy }));
  };
  const card = (s: Box, which: 'a' | 'b', text: string) => (
    <Surface material="raise-sm" radius="plate" onPointerDown={down(which)} style={{ position: 'absolute', left: s.x, top: s.y, width: s.w, height: s.h, cursor: 'grab', display: 'grid', placeItems: 'center', touchAction: 'none' }}>
      <span className="eng">{text}</span>
    </Surface>
  );

  return (
    <div className="flex w-full flex-col items-center gap-14">
      <div ref={box} className="snap-canvas" style={{ height: 320 }} onPointerMove={move} onPointerUp={() => (drag.current = null)} onPointerDown={() => setState('rest')}>
        {card(a, 'a', 'Idea')}
        {end === 'attached' && card(b, 'b', 'Plan')}
        <svg width={1} height={1} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
          <path d={d + head} fill="none" stroke={inkColor('ink')} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <path d={d} fill="none" stroke="transparent" strokeWidth={16} style={{ cursor: 'pointer' }}
            onPointerEnter={() => setState((s) => (s === 'selected' ? s : 'hover'))}
            onPointerLeave={() => setState((s) => (s === 'selected' ? s : 'rest'))}
            onPointerDown={(e) => { e.stopPropagation(); setState('selected'); }} />
        </svg>
        <Connector d={d} from={{ ...p0, attached: true }} to={{ ...p1, attached: end === 'attached' }} state={state} label="leads to" labelAt={{ x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 }} />
      </div>
      <Segmented size="compact" aria-label="Far end" value={end} onValueChange={setEnd} options={[{ value: 'attached', label: 'Attached' }, { value: 'free', label: 'Free end' }]} />
    </div>
  );
}

export default function ConnectorPage() {
  return (
    <ComponentPage
      title="Connector"
      lede="A line or arrow that joins two blocks. Move a block and the line follows it."
      play={{ lede: 'Drag a block: the arrow re-attaches to the nearest edges. Hover the arrow to see its ends, click it to select it. Switch to a free end to see the hollow dot.', node: <Play /> }}
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
