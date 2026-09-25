import * as React from 'react';
import { Connector, Segmented, Surface, inkColor, type ConnectorFlow, type ConnectorLook } from '@unlocalhosted/metalui';

/* The Connector playground: two blocks and a line between them. Drag a block hard and let go,
 * hover the line, click it to select it; pick the look and which way it flows. */

type Box = { x: number; y: number; w: number; h: number };
type P = { x: number; y: number };

/** Where the line from a box's centre toward a point leaves the box. */
function edgePoint(b: Box, t: P): P {
  const cx = b.x + b.w / 2, cy = b.y + b.h / 2, dx = t.x - cx, dy = t.y - cy;
  const k = Math.min(Math.abs(b.w / 2 / (dx || 1e-6)), Math.abs(b.h / 2 / (dy || 1e-6)));
  return { x: cx + dx * k, y: cy + dy * k };
}
const centre = (b: Box): P => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });

export function ConnectorLab() {
  const [look, setLook] = React.useState<ConnectorLook>('elastic');
  const [flow, setFlow] = React.useState<ConnectorFlow>('forward');
  const [hovered, setHovered] = React.useState(false);
  const [selected, setSelected] = React.useState(false);
  const [blocks, setBlocks] = React.useState<{ a: Box; b: Box }>({ a: { x: 50, y: 60, w: 150, h: 70 }, b: { x: 380, y: 200, w: 150, h: 70 } });
  const drag = React.useRef<{ which: 'a' | 'b'; dx: number; dy: number } | null>(null);
  const box = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // A drag ends wherever the pointer is let go.
    const release = () => (drag.current = null);
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    return () => { window.removeEventListener('pointerup', release); window.removeEventListener('pointercancel', release); };
  }, []);

  const at = (e: React.PointerEvent): P => { const r = box.current!.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const down = (which: 'a' | 'b') => (e: React.PointerEvent) => {
    e.stopPropagation();
    try { (e.target as HTMLElement).setPointerCapture(e.pointerId); } catch { /* a synthetic pointer */ }
    const p = at(e), s = blocks[which];
    drag.current = { which, dx: p.x - s.x, dy: p.y - s.y };
  };
  const move = (e: React.PointerEvent) => {
    const g = drag.current; if (!g) return;
    const p = at(e);
    setBlocks((all) => ({ ...all, [g.which]: { ...all[g.which], x: p.x - g.dx, y: p.y - g.dy } }));
  };

  const { a, b } = blocks;
  const p0 = edgePoint(a, centre(b)), p1 = edgePoint(b, centre(a));

  return (
    <div className="flex w-full flex-col items-center gap-14">
      <div ref={box} className="snap-canvas" style={{ height: 340, touchAction: 'none' }} onPointerMove={move} onPointerDown={() => setSelected(false)}>
        {(['a', 'b'] as const).map((k) => (
          <Surface key={k} material="raise-sm" radius="plate" onPointerDown={down(k)} style={{ position: 'absolute', left: blocks[k].x, top: blocks[k].y, width: blocks[k].w, height: blocks[k].h, cursor: 'grab', display: 'grid', placeItems: 'center', touchAction: 'none' }}>
            <span className="eng">{k === 'a' ? 'Idea' : 'Plan'}</span>
          </Surface>
        ))}
        <Connector
          from={{ ...p0, attached: true }}
          to={{ ...p1, attached: true }}
          look={look}
          flow={flow}
          ink={inkColor('ink')}
          state={selected ? 'selected' : hovered ? 'hover' : 'rest'}
          label="leads to"
          onHoverChange={setHovered}
          onPress={(e) => { e.stopPropagation(); setSelected(true); }}
        />
      </div>
      <div className="flex flex-wrap items-center justify-center gap-16">
        <Segmented size="compact" aria-label="Look" value={look} onValueChange={(v) => setLook(v as ConnectorLook)} options={[{ value: 'elastic', label: 'Elastic' }, { value: 'current', label: 'Current' }, { value: 'stardust', label: 'Stardust' }]} />
        <Segmented size="compact" aria-label="Flow" value={flow} onValueChange={(v) => setFlow(v as ConnectorFlow)} options={[{ value: 'forward', label: 'Idea → Plan' }, { value: 'backward', label: 'Plan → Idea' }, { value: 'both', label: 'Both ways' }]} />
      </div>
    </div>
  );
}
