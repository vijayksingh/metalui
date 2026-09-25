import { actor, ease, end, light, motion, pose, spring, T, trace } from '../motion.mjs';

/* ── REDO / the hook is cast forward one step ─────────────────
 * Verb, object   do that again. Undo's hook, mirrored: the line is the history, the head
 *                is where it goes, and this time it goes forward.
 * Geometry       the legacy entry mirrored Undo with a static matrix on a group; a moving
 *                part may not sit under a static transform, so the mirror is baked into
 *                these paths (x → 24 − x, the arc's sweep flipped). Same contour.
 * Invariant      a hooked arrow whose head points right; it only turns about the hook's
 *                own centre (9.4, 13.6), never past 16°, and its head never detaches.
 * Causal parts   cause: the hook wound back, then whipped forward about its centre.
 *                Receiver: the line's tail, reeled up into the curve by the whip, then paid
 *                back out as it settles. Payoff: the head's echo carried on right, a step on.
 * Neighbours     not Undo (turns the other way, head left), not Refresh (never a full turn),
 *                not Forward/Send (the head never flies off).
 * Forbidden      a spin, a wiggle, a scale pulse.
 *
 *    0ms  rest
 *  150ms  winds back −7° about the hook centre (head lifts left), the tail tight
 *  330ms  whips forward to 16°, head leading down-right; the tail reels in to .74
 *  350ms  the echo of the head leaves the tip and carries on 2.4 further right, fading
 *  400ms  held at the step (15°)
 *  400ms+ returns on the part spring, one small overshoot; the tail pays back out (430–720)
 * 1010ms  exact rest
 * ────────────────────────────────────────────────────────── */
const back = spring(400, { r: 15 }, {}, 'part', { still: 0.5 });
const D = end(back);
export const act = {
  body: `<g data-part="hook"><path d="M15 5.3 18.7 9 15 12.7"/><path data-part="line" pathLength="1" d="M18.7 9H9.4a4.6 4.6 0 0 0 0 9.2h4"/><path class="ac" data-part="echo" opacity="0" d="M15 5.3 18.7 9 15 12.7" style="stroke-width:calc(var(--sw) * .7)"/></g>`,
  study: motion(D, 'The hook winds back, whips forward about its centre and reels its tail in; the head\'s echo carries on, a step on.', ['Wind', 'Cast forward', 'Pay out'], [
    actor('hook', '9.4px 13.6px', [
      pose(0, T(), ease.smooth),
      pose(150, T({ r: -7 }), ease.strike),
      pose(330, T({ r: 16 }), ease.smooth),
      ...back,
    ]),
    actor('line', '18.7px 9px', [
      trace(0, 1), trace(150, 1, ease.strike), trace(330, 0.74, ease.linear),
      trace(430, 0.74, ease.settle), trace(720, 1), trace(D, 1),
    ]),
    actor('echo', '18.7px 9px', [
      light(0, 0, T()), light(310, 0, T(), ease.smooth),
      light(350, 0.9, T({ x: 1.1 }), ease.settle), light(560, 0, T({ x: 2.4 })), light(D, 0, T()),
    ]),
  ]),
  shape: 'Undo mirrored on x, baked into the paths: arc r4.6 about (9.4, 13.6). Motion (study): the hook winds back 7° about the arc centre, whips forward to 16° while the tail reels up into the curve (draw .74), an echo of the head carries on 2.4 right; it returns on the part spring and the tail pays back out.',
};
