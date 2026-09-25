import * as React from 'react';
import { Connector, Segmented, Surface, inkColor } from '@unlocalhosted/metalui';

/* ─────────────────────────────────────────────────────────
 * CONNECTOR LAB · five looks for a line between two blocks, to choose from
 *
 * A connector is a relationship. Each look answers "what is the line made of?"
 *
 *   plain     ink and an arrowhead; the line re-routes rigidly (today's)
 *   thread    a real rope with 6 % slack: it sags under gravity, swings when a
 *             block is dragged, and settles (verlet, 22 points, 14 passes)
 *   elastic   a taut band: its middle lags a moving block on a spring
 *             (k 170, damping 13), so the line bends while you drag and
 *             whips back straight with one overshoot when you stop
 *   current   the elastic path, with light flowing along it from the first
 *             block to the second: direction without an arrowhead; the flow
 *             speeds up while a block moves and calms after
 *   stardust  the path as a trail of drifting motes; they twinkle, and a
 *             shimmer runs toward the target. Hover: they pull into a line
 *
 * Drag a block, hover the line, click it to select it.
 * ───────────────────────────────────────────────────────── */

type Style = 'plain' | 'thread' | 'elastic' | 'current' | 'stardust';
type Box = { x: number; y: number; w: number; h: number };
type P = { x: number; y: number };

const ROPE = { points: 22, slack: 1.06, gravity: 1400, damping: 0.982, passes: 14 };
const BAND = { k: 170, damping: 13 };
const FLOW = { pulses: 3, speed: 0.32, boost: 0.0045, calm: 2.2, length: 0.09 };
const DUST = { motes: 34, drift: 3.4, align: { k: 120, damping: 14 }, shimmer: 0.55 };
const HEAD = 11;

/** Where the line from a box's centre toward a point leaves the box. */
function edgePoint(b: Box, t: P): P {
  const cx = b.x + b.w / 2, cy = b.y + b.h / 2, dx = t.x - cx, dy = t.y - cy;
  const k = Math.min(Math.abs(b.w / 2 / (dx || 1e-6)), Math.abs(b.h / 2 / (dy || 1e-6)));
  return { x: cx + dx * k, y: cy + dy * k };
}
const centre = (b: Box): P => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });

/** A smooth path through points (Catmull-Rom as cubics). */
function smooth(p: P[]) {
  let d = `M${p[0].x} ${p[0].y}`;
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i - 1] ?? p[i], b = p[i], c = p[i + 1], e = p[i + 2] ?? c;
    d += `C${b.x + (c.x - a.x) / 6} ${b.y + (c.y - a.y) / 6} ${c.x - (e.x - b.x) / 6} ${c.y - (e.y - b.y) / 6} ${c.x} ${c.y}`;
  }
  return d;
}
/** A point on the quadratic from a to b through its middle m (at t = .5). */
function onBand(a: P, m: P, b: P, t: number): P {
  const q = { x: 2 * m.x - (a.x + b.x) / 2, y: 2 * m.y - (a.y + b.y) / 2 }, u = 1 - t;
  return { x: u * u * a.x + 2 * u * t * q.x + t * t * b.x, y: u * u * a.y + 2 * u * t * q.y + t * t * b.y };
}
const bandPath = (a: P, m: P, b: P) => `M${a.x} ${a.y}Q${2 * m.x - (a.x + b.x) / 2} ${2 * m.y - (a.y + b.y) / 2} ${b.x} ${b.y}`;
function head(tip: P, from: P) {
  const g = Math.atan2(tip.y - from.y, tip.x - from.x);
  return `M${tip.x - HEAD * Math.cos(g - 0.5)} ${tip.y - HEAD * Math.sin(g - 0.5)}L${tip.x} ${tip.y}L${tip.x - HEAD * Math.cos(g + 0.5)} ${tip.y - HEAD * Math.sin(g + 0.5)}`;
}

export function ConnectorLab() {
  const [style, setStyle] = React.useState<Style>('thread');
  const [state, setState] = React.useState<'rest' | 'hover' | 'selected'>('rest');
  const [, tick] = React.useReducer((n: number) => n + 1, 0);
  const box = React.useRef<HTMLDivElement>(null);
  const blocks = React.useRef<{ a: Box; b: Box }>({ a: { x: 50, y: 60, w: 150, h: 70 }, b: { x: 360, y: 190, w: 150, h: 70 } });
  const drag = React.useRef<{ which: 'a' | 'b'; dx: number; dy: number } | null>(null);
  const hovered = React.useRef(false);

  // The world each look keeps between frames.
  const sim = React.useRef({
    rope: [] as { x: number; y: number; px: number; py: number }[],
    mid: { x: 0, y: 0, vx: 0, vy: 0, ready: false },
    flow: { phase: 0, energy: 0 },
    dust: { align: 0, v: 0, time: 0 },
    last: { a: { x: 0, y: 0 }, b: { x: 0, y: 0 } },
  });

  const ends = () => {
    const { a, b } = blocks.current;
    return { p0: edgePoint(a, centre(b)), p1: edgePoint(b, centre(a)) };
  };

  React.useEffect(() => {
    let raf = 0, prev = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(1 / 30, (now - prev) / 1000); prev = now;
      const s = sim.current, { p0, p1 } = ends();
      const { a, b } = blocks.current;
      // How fast the blocks moved this frame: the energy a drag puts in.
      const moved = Math.hypot(a.x - s.last.a.x, a.y - s.last.a.y) + Math.hypot(b.x - s.last.b.x, b.y - s.last.b.y);
      s.last = { a: { x: a.x, y: a.y }, b: { x: b.x, y: b.y } };

      // thread: verlet rope pinned at both ends
      const n = ROPE.points;
      if (s.rope.length !== n) s.rope = Array.from({ length: n }, (_, i) => { const t = i / (n - 1); const x = p0.x + (p1.x - p0.x) * t, y = p0.y + (p1.y - p0.y) * t; return { x, y, px: x, py: y }; });
      for (let i = 1; i < n - 1; i++) {
        const q = s.rope[i], vx = (q.x - q.px) * ROPE.damping, vy = (q.y - q.py) * ROPE.damping;
        q.px = q.x; q.py = q.y; q.x += vx; q.y += vy + ROPE.gravity * dt * dt;
      }
      const seg = (Math.hypot(p1.x - p0.x, p1.y - p0.y) * ROPE.slack) / (n - 1);
      for (let k = 0; k < ROPE.passes; k++) {
        Object.assign(s.rope[0], p0); Object.assign(s.rope[n - 1], p1);
        for (let i = 0; i < n - 1; i++) {
          const u = s.rope[i], v = s.rope[i + 1], dx = v.x - u.x, dy = v.y - u.y, d = Math.hypot(dx, dy) || 1e-6;
          const f = (d - seg) / d / 2, ux = i === 0 ? 0 : 1, vx = i + 1 === n - 1 ? 0 : 1, w = ux + vx || 1;
          u.x += (dx * f * 2 * ux) / w; u.y += (dy * f * 2 * ux) / w; v.x -= (dx * f * 2 * vx) / w; v.y -= (dy * f * 2 * vx) / w;
        }
      }

      // elastic, current, stardust: the middle on a spring toward the true middle
      const m = s.mid, tx = (p0.x + p1.x) / 2, ty = (p0.y + p1.y) / 2;
      if (!m.ready) Object.assign(m, { x: tx, y: ty, ready: true });
      m.vx += (BAND.k * (tx - m.x) - BAND.damping * m.vx) * dt; m.vy += (BAND.k * (ty - m.y) - BAND.damping * m.vy) * dt;
      m.x += m.vx * dt; m.y += m.vy * dt;

      // current: flow speeds up with energy, then calms
      s.flow.energy = Math.max(0, s.flow.energy + moved * FLOW.boost - s.flow.energy * FLOW.calm * dt);
      s.flow.phase = (s.flow.phase + (FLOW.speed + s.flow.energy) * dt) % 1;

      // stardust: motes pull into line on hover
      const want = hovered.current || drag.current ? 1 : 0, d = s.dust;
      d.v += (DUST.align.k * (want - d.align) - DUST.align.damping * d.v) * dt; d.align += d.v * dt; d.time += dt;

      tick();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    // A drag ends wherever the pointer is let go.
    const release = () => (drag.current = null);
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('pointerup', release); window.removeEventListener('pointercancel', release); };
  }, []);

  const at = (e: React.PointerEvent): P => { const r = box.current!.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const down = (which: 'a' | 'b') => (e: React.PointerEvent) => {
    e.stopPropagation();
    try { (e.target as HTMLElement).setPointerCapture(e.pointerId); } catch { /* a synthetic pointer */ }
    const p = at(e), s = blocks.current[which];
    drag.current = { which, dx: p.x - s.x, dy: p.y - s.y };
  };
  const move = (e: React.PointerEvent) => {
    const g = drag.current; if (!g) return;
    const p = at(e), s = blocks.current[g.which];
    s.x = p.x - g.dx; s.y = p.y - g.dy;
  };

  const s = sim.current, { p0, p1 } = ends(), ink = inkColor('ink');
  const mid: P = s.mid.ready ? s.mid : { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
  const band = bandPath(p0, mid, p1);
  const rope = s.rope.length ? s.rope : [p0, p1];
  const guide = style === 'thread' ? smooth(rope) : style === 'plain' ? `M${p0.x} ${p0.y}L${p1.x} ${p1.y}` : band;
  const labelAt = style === 'thread' ? rope[Math.floor(rope.length / 2)] : style === 'plain' ? { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 } : mid;

  const art = (() => {
    switch (style) {
      case 'plain':
        return <path d={guide + head(p1, p0)} fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />;
      case 'thread': {
        const tail = rope[rope.length - 3] ?? p0;
        return (
          <>
            <path d={guide} fill="none" stroke={ink} strokeWidth={1.6} strokeLinecap="round" />
            <path d={head(p1, tail)} fill="none" stroke={ink} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={p0.x} cy={p0.y} r={2.6} fill={ink} />
          </>
        );
      }
      case 'elastic':
        return <path d={band + head(p1, onBand(p0, mid, p1, 0.93))} fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />;
      case 'current':
        return (
          <>
            <path d={band} fill="none" stroke={ink} strokeOpacity={0.22} strokeWidth={1.5} strokeLinecap="round" />
            {Array.from({ length: FLOW.pulses }, (_, i) => {
              const off = -((s.flow.phase + i / FLOW.pulses) % 1);
              return (
                <g key={i}>
                  <path d={band} pathLength={1} fill="none" stroke="var(--mu-presence-guide)" strokeWidth={7} strokeLinecap="round" strokeDasharray={`${FLOW.length} 2`} strokeDashoffset={off + FLOW.length} filter="url(#lab-glow)" opacity={0.55 + Math.min(0.45, s.flow.energy)} />
                  <path d={band} pathLength={1} fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" strokeDasharray={`${FLOW.length * 0.6} 2`} strokeDashoffset={off + FLOW.length * 0.6} />
                </g>
              );
            })}
            <circle cx={p0.x} cy={p0.y} r={2.4} fill={ink} opacity={0.5} />
            <circle cx={p1.x} cy={p1.y} r={3.2} fill="var(--mu-presence-guide)" filter="url(#lab-glow)" opacity={0.6 + Math.min(0.4, s.flow.energy * 2)} />
          </>
        );
      case 'stardust': {
        const d = s.dust, loose = 1 - Math.max(0, Math.min(1.1, d.align));
        return (
          <>
            {Array.from({ length: DUST.motes }, (_, i) => {
              const t = i / (DUST.motes - 1), p = onBand(p0, mid, p1, t), q = onBand(p0, mid, p1, Math.min(1, t + 0.01));
              const nx = -(q.y - p.y), ny = q.x - p.x, nl = Math.hypot(nx, ny) || 1;
              const w = Math.sin(d.time * 1.3 + i * 2.1) + Math.sin(d.time * 0.7 + i * 5.3) * 0.6;
              const along = Math.sin(d.time * 0.9 + i * 3.7) * 0.5;
              const off = DUST.drift * loose;
              const x = p.x + (nx / nl) * w * off + ((q.x - p.x) / nl) * along * off, y = p.y + (ny / nl) * w * off + ((q.y - p.y) / nl) * along * off;
              // A shimmer runs toward the target; each mote also twinkles on its own.
              const wave = Math.max(0, 1 - Math.abs(((t - d.time * DUST.shimmer) % 1 + 1) % 1 - 0.5) * 7);
              const tw = 0.45 + 0.35 * (0.5 + 0.5 * Math.sin(d.time * 2.3 + i * 1.7));
              return <circle key={i} cx={x} cy={y} r={1.25 + wave * 0.9 + t * 0.35} fill={wave > 0.2 ? 'var(--mu-presence-guide)' : ink} opacity={Math.min(1, tw + wave * 0.6)} />;
            })}
          </>
        );
      }
    }
  })();

  return (
    <div className="flex w-full flex-col items-center gap-14">
      <div
        ref={box}
        className="snap-canvas"
        style={{ height: 340, touchAction: 'none' }}
        onPointerMove={move}
        onPointerUp={() => (drag.current = null)}
        onPointerDown={() => setState('rest')}
      >
        {(['a', 'b'] as const).map((k) => {
          const b = blocks.current[k];
          return (
            <Surface key={k} material="raise-sm" radius="plate" onPointerDown={down(k)} style={{ position: 'absolute', left: b.x, top: b.y, width: b.w, height: b.h, cursor: 'grab', display: 'grid', placeItems: 'center', touchAction: 'none' }}>
              <span className="eng">{k === 'a' ? 'Idea' : 'Plan'}</span>
            </Surface>
          );
        })}
        <svg width={1} height={1} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
          <defs>
            <filter id="lab-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" /></filter>
          </defs>
          {art}
          <path
            d={guide}
            fill="none"
            stroke="transparent"
            strokeWidth={18}
            style={{ cursor: 'pointer' }}
            onPointerEnter={() => { hovered.current = true; setState((v) => (v === 'selected' ? v : 'hover')); }}
            onPointerLeave={() => { hovered.current = false; setState((v) => (v === 'selected' ? v : 'rest')); }}
            onPointerDown={(e) => { e.stopPropagation(); setState('selected'); }}
          />
        </svg>
        <Connector d={guide} from={{ ...p0, attached: true }} to={{ ...p1, attached: true }} state={state} label="leads to" labelAt={labelAt} />
      </div>
      <Segmented
        size="compact"
        aria-label="Look"
        value={style}
        onValueChange={(v) => setStyle(v as Style)}
        options={[
          { value: 'plain', label: 'Plain' },
          { value: 'thread', label: 'Thread' },
          { value: 'elastic', label: 'Elastic' },
          { value: 'current', label: 'Current' },
          { value: 'stardust', label: 'Stardust' },
        ]}
      />
    </div>
  );
}
