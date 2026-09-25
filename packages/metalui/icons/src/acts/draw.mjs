import { actor, ease, light, motion, pose, T, trace } from '../motion.mjs';

/* ── DRAW / the pencil comes down and pulls a stroke ──────────
 * Verb, object   draw. The pencil is lifted back to where the line will start, set down on
 *                its point, and dragged: the stroke grows exactly under its tip, then it lifts
 *                off and goes back to its place.
 * Invariant      a pencil at 45°, point down-left; it leans at most 5°, never travels more
 *                than 1.8 left or 3.5 right, and while it draws its point is where the line ends.
 * Causal parts   cause: the point, dragged across the page. Receiver: the paper.
 *                Payoff: the stroke itself (an accent, drawn in step with the tip, gone at rest).
 * Neighbours     not Pen (no ink wave or blot, one soft swoop), not Marker (no band),
 *                not Edit (it makes a mark, it doesn't point at one).
 * Forbidden      a wiggle, a pencil spin, a scribble loop, a whole-icon bounce.
 *
 *  The stroke is M3.7 17.5 c1.8 1.2 3.5 1.2 5.3 0; the tip rides the same curve (its thirds
 *  at translate −.03,.8 and 1.73,.8 from rest), and the draw runs linear with it.
 *
 *    0ms  rest
 *  180ms  lifts 1.6 and back toward the start of the line, leaning back 4° (anticipate)
 *  320ms  set down hard on its point at the start, .3 into the paper, lean thrown to 3°
 *  345ms  the drag begins: the stroke grows under the tip, the pencil trailing 5°
 *  720ms  the stroke is complete (5.3 long); the tip is at its end
 *  820ms  flicks off, up and away (lean −3°)
 *  900ms  the stroke starts to fade, gone by 1100ms
 * 1060ms  swings home past rest by .3 and sets down
 * 1180ms  exact rest
 * ────────────────────────────────────────────────────────── */
const D = 1180;

export const act = {
  body: `<path class="ac" data-part="stroke" opacity="0" pathLength="1" d="M3.7 17.5c1.8 1.2 3.5 1.2 5.3 0"/><g data-part="pencil"><g transform="translate(-1.6 .6) rotate(45 12 12)"><path class="f" style="--duo:.16" d="M9.4 14.4V5.8a2.6 2.6 0 0 1 5.2 0v8.6l-1.75 4a.9.9 0 0 1-1.7 0Z"/><path d="M9.4 8.2h5.2"/></g></g>`,
  study: motion(D, 'The pencil lifts back, comes down on its point and pulls a stroke across the page, then goes back to its place.', ['Lift', 'Stroke', 'Return'], [
    actor('pencil', '5.5px 17.5px', [
      pose(0, T(), ease.smooth),
      pose(180, T({ x: -1.2, y: -1.6, r: -4 }), ease.accelerate),
      pose(320, T({ x: -1.8, y: 0.3, r: 3 }), ease.smooth),
      pose(345, T({ x: -1.78, y: 0.12, r: 4 }), ease.linear),
      pose(470, T({ x: -0.03, y: 0.8, r: 5 }), ease.linear),
      pose(595, T({ x: 1.73, y: 0.8, r: 5 }), ease.linear),
      pose(720, T({ x: 3.5, y: 0, r: 4 }), ease.smooth),
      pose(820, T({ x: 3.4, y: -1.5, r: -3 }), ease.smooth),
      pose(1060, T({ x: -0.3, y: 0.25, r: 1 }), ease.settle),
      pose(D, T()),
    ]),
    actor('stroke', '3.7px 17.5px', [
      { ...light(0, 0), ...trace(0, 0) }, { ...light(335, 0), ...trace(335, 0, ease.linear) },
      { ...light(345, 1), ...trace(345, 0.01, ease.linear) },
      { ...light(720, 1), ...trace(720, 1, ease.linear) },
      { ...light(900, 1), ...trace(900, 1, ease.smooth) },
      { ...light(1100, 0), ...trace(1100, 1, ease.linear) },
      { ...light(D, 0), ...trace(D, 0) },
    ]),
  ]),
  shape: 'Pencil built upright (body w4.6, eraser band at y8) then rotated 45°. Motion (study): the pencil lifts 1.6 back to the start of the line, is set down hard on its point, and drags 5.3 right along a soft swoop while the stroke (an accent) is drawn in step under its tip; it flicks off and swings home, and the stroke fades.',
};
