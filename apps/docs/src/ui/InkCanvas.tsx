import * as React from 'react';
import { BrushCursor, Segmented, Slider } from '@unlocalhosted/metalui';

/* The Brush cursor playground: draw with the pen, rub strokes out with the eraser. The brush is
 * the stroke's true size on screen (width × zoom), and grows with pressure (a pen's, else the
 * pointer's speed, as the core's stroke_pressure does). */

type Pt = [number, number, number];
interface Stroke { id: number; pts: Pt[] }

export function InkCanvas({ height = 320 }: { height?: number }) {
  const [tool, setTool] = React.useState<'pen' | 'eraser'>('pen');
  const [width, setWidth] = React.useState(4);
  const [zoom, setZoom] = React.useState('1');
  const scale = Number(zoom);
  const [strokes, setStrokes] = React.useState<Stroke[]>([]);
  const [at, setAt] = React.useState<{ x: number; y: number } | null>(null);
  const [pressure, setPressure] = React.useState(1);
  const live = React.useRef<Stroke | null>(null);
  const last = React.useRef<{ x: number; y: number; t: number } | null>(null);
  const box = React.useRef<HTMLDivElement>(null);
  const ink = 'var(--ink)';

  const world = (e: React.PointerEvent) => { const r = box.current!.getBoundingClientRect(); return [(e.clientX - r.left) / scale, (e.clientY - r.top) / scale] as const; };
  // A pen reports pressure; a mouse or trackpad does not, so slower movement draws wider.
  const pressureOf = (e: React.PointerEvent) => {
    if (e.pointerType === 'pen' && e.pressure > 0) return 0.5 + e.pressure;
    const p = last.current, now = performance.now();
    if (!p) return 1;
    const v = Math.hypot(e.clientX - p.x, e.clientY - p.y) / Math.max(1, now - p.t);
    return Math.max(0.55, Math.min(1.35, 1.35 - v * 0.35));
  };
  const erase = (x: number, y: number) => {
    const rad = (width * 2.5) / 2;
    setStrokes((all) => all.filter((s) => !s.pts.some(([px, py]) => Math.hypot(px - x, py - y) < rad)));
  };

  const down = (e: React.PointerEvent) => {
    try { (e.target as HTMLElement).setPointerCapture(e.pointerId); } catch { /* a synthetic pointer */ }
    const [x, y] = world(e);
    last.current = { x: e.clientX, y: e.clientY, t: performance.now() };
    if (tool === 'eraser') { erase(x, y); live.current = { id: -1, pts: [] }; return; }
    live.current = { id: Date.now(), pts: [[x, y, 1]] };
    setStrokes((all) => [...all, live.current!]);
  };
  const move = (e: React.PointerEvent) => {
    setAt({ x: e.clientX, y: e.clientY });
    const s = live.current; if (!s) return;
    const [x, y] = world(e);
    const p = pressureOf(e); setPressure(p);
    last.current = { x: e.clientX, y: e.clientY, t: performance.now() };
    if (tool === 'eraser') { erase(x, y); return; }
    s.pts.push([x, y, p]);
    setStrokes((all) => all.map((k) => (k.id === s.id ? { ...s, pts: [...s.pts] } : k)));
  };
  const up = () => { live.current = null; last.current = null; setPressure(1); };

  const brush = tool === 'eraser' ? width * 2.5 * scale : width * scale * (live.current ? pressure : 1);

  return (
    <div className="flex w-full flex-col items-center gap-14">
      <div ref={box} className="snap-canvas ink-canvas" style={{ height }} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onPointerLeave={() => setAt(null)}>
        <svg className="snap-world" style={{ transform: `scale(${scale})`, overflow: 'visible' }} aria-hidden>
          {strokes.map((s) => s.pts.slice(1).map(([x, y, p], i) => {
            const [x0, y0] = s.pts[i];
            return <line key={`${s.id}-${i}`} x1={x0} y1={y0} x2={x} y2={y} stroke={ink} strokeWidth={width * p} strokeLinecap="round" />;
          }))}
        </svg>
        {!strokes.length && <span className="eng ink-hint">draw here</span>}
      </div>
      <BrushCursor mode={tool} at={at} size={brush} color={ink} />
      <div className="flex flex-wrap items-center justify-center gap-16">
        <Segmented size="compact" aria-label="Tool" value={tool} onValueChange={(v) => setTool(v as typeof tool)} options={[{ value: 'pen', label: 'Pen · P' }, { value: 'eraser', label: 'Eraser · E' }]} />
        <div style={{ width: 160, height: 32 }}>
          <Slider.Root value={width} min={1} max={16} step={1} onValueChange={setWidth}><Slider.Track /><Slider.Knob aria-label="Stroke width" /></Slider.Root>
        </div>
        <Segmented size="compact" aria-label="Zoom" value={zoom} onValueChange={setZoom} options={[{ value: '0.5', label: '50 %' }, { value: '1', label: '100 %' }, { value: '2', label: '200 %' }]} />
      </div>
    </div>
  );
}
