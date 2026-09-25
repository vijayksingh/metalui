import { actor, ease, end, light, motion, parsePose, pose, T } from '../motion.mjs';

/* ── ARROW / point at something: the head is thrust at its mark ─
 * Verb, object   point at this. The tail is held where the arrow starts; the head is what
 *                you aim, and the shaft is always the distance between them.
 * Invariant      one straight diagonal with an open right-angle head at its top-right end;
 *                the direction never changes, the tail never moves, the head never turns.
 * Causal parts   cause: the head, drawn back and thrust along its line. Receiver: the shaft,
 *                shortening and stretching from its fixed tail so it stays joined to the head.
 *                Payoff: the head strikes its mark (its rest point) and compresses into
 *                its tip; three short rays open just beyond the tip.
 * Neighbours     not Line (no end handles, nothing dragged out), not Send (nothing leaves),
 *                not Arrow-up-right navigation (the tail is held, it is a drawn arrow).
 * Forbidden      the shaft bending (reshaping), a whole-icon pulse, the head spinning.
 *
 *    0ms  rest
 *  160ms  drawn back 2 along its line; the shaft shortens to .84 from the tail (anticipate)
 *  300ms  thrust: the head drives .3 into its mark and compresses into its tip (.8), contact
 *  350ms  the rays open beyond the tip, then widen a little and fade by 600
 *  430ms  it rebounds .7 back off the mark (1.04), the shaft with it
 *  590ms  a small correction forward
 *  800ms  exact rest
 * ────────────────────────────────────────────────────────── */

const SHAFT = 12.6; // tail 5.4,18.6 → shaft end 18,6 along each axis
const head = [
  pose(0, T(), ease.accelerate),
  pose(160, T({ x: -2, y: 2 }), ease.strike),
  pose(300, T({ x: .3, y: -.3, sx: .8, sy: .8 }), ease.smooth),
  pose(430, T({ x: -.7, y: .7, sx: 1.04, sy: 1.04 }), ease.smooth),
  pose(590, T({ x: .15, y: -.15, sx: .99, sy: .99 }), ease.settle),
  pose(800, T()),
];
// The shaft is scaled from its tail by exactly the head's travel along the line, frame for frame.
const shaft = head.map((f) => {
  const p = parsePose(f.transform), s = 1 + p.x / SHAFT;
  return { ...f, transform: T({ sx: s, sy: s }) };
});
const D = end(head);

export const act = {
  body: `<path data-part="shaft" d="M5.4 18.6C9.6 14.4 13.8 10.2 18 6"/><path data-part="head" d="M10.8 5.4h7.8v7.8"/><path class="ac" data-part="rays" opacity="0" d="M20.9 5.4h1M20.3 3.7l.7-.7M18.6 3.1V2.2" style="stroke-width:calc(var(--sw) * .7)"/>`,
  study: motion(D, 'The arrow is drawn back from its held tail and thrust at its mark; the head strikes, compresses into its tip, and rebounds.', ['Draw back', 'Thrust', 'Strike'], [
    actor('head', '18.6px 5.4px', head),
    actor('shaft', '5.4px 18.6px', shaft),
    actor('rays', '18.6px 5.4px', [
      light(0, 0, 'scale(.7)'), light(290, 0, 'scale(.7)', ease.settle),
      light(350, .9, 'scale(1)', ease.smooth), light(600, 0, 'scale(1.08)'), light(D, 0, 'scale(.7)'),
    ]),
  ]),
  shape: 'A corner-to-corner shaft (5.4,18.6 to 18,6; a cubic, straight) with an open right-angle head (7.8 legs) whose tip is 18.6,5.4, the same span as Line. Motion (study): the head draws back 2 along the line and is thrust into its mark, driving .3 past and compressing .8 into its tip; the shaft is scaled from its fixed tail by the same travel so it stays joined; three short rays open beyond the tip; it rebounds .7 and settles.',
};
