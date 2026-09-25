import * as React from 'react';
import { PerfectPreview, inkColor } from '@unlocalhosted/metalui';
import reactSource from '../../../../../packages/metalui/src/components/perfect-preview/perfect-preview.tsx?raw';
import agentSource from '../../../../../packages/metalui/src/components/perfect-preview/perfect-preview.agent.md?raw';
import { ComponentPage } from '../../ui/ComponentPage';

/* Draw a rough circle or line and keep the pointer still: the clean shape traces itself, then the
 * stroke morphs into it. Move again before it closes to keep your own stroke. The fit here is a
 * stand-in for the core's shape_recognize: a closed stroke is an ellipse, an open one a line. */

type P = [number, number];
const N = 96;

function resample(pts: P[], n = N): P[] {
  const d = [0];
  for (let i = 1; i < pts.length; i++) d.push(d[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const L = d[d.length - 1] || 1, out: P[] = [];
  for (let k = 0, j = 0; k < n; k++) {
    const t = (k / (n - 1)) * L;
    while (j < d.length - 2 && d[j + 1] < t) j++;
    const u = (t - d[j]) / (d[j + 1] - d[j] || 1);
    out.push([pts[j][0] + (pts[j + 1][0] - pts[j][0]) * u, pts[j][1] + (pts[j + 1][1] - pts[j][1]) * u]);
  }
  return out;
}

function fit(pts: P[]): P[] {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const [a, b] = [pts[0], pts[pts.length - 1]];
  const closed = Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.25 * Math.max(x1 - x0, y1 - y0);
  if (!closed) return resample([a, b]);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, rx = (x1 - x0) / 2, ry = (y1 - y0) / 2;
  const start = Math.atan2(a[1] - cy, a[0] - cx);
  // Go round the way the hand went.
  const dir = (pts[Math.floor(pts.length / 4)][0] - cx) * (a[1] - cy) - (pts[Math.floor(pts.length / 4)][1] - cy) * (a[0] - cx) > 0 ? -1 : 1;
  return Array.from({ length: N }, (_, k) => { const t = start + dir * (k / (N - 1)) * Math.PI * 2; return [cx + rx * Math.cos(t), cy + ry * Math.sin(t)] as P; });
}

const pathOf = (pts: P[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('');

function Play() {
  const [pts, setPts] = React.useState<P[]>([]);
  const [shape, setShape] = React.useState<P[] | null>(null);
  const [phase, setPhase] = React.useState<'idle' | 'holding' | 'done'>('idle');
  const down = React.useRef(false);
  const still = React.useRef<number | undefined>(undefined);
  const box = React.useRef<HTMLDivElement>(null);
  const at = (e: React.PointerEvent): P => { const r = box.current!.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };

  const arm = (all: P[]) => {
    window.clearTimeout(still.current);
    setPhase('idle');
    if (all.length < 8) return;
    still.current = window.setTimeout(() => { setShape(fit(all)); setPhase('holding'); }, 140);
  };
  const morph = () => {
    const from = resample(pts), to = shape!;
    setPhase('done');
    const t0 = performance.now(), dur = 180;
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - t, 3);
      setPts(from.map((p, i) => [p[0] + (to[i][0] - p[0]) * e, p[1] + (to[i][1] - p[1]) * e]));
      if (t < 1) requestAnimationFrame(step); else setTimeout(() => setPhase('idle'), 20);
    };
    requestAnimationFrame(step);
  };

  return (
    <div
      ref={box}
      className="snap-canvas"
      style={{ height: 320, touchAction: 'none', cursor: 'crosshair' }}
      onPointerDown={(e) => { try { (e.target as HTMLElement).setPointerCapture(e.pointerId); } catch { /* a synthetic pointer */ } down.current = true; setShape(null); setPhase('idle'); setPts([at(e)]); }}
      onPointerMove={(e) => { if (!down.current || phase === 'done') return; const next = [...pts, at(e)]; setPts(next); arm(next); }}
      onPointerUp={() => { down.current = false; window.clearTimeout(still.current); if (phase === 'holding') setPhase('idle'); }}
    >
      <svg width={1} height={1} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <path d={pathOf(pts)} fill="none" stroke={inkColor('ink')} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {shape && <PerfectPreview d={pathOf(shape)} phase={phase} onHeld={() => down.current && morph()} />}
      {!pts.length && <span className="eng ink-hint">draw a rough circle, then hold still</span>}
    </div>
  );
}

export default function PerfectPreviewPage() {
  return (
    <ComponentPage
      title="Perfect preview"
      lede="Draw a rough shape and hold still: the clean shape draws itself, then your stroke becomes it."
      play={{ lede: 'Draw a rough circle or line and keep the pointer still without letting go. Move again before the outline closes to keep your own stroke.', node: <Play /> }}
      sources={[
        { id: 'react', label: 'React', code: reactSource },
        { id: 'agent', label: 'Agent guide', code: agentSource },
      ]}
      rules={[
        { id: 'PF1', title: 'The outline is the timer', body: 'The clean shape traces round over the hold. When it closes, the stroke changes. No separate progress ring.', origin: 'Ours' },
        { id: 'PF2', title: 'Easy to refuse', body: 'Moving again or Escape keeps the hand-drawn stroke at once.', origin: 'DRAWING.md DR-05' },
        { id: 'PF3', title: 'A morph, not a swap', body: 'The stroke moves into the shape over 180 ms. It never jumps.', origin: 'DRAWING.md DR-05' },
      ]}
    />
  );
}
