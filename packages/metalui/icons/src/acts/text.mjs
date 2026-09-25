import { actor, ease, light, motion, pose, spring, T } from '../motion.mjs';

/* ── TEXT / a piece of type is set, and the caret waits after it ──
 * Verb, object   set type. The T is a metal slug: it is lifted, struck onto its baseline,
 *                and the caret appears after it, ready for the next letter.
 * Invariant      an upright T on its foot at x 12; it never tilts, never leaves the
 *                baseline by more than 2, and the foot is where every squash is pinned.
 * Causal parts   cause: the slug struck down onto its foot. Receiver: the baseline.
 *                Payoff: two short impression marks flank the foot on contact; then the caret.
 * Neighbours     not Heading or Font (no size change held), not Cursor/Select (the caret is
 *                a consequence, not the actor), not a bounce (one strike, one landing).
 * Forbidden      a whole-glyph pulse, a wobble, the T hopping, a caret blinking forever.
 *
 *    0ms  rest
 *  190ms  the slug lifts 2 off its baseline and stretches a touch (anticipate)
 *  240ms  a hang at the top
 *  320ms  strikes down onto its foot: squashes .86 tall, 1.1 wide, pinned at the foot
 *  340ms  impression marks flash at both ends of the foot and spread
 *  380ms  held on the strike, then springs up on the object spring
 *  430ms  the caret grows up from the baseline beside the crossbar
 *  660ms  one blink off, 830ms on again, 1010ms off
 * 1100ms  exact rest (caret gone)
 * ────────────────────────────────────────────────────────── */
const SQUASH = { sx: 1.1, sy: 0.86 };
const land = spring(380, SQUASH, {}, 'object');
const D = 1100;

export const act = {
  body: `<g data-part="slug"><path d="M6.2 7.3V6.4a1.2 1.2 0 0 1 1.2-1.2h9.2a1.2 1.2 0 0 1 1.2 1.2v.9"/><path d="M12 5.2v13.6M9.6 18.8h4.8"/></g><path class="ac" data-part="caret" opacity="0" d="M19.4 12.9v6.2"/><path class="ac" data-part="dent" opacity="0" d="M7.9 20 6.8 20.6M16.1 20l1.1.6" style="stroke-width:calc(var(--sw) * .7)"/>`,
  study: motion(D, 'The T is lifted, struck down onto its foot like a piece of type, and the caret appears after it.', ['Lift', 'Strike', 'Caret'], [
    actor('slug', '12px 18.8px', [
      pose(0, T(), ease.smooth),
      pose(190, T({ y: -2, sy: 1.04 }), ease.smooth),
      pose(240, T({ y: -2.2, sy: 1.03 }), ease.accelerate),
      pose(320, T(SQUASH), ease.smooth),
      ...land,
      ...(land[land.length - 1].at < D ? [pose(D, T())] : []),
    ]),
    actor('dent', '12px 18.8px', [
      light(0, 0, T({ sx: 0.8 })), light(318, 0, T({ sx: 0.8 }), ease.settle),
      light(345, 0.9, T({ sx: 1 }), ease.smooth), light(600, 0, T({ sx: 1.4 })), light(D, 0, T({ sx: 0.8 })),
    ]),
    actor('caret', '19.4px 19.1px', [
      light(0, 0, T({ sy: 0.3 })), light(420, 0, T({ sy: 0.3 }), ease.settle),
      light(520, 1, T(), ease.linear), light(650, 1, T(), ease.linear), light(670, 0, T(), ease.linear),
      light(810, 0, T(), ease.linear), light(830, 1, T(), ease.linear), light(990, 1, T(), ease.linear),
      light(1010, 0, T(), ease.linear), light(D, 0, T({ sy: 0.3 })),
    ]),
  ]),
  shape: 'T with soft 1.2u corner drops; the caret is a separate 6.2u line, an accent. Motion (study): the slug lifts 2, is struck onto its foot (squash .86 × 1.1 pinned at the foot) with two impression marks flanking the foot, springs back on the object spring; the caret grows up beside it and blinks once.',
};
