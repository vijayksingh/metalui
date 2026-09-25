import { actor, ease, light, motion, pose, spring, T, trace } from '../motion.mjs';

/* ── REGION / a frame is set down and its name is written in ─
 * Verb, object   mark out an area and name it. The frame is the area; the head carries its name.
 * Invariant      a rounded frame with a head rule across its top; the frame never tilts, and it
 *                never leaves its footprint by more than 1.4 up.
 * Causal parts   cause: the frame landing on the canvas (squash about its bottom edge).
 *                Receiver: the empty head. Payoff: the name writes in left to right behind a caret,
 *                and the caret blinks once at the end of the word.
 * Neighbours     not Calendar (no rings, no page), not Document (no fold), not a card being dragged.
 * Forbidden      a whole-icon pulse, a stretch of the name (the old scaleX), a bounce loop.
 *
 *    0ms  rest
 *  150ms  the frame lifts 1.4 off the canvas; the name erases right to left as it goes
 *  290ms  the frame lands, squashed .92 about its bottom edge, and widens 1.04
 *  330ms  the caret appears at the head of the empty name line
 *  360ms  the name writes on behind the caret (object spring settles the frame meanwhile)
 *  640ms  name complete; the caret sits at its end
 *  720ms  the caret blinks off (720–740), back on (800–820), and fades out by 960
 * 1040ms  exact rest
 * ────────────────────────────────────────────────────────── */
const D = 1040;
export const act = {
  body: `<g data-part="frame"><rect class="f" style="--duo:.08" x="3.5" y="5" width="17" height="14" rx="3.5"/><path d="M3.5 9.6h17"/><path data-part="name" pathLength="1" d="M6.8 7.3h3.6"/><path class="ac" data-part="caret" opacity="0" d="M10.4 6.1v2.4" style="stroke-width:calc(var(--sw) * .7)"/></g>`,
  study: motion(D, 'The frame is set down on the canvas, and its name writes into the head behind a caret.', ['Lift', 'Land', 'Name'], [
    actor('frame', '12px 19px', [
      pose(0, T(), ease.settle),
      pose(150, T({ y: -1.4 }), ease.accelerate),
      ...spring(290, { sx: 1.04, sy: 0.92 }, {}, 'object'),
      pose(D, T()),
    ]),
    actor('name', '6.8px 7.3px', [
      trace(0, 1, ease.smooth), trace(170, 0, ease.linear), trace(360, 0, ease.smooth), trace(640, 1), trace(D, 1),
    ]),
    actor('caret', '10.4px 7.3px', [
      light(0, 0, 'translate(-3.6px,0px)'), light(320, 0, 'translate(-3.6px,0px)', ease.settle),
      light(360, 1, 'translate(-3.6px,0px)', ease.smooth), light(640, 1, 'translate(0px,0px)'),
      light(720, 1, 'translate(0px,0px)', ease.linear), light(740, 0, 'translate(0px,0px)', ease.linear),
      light(800, 0, 'translate(0px,0px)', ease.linear), light(820, 1, 'translate(0px,0px)', ease.linear),
      light(900, 1, 'translate(0px,0px)', ease.smooth), light(960, 0, 'translate(0px,0px)'), light(D, 0, 'translate(-3.6px,0px)'),
    ]),
  ]),
  shape: 'Frame 17 × 14 r3.5, tinted .08; head rule on the 9.6 line; the name a 3.6 wire in the head. Motion (study): the frame lifts 1.4 and lands on its bottom edge (squash .92, object spring) while the name erases, then the name writes back in behind a caret that blinks once at its end.',
};
