import { actor, ease, light, motion, pose, T } from '../motion.mjs';

/* ── LINE / press a start point and drag the line out to its end ─
 * Verb, object   draw a line. The start dot is where the pen goes down; the end dot is the
 *                handle you drag, and the stroke is always exactly as long as the drag.
 * Invariant      one straight diagonal from the start dot, direction never changes; the
 *                start dot never moves; over a third of the stroke is always drawn.
 * Causal parts   cause: the end handle picked up and dragged. Receiver: the stroke, which
 *                follows the handle (it is drawn behind it, then stretched a little past
 *                the end). Payoff: a snap ring where the handle lands on its end point.
 * Neighbours     not Arrow (no head, nothing fired), not Draw (not freehand), not a pluck.
 * Forbidden      a whole-icon pulse, a wiggle, the stroke bending (reshaping isn't motion).
 *
 *    0ms  rest
 *   90ms  the end handle is picked up: it swells to 1.35 (anticipate)
 *  270ms  the drag pulls it back toward the start; the stroke retracts to .38
 *  330ms  the pen presses the start dot down (.72), contact
 *  540ms  dragged out: the stroke is drawn behind the handle and reaches the end
 *  620ms  the drag carries 9% past the end, the stroke stretching with it
 *  660ms  the handle is let go and drops onto its point (.8), the snap ring opens
 *  800ms  it springs back just short (.985)
 * 1000ms  exact rest
 * ────────────────────────────────────────────────────────── */

// The drag as one number: how far the end handle is along the line (1 = its rest point).
// Under 1 the stroke is drawn to it; over 1 the stroke is stretched from its start to reach it,
// so the handle and the stroke's end stay joined on every frame.
const SPAN = 13.2; // 5.4,18.6 → 18.6,5.4 along each axis
const reach = [
  // at,   u,     handle scale, easing
  [0,    1,     1,    ease.accelerate],
  [90,   1,     1.35, ease.smooth],
  [270,  .38,   1.35, ease.smooth],
  [330,  .38,   1.35, 'cubic-bezier(.35,0,.55,1)'],
  [540,  1,     1.35, ease.settle],
  [620,  1.09,  1.35, ease.smooth],
  [660,  1.07,  .8,   ease.smooth],
  [800,  .985,  1.04, ease.smooth],
  [1000, 1,     1],
];

export const act = {
  body: `<path data-part="stroke" pathLength="1" d="M5.4 18.6C9.8 14.2 14.2 9.8 18.6 5.4"/><circle class="s" data-part="start" cx="5.4" cy="18.6" r="1.3"/><circle class="s" data-part="end" cx="18.6" cy="5.4" r="1.3"/><circle class="ac" data-part="snap" opacity="0" cx="18.6" cy="5.4" r="2.8" style="stroke-width:calc(var(--sw) * .7)"/>`,
  study: motion(1000, 'The end handle is picked up and dragged back, the pen presses the start, and the line is drawn out to snap onto its end.', ['Pick up', 'Drag out', 'Snap'], [
    actor('stroke', '5.4px 18.6px', reach.map(([at, u, , e]) => ({
      at, draw: Math.min(u, 1), transform: T({ sx: Math.max(u, 1), sy: Math.max(u, 1) }), ...(e ? { easing: e } : {}),
    }))),
    actor('end', '18.6px 5.4px', reach.map(([at, u, s, e]) => ({
      at, transform: T({ x: (u - 1) * SPAN, y: (1 - u) * SPAN, sx: s, sy: s }), ...(e ? { easing: e } : {}),
    }))),
    actor('start', '5.4px 18.6px', [
      pose(0, T(), ease.smooth),
      pose(270, T(), ease.strike),
      pose(330, T({ sx: .72, sy: .72 }), ease.smooth),
      pose(460, T({ sx: 1.08, sy: 1.08 }), ease.smooth),
      pose(580, T(), ease.smooth),
      pose(1000, T()),
    ]),
    actor('snap', '18.6px 5.4px', [
      light(0, 0, 'scale(.4)'), light(640, 0, 'scale(.4)', ease.settle),
      light(700, .9, 'scale(.85)', ease.smooth), light(920, 0, 'scale(1.5)'), light(1000, 0, 'scale(.4)'),
    ]),
  ]),
  shape: 'One diagonal corner to corner (5.4 to 18.6), a cubic with its handles on the line, and a 1.3 dot at each end. Motion (study): the end dot is picked up (1.35) and dragged back to .38 of the length, the stroke retracting with it; the start dot is pressed (.72); the drag draws the stroke out, carries 9% past the end (the stroke stretched from its start), and the handle drops onto its point with a snap ring.',
};
