import { actor, ease, light, motion, pose, spring, T } from '../motion.mjs';

/* ── BOARD / the ribbon is hung on the board and caught at its top ─
 * Verb, object   keep this on the board. The ribbon is a strip of cloth hung by its top edge;
 *                it is lifted, let drop, and caught by that edge, and its tail runs on and
 *                stretches before it springs back.
 * Invariant      the same portrait ribbon with its notch; it only moves up and down its own
 *                axis (never tilts), and its top edge stays level.
 * Causal parts   cause: the fall, stopped at the top edge. Receiver: the ribbon's tail, which
 *                keeps going (stretch 1.05 from the top) and lags the edge. Payoff: two catch
 *                marks either side of the top edge, where it is held.
 * Neighbours     not Pin (no needle, no board line), not Download (it comes back up to rest and
 *                points nowhere), not Flag (no pole, no wave).
 * Forbidden      a swell of the ribbon, a whole-icon bounce, the old lengthening tail alone.
 *
 *    0ms  rest
 *  180ms  lifted 1.6, gathering .96 toward its top (lift)
 *  260ms  held up (1.7)
 *  360ms  dropped: caught by its top .5 below rest; the catch marks flash (strike)
 *  420ms  the tail runs on: stretched 1.05 from the top
 *  ...    object spring back to rest; ~860ms exact rest
 * ────────────────────────────────────────────────────────── */
const ribbon = [
  pose(0, T(), ease.smooth),
  pose(180, T({ y: -1.6, sy: 0.96 }), ease.smooth),
  pose(260, T({ y: -1.7, sy: 0.96 }), ease.accelerate),
  pose(360, T({ y: 0.5 }), ease.smooth),
  ...spring(420, { y: 0.5, sy: 1.05 }, {}, 'object', { still: 0.2 }),
];
const D = ribbon[ribbon.length - 1].at;

export const act = {
  body: `<path data-part="ribbon" class="f" style="--duo:.16" d="M6.8 19.8V5.9a2.1 2.1 0 0 1 2.1-2.1h6.2a2.1 2.1 0 0 1 2.1 2.1v13.9l-4.3-3a1.6 1.6 0 0 0-1.8 0Z"/>`
    + `<path class="ac" data-part="catch" opacity="0" d="M5.3 4.4h-1.3M18.7 4.4h1.3" style="stroke-width:calc(var(--sw) * .7)"/>`,
  study: motion(D, 'The ribbon is lifted and let drop; its top edge catches it, the tail runs on and springs back.', ['Lift', 'Drop and catch', 'Hang'], [
    actor('ribbon', '12px 3.8px', ribbon),
    actor('catch', '12px 4.4px', [
      light(0, 0, 'scale(.7)'), light(350, 0, 'scale(.7)', ease.settle),
      light(400, 1, 'scale(1)', ease.smooth), light(620, 0, 'scale(1.2)'), light(D, 0, 'scale(.7)'),
    ]),
  ]),
  shape: 'Portrait ribbon with a notch 3.0 deep. Motion (study): the ribbon lifts 1.6 gathering toward its top, drops and is caught .5 below rest, its tail running on to 1.05 before an object spring; catch marks flash either side of the top edge.',
};
