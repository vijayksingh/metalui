import { actor, ease, light, motion, pose, T, trace } from '../motion.mjs';

/* ── NOTE / lift the corner, jot the lines, fold it back ───────
 * Verb, object   take a note. The dog-ear is a real flap on its crease: it peels open,
 *                the lines are written fresh, and it is pressed back down.
 * Invariant      the rounded sheet and its corner cut never move; the flap stays hinged on
 *                the crease (it foreshortens across it, never slides or shrinks toward a point);
 *                the two lines keep their left margin.
 * Causal parts   cause: the flap, hinged on the crease 14.2,20.5 → 20.5,14.2. Receiver: the
 *                lines under it, written left to right. Payoff: the flap slaps flat and a
 *                crease mark flicks off the corner.
 * Neighbours     not File (no page turn, the sheet stays), not Edit/Pen (no tool appears),
 *                not Text (the lines are handwriting, not a glyph).
 * Forbidden      a sheet swell, a wobble, lines blinking, the flap spinning.
 *
 *  Mechanics: the flap is two nested parts on the crease midpoint. `flap` turns −45° and
 *  scales its local y (across the crease); `crease` turns +45° inside it. At scale 1 the two
 *  turns cancel exactly, so they are set in the first 20 ms and undone in the last 20 ms
 *  unseen; in between the flap only foreshortens across its crease (1 → −.9 = peeled open).
 *
 *    0ms  rest
 *   20ms  (the crease frame is set; nothing visible changes)
 *   40ms  line one wipes back to the margin by 200ms (the corner is lifting)
 *  160ms  line two starts wiping; one line is always on the sheet
 *  240ms  line one is written again, left to right, done at 440ms
 *  260ms  the corner is peeled open past its crease to −.9
 *  420ms  line two is written again, done at 580ms
 *  560ms  the flap is let go, falls (accelerating) and slaps flat at 680ms, 1.1 into the page
 *  690ms  the crease mark flicks off the corner and fades
 *  800ms  the flap rebounds .95, 900ms 1.02, 980ms flat
 * 1000ms  exact rest
 * ────────────────────────────────────────────────────────── */
const D = 1000;
const R = -45;

export const act = {
  body: `<path d="M20.5 14.2V7A3.5 3.5 0 0 0 17 3.5H7A3.5 3.5 0 0 0 3.5 7v10A3.5 3.5 0 0 0 7 20.5h7.2Z"/><g data-part="flap"><g data-part="crease"><path class="f" style="--duo:.2" d="M14.2 20.5v-3.9a2.4 2.4 0 0 1 2.4-2.4h3.9Z"/></g></g><path data-part="line1" pathLength="1" d="M7.6 8.6h8.8"/><path data-part="line2" pathLength="1" d="M7.6 12.2h4.8"/><path class="ac" data-part="slap" opacity="0" d="M18.4 21.1 21.1 18.4" style="stroke-width:calc(var(--sw) * .7)"/>`,
  study: motion(D, 'The corner peels open, the lines are written fresh, and the corner is pressed back down.', ['Peel', 'Write', 'Fold'], [
    actor('flap', '17.35px 17.35px', [
      pose(0, T(), ease.linear),
      pose(20, T({ r: R }), ease.smooth),
      pose(260, T({ r: R, sy: -0.9 }), ease.smooth),
      pose(560, T({ r: R, sy: -0.82 }), ease.accelerate),
      pose(680, T({ r: R, sy: 1.1 }), ease.smooth),
      pose(800, T({ r: R, sy: 0.95 }), ease.smooth),
      pose(900, T({ r: R, sy: 1.02 }), ease.settle),
      pose(980, T({ r: R }), ease.linear),
      pose(D, T()),
    ]),
    actor('crease', '17.35px 17.35px', [
      pose(0, T(), ease.linear), pose(20, T({ r: -R }), ease.linear), pose(980, T({ r: -R }), ease.linear), pose(D, T()),
    ]),
    actor('line1', '7.6px 8.6px', [
      trace(0, 1), trace(40, 1, ease.accelerate), trace(200, 0, ease.linear), trace(240, 0, ease.smooth), trace(440, 1, ease.linear), trace(D, 1),
    ]),
    actor('line2', '7.6px 12.2px', [
      trace(0, 1), trace(160, 1, ease.accelerate), trace(300, 0, ease.linear), trace(420, 0, ease.smooth), trace(580, 1, ease.linear), trace(D, 1),
    ]),
    actor('slap', '19.75px 19.75px', [
      light(0, 0, T({ x: -0.6, y: -0.6 })), light(670, 0, T({ x: -0.6, y: -0.6 }), ease.settle),
      light(700, 0.9, T({ x: -0.3, y: -0.3 }), ease.smooth), light(900, 0, T({ x: 0.5, y: 0.5 })), light(D, 0, T({ x: -0.6, y: -0.6 })),
    ]),
  ]),
  shape: 'Rounded square r3.5 with a diagonal corner cut and a folded flap (duo .2) in the cut. Motion (study): the flap is hinged on its crease (two nested parts whose ±45° turns cancel at scale 1, so it foreshortens only across the crease): it peels open to −.9 while the lines wipe back, the lines are written again, and the flap falls and slaps flat (1.1, then .95, 1.02) with a crease mark flicking off the corner.',
};
