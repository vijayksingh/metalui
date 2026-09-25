/* ─────────────────────────────────────────────────────────
 * HOP: a thing thrown from one stop to the next along a small arc
 *
 * For a light stepping down a list, or an object moving from one region to another.
 * It travels a quadratic arc: the control point sits off the middle of the straight line by
 * min(0.8 × distance, --mu-motion-hop-lift), so the arc peaks at half that (7 px at most).
 *   side   up   bows toward the top of the screen, like a thrown thing (moves between regions);
 *               a mostly vertical move bows to the left going down, right going up
 *          cw / ccw  locked to the direction of travel (a light down a list uses ccw)
 *   reach  near  a light stepping through a list: the arc is capped by --mu-motion-hop-lift,
 *                in --mu-motion-hop-duration (250 ms), easing out
 *          far   a thing carried to another place, thrown with weight:
 *                  crouch  --mu-motion-hop-crouch (70 ms): it presses into the table
 *                  flight  --mu-motion-hop-duration-far (340 ms): across smoothly, while its height
 *                          follows gravity (rises slowing, hangs, falls faster); it grows to
 *                          --mu-motion-hop-rise and casts --mu-motion-hop-rise-shadow at the top
 *                  land    --mu-motion-hop-land (200 ms): squashes to --mu-motion-hop-squash on its
 *                          base, rebounds and settles (the table is a stop, so it may bounce)
 * Reduce Motion: it jumps. The last frame is held, so the caller sets the resting place.
 * ───────────────────────────────────────────────────────── */

export interface HopPoint { x: number; y: number }
export interface HopOptions { side?: 'up' | 'cw' | 'ccw'; reach?: 'near' | 'far' }

const FRAMES = 24;

function token(name: string, fallback: number) {
  if (typeof window === 'undefined') return fallback;
  const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
  return Number.isFinite(v) ? v : fallback;
}

/** The point a fraction t (0–1) of the way along the hop's arc. */
export function hopPoint(from: HopPoint, to: HopPoint, t: number, { side = 'up' }: HopOptions = {}, lift = 14): HopPoint {
  const dx = to.x - from.x, dy = to.y - from.y, d = Math.hypot(dx, dy);
  if (d === 0) return to;
  // ccw bows to the left of travel on screen (y grows down): going down it bows left, going up right.
  let nx = -dy / d, ny = dx / d;
  if (side === 'cw') { nx = -nx; ny = -ny; }
  // up bows toward the top of the screen; a mostly vertical move keeps ccw.
  if (side === 'up' && Math.abs(dx) >= Math.abs(dy) && ny > 0) { nx = -nx; ny = -ny; }
  const h = Math.min(token('--mu-motion-hop-arc-ratio', 0.8) * d, lift);
  const cx = from.x + dx / 2 + nx * h, cy = from.y + dy / 2 + ny * h;
  const u = 1 - t;
  return { x: u * u * from.x + 2 * u * t * cx + t * t * to.x, y: u * u * from.y + 2 * u * t * cy + t * t * to.y };
}

/** Throws the element from one translate to another along the hop's arc. Returns the animation. */
export function hop(el: HTMLElement, from: HopPoint, to: HopPoint, options: HopOptions = {}): Animation {
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (options.reach === 'far') return throwFar(el, from, to, options, reduced);
  const duration = reduced ? 0 : token('--mu-motion-hop-duration', 250);
  const lift = token('--mu-motion-hop-lift', 14);
  const frames: Keyframe[] = [];
  for (let k = 0; k <= FRAMES; k++) {
    const time = k / FRAMES, t = 1 - (1 - time) * (1 - time); // ease out: fast from the stop, slow into the next
    const p = hopPoint(from, to, t, options, lift);
    frames.push({ offset: time, transform: `translate(${p.x}px, ${p.y}px)` });
  }
  return el.animate(frames, { duration, easing: 'linear', fill: 'forwards' });
}

function cssToken(name: string, fallback: string) {
  if (typeof window === 'undefined') return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

/* A far hop: crouch, a throw under gravity, a landing that squashes and settles. One animation, so a
 * caller can cancel it and set the resting place like any other. */
function throwFar(el: HTMLElement, from: HopPoint, to: HopPoint, _options: HopOptions, reduced: boolean): Animation {
  const at = (p: HopPoint, sx = 1, sy = 1) => `translate(${p.x}px, ${p.y}px) scale(${sx}, ${sy})`;
  const none = 'drop-shadow(0 0 0 rgba(0,0,0,0))';
  if (reduced) return el.animate([{ transform: at(to), filter: none }], { duration: 0, fill: 'forwards' });

  const crouch = token('--mu-motion-hop-crouch', 70), flight = token('--mu-motion-hop-duration-far', 340), land = token('--mu-motion-hop-land', 200);
  const rise = token('--mu-motion-hop-rise', 1.04), squash = token('--mu-motion-hop-squash', 0.95);
  const shadow = cssToken('--mu-motion-hop-rise-shadow', '0 14px 18px rgba(0,0,0,.16)');
  const total = crouch + flight + land;
  const dx = to.x - from.x, dy = to.y - from.y, d = Math.hypot(dx, dy);
  // The top of the throw (always toward the top of the screen): half the control-point lift, bounded by the distance.
  const apex = Math.min(token('--mu-motion-hop-arc-ratio', 0.8) * d, token('--mu-motion-hop-lift-far', 72)) / 2;
  // The shadow at a height h (0–1): its offset, blur and alpha grow with the height.
  const cast = (h: number) => (h <= 0 ? none : `drop-shadow(${shadow.replace(/(-?[\d.]+)px/g, (_, n) => `${(+n * h).toFixed(2)}px`).replace(/rgba\(([^)]+),\s*([\d.]+)\)/, (_, rgb, a) => `rgba(${rgb},${(+a * h).toFixed(3)})`)})`);

  const frames: Keyframe[] = [];
  el.style.transformOrigin = '50% 100%'; // it crouches and lands on its base
  // Crouch: press into the table, from rest.
  frames.push({ offset: 0, transform: at(from), filter: none, easing: 'ease-out' });
  frames.push({ offset: crouch / total, transform: at(from, 1 + (1 - squash) / 4, 1 - (1 - squash) / 2), filter: none });
  // Flight: across on a smooth ease, height on gravity (a parabola in time), scale and shadow with height.
  const N = 20;
  for (let k = 1; k <= N; k++) {
    const u = k / N;
    const across = u * u * (3 - 2 * u); // lifts off and sets down smoothly
    const h = 4 * u * (1 - u); // gravity: rises slowing, hangs, falls faster
    const p = { x: from.x + dx * across, y: from.y + dy * u - apex * h };
    const g = 1 + (rise - 1) * h;
    frames.push({ offset: (crouch + flight * u) / total, transform: at(p, g, g), filter: cast(h), easing: 'linear' });
  }
  // Land: squash on its base, rebound, settle.
  frames.push({ offset: (crouch + flight + land * 0.35) / total, transform: at(to, 1 + (1 - squash) / 2, squash), filter: none, easing: 'ease-out' });
  frames.push({ offset: (crouch + flight + land * 0.7) / total, transform: at(to, 1 - (1 - squash) / 6, 1 + (1 - squash) / 3), filter: none, easing: 'ease-in-out' });
  frames.push({ offset: 1, transform: at(to), filter: none });
  return el.animate(frames, { duration: total, fill: 'forwards' });
}
