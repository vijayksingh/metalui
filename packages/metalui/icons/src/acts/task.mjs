import { actor, ease, light, motion, pose, T, trace } from '../motion.mjs';

/* ── TASK / the box is pressed, and comes back up ticked ──────
 * Verb, object   mark it done. The item is a physical checkbox: pressing it writes the tick.
 * Invariant      a rounded box with its tick; the box never leaves its footprint by more
 *                than 1 and never turns; the tick only ever lives inside it.
 * Causal parts   cause: the press, squashing the box down onto its base. Receiver: the tick,
 *                cleared as the box goes down and written back in while it is held (short
 *                leg, a beat at the corner, a flick up the long leg). Payoff: released, the
 *                box springs up past rest and its rim clicks (an outline echo leaves it).
 * Neighbours     not Check (a box, and the tick is caused by the press), not Plus (nothing
 *                is inserted), not a checkbox toggling off (it always ends ticked).
 * Forbidden      a scale pulse of the whole icon, a bounce, a wiggle.
 *
 *    0ms  rest
 *  100ms  pressing: the tick clears
 *  150ms  the box bottoms out: 1 down at its top, .92 tall, 1.03 wide, about its base
 *  160ms  held; the tick is written: short leg to 230, a beat at the corner, flick to 330
 *  330ms  released: the box snaps up past rest (400: 1.05 tall), rings once (500), settles
 *  400ms  the rim clicks: a thin outline springs off 1.2 out and widens as it fades (by 600)
 *  720ms  exact rest
 * ────────────────────────────────────────────────────────── */
// Released, a stiff key cap snaps up past rest and rings once: hand-authored, quicker than
// the part spring would carry a .92 squash (that would read as a slow inflate).
const D = 720;
const pop = [
  pose(330, T({ sx: 1.03, sy: 0.92 }), ease.strike),
  pose(400, T({ sx: 0.985, sy: 1.05 }), ease.smooth),
  pose(500, T({ sx: 1.006, sy: 0.985 }), ease.smooth),
  pose(600, T({ sx: 1, sy: 1.004 }), ease.settle),
  pose(D, T()),
];
export const act = {
  body: `<g data-part="box"><rect class="f" style="--duo:.12" x="5" y="5" width="14" height="14" rx="3.5"/><path data-part="tick" pathLength="1" d="M8.7 12.2l2.3 2.3 4.4-4.9"/><rect class="ac" data-part="rim" opacity="0" x="5" y="5" width="14" height="14" rx="3.5" style="stroke-width:calc(var(--sw) * .45)"/></g>`,
  study: motion(D, 'The box is pressed down; while it is held the tick is written, and released it springs back up with a click.', ['Press', 'Write', 'Release'], [
    actor('box', '12px 19px', [
      pose(0, T(), ease.accelerate),
      pose(150, T({ sx: 1.03, sy: 0.92 }), ease.linear),
      ...pop,
    ]),
    actor('tick', '11px 14.5px', [
      { ...trace(0, 1, ease.smooth), opacity: 1 },
      { ...trace(100, 1, ease.linear), opacity: 0 },
      { ...trace(110, 0, ease.linear), opacity: 0 },
      { ...trace(160, 0, ease.smooth), opacity: 1 },
      { ...trace(230, 0.33, ease.linear), opacity: 1 },
      { ...trace(255, 0.33, ease.strike), opacity: 1 },
      { ...trace(330, 1, ease.linear), opacity: 1 },
      { ...trace(D, 1), opacity: 1 },
    ]),
    actor('rim', '12px 12px', [
      light(0, 0, 'scale(1.14)'), light(395, 0, 'scale(1.14)', ease.settle),
      light(430, 0.85, 'scale(1.2)', ease.smooth), light(600, 0, 'scale(1.29)'), light(D, 0, 'scale(1.14)'),
    ]),
  ]),
  shape: 'Dimple 14 × 14 r3.5, tinted .12, with the check tick at the size of the box. Motion (study): completion by the item itself. The box is pressed down about its base (.92 tall, 1.03 wide) and the tick clears; held, the tick is written back in from the short leg with a beat at the corner; released, the box snaps up past rest and rings once and an outline of its rim clicks off it.',
};
