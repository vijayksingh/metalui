import { actor, ease, light, motion, pose, T } from '../motion.mjs';

/* ── TAG / tied on: the cord tugs, the tag swings on its eyelet ─
 * Verb, object   attach a label to a thing. The eyelet is where the tag is tied; the card hangs off it.
 * Invariant      the same tag with its point to the left and the bead on its centre line; it turns
 *                only about the eyelet, never more than 14°, and moves at most 1.2 along its cord.
 * Causal parts   cause: the cord pulling the eyelet left. Receiver: the card, which trails and then
 *                swings on the eyelet. Payoff: a ring at the eyelet the moment the cord goes taut.
 * Neighbours     not Bookmark (nothing drops down), not Pin (no tip goes in), not Price/Label badges.
 * Forbidden      a free spin, a wiggle with no cause, a whole-icon pulse or the old stamp squash.
 *
 *    0ms  rest
 *  140ms  the cord tugs: the tag slides 1.2 left along its axis, its far end lifting 6° as it trails
 *  300ms  the cord goes taut; the tag whips down to 14° on the eyelet; the ring opens there
 *  460ms  swings back past rest to −6°
 *  600ms  +2.5° … 730ms −0.8°
 *  900ms  exact rest
 * ────────────────────────────────────────────────────────── */
const D = 900;
export const act = {
  body: `<g data-part="tag"><path class="f" style="--duo:.12" d="M10.2 5h7.6a2.2 2.2 0 0 1 2.2 2.2v9.6a2.2 2.2 0 0 1-2.2 2.2h-7.6a2.2 2.2 0 0 1-1.7-.8L4.6 13.4a2.2 2.2 0 0 1 0-2.8l3.9-4.8a2.2 2.2 0 0 1 1.7-.8Z"/><circle class="s" cx="9.4" cy="12" r="1.3"/></g><circle class="ac" data-part="taut" opacity="0" cx="9.4" cy="12" r="2.6" style="stroke-width:calc(var(--sw) * .7)"/>`,
  study: motion(D, 'The cord tugs the tag by its eyelet, and it swings there and comes to hang still.', ['Tug', 'Swing', 'Hang'], [
    actor('tag', '9.4px 12px', [
      pose(0, T(), ease.accelerate),
      pose(140, T({ x: -1.2, r: -6 }), ease.strike),
      pose(300, T({ r: 14 }), ease.smooth),
      pose(460, T({ r: -6 }), ease.smooth),
      pose(600, T({ r: 2.5 }), ease.smooth),
      pose(730, T({ r: -0.8 }), ease.settle),
      pose(D, T()),
    ]),
    actor('taut', '9.4px 12px', [
      light(0, 0, 'scale(.4)'), light(250, 0, 'scale(.4)', ease.settle),
      light(310, 0.9, 'scale(.8)', ease.smooth), light(560, 0, 'scale(1.5)'), light(D, 0, 'scale(.4)'),
    ]),
  ]),
  shape: 'Tag 15.4 × 14 with a rounded point, tinted .12; eyelet bead 2.6 on the centre line. Motion (study): the cord tugs the tag 1.2 left by its eyelet, then it whips to 14° about the eyelet and swings out (−6°, +2.5°, −0.8°); a ring opens at the eyelet when the cord goes taut.',
};
