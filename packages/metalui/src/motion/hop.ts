/* ─────────────────────────────────────────────────────────
 * HOP: a thing thrown from one stop to the next along a small arc
 *
 * For a light stepping down a list, or an object moving from one region to another.
 * It travels a quadratic arc: the control point sits off the middle of the straight line by
 * min(0.8 × distance, --mu-motion-hop-lift), so the arc peaks at half that (7 px at most).
 *   side   up   bows toward the top of the screen, like a thrown thing (moves between regions);
 *               a mostly vertical move bows to the left going down, right going up
 *          cw / ccw  locked to the direction of travel (a light down a list uses ccw)
 *   time   --mu-motion-hop-duration (250 ms), easing out
 * Reduce Motion: it jumps. The last frame is held, so the caller sets the resting place.
 * ───────────────────────────────────────────────────────── */

export interface HopPoint { x: number; y: number }
export interface HopOptions { side?: 'up' | 'cw' | 'ccw' }

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
  const h = Math.min(0.8 * d, lift);
  const cx = from.x + dx / 2 + nx * h, cy = from.y + dy / 2 + ny * h;
  const u = 1 - t;
  return { x: u * u * from.x + 2 * u * t * cx + t * t * to.x, y: u * u * from.y + 2 * u * t * cy + t * t * to.y };
}

/** Throws the element from one translate to another along the hop's arc. Returns the animation. */
export function hop(el: HTMLElement, from: HopPoint, to: HopPoint, options: HopOptions = {}): Animation {
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
