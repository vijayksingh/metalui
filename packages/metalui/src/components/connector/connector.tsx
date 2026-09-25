'use client';

import * as React from 'react';

/* ─────────────────────────────────────────────────────────
 * CONNECTOR (DRAWING.md DR-07): a line between two blocks, and everything around it
 *
 * Looks (what the line is made of):
 *   elastic   the default. A taut band: its middle rides a spring toward the true
 *             middle, so when a block moves the line bends behind it and whips back
 *             straight with one overshoot. Arrowheads show the flow.
 *   current   light flows along a quiet line: comets leave the source slowly, speed
 *             up, and slow down into the target, which glows as each one lands.
 *             The flow quickens while a block moves, then calms.
 *   stardust  the line is a trail of drifting, twinkling motes; a shimmer runs in the
 *             flow's direction. Hover or drag: the motes pull into a line.
 * Flow: forward (from → to), backward (to → from) or both.
 *
 * Chrome (the same for every look):
 *   rest      the line and its label chip
 *   hover     a soft green halo along the path, and a dot at each end: solid where the
 *             end is on a block, hollow where it is free (fades in on the part spring)
 *   selected  the halo stays; the ends become handles to drag and re-attach
 *   label     a chip at the middle of the line, the same size on screen at every zoom
 *
 * The line is world ink (it scales with zoom); the chrome keeps its screen size.
 * Reduce Motion: no spring, no flow; elastic's straight line with its arrowheads.
 * Current and stardust animate all the time: use them to show a flow, not for every line.
 * ───────────────────────────────────────────────────────── */

export interface ConnectorEnd {
  x: number;
  y: number;
  /** On a block (solid dot) or free (hollow dot). */
  attached: boolean;
}

export type ConnectorLook = 'elastic' | 'current' | 'stardust';
export type ConnectorFlow = 'forward' | 'backward' | 'both';

export interface ConnectorProps {
  from: ConnectorEnd;
  to: ConnectorEnd;
  look?: ConnectorLook;
  flow?: ConnectorFlow;
  /** The ink colour (see inkColor), and its width in world units. */
  ink?: string;
  width?: number;
  state?: 'rest' | 'hover' | 'selected';
  label?: string;
  /** The canvas scale (1 at 100 %), so the chrome keeps its screen size. */
  scale?: number;
  /** An end handle was pressed (selected only). The host drags it and re-attaches. */
  onEndPointerDown?: (end: 'from' | 'to', event: React.PointerEvent<SVGCircleElement>) => void;
  /** The pointer came onto or left the line (a band 18 wide on screen). */
  onHoverChange?: (hovered: boolean) => void;
  /** The line was pressed: the host selects it. */
  onPress?: (event: React.PointerEvent<SVGPathElement>) => void;
  className?: string;
}

/* The physics and the flow, as named numbers. */
const BAND = { k: 170, damping: 13, rest: 0.05 };          // the middle's spring; settled under .05 pt
const HEAD = 3.2;                                           // arrowhead length, in line widths + 5
const COMET = { perDirection: 3, speed: 0.38, tail: 16, step: 0.014, boost: 0.004, calm: 2.4 };
const BLOOM = { rise: 0.8, fall: 0.14 };                    // the target glows as a comet lands
const DUST = { motes: 34, drift: 3.4, shimmer: 0.5, align: { k: 120, damping: 14 } };

const LAYER = 'mu-connector connector-layer';
const HALO = 'mu-connector-halo connector-halo';
const CHROME = 'mu-connector-chrome connector-chrome';
const END = { attached: 'connector-end', free: 'connector-end-free' };
const HANDLE = 'mu-connector-handle connector-handle';
const LABEL = 'mu-connector-label connector-label';
const GLOW = 'connector-glow';
const HIT = 'mu-connector-hit connector-hit';

type P = { x: number; y: number };

/** A size in screen points from the theme. */
function cssPx(name: string, fallback: number) {
  if (typeof window === 'undefined') return fallback;
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)) || fallback;
}
/** A point on the curve from a to b that passes through m at its middle. */
function onBand(a: P, m: P, b: P, t: number): P {
  const qx = 2 * m.x - (a.x + b.x) / 2, qy = 2 * m.y - (a.y + b.y) / 2, u = 1 - t;
  return { x: u * u * a.x + 2 * u * t * qx + t * t * b.x, y: u * u * a.y + 2 * u * t * qy + t * t * b.y };
}
const bandPath = (a: P, m: P, b: P) => `M${a.x} ${a.y}Q${2 * m.x - (a.x + b.x) / 2} ${2 * m.y - (a.y + b.y) / 2} ${b.x} ${b.y}`;
function arrowhead(tip: P, from: P, len: number) {
  const g = Math.atan2(tip.y - from.y, tip.x - from.x);
  return `M${tip.x - len * Math.cos(g - 0.5)} ${tip.y - len * Math.sin(g - 0.5)}L${tip.x} ${tip.y}L${tip.x - len * Math.cos(g + 0.5)} ${tip.y - len * Math.sin(g + 0.5)}`;
}
const frac = (v: number) => ((v % 1) + 1) % 1;
const easeInOut = (u: number) => 0.5 - 0.5 * Math.cos(Math.PI * u);

function useReducedMotion() {
  const [reduce, setReduce] = React.useState(false);
  React.useEffect(() => {
    const q = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduce(q.matches);
    const on = () => setReduce(q.matches);
    q.addEventListener('change', on);
    return () => q.removeEventListener('change', on);
  }, []);
  return reduce;
}

/** A line between two blocks, with its look, its flow and its chrome. */
export function Connector({
  from, to, look = 'elastic', flow = 'forward', ink = 'currentColor', width = 2, state = 'rest', label, scale = 1, onEndPointerDown, onHoverChange, onPress, className,
}: ConnectorProps) {
  const reduce = useReducedMotion();
  const endR = React.useMemo(() => cssPx('--mu-r-connector-end-size', 4.5), []) / scale;
  const handleR = React.useMemo(() => cssPx('--mu-r-connector-handle-size', 5), []) / scale;
  const glowId = `mu-connector-glow-${React.useId().replace(/:/g, '')}`;

  // The live world: the latest ends, the spring middle, the flow clock.
  const live = React.useRef({ from, to, state, look });
  live.current = { from, to, state, look };
  const sim = React.useRef({ m: { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2, vx: 0, vy: 0 }, time: 0, phase: 0, energy: 0, align: 0, av: 0, last: { ...from, tx: to.x, ty: to.y } });
  const [, redraw] = React.useReducer((n: number) => n + 1, 0);

  React.useEffect(() => {
    if (reduce) return;
    let raf = 0, prev = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(1 / 30, (now - prev) / 1000); prev = now;
      const s = sim.current, { from: a, to: b, state: st, look: lk } = live.current;
      const tx = (a.x + b.x) / 2, ty = (a.y + b.y) / 2, m = s.m;
      m.vx += (BAND.k * (tx - m.x) - BAND.damping * m.vx) * dt; m.vy += (BAND.k * (ty - m.y) - BAND.damping * m.vy) * dt;
      m.x += m.vx * dt; m.y += m.vy * dt;
      const moved = Math.hypot(a.x - s.last.x, a.y - s.last.y) + Math.hypot(b.x - s.last.tx, b.y - s.last.ty);
      s.last = { ...a, tx: b.x, ty: b.y };
      s.energy = Math.max(0, s.energy + moved * COMET.boost - s.energy * COMET.calm * dt);
      s.phase += (COMET.speed + s.energy) * dt;
      s.time += dt;
      const want = st !== 'rest' ? 1 : 0;
      s.av += (DUST.align.k * (want - s.align) - DUST.align.damping * s.av) * dt; s.align += s.av * dt;
      const settled = Math.hypot(tx - m.x, ty - m.y) < BAND.rest && Math.hypot(m.vx, m.vy) < BAND.rest;
      if (settled) { m.x = tx; m.y = ty; m.vx = m.vy = 0; }
      // Elastic rests when the spring does; the flow looks keep going.
      if (!settled || lk !== 'elastic') redraw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduce]);

  const s = sim.current;
  const mid: P = reduce ? { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 } : s.m;
  const d = bandPath(from, mid, to);
  const fwd = flow !== 'backward', back = flow !== 'forward';
  const vars = { '--mu-canvas-scale': scale } as React.CSSProperties;
  const selected = state === 'selected';
  const line = { fill: 'none', stroke: ink, strokeWidth: width, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  const art = (() => {
    if (look === 'elastic' || reduce) {
      const len = width * HEAD + 5;
      const heads = (fwd ? arrowhead(to, onBand(from, mid, to, 0.92), len) : '') + (back ? arrowhead(from, onBand(from, mid, to, 0.08), len) : '');
      return <path {...line} d={d + heads} />;
    }
    if (look === 'current') {
      const dirs = [fwd && 1, back && -1].filter(Boolean) as number[];
      let bloomTo = 0, bloomFrom = 0;
      const comets = dirs.flatMap((dir, di) =>
        Array.from({ length: COMET.perDirection }, (_, i) => {
          const u = frac(s.phase + i / COMET.perDirection + di / (COMET.perDirection * 2));
          const speed = Math.sin(Math.PI * u), fade = Math.sqrt(speed);
          const bloom = u > BLOOM.rise ? (u - BLOOM.rise) / (1 - BLOOM.rise) : u < BLOOM.fall ? 1 - u / BLOOM.fall : 0;
          if (dir > 0) bloomTo = Math.max(bloomTo, bloom); else bloomFrom = Math.max(bloomFrom, bloom);
          const e = easeInOut(u), head = dir > 0 ? e : 1 - e;
          const tail = Array.from({ length: COMET.tail }, (_, j) => {
            // Motion blur: the tail stretches with the comet's speed.
            const t = head - dir * j * COMET.step * (0.25 + 1.1 * speed);
            if (t < 0 || t > 1) return null;
            const p = onBand(from, mid, to, t), k = 1 - j / COMET.tail;
            return <circle key={j} cx={p.x} cy={p.y} r={width * (0.4 + 0.9 * k)} className={GLOW} opacity={fade * Math.pow(k, 1.4)} />;
          });
          const h = onBand(from, mid, to, head);
          return (
            <g key={`${dir}-${i}`}>
              <circle cx={h.x} cy={h.y} r={width * 3.2} className={GLOW} opacity={fade * 0.8} filter={`url(#${glowId})`} />
              {tail}
              <circle cx={h.x} cy={h.y} r={width * 0.85} fill={ink} opacity={fade} />
            </g>
          );
        }),
      );
      return (
        <>
          <path {...line} d={d} strokeOpacity={0.3} />
          {comets}
          {bloomTo > 0 && <circle cx={to.x} cy={to.y} r={width * (2 + bloomTo * 2.5)} className={GLOW} opacity={bloomTo * 0.8} filter={`url(#${glowId})`} />}
          {bloomFrom > 0 && <circle cx={from.x} cy={from.y} r={width * (2 + bloomFrom * 2.5)} className={GLOW} opacity={bloomFrom * 0.8} filter={`url(#${glowId})`} />}
        </>
      );
    }
    // stardust
    const loose = 1 - Math.max(0, Math.min(1.1, s.align));
    return Array.from({ length: DUST.motes }, (_, i) => {
      const t = i / (DUST.motes - 1), p = onBand(from, mid, to, t), q = onBand(from, mid, to, Math.min(1, t + 0.01));
      const tl = Math.hypot(q.x - p.x, q.y - p.y) || 1, nx = -(q.y - p.y) / tl, ny = (q.x - p.x) / tl;
      const w = (Math.sin(s.time * 1.3 + i * 2.1) + Math.sin(s.time * 0.7 + i * 5.3) * 0.6) * DUST.drift * loose;
      const along = Math.sin(s.time * 0.9 + i * 3.7) * 0.5 * DUST.drift * loose;
      const wave = (pos: number) => Math.max(0, 1 - Math.abs(frac(pos - s.time * DUST.shimmer) - 0.5) * 7);
      const shine = Math.max(fwd ? wave(t) : 0, back ? wave(1 - t) : 0);
      const twinkle = 0.45 + 0.35 * (0.5 + 0.5 * Math.sin(s.time * 2.3 + i * 1.7));
      return (
        <circle
          key={i}
          cx={p.x + nx * w + ((q.x - p.x) / tl) * along}
          cy={p.y + ny * w + ((q.y - p.y) / tl) * along}
          r={width * (0.62 + shine * 0.45)}
          className={shine > 0.2 ? GLOW : undefined}
          fill={shine > 0.2 ? undefined : ink}
          opacity={Math.min(1, twinkle + shine * 0.6)}
        />
      );
    });
  })();

  const labelAt = look === 'elastic' || reduce ? onBand(from, mid, to, 0.5) : mid;

  return (
    <>
      <svg aria-hidden width={1} height={1} data-state={state} data-look={look} className={className ? `${LAYER} ${className}` : LAYER} style={vars}>
        <defs>
          <filter id={glowId} x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation={width * 1.4} /></filter>
        </defs>
        {art}
        <path className={HIT} d={d} onPointerEnter={() => onHoverChange?.(true)} onPointerLeave={() => onHoverChange?.(false)} onPointerDown={onPress} />
        <g className={CHROME}>
          <path className={HALO} d={d} />
          {(['from', 'to'] as const).map((k) => {
            const e = k === 'from' ? from : to;
            return selected ? (
              <circle key={k} className={HANDLE} cx={e.x} cy={e.y} r={handleR} onPointerDown={(ev) => onEndPointerDown?.(k, ev)} />
            ) : (
              <circle key={k} className={END[e.attached ? 'attached' : 'free']} cx={e.x} cy={e.y} r={endR} />
            );
          })}
        </g>
      </svg>
      {label && (
        <span className={LABEL} style={{ ...vars, left: labelAt.x, top: labelAt.y }}>
          {label}
        </span>
      )}
    </>
  );
}
