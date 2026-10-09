'use client';

import * as React from 'react';
import { SPRINGS } from '../../motion/springs.generated';
import { motionReduced } from '../../motion/reduced';

/* ─────────────────────────────────────────────────────────
 * DIAL, a rotary knob: a knurled disc in a slim groove, for a value you turn
 *
 * One track of one length carries a curl: 0 is a straight bar (a slider), 1 a ring of `sweep`
 * degrees with its gap at six o'clock: min at seven, max at five, as on any rotary control.
 * Walking the track from min to max turns clockwise, so turning anticlockwise lowers the value.
 *
 *   rest      the groove (a hairline edge under the track colour) with the fill from min to the
 *             value, marks across it, ticks on the bezel outside it; in the middle the knob, a
 *             knurled disc whose knurl and indicator dot point at the value
 *   drag      the value follows the nearest point of the groove to the pointer: round the ring,
 *             along the bar. It never jumps across the gap between the ends
 *   wheel     down turns back (anticlockwise), up turns on; one step a notch
 *   keys      ← ↓ back, → ↑ on (shift: a large step), PageUp/PageDown large steps, Home, End
 *   curl      a new curl winds or unwinds the one track on the surface spring (no overshoot):
 *             length and curvature move together so marks and ticks ride along, the track slims
 *             into the groove, and the bar's knob travels to the centre and grows into the disc
 *             (unwinding, it shrinks back onto the bar). Tick labels show only while it is a bar.
 *             Taking over from a bar (`barLength`) it winds onto a reel instead (see shape()), and
 *             that ring runs anticlockwise: min at five, max at seven
 * Reduce Motion: the curl resolves without travel.
 * ───────────────────────────────────────────────────────── */

export interface DialProps {
  value: number;
  min: number;
  max: number;
  onValueChange: (value: number) => void;
  /** One key press or wheel notch. */
  step?: number;
  /** Shift + key, PageUp/PageDown. */
  largeStep?: number;
  /** 0 a straight bar, 1 a ring. A change winds or unwinds on the surface spring. */
  curl: number;
  /** The curl to start from (default: curl). */
  initialCurl?: number;
  /** Called once a wind or unwind comes to rest, with the curl it rests at. */
  onCurlRest?: (curl: number) => void;
  /** The bar's length, from the first knob centre to the last (default: the ring's length). */
  barLength?: number;
  /** Moments along the track, as fractions: thin marks across it. */
  marks?: number[];
  /** Ticks outside the track, as fractions, with a label shown while it is a bar. */
  ticks?: { at: number; label?: React.ReactNode }[];
  'aria-label': string;
  'aria-valuetext'?: string;
  className?: string;
}

const ROOT = 'mu-dial relative touch-none select-none cursor-pointer';
const SVG = 'mu-dial-track absolute left-0 top-0 overflow-visible pointer-events-none';
const KNOB = 'mu-dial-knob absolute -translate-1/2 rounded-round recipe-slider-knob cursor-grab outline-none focus-visible:focus-ring transition-slider-knob pointer-hover:recipe-slider-knob-hover active:slider-knob-press active:recipe-slider-knob-press';
const DOT = 'mu-dial-dot absolute left-1/2 -translate-x-1/2 rounded-round pointer-events-none';
const LABEL = 'mu-dial-tick-label absolute -translate-x-1/2 pointer-events-none type-meta text-ink2 whitespace-nowrap';
const SAMPLES = 96;

function cssPx(el: Element | null, name: string, fallback: number) {
  if (!el || typeof window === 'undefined') return fallback;
  return parseFloat(getComputedStyle(el).getPropertyValue(name)) || fallback;
}

/** The track at a curl: points by fraction, in a box padded by the knob's radius.
 *  With no bar to take over from it bends evenly (the knob's clockwise ring). Taking over from a bar
 *  (`reel`) it winds onto a reel: the bar's near end meets a circle the size of the finished ring,
 *  curls up around it, and the rest follows it in, so what is left straight is always the far end;
 *  the reel turns as it fills so the gap settles at six. A bar coiling up over itself runs
 *  anticlockwise, so that ring reads min at five, max at seven. `below` keeps the bar's room under
 *  its line so the line holds still while the reel rises. */
function shape(curl: number, bar: number, ring: number, sweep: number, pad: number, reel: boolean, below = 0) {
  const length = bar + (ring - bar) * curl;
  const theta = sweep * curl;
  const R = ring / sweep;
  const k = reel ? (curl > 0 ? 1 / R : 0) : theta / length;
  const wound = length * curl;
  // even bend: the middle of the track sits level at twelve, the gap centred at six
  const turn = reel ? ((2 * Math.PI - sweep) / 2) * curl ** 3 : -theta / 2;
  const cos = Math.cos(turn), sin = Math.sin(turn);
  const spin = (x: number, y: number): [number, number] => [x * cos - y * sin, x * sin + y * cos];
  const raw = (u: number): [number, number] => {
    const d = u * length;
    if (reel) {
      // straight from the hinge, or back from it round the reel (centre at (0, -R))
      const [x, y] = d >= wound ? [d - wound, 0] : [-R * Math.sin((wound - d) / R), -R + R * Math.cos((wound - d) / R)];
      const [rx, ry] = spin(x, y + R);
      return [rx, ry - R];
    }
    if (k < 1e-6) return [d, 0];
    return spin(Math.sin(k * d) / k, (1 - Math.cos(k * d)) / k);
  };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let i = 0; i <= SAMPLES; i++) {
    const [x, y] = raw(i / SAMPLES);
    minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  const ox = pad - minX, oy = pad - minY;
  const at = (u: number): [number, number] => { const [x, y] = raw(Math.min(1, Math.max(0, u))); return [x + ox, y + oy]; };
  const centre = k < 1e-6 ? null : reel ? ([ox, oy - R] as [number, number]) : ((): [number, number] => { const [x, y] = spin(0, 1 / k); return [x + ox, y + oy]; })();
  return { at, centre, radius: k < 1e-6 ? Infinity : 1 / k, width: maxX - minX + pad * 2, height: maxY - minY + pad * 2 + below, length };
}

function normalAt(at: (u: number) => [number, number], u: number): [number, number] {
  const e = 1 / (SAMPLES * 4);
  const [x0, y0] = at(u - e), [x1, y1] = at(u + e);
  const dx = x1 - x0, dy = y1 - y0, n = Math.hypot(dx, dy) || 1;
  return [-dy / n, dx / n];
}

/** The curl, wound towards its target on the surface spring. */
function useCurl(target: number, initial: number, host: React.RefObject<HTMLDivElement | null>, onRest?: (curl: number) => void) {
  const [curl, setCurl] = React.useState(initial);
  const state = React.useRef({ x: initial, v: 0 });
  const rest = React.useRef(onRest);
  rest.current = onRest;
  React.useEffect(() => {
    if (motionReduced(host.current)) {
      state.current = { x: target, v: 0 };
      setCurl(target);
      rest.current?.(target);
      return;
    }
    const { stiffness, damping } = SPRINGS.surface;
    let frame = 0, last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.032, (now - last) / 1000);
      last = now;
      const s = state.current;
      s.v += (-stiffness * (s.x - target) - damping * s.v) * dt;
      s.x = Math.min(1, Math.max(0, s.x + s.v * dt));
      if (Math.abs(s.x - target) < 0.001 && Math.abs(s.v) < 0.01) {
        state.current = { x: target, v: 0 };
        setCurl(target);
        rest.current?.(target);
        return;
      }
      setCurl(s.x);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, host]);
  return curl;
}

/** A slider wound into a ring: drag round it, wheel it, or use the slider keys. */
export function Dial({
  value, min, max, onValueChange, step = 1, largeStep, curl: target, initialCurl, onCurlRest, barLength,
  marks = [], ticks = [], className, ...aria
}: DialProps) {
  const root = React.useRef<HTMLDivElement>(null);
  const curl = useCurl(target, initialCurl ?? target, root, onCurlRest);
  const ring = cssPx(root.current, '--mu-r-dial-self-length', 200);
  const sweep = (cssPx(root.current, '--mu-r-dial-self-sweep', 320) * Math.PI) / 180;
  const bar = cssPx(root.current, '--mu-r-dial-self-track', 10);
  const groove = cssPx(root.current, '--mu-r-dial-self-groove', 6);
  const knob = cssPx(root.current, '--mu-r-dial-self-knob', 22);
  const discGap = cssPx(root.current, '--mu-r-dial-self-disc-gap', 5);
  const dot = cssPx(root.current, '--mu-r-dial-self-dot', 6);
  const dotInset = cssPx(root.current, '--mu-r-dial-self-dot-inset', 7);
  const tickOut = cssPx(root.current, '--mu-r-dial-self-tick-out', 3);
  const tickLen = cssPx(root.current, '--mu-r-dial-self-tick', 4);
  // how far the knob has become the disc: none while it is nearly a bar, all of it as the ring closes
  // (on a reel the knob stays the bar's knob while the bar travels, and grows as the ring closes)
  const reel = barLength != null;
  const e0 = Math.min(1, Math.max(0, reel ? (curl - 0.55) / 0.45 : (curl - 0.15) / 0.85));
  const disc = e0 * e0 * (3 - 2 * e0);
  const track = bar + (groove - bar) * disc;
  const below = reel ? (cssPx(root.current, '--mu-scrubber-height', 50) / 2 - knob / 2) * (1 - disc) : 0;
  const g = shape(curl, barLength ?? ring, ring, sweep, knob / 2 + (track / 2 + tickOut + tickLen + 1 - knob / 2) * disc, reel, below);
  const span = Math.max(Number.EPSILON, max - min);
  const fraction = Math.min(1, Math.max(0, (value - min) / span));
  const last = React.useRef(fraction);
  last.current = fraction;
  const set = (v: number) => onValueChange(Math.min(max, Math.max(min, v)));

  const points = Array.from({ length: SAMPLES + 1 }, (_, i) => g.at(i / SAMPLES));
  const d = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ');
  const fromPointer = (e: React.PointerEvent) => {
    const r = root.current!.getBoundingClientRect();
    const px = e.clientX - r.left, py = e.clientY - r.top;
    let best = 0, bestD = Infinity;
    points.forEach(([x, y], i) => { const dd = (x - px) ** 2 + (y - py) ** 2; if (dd < bestD) { bestD = dd; best = i / SAMPLES; } });
    // never across the gap: a jump of more than half the track stays at the end it left from
    if (Math.abs(best - last.current) > 0.5) best = last.current > 0.5 ? 1 : 0;
    set(min + best * span);
  };

  React.useEffect(() => {
    const el = root.current;
    if (!el) return;
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      const notch = Math.sign(e.deltaY || e.deltaX);
      if (notch) set(min + last.current * span - notch * step);
    };
    el.addEventListener('wheel', wheel, { passive: false });
    return () => el.removeEventListener('wheel', wheel);
  });

  const onKeyDown = (e: React.KeyboardEvent) => {
    const big = largeStep ?? step * 10;
    const by = e.shiftKey ? big : step;
    const moves: Record<string, () => number> = {
      ArrowLeft: () => value - by, ArrowDown: () => value - by, ArrowRight: () => value + by, ArrowUp: () => value + by,
      PageDown: () => value - big, PageUp: () => value + big, Home: () => min, End: () => max,
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    set(move());
  };

  const [px, py] = g.at(fraction);
  const [cx, cy] = g.centre ?? [px, py];
  const kx = px + (cx - px) * disc, ky = py + (cy - py) * disc;
  // the disc grows into its resting size and never past it (mid-wind the ring is looser than at rest)
  const rest = 2 * (ring / sweep - groove / 2 - discGap);
  const discSize = Number.isFinite(g.radius) ? Math.max(knob, Math.min(rest, 2 * (g.radius - track / 2 - discGap))) : knob;
  const size = knob + (discSize - knob) * disc;
  // the disc faces the value: its knurl and dot turn to the point on the groove
  const facing = g.centre ? (Math.atan2(py - cy, px - cx) * 180) / Math.PI + 90 : 0;
  const bar01 = Math.max(0, 1 - curl * 4);
  // ticks sit below a bar and outside a ring; they swap sides while faded out mid-wind
  const side = curl < 0.5 ? 1 : -1;
  const tickFade = Math.abs(1 - curl * 2);

  return (
    <div
      ref={root}
      className={className ? `${ROOT} ${className}` : ROOT}
      style={{ width: g.width, height: g.height }}
      onPointerDown={(e) => { root.current?.setPointerCapture(e.pointerId); fromPointer(e); }}
      onPointerMove={(e) => { if (root.current?.hasPointerCapture(e.pointerId)) fromPointer(e); }}
    >
      <svg className={SVG} width={g.width} height={g.height} aria-hidden>
        <path d={d} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth={track + 1} style={{ stroke: 'var(--mu-r-dial-track-edge)' }} />
        <path d={d} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth={track} style={{ stroke: 'var(--mu-r-dial-track-color)' }} />
        <path d={d} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth={track} pathLength={1} strokeDasharray={`${fraction} 2`} style={{ stroke: 'var(--mu-r-dial-fill-color)' }} />
        {marks.map((m, i) => {
          const [x, y] = g.at(m), [nx, ny] = normalAt(g.at, m), h = track / 2 - 2;
          return <line key={`m${i}`} x1={x - nx * h} y1={y - ny * h} x2={x + nx * h} y2={y + ny * h} strokeWidth={2} strokeLinecap="round" style={{ stroke: 'var(--mu-r-dial-mark-color)' }} />;
        })}
        {ticks.map((t, i) => {
          const [x, y] = g.at(t.at), [nx, ny] = normalAt(g.at, t.at), o = track / 2 + tickOut;
          return <line key={`t${i}`} x1={x + nx * o * side} y1={y + ny * o * side} x2={x + nx * (o + tickLen) * side} y2={y + ny * (o + tickLen) * side} strokeWidth={1} opacity={tickFade} style={{ stroke: 'var(--mu-r-dial-tick-color)' }} />;
        })}
      </svg>
      {bar01 > 0 && ticks.map((t, i) => {
        if (!t.label) return null;
        const [x, y] = g.at(t.at);
        return <span key={`l${i}`} className={LABEL} style={{ left: x, top: y + track / 2 + tickOut + tickLen + 2, opacity: bar01 }}>{t.label}</span>;
      })}
      <span
        role="slider"
        tabIndex={0}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-orientation="horizontal"
        {...aria}
        className={KNOB}
        style={{ left: kx, top: ky, width: size, height: size, rotate: `${facing * disc}deg` }}
        onKeyDown={onKeyDown}
      >
        <span className={DOT} style={{ top: dotInset, width: dot, height: dot, opacity: disc, background: 'var(--mu-r-dial-fill-color)' }} />
      </span>
    </div>
  );
}
