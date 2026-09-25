import { actor, ease, end, light, motion, pose, spring, T, trace } from '../motion.mjs';

/* ── CLOSE / cross it out, one stroke, then the other ─────────
 * Verb, object   dismiss this. A pen crosses the thing out: two diagonal strokes, in order.
 * Invariant      two strokes on fixed 45° diagonals; never turned, never scaled, never a
 *                plus. The second stroke stays whole while the first is re-marked, and
 *                each stroke keeps at least its first 30%, so an × is always on the page.
 * Causal parts   cause: the pen, marking the first diagonal top-left to bottom-right, then
 *                striking the second top-right to bottom-left through it. Receiver: the
 *                first stroke, knocked aside where the second crosses it. Payoff: an impact
 *                ring at the crossing, then both strokes' ends overshoot and settle.
 * Neighbours     not Plus (never upright), not Loading (no turn), not Clear/Erase (strokes
 *                are made, not wiped away).
 * Forbidden      shrink/grow of the whole ×, a spin, a scale pulse.
 *
 *    0ms  rest
 *  110ms  the first stroke's pen draws back up its own line (drawn .3)
 *  260ms  it strikes down to bottom-right and runs .5 past its end along the line
 *  230ms  the second stroke's pen draws back (drawn .3) as the first lands
 *  320ms  it strikes down to bottom-left, through the crossing by ~340, whole by 440
 *  350ms  the first stroke is knocked .8 along the second's travel; an impact ring opens
 *         at the crossing (peak 370)
 *  350ms+ the first recovers on the part spring; the second's .5 overrun recovers too
 *  754ms  exact rest
 * ────────────────────────────────────────────────────────── */
const k = 0.8 / Math.SQRT2; // the knock, along the second stroke's travel (down-left)
const o = 0.5 / Math.SQRT2; // a stroke's overrun along its own line
const knock = spring(350, { x: -k, y: k }, {}, 'part');
const run2 = spring(440, { x: -o, y: o }, {}, 'release');
const D = Math.max(end(knock), end(run2));
const fin = (frames) => (end(frames) === D ? frames : [...frames, pose(D, T())]);
export const act = {
  body: `<path data-part="x1" pathLength="1" d="M7.2 7.2l9.6 9.6"/><path data-part="x2" pathLength="1" d="M16.8 7.2l-9.6 9.6"/><circle class="ac" data-part="impact" opacity="0" cx="12" cy="12" r="2.8" style="stroke-width:calc(var(--sw) * .6)"/>`,
  study: motion(D, 'A pen crosses it out: the first stroke marks down, the second strikes through it, and the crossing takes the impact.', ['Mark', 'Cross out', 'Settle'], [
    actor('x1', '12px 12px', [
      { ...trace(0, 1, ease.accelerate), transform: T() },
      { ...trace(110, 0.3, ease.strike), transform: T() },
      { ...trace(260, 1, ease.smooth), transform: T({ x: o, y: o }) },
      { ...trace(325, 1, ease.strike), transform: T() },
      ...knock.map((f) => ({ ...f, draw: 1 })),
      ...(end(knock) === D ? [] : [{ ...pose(D, T()), draw: 1 }]),
    ]),
    actor('x2', '12px 12px', [
      { ...trace(0, 1, ease.linear), transform: T() },
      { ...trace(230, 1, ease.accelerate), transform: T() },
      { ...trace(320, 0.3, ease.strike), transform: T() },
      ...fin(run2).map((f) => ({ ...f, draw: 1 })),
    ]),
    actor('impact', '12px 12px', [
      light(0, 0, 'scale(.4)'), light(335, 0, 'scale(.4)', ease.settle),
      light(365, 1, 'scale(.8)', ease.smooth), light(490, 0, 'scale(1.2)'), light(D, 0, 'scale(.4)'),
    ]),
  ]),
  shape: 'X on the circle keyline, arms 13.6u, always at 45°: a turn is no motion for an ×, it reads as loading. Motion (study): crossed out in order. The first stroke draws back up its line and strikes down again, overrunning .5; the second does the same through it, knocking the first .8 along its travel at the crossing, where an impact ring opens; both settle on their springs.',
};
