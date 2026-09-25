import { actor, ease, end, light, motion, pose, spring, T, trace } from '../motion.mjs';

/* ── UNDO / the hook is reeled back one step ──────────────────
 * Verb, object   take that back. The line is the history; the head is where it goes.
 * Invariant      a hooked arrow whose head points left; it only turns about the hook's
 *                own centre (14.6, 13.6), never past 16°, and its head never detaches.
 * Causal parts   cause: the hook wound forward, then whipped back about its centre.
 *                Receiver: the line's tail, reeled up into the curve by the whip, then paid
 *                back out as it settles. Payoff: the head's echo carried on left, a step back.
 * Neighbours     not Redo (turns the other way, head right), not Refresh/Retry (never a full
 *                turn, no circle), not Reply (the tail is reeled, the head never flies off).
 * Forbidden      a spin, a wiggle, a scale pulse.
 *
 *    0ms  rest
 *  150ms  winds forward 7° about the hook centre (head lifts right), the tail tight
 *  330ms  whips back to −16°, head leading down-left; the tail reels in to .74
 *  350ms  the echo of the head leaves the tip and carries on 2.4 further left, fading
 *  400ms  held at the step (−15°)
 *  400ms+ returns on the part spring, one small overshoot; the tail pays back out (430–720)
 * 1010ms  exact rest
 * ────────────────────────────────────────────────────────── */
const back = spring(400, { r: -15 }, {}, 'part', { still: 0.5 });
const D = end(back);
export const act = {
  body: `<g data-part="hook"><path d="M9 5.3 5.3 9 9 12.7"/><path data-part="line" pathLength="1" d="M5.3 9h9.3a4.6 4.6 0 0 1 0 9.2h-4"/><path class="ac" data-part="echo" opacity="0" d="M9 5.3 5.3 9 9 12.7" style="stroke-width:calc(var(--sw) * .7)"/></g>`,
  study: motion(D, 'The hook winds forward, whips back about its centre and reels its tail in; the head\'s echo carries on, a step back.', ['Wind', 'Reel back', 'Pay out'], [
    actor('hook', '14.6px 13.6px', [
      pose(0, T(), ease.smooth),
      pose(150, T({ r: 7 }), ease.strike),
      pose(330, T({ r: -16 }), ease.smooth),
      ...back,
    ]),
    actor('line', '5.3px 9px', [
      trace(0, 1), trace(150, 1, ease.strike), trace(330, 0.74, ease.linear),
      trace(430, 0.74, ease.settle), trace(720, 1), trace(D, 1),
    ]),
    actor('echo', '5.3px 9px', [
      light(0, 0, T()), light(310, 0, T(), ease.smooth),
      light(350, 0.9, T({ x: -1.1 }), ease.settle), light(560, 0, T({ x: -2.4 })), light(D, 0, T()),
    ]),
  ]),
  shape: 'Hook arrow, arc r4.6 about (14.6, 13.6). Motion (study): the hook winds forward 7° about the arc centre, whips back to −16° while the tail reels up into the curve (draw .74), an echo of the head carries on 2.4 left; it returns on the part spring and the tail pays back out.',
};
