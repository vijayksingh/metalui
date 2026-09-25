import { actor, ease, light, motion, T } from '../motion.mjs';

/* ── PASTE / the clip opens, the content drops on, the clip clamps it ─
 * Verb, object   put it here. The clipboard's clip levers open, the content falls onto the
 *                board line by line, and the clip snaps down to hold it.
 * Invariant      the board never moves (it is the table); the clip stays on its top edge;
 *                the content always lands inside the board, in its drawn place.
 * Causal parts   cause: the clip levering open about its left end. Receiver: the two lines,
 *                which fall in and land with a small bounce, the short one a beat late.
 *                Payoff: the clip clamps (squashes onto the board) and clacks: two ticks.
 * Neighbours     not Copy (nothing is duplicated, no second sheet), not Clipboard/Notes
 *                (the content arrives), not Download (no arrow, the drop is short).
 * Forbidden      a whole-board bounce, lines drawing like handwriting, a floating sheet.
 *
 *    0ms  rest
 *  140ms  the old lines lift 0.8 and fade (the board is cleared to receive)
 *  180ms  the clip has levered open: 10° about its left end and 1.0 up
 *  220ms  line 1 falls from 3.2 above …
 *  340ms  … and lands 0.5 low, rebounds; line 2 follows 70 ms later
 *  520ms  the clip clamps down, squashed 10% onto the board; the clack ticks fire
 *  620ms  it rebounds 0.15 and settles
 *  900ms  exact rest
 * ────────────────────────────────────────────────────────── */
const line = (dl) => {
  const f = (at, y, opacity, easing = ease.smooth) => ({ at, transform: T({ y }), opacity, easing });
  return [f(0, 0, 1, ease.accelerate), f(140, -.8, 0, ease.linear), f(220 + dl, -3.2, 0, ease.accelerate),
    f(340 + dl, .5, 1), f(420 + dl, -.15, 1), f(500 + dl, 0, 1, ease.linear), f(900, 0, 1)];
};

export const act = {
  body: `<path class="f" style="--duo:.1" d="M8.6 5.2H7.4A2.4 2.4 0 0 0 5 7.6v10.6a2.4 2.4 0 0 0 2.4 2.4h9.2a2.4 2.4 0 0 0 2.4-2.4V7.6a2.4 2.4 0 0 0-2.4-2.4h-1.2"/><rect data-part="clip" x="8.6" y="3.4" width="6.8" height="3.6" rx="1.3"/><path data-part="l1" d="M8.6 11.8h6.8"/><path data-part="l2" d="M8.6 15.4h4.2"/><path class="ac" data-part="clack" opacity="0" d="M7.3 3.1 6.3 2.3M16.7 3.1 17.7 2.3" style="stroke-width:calc(var(--sw) * .7)"/>`,
  study: motion(900, 'The clip levers open, the content drops onto the board, and the clip clamps it down.', ['Open', 'Drop', 'Clamp'], [
    actor('clip', '8.6px 7px', [
      { at: 0, transform: T(), easing: ease.smooth },
      { at: 180, transform: T({ y: -1, r: -10 }), easing: ease.linear },
      { at: 450, transform: T({ y: -1, r: -10 }), easing: ease.accelerate },
      { at: 520, transform: T({ y: .3, sx: 1.04, sy: .9 }), easing: ease.smooth },
      { at: 620, transform: T({ y: -.15 }), easing: ease.smooth },
      { at: 740, transform: T({ y: .05 }), easing: ease.settle },
      { at: 900, transform: T() },
    ]),
    actor('l1', '12px 11.8px', line(0)),
    actor('l2', '10.7px 15.4px', line(70)),
    actor('clack', '12px 3.4px', [
      light(0, 0, 'scale(.6)'), light(510, 0, 'scale(.6)', ease.settle), light(550, 1, 'scale(1)', ease.smooth),
      light(740, 0, 'scale(1.25)'), light(900, 0, 'scale(.6)'),
    ]),
  ]),
  shape: 'Portrait clipboard r2.4 tinted .1, clip 6.8 × 3.6 r1.3, two content lines (6.8 and 4.2). Motion (study): the clip levers open 10° about its left end, the old lines lift away, the content falls onto the board line by line and bounces, and the clip clamps down squashed with a two-tick clack.',
};
