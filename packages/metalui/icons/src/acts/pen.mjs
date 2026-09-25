import { actor, ease, light, motion, pose, T, trace } from '../motion.mjs';

/* ── PEN / the nib writes a wave of ink and presses a drop ────
 * Verb, object   write in ink. The fountain nib is set down, rides a two-hump wave with its
 *                point (the tip goes up and down with the ink), then presses at the end of the
 *                line: pressure opens the slit and a drop of ink blooms and soaks in.
 * Invariant      a nib at 45°, point down-left, slit and breather hole intact; it leans at most
 *                6°, travels at most 1.6 left and 2.8 right, and its point is on the wet end of
 *                the line while it writes.
 * Causal parts   cause: the point riding the wave, then pressing. Receiver: the paper.
 *                Payoff: the ink line (drawn in step with the tip) and the drop that blooms
 *                under the press.
 * Neighbours     not Draw (the tip undulates on a wave and ends in pressure and a drop, where
 *                the pencil drags one swoop), not Marker (no band), not Signature.
 * Forbidden      a scribble loop, a nib spin, a wiggle, a whole-icon bounce.
 *
 *  The ink is M3.6 17.8 c.75-.9 1.45-.9 2.2 0 s1.45.9 2.2 0 (4.4 long); from rest the point
 *  rides translate −1.6,0 → −.5,−.68 → .6,0 → 1.7,.68 → 2.8,0 with the draw, linear.
 *
 *    0ms  rest
 *  150ms  lifts 1 and back to the start of the line, leaning back 3° (anticipate)
 *  270ms  touches down on its point
 *  280ms  writes: rides the wave crest (370), crossing (460), trough (550), end (640)
 *  720ms  presses at the end: .6 into the paper, squashed .92 tall, 1.06 wide, leaning 6°
 *  700ms  the drop blooms under the point (1.12 at 770ms), recoils .95 at 880ms
 *  870ms  lets go: lifts 1.8 up and off the drop, leaning back, and hangs (the drop is seen)
 * 1000ms  drop and ink line soak in, gone by 1200ms
 * 1170ms  swings home past rest by .25 and sets down
 * 1280ms  exact rest
 * ────────────────────────────────────────────────────────── */
const D = 1280;

export const act = {
  body: `<path class="ac" data-part="ink" opacity="0" pathLength="1" d="M3.6 17.8c.75-.9 1.45-.9 2.2 0s1.45.9 2.2 0"/><circle class="s ac" data-part="drop" opacity="0" cx="8" cy="17.8" r="1.5" style="stroke:none"/><g data-part="nib"><g transform="translate(-1.6 .6) rotate(45 12 12)"><path class="f" style="--duo:.16" d="M8.8 3.2h6.4v5.2l1.4 2.8-4.6 8.2-4.6-8.2 1.4-2.8Z"/><path d="M12 19.4v-5"/><circle class="s" cx="12" cy="12.4" r=".75" style="stroke:none"/></g></g>`,
  study: motion(D, 'The nib writes a wave of ink, presses at the end of the line, and a drop of ink blooms and soaks in.', ['Set down', 'Write', 'Press'], [
    actor('nib', '5.2px 17.8px', [
      pose(0, T(), ease.smooth),
      pose(150, T({ x: -1.2, y: -1, r: -3 }), ease.accelerate),
      pose(270, T({ x: -1.6, y: 0.15, r: 2 }), ease.linear),
      pose(280, T({ x: -1.6, y: 0, r: 3 }), ease.linear),
      pose(370, T({ x: -0.5, y: -0.68, r: 4 }), ease.linear),
      pose(460, T({ x: 0.6, y: 0, r: 4 }), ease.linear),
      pose(550, T({ x: 1.7, y: 0.68, r: 4 }), ease.linear),
      pose(640, T({ x: 2.8, y: 0, r: 4 }), ease.accelerate),
      pose(720, T({ x: 2.8, y: 0.6, r: 6, sx: 1.06, sy: 0.92 }), ease.smooth),
      pose(770, T({ x: 2.8, y: 0.5, r: 5.5, sx: 1.04, sy: 0.95 }), ease.strike),
      pose(870, T({ x: 3, y: -1.8, r: -3 }), ease.smooth),
      pose(940, T({ x: 2.95, y: -1.9, r: -3.5 }), ease.smooth),
      pose(1170, T({ x: -0.25, y: 0.2, r: 1 }), ease.settle),
      pose(D, T()),
    ]),
    actor('ink', '3.6px 17.8px', [
      { ...light(0, 0), ...trace(0, 0) }, { ...light(272, 0), ...trace(272, 0, ease.linear) },
      { ...light(282, 1), ...trace(282, 0.01, ease.linear) },
      { ...light(640, 1), ...trace(640, 1, ease.linear) },
      { ...light(1000, 1), ...trace(1000, 1, ease.smooth) },
      { ...light(1200, 0), ...trace(1200, 1, ease.linear) },
      { ...light(D, 0), ...trace(D, 0) },
    ]),
    actor('drop', '8px 17.8px', [
      light(0, 0, 'scale(.2)'), light(690, 0, 'scale(.2)', ease.strike),
      light(770, 1, 'scale(1.12)', ease.smooth), light(880, 1, 'scale(.95)', ease.smooth),
      light(1000, 0.95, 'scale(1)', ease.smooth), light(1200, 0, 'scale(1.05)', ease.linear), light(D, 0, 'scale(.2)'),
    ]),
  ]),
  shape: 'A fountain nib on the Draw pencil frame (same length, angle and tip point): shoulders 6.4 wide, a slit from the tip to the breather hole. Motion (study): the nib sets down 1.6 left, rides a two-hump wave with its point while the ink (an accent) is drawn under it, presses at the end of the line (.6 down, squash .92) and a drop of ink blooms there and soaks in; it lets go and swings home.',
};
