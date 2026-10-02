'use client';

import * as React from 'react';
import { TICK } from './tick.generated';
import { useIsoLayoutEffect } from '../motion/layout-effect';

// The one pen for Checkbox, selected rows and menu checks. Geometry and timing are unchanged.
const ignoreInk = (_inked: boolean) => {};

/* ── the route ─────────────────────────────────────────── */

type Pt = { x: number; y: number };
type Route = readonly [Pt, Pt, Pt];
export type TickMark = 'tick' | 'dash' | null;

const GRID = 24;
const dist = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y);
const legs = ([a, c, b]: Route) => [dist(a, c), dist(c, b)] as const;
const length = (r: Route) => legs(r)[0] + legs(r)[1];
const lerp = (a: Route, b: Route, p: number): Route => a.map((q, i) => ({ x: q.x + (b[i].x - q.x) * p, y: q.y + (b[i].y - q.y) * p })) as unknown as Route;
/** The route as path data; `tail` runs the long leg on past the tip by its own length, room for the overshoot. */
const pathOf = ([a, c, b]: Route, tail = false) =>
  `M${a.x} ${a.y}L${c.x} ${c.y}L${b.x} ${b.y}${tail ? `L${2 * b.x - c.x} ${2 * b.y - c.y}` : ''}`;

const TICK_ROUTE: Route = [TICK.start, TICK.corner, TICK.tip];
/** The dash: the tick laid flat across its own width at its middle height, the corner at the same share of the way. */
const DASH_ROUTE: Route = (() => {
  const xs = TICK_ROUTE.map((p) => p.x), ys = TICK_ROUTE.map((p) => p.y);
  const y = (Math.min(...ys) + Math.max(...ys)) / 2, x0 = Math.min(...xs), x1 = Math.max(...xs);
  const share = legs(TICK_ROUTE)[0] / length(TICK_ROUTE);
  return [{ x: x0, y }, { x: x0 + (x1 - x0) * share, y }, { x: x1, y }];
})();
const ROUTES = { tick: TICK_ROUTE, dash: DASH_ROUTE } as const;
const PIVOT = `${(TICK.corner.x / GRID) * 100}% ${(TICK.corner.y / GRID) * 100}%`;

/* ── the clock: every duration and curve is a token, read where the tick is drawn ── */

function clock(path: SVGPathElement) {
  const s = getComputedStyle(path);
  const v = (name: string) => s.getPropertyValue(name).trim();
  const ms = (value: string) => (/ms$/.test(value) ? parseFloat(value) : parseFloat(value) * 1000) || 0;
  const key = path.closest('.mu-dimple');
  return {
    still: parseFloat(v('--mu-travel-part')) === 0,
    // A group's cascade delays the key; the pen waits for its own key.
    wait: key ? ms(getComputedStyle(key).transitionDelay.split(',')[0].trim()) : 0,
    beat: ms(v('--mu-r-checkbox-tick-delay')),
    down: ms(v('--mu-r-checkbox-tick-down')),
    pace: ms(v('--mu-r-checkbox-tick-pace')),
    withdraw: ms(v('--mu-r-checkbox-tick-withdraw')),
    into: v('--mu-ease-press') || 'ease-out',
    part: { curve: v('--mu-spring-part') || 'ease-out', ms: ms(v('--mu-spring-part-d')) },
    settle: { curve: v('--mu-spring-settle') || 'ease-out', ms: ms(v('--mu-spring-settle-d')) },
  };
}
type Clock = ReturnType<typeof clock>;

/* ── the pen ───────────────────────────────────────────── */

interface Pen {
  path: SVGPathElement;
  /** The shape on the page now (a bend in progress is caught where it is). */
  route: Route;
  stop: () => void;
}

/** Leave the stroke at rest: the route exactly (no tail, no dash), shown or not. */
function rest(pen: Pen, route: Route, shown: boolean) {
  pen.stop();
  pen.route = route;
  const { path } = pen;
  path.getAnimations().forEach((a) => a.cancel());
  path.setAttribute('d', pathOf(route));
  path.style.removeProperty('stroke-dasharray');
  path.style.removeProperty('stroke-dashoffset');
  path.setAttribute('visibility', shown ? 'visible' : 'hidden');
}

/** How much of the route is drawn on screen now. */
function drawnNow(pen: Pen) {
  const { path } = pen;
  if (path.getAttribute('visibility') === 'hidden' && !path.getAnimations().length) return 0;
  const dash = path.style.getPropertyValue('stroke-dasharray');
  if (!dash) return length(pen.route);
  const total = parseFloat(dash);
  return Math.max(0, total - parseFloat(getComputedStyle(path).strokeDashoffset));
}

type Step = { to: number; ms: number; easing: string };

/** Run the pen along `route` through `steps` (drawn lengths), from `from`; `done` when it arrives. */
function stroke(pen: Pen, route: Route, from: number, steps: Step[], delay: number, done: () => void) {
  const { path } = pen;
  const total = length(route) + legs(route)[1];
  const kept = steps.filter((s) => s.ms > 0);
  const ms = kept.reduce((sum, s) => sum + s.ms, 0);
  pen.stop();
  path.getAnimations().forEach((a) => a.cancel());
  pen.route = route;
  path.setAttribute('d', pathOf(route, true));
  path.setAttribute('visibility', 'visible');
  path.style.setProperty('stroke-dasharray', `${total} ${total}`);
  path.style.setProperty('stroke-dashoffset', `${total - from}`);
  if (!ms) { done(); return; }
  let at = 0;
  const frames: Keyframe[] = [{ offset: 0, strokeDashoffset: `${total - from}`, visibility: from > 0 ? 'visible' : 'hidden', easing: kept[0].easing }];
  kept.forEach((s, i) => {
    at += s.ms;
    frames.push({ offset: at / ms, strokeDashoffset: `${total - s.to}`, visibility: s.to > 0 || i < kept.length - 1 ? 'visible' : 'hidden', ...(kept[i + 1] ? { easing: kept[i + 1].easing } : {}) });
  });
  const run = path.animate(frames, { duration: ms, delay, fill: 'both', easing: 'linear' });
  let live = true;
  pen.stop = () => { live = false; };
  run.finished.then(() => { if (live) { live = false; pen.stop = () => {}; done(); } }, () => {});
}

function draw(pen: Pen, route: Route, t: Clock, kind: 'tick' | 'dash') {
  const from = drawnNow(pen);
  const [short] = legs(route), whole = length(route);
  const steps: Step[] = kind === 'dash' || from >= short
    ? [{ to: whole, ms: t.part.ms, easing: t.part.curve }]
    : [
        { to: short, ms: t.down * (1 - from / short), easing: t.into },
        { to: short, ms: t.pace, easing: 'linear' },
        { to: whole, ms: t.part.ms, easing: t.part.curve },
      ];
  stroke(pen, route, from, steps, from > 0 ? 0 : t.wait + t.beat, () => rest(pen, route, true));
}

function withdraw(pen: Pen, t: Clock, kind: 'tick' | 'dash', gone: () => void) {
  const route = pen.route;
  const from = drawnNow(pen);
  const [short] = legs(route), whole = length(route);
  const share = (d: number) => (t.withdraw * d) / whole;
  const steps: Step[] = kind === 'dash' || from <= short
    ? [{ to: 0, ms: share(from), easing: t.into }]
    : [
        { to: short, ms: share(from - short), easing: t.into },
        { to: short, ms: t.pace, easing: 'linear' },
        { to: 0, ms: share(short), easing: t.into },
      ];
  stroke(pen, route, from, steps, 0, () => { rest(pen, route, false); gone(); });
}

/** Bend the stroke on screen into `to` on the settle spring (dash ↔ tick). */
function bend(pen: Pen, to: Route, t: Clock) {
  const from = pen.route;
  rest(pen, from, true);
  const clockwork = pen.path.animate([{ opacity: 1 }, { opacity: 1 }], { duration: t.settle.ms, easing: t.settle.curve });
  let frame = 0;
  const tickOnce = () => {
    const p = clockwork.effect?.getComputedTiming().progress;
    if (clockwork.playState === 'finished' || p == null) { rest(pen, to, true); return; }
    pen.route = lerp(from, to, p);
    pen.path.setAttribute('d', pathOf(pen.route));
    frame = requestAnimationFrame(tickOnce);
  };
  frame = requestAnimationFrame(tickOnce);
  pen.stop = () => { cancelAnimationFrame(frame); clockwork.cancel(); };
}

/** The tick (or a mixed parent's dash), drawn by the pen when the mark changes. */
export function TickGlyph({ mark, onInk = ignoreInk, className, style, ...props }: { mark: TickMark; onInk?: (inked: boolean) => void } & React.SVGProps<SVGSVGElement>) {
  const ref = React.useRef<SVGPathElement>(null);
  const pen = React.useRef<Pen | null>(null);
  const shown = React.useRef<TickMark>(mark);
  const [initial] = React.useState(mark);

  useIsoLayoutEffect(() => {
    const path = ref.current;
    if (!path) return;
    pen.current ??= { path, route: ROUTES[initial ?? 'tick'], stop: () => {} };
    const from = shown.current;
    if (from === mark) return;
    shown.current = mark;
    const p = pen.current, t = clock(path);
    // Hold the key dark from here: a tick that was on the page at load withdraws on a dark key too.
    onInk(true);
    if (t.still) {
      if (mark) rest(p, ROUTES[mark], true);
      else { rest(p, p.route, false); onInk(false); }
      return;
    }
    if (mark && from && drawnNow(p) > 0) bend(p, ROUTES[mark], t);
    else if (mark) draw(p, ROUTES[mark], t, mark);
    else withdraw(p, t, from ?? 'tick', () => onInk(false));
  }, [mark, initial, onInk]);
  React.useEffect(() => () => pen.current?.stop(), []);

  return (
    <svg {...props} className={className} viewBox={`0 0 ${GRID} ${GRID}`} aria-hidden style={{ transformOrigin: PIVOT, ...style }}>
      <path ref={ref} d={pathOf(ROUTES[initial ?? 'tick'])} visibility={initial ? 'visible' : 'hidden'} />
    </svg>
  );
}

