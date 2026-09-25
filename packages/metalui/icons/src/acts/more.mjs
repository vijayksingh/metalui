import { actor, ease, end, light, motion, pose, spring, T } from '../motion.mjs';

/* ── MORE / a knock runs down the row and carries on ──────────
 * Verb, object   there is more. An ellipsis says the row continues past its last dot, so
 *                the act is a knock that travels along the row and leaves by its far end.
 * Invariant      three equal dots on one line, left to right; none leaves its line, the
 *                row's order never changes, the first and last never cross the 2–22 area.
 * Causal parts   cause: the first dot drawn back and struck into the row (it squashes on
 *                contact). Receiver: the middle dot, compressed as the knock passes through.
 *                Payoff: the last dot kicked out to the right, and a ring where it stood.
 * Neighbours     not Loading (it runs once, left to right, and stops), not Drag handle
 *                (dots never gather), not Typing (no rising wave).
 * Forbidden      a looped wave, a swell of all three, a bounce.
 *
 *    0ms  rest
 *  160ms  the first dot draws back 2 left
 *  250ms  strikes back into its place and squashes (.8 wide, 1.16 tall) against the row
 *  280ms  the middle dot takes the knock (.86, 1.1) and passes it on
 *  300ms  the last dot leaves right, stretched along the kick; a ring opens where it stood
 *  320ms  the first two rebound slightly the other way (70 ms after contact), round by 100 later
 *  430ms  the last dot is out 2 to the right
 *  430ms+ the last dot swings back on the object spring, a small overshoot into the row
 * 1143ms  exact rest
 * ────────────────────────────────────────────────────────── */
// Contact squash recovers fast (a hard bead), with one small rebound: hand-authored.
const knocked = (at, sx, sy) => [pose(at, T({ sx, sy }), ease.smooth), pose(at + 70, T({ sx: 1 + (1 - sx) * 0.3, sy: 1 - (sy - 1) * 0.3 }), ease.settle), pose(at + 170, T())];
const d1 = knocked(250, 0.8, 1.16);
const d2 = knocked(285, 0.86, 1.1);
const d3 = spring(430, { x: 2 }, {}, 'object');
const D = Math.max(end(d1), end(d2), end(d3));
const hold = (frames) => (end(frames) === D ? frames : [...frames, pose(D, T())]);
export const act = {
  body: `<circle class="s" data-part="m1" cx="5.6" cy="12" r="1.55"/><circle class="s" data-part="m2" cx="12" cy="12" r="1.55"/><circle class="s" data-part="m3" cx="18.4" cy="12" r="1.55"/><circle class="ac" data-part="knock" opacity="0" cx="18.4" cy="12" r="2.4" style="stroke-width:calc(var(--sw) * .6)"/>`,
  study: motion(D, 'The first dot is struck into the row; the knock runs through and kicks the last one out: there is more.', ['Draw back', 'Knock', 'Carry on'], [
    actor('m1', '5.6px 12px', [
      pose(0, T(), ease.smooth),
      pose(160, T({ x: -2 }), ease.accelerate),
      ...hold(d1),
    ]),
    actor('m2', '12px 12px', [
      pose(0, T(), ease.linear),
      pose(250, T(), ease.strike),
      ...hold(d2),
    ]),
    actor('m3', '18.4px 12px', [
      pose(0, T(), ease.linear),
      pose(285, T(), ease.strike),
      pose(330, T({ x: 0.6, sx: 1.12, sy: 0.9 }), ease.settle),
      ...hold(d3),
    ]),
    actor('knock', '18.4px 12px', [
      light(0, 0, 'scale(.4)'), light(290, 0, 'scale(.4)', ease.settle),
      light(330, 0.85, 'scale(.8)', ease.smooth), light(580, 0, 'scale(1.4)'), light(D, 0, 'scale(.4)'),
    ]),
  ]),
  shape: 'Three r1.55 dots on 6.4u pitch. Motion (study): a Newton\'s-cradle knock. The first dot draws back 2 and strikes into place, squashing against the row; the middle dot compresses as the knock passes; the last is kicked 2 right, stretched along the kick, with a ring opening where it stood, and swings back on the object spring.',
};
