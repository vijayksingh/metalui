import { actor, ease, light, motion, pose, spring, T } from '../motion.mjs';

/* ── CALENDAR / the day's leaf flips over the binding ─────────
 * Verb, object   go to a date. The pad is the calendar; today is its top leaf, bound under the rings.
 * Invariant      the pad, its header rule and both rings stay where they are drawn (the rings only
 *                lift 1.4 in their slots); the pad never moves, so the leaf reads against it.
 * Causal parts   cause: the leaf lifting from its bottom edge and flipping up about the header rule.
 *                Receiver: the rings, kicked up as the leaf passes over the binding, then dropping
 *                back into their seats. Payoff: the leaf lies over the head and is gone; a fresh page.
 * Neighbours     not Document (no fold, no lines), not Region (no name), not Clock (no hands).
 * Forbidden      the old squash of the page, a whole-icon bounce, the rings hopping with no cause.
 *
 *    0ms  rest
 *  160ms  the leaf appears on the page and its bottom edge curls up (to .78 of its height)
 *  300ms  flipping about the header rule, edge-on; the rings start to rise
 *  360ms  the leaf is over the binding: the rings are kicked 1.4 up
 *  440ms  the leaf lies over the head (flipped −.55), beginning to fade
 *  620ms  the leaf is gone
 *  665ms  the rings drop back through their seats (part spring) … 970ms seated
 * 1000ms  exact rest
 * ────────────────────────────────────────────────────────── */
const D = 1000;
export const act = {
  body: `<rect class="f" style="--duo:.08" x="3.5" y="5.2" width="17" height="15" rx="3.2"/><path d="M3.5 10h17"/><path data-part="rings" d="M8.2 3.4v3.4M15.8 3.4v3.4"/><path class="ac f" data-part="leaf" opacity="0" style="--duo:.14" d="M3.5 10h17v7a3.2 3.2 0 0 1-3.2 3.2H6.7a3.2 3.2 0 0 1-3.2-3.2Z"/>`,
  study: motion(D, 'Today\'s leaf curls up and flips over the binding, kicking the rings, and a fresh page is left.', ['Lift', 'Flip', 'Settle'], [
    actor('leaf', '12px 10px', [
      light(0, 0, T(), ease.smooth),
      light(60, 1, T({ sy: 0.97 }), ease.accelerate),
      light(160, 1, T({ sy: 0.78 }), ease.accelerate),
      light(300, 1, T({ sy: 0.02 }), ease.linear),
      light(360, 1, T({ y: -0.2, sy: -0.35 }), ease.settle),
      light(440, 0.9, T({ y: -0.4, sy: -0.55 }), ease.smooth),
      light(620, 0, T({ y: -0.8, sy: -0.6 })),
      light(D, 0, T()),
    ]),
    actor('rings', '12px 5.1px', [
      pose(0, T(), ease.smooth),
      pose(280, T(), ease.strike),
      ...spring(360, { y: -1.4 }, {}, 'part'),
      pose(D, T()),
    ]),
  ]),
  shape: 'Page 17 × 15 r3.2, tinted .08; header rule on the 10 line; binding rings at the 8 and 16 detents. Motion (study): today\'s leaf (an accent the shape of the page below the rule) curls from its bottom edge and flips up about the header rule; passing the binding it kicks the rings 1.4 up, which drop back on the part spring; the leaf lies over the head and fades.',
};
