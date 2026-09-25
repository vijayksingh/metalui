import * as React from 'react';
import { Lasso, Switcher, SelectionFrame, SnapGuides, Surface, type LassoRect, type SnapGuide } from '@unlocalhosted/metalui';
import { snapMove, type Box } from './snapdemo';

/* A tiny canvas for the Snap guides page: three notes stay put, one you drag. It snaps to their
 * edges and centres within 6 screen points and draws the guides; ⌘ held drags free. The zoom
 * changes the world's scale, and the guides stay 1 pt with the same dash and overshoot. */

const FIXED: Box[] = [
  { id: 'a', x: 40, y: 40, w: 150, h: 64 },
  { id: 'b', x: 260, y: 150, w: 170, h: 64 },
  { id: 'c', x: 60, y: 250, w: 120, h: 64 },
];
const WORDS: Record<string, string> = { a: 'call the printer', b: 'pick the typeface', c: 'book the venue', m: 'drag me' };

const touches = (r: LassoRect, b: Box) => {
  const x = Math.min(r.x, r.x + r.width), y = Math.min(r.y, r.y + r.height), w = Math.abs(r.width), h = Math.abs(r.height);
  return b.x < x + w && b.x + b.w > x && b.y < y + h && b.y + b.h > y;
};

export function SnapCanvas({ height = 360, lasso = false }: { height?: number; lasso?: boolean }) {
  const [zoom, setZoom] = React.useState('1');
  const scale = Number(zoom);
  const [box, setBox] = React.useState<Box>({ id: 'm', x: 250, y: 40, w: 140, h: 64 });
  const [guides, setGuides] = React.useState<SnapGuide[]>([]);
  const drag = React.useRef<{ px: number; py: number; x: number; y: number; moved: boolean } | null>(null);

  const down = (e: React.PointerEvent) => {
    try { (e.target as HTMLElement).setPointerCapture(e.pointerId); } catch { /* a synthetic pointer */ }
    drag.current = { px: e.clientX, py: e.clientY, x: box.x, y: box.y, moved: false };
  };
  const move = (e: React.PointerEvent) => {
    const d = drag.current; if (!d) return;
    const dx = (e.clientX - d.px) / scale, dy = (e.clientY - d.py) / scale;
    if (!d.moved && Math.hypot(e.clientX - d.px, e.clientY - d.py) < 3) return; // the drag threshold
    d.moved = true;
    const free = { ...box, x: d.x + dx, y: d.y + dy };
    if (e.metaKey) { setBox(free); setGuides([]); return; }
    const snapped = snapMove(free, FIXED, 6, scale);
    setBox(snapped.box); setGuides(snapped.guides);
  };
  const up = () => { drag.current = null; setGuides([]); };
  // A new line caught: the Mac taps the trackpad; here, only where the browser can vibrate.
  const [taps, setTaps] = React.useState(0);
  const engage = React.useCallback(() => { setTaps((n) => n + 1); navigator.vibrate?.(8); }, []);

  // Lasso: a drag on empty canvas draws the box; letting go selects what it touches.
  const [rect, setRect] = React.useState<LassoRect | null>(null);
  const [picked, setPicked] = React.useState<string[]>([]);
  const world = React.useRef<HTMLDivElement>(null);
  const at = (e: React.PointerEvent) => { const w = world.current!.getBoundingClientRect(); return { x: (e.clientX - w.left) / scale, y: (e.clientY - w.top) / scale }; };
  const lassoStart = React.useRef<{ x: number; y: number } | null>(null);
  const all = [...FIXED, box];
  const count = rect ? all.filter((b) => touches(rect, b)).length : 0;
  const worldDown = (e: React.PointerEvent) => {
    if (!lasso || e.target !== e.currentTarget) return;
    try { (e.target as HTMLElement).setPointerCapture(e.pointerId); } catch { /* a synthetic pointer */ }
    lassoStart.current = at(e); setPicked([]);
  };
  const worldMove = (e: React.PointerEvent) => {
    const s0 = lassoStart.current; if (!s0) return;
    const p = at(e);
    if (!rect && Math.hypot((p.x - s0.x) * scale, (p.y - s0.y) * scale) < 3) return;
    setRect({ x: s0.x, y: s0.y, width: p.x - s0.x, height: p.y - s0.y });
  };
  const worldUp = () => {
    if (rect) setPicked(all.filter((b) => touches(rect, b)).map((b) => b.id));
    lassoStart.current = null; setRect(null);
  };

  const card = (b: Box, live = false) => (
    <Surface key={b.id} material="raise-lite" radius="card"
      className={live ? 'absolute grid cursor-grab place-items-center active:cursor-grabbing' : 'absolute grid place-items-center'}
      style={{ left: b.x, top: b.y, width: b.w, height: b.h, touchAction: 'none' }}
      {...(live ? { onPointerDown: down, onPointerMove: move, onPointerUp: up, onPointerCancel: up } : {})}>
      <span className="type-ui text-ink2">{WORDS[b.id]}</span>
      {picked.includes(b.id) && <SelectionFrame state="selected" variant="lite" radius={24} entrance={false} />}
    </Surface>
  );

  return (
    <div className="flex w-full flex-col items-center gap-14">
      <div className="snap-canvas" style={{ height }}>
        <div ref={world} className="snap-world" style={{ transform: `scale(${scale})` }} onPointerDown={worldDown} onPointerMove={worldMove} onPointerUp={worldUp} onPointerCancel={worldUp}>
          {FIXED.map((b) => card(b))}
          <SnapGuides guides={guides} scale={scale} onEngage={engage} />
          {card(box, true)}
          {lasso && <Lasso rect={rect} count={count} scale={scale} />}
        </div>
      </div>
      {lasso
        ? <span className="eng">{picked.length ? `selected · ${picked.length}` : 'drag on empty space to draw a box'}</span>
        : <span className="eng">haptic taps · {taps} <span className="text-ink3">(on a Mac trackpad in the app; the browser cannot)</span></span>}
      <Switcher size="compact" aria-label="Zoom" value={zoom} onValueChange={setZoom} options={[{ value: '0.5', label: '50 %' }, { value: '1', label: '100 %' }, { value: '2', label: '200 %' }]} />
    </div>
  );
}
