import { actor, ease, light, motion, pose, T, trace } from '../motion.mjs';

/* ── ME / your trend runs back and climbs again to today ──────
 * Verb, object   look at yourself over time. The screen is the record; the trace is your days;
 *                the bead is today.
 * Invariant      the screen never moves; the bead is always the tip of the trace (it rides the
 *                drawn end exactly), so the mark is always a trend ending in a point.
 * Causal parts   cause: the bead, a pen tip, running back along your days and drawing them again.
 *                Receiver: the trace, which erases and redraws behind it. Payoff: the bead climbs
 *                the last rise, is flung a little past today and pulled back; a ring marks today.
 * Neighbours     not Chart/Analytics (no axes, one series), not Activity (no pulse wave), not
 *                User (no head and shoulders).
 * Forbidden      a pulsing dot (the old press), a generic draw-on with nothing leading it.
 *
 * Trace (7.2,15.2)→(10,12)→(12.6,14)→(16,9.8): lengths 4.25, 3.28, 5.40 (12.94); the joints
 * fall at .3287 and .5823 of its length, and each run is timed in proportion so the tip is steady.
 *    0ms  rest
 *   40ms  the bead starts back down the last rise; the trace erases behind it
 *  280ms  back at the first day, the trace gone (identity: screen, point)
 *  360ms  it sets off again, drawing: 470ms first joint, 550ms second
 *  720ms  arrives at today after the long climb
 *  780ms  flung .7 past it along the rise; the ring opens at today
 *  860ms  pulled back onto the end of the trace
 * 1000ms  exact rest
 * ────────────────────────────────────────────────────────── */
const D = 1000;
const J1 = 0.3287, J2 = 0.5823;
const P0 = { x: -8.8, y: 5.4 }, P1 = { x: -6, y: 2.2 }, P2 = { x: -3.4, y: 4.2 };
export const act = {
  body: `<rect class="f" style="--duo:.08" x="4" y="4" width="16" height="16" rx="3.5"/><path data-part="trend" pathLength="1" d="M7.2 15.2l2.8-3.2 2.6 2 3.4-4.2"/><circle class="s" data-part="last" cx="16" cy="9.8" r="1.2"/><circle class="ac" data-part="today" opacity="0" cx="16" cy="9.8" r="2.3" style="stroke-width:calc(var(--sw) * .7)"/>`,
  study: motion(D, 'Today\'s point runs back along your days and climbs to today again, drawing the trend behind it.', ['Run back', 'Climb', 'Today'], [
    actor('trend', '7.2px 15.2px', [
      trace(0, 1, ease.linear), trace(40, 1, ease.linear), trace(140, J2, ease.linear), trace(200, J1, ease.linear), trace(280, 0, ease.linear),
      trace(360, 0, ease.linear), trace(470, J1, ease.linear), trace(550, J2, ease.linear), trace(720, 1), trace(D, 1),
    ]),
    actor('last', '16px 9.8px', [
      pose(0, T(), ease.linear), pose(40, T(), ease.linear), pose(140, T(P2), ease.linear), pose(200, T(P1), ease.linear),
      pose(280, T(P0), ease.linear), pose(360, T(P0), ease.linear), pose(470, T(P1), ease.linear), pose(550, T(P2), ease.linear),
      pose(720, T(), ease.settle), pose(780, T({ x: 0.44, y: -0.54 }), ease.smooth), pose(860, T({ x: -0.06, y: 0.07 }), ease.settle), pose(D, T()),
    ]),
    actor('today', '16px 9.8px', [
      light(0, 0, 'scale(.5)'), light(710, 0, 'scale(.5)', ease.settle),
      light(770, 0.9, 'scale(.9)', ease.smooth), light(980, 0, 'scale(1.5)'), light(D, 0, 'scale(.5)'),
    ]),
  ]),
  shape: 'Screen 16 × 16 r3.5, tinted .08; trend of three segments ending in a 2.4 bead. Motion (study): the bead runs back down the trend to its first day, erasing it, then climbs again drawing it (the bead is always the drawn tip), is flung .7 past today along the last rise and pulled back; a ring opens at today.',
};
