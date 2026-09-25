import * as React from 'react';
import { BrushCursor, DrawTools, Segmented, inkColor, type DrawTool, type Ink, type InkWidth } from '@unlocalhosted/metalui';

/* The Brush cursor playground: pick a tool in the drawing group and draw. The brush is the
 * stroke's true size on screen (width × zoom) and grows with pressure (a pen's, else the
 * pointer's speed, as the core's stroke_pressure does). Shapes draw from the crosshair. */

type Pt = [number, number, number];
interface Mark { id: number; tool: DrawTool; ink: Ink; w: number; pts: Pt[] }

const WIDTH: Record<InkWidth, number> = { fine: 2, regular: 4, bold: 8 };
const SHAPES = new Set<DrawTool>(['line', 'arrow', 'rectangle', 'ellipse']);

function shapeOf(m: Mark, key: string) {
  const [[x0, y0], [x1, y1]] = [m.pts[0], m.pts[m.pts.length - 1]];
  const style = { fill: 'none', stroke: inkColor(m.ink), strokeWidth: m.w, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (m.tool === 'rectangle') return <rect key={key} {...style} x={Math.min(x0, x1)} y={Math.min(y0, y1)} width={Math.abs(x1 - x0)} height={Math.abs(y1 - y0)} rx={6} />;
  if (m.tool === 'ellipse') return <ellipse key={key} {...style} cx={(x0 + x1) / 2} cy={(y0 + y1) / 2} rx={Math.abs(x1 - x0) / 2} ry={Math.abs(y1 - y0) / 2} />;
  const g = Math.atan2(y1 - y0, x1 - x0), L = 6 + m.w * 2.5;
  const head = m.tool === 'arrow' ? `M${x1 - L * Math.cos(g - 0.5)} ${y1 - L * Math.sin(g - 0.5)}L${x1} ${y1}L${x1 - L * Math.cos(g + 0.5)} ${y1 - L * Math.sin(g + 0.5)}` : '';
  return <path key={key} {...style} d={`M${x0} ${y0}L${x1} ${y1}${head}`} />;
}

export function InkCanvas({ height = 320 }: { height?: number }) {
  const [tool, setTool] = React.useState<DrawTool | null>('pen');
  const [ink, setInk] = React.useState<Ink>('ink');
  const [width, setWidth] = React.useState<InkWidth>('regular');
  const [zoom, setZoom] = React.useState('1');
  const scale = Number(zoom);
  const [marks, setMarks] = React.useState<Mark[]>([]);
  const [at, setAt] = React.useState<{ x: number; y: number } | null>(null);
  const [pressure, setPressure] = React.useState(1);
  const live = React.useRef<Mark | null>(null);
  const last = React.useRef<{ x: number; y: number; t: number } | null>(null);
  const box = React.useRef<HTMLDivElement>(null);
  const w = WIDTH[width] * (tool === 'marker' ? 3 : tool === 'pencil' ? 0.6 : 1);

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
    const rad = (WIDTH[width] * 2.5) / 2;
    setMarks((all) => all.filter((m) => !m.pts.some(([px, py]) => Math.hypot(px - x, py - y) < rad)));
  };

  const down = (e: React.PointerEvent) => {
    if (!tool) return;
    try { (e.target as HTMLElement).setPointerCapture(e.pointerId); } catch { /* a synthetic pointer */ }
    const [x, y] = world(e);
    last.current = { x: e.clientX, y: e.clientY, t: performance.now() };
    if (tool === 'eraser') { erase(x, y); live.current = { id: -1, tool, ink, w, pts: [] }; return; }
    live.current = { id: Date.now(), tool, ink, w, pts: [[x, y, 1]] };
    setMarks((all) => [...all, live.current!]);
  };
  const move = (e: React.PointerEvent) => {
    setAt({ x: e.clientX, y: e.clientY });
    const m = live.current; if (!m) return;
    const [x, y] = world(e);
    const p = pressureOf(e); setPressure(p);
    last.current = { x: e.clientX, y: e.clientY, t: performance.now() };
    if (tool === 'eraser') { erase(x, y); return; }
    m.pts = SHAPES.has(m.tool) ? [m.pts[0], [x, y, 1]] : [...m.pts, [x, y, p]];
    setMarks((all) => all.map((k) => (k.id === m.id ? { ...m } : k)));
  };
  const up = () => { live.current = null; last.current = null; setPressure(1); };

  const brush = tool === 'eraser' ? WIDTH[width] * 2.5 * scale : w * scale * (live.current ? pressure : 1);

  return (
    <div className="flex w-full flex-col items-center gap-14">
      <DrawTools tool={tool} onToolChange={setTool} ink={ink} onInkChange={setInk} width={width} onWidthChange={setWidth} />
      <div ref={box} className="snap-canvas ink-canvas" style={{ height }} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onPointerLeave={() => setAt(null)}>
        <svg className="snap-world" style={{ transform: `scale(${scale})`, overflow: 'visible' }} aria-hidden>
          {marks.map((m) => SHAPES.has(m.tool)
            ? shapeOf(m, String(m.id))
            : m.pts.slice(1).map(([x, y, p], i) => {
              const [x0, y0] = m.pts[i];
              return <line key={`${m.id}-${i}`} x1={x0} y1={y0} x2={x} y2={y} stroke={inkColor(m.ink)} strokeOpacity={m.tool === 'marker' ? 0.4 : m.tool === 'pencil' ? 0.8 : 1} strokeWidth={m.tool === 'marker' ? m.w : m.w * p} strokeLinecap={m.tool === 'marker' ? 'square' : 'round'} />;
            }))}
        </svg>
        {!marks.length && <span className="eng ink-hint">draw here</span>}
      </div>
      {tool && <BrushCursor mode={tool} at={at} size={brush} color={inkColor(ink)} />}
      <Segmented size="compact" aria-label="Zoom" value={zoom} onValueChange={setZoom} options={[{ value: '0.5', label: '50 %' }, { value: '1', label: '100 %' }, { value: '2', label: '200 %' }]} />
    </div>
  );
}
