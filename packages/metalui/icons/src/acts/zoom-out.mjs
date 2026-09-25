import { actor, ease, light, motion, pose, spring, T } from '../motion.mjs';

/* ── ZOOM OUT / the lens is pulled back and the view recedes ──
 * Verb, object   reduce magnification. The magnifier is drawn back along its handle, away
 *                from the subject; what is under the glass gets smaller because the glass
 *                went further away, and the old field of view shrinks inside it.
 * Invariant      lens up-left, handle at 45°, the minus level in the lens; the tool never
 *                leaves its axis and the handle end stays inside 21.
 * Causal parts   cause: the hand pulls the tool down its axis. Receiver: the minus, which
 *                shrinks a beat after the lens (optics follow the glass). Payoff: the
 *                corners of the old view appear at the rim and close in around it.
 * Neighbours     not Zoom In (pulled back, the sign shrinks, the marks close inward),
 *                not Search (no swing about the grip), not Remove (the minus never leaves).
 * Forbidden      a scale pulse of the whole icon, the minus sliding out, a spin.
 *
 *    0ms  rest
 *  150ms  eased in .5 up the handle axis; the minus grows to 1.06 (anticipate)
 *  360ms  pulled back 1.3 down the axis, caught at 1.1 (part spring)
 *  400ms  the minus recedes to .66 with a small rebound, held at .7
 *  400ms  the old view's corners appear at the rim (1.2) and close to .8 by 700ms, fading
 *  720ms  released: the tool slides home and the minus comes back with it
 * 1140ms  exact rest
 * ────────────────────────────────────────────────────────── */
const PREP = 150, PULL = 360, SHRINK = 400, LET = 720, D = 1140;
const OUT = { x: 1.1, y: 1.1 };
const pulled = spring(PULL, { x: 1.3, y: 1.3 }, OUT, 'part');
const receded = spring(SHRINK, { sx: 0.66, sy: 0.66 }, { sx: 0.7, sy: 0.7 }, 'part', { still: 0.05 });
const upTo = (frames, t) => frames.filter((f) => f.at < t);

export const act = {
  body: `<g data-part="tool"><circle cx="10.6" cy="10.6" r="6.3"/><path d="M15.2 15.2 19.8 19.8"/>` +
    `<g data-part="sign"><path d="M8.2 10.6h4.8"/></g>` +
    `<path class="ac" data-part="field" opacity="0" d="M7.4 8.3v-.9h.9M12.9 7.4h.9v.9M13.8 12.9v.9h-.9M8.3 13.8h-.9v-.9" style="stroke-width:calc(var(--sw) * .6)"/></g>`,
  study: motion(D, 'The lens is drawn back along its handle; the minus recedes and the old view closes in.', ['Ease in', 'Pull back', 'Recede'], [
    actor('tool', '19.8px 19.8px', [
      pose(0, T(), ease.smooth),
      pose(PREP, T({ x: -0.5, y: -0.5 }), ease.strike),
      ...upTo(pulled, LET),
      pose(LET, T(OUT), ease.smooth),
      pose(LET + 240, T({ x: -0.2, y: -0.2 }), ease.smooth),
      pose(D, T()),
    ]),
    actor('sign', '10.6px 10.6px', [
      pose(0, T(), ease.smooth),
      pose(PREP, T({ sx: 1.06, sy: 1.06 }), ease.accelerate),
      pose(PULL, T({ sx: 0.92, sy: 0.92 }), ease.strike),
      ...upTo(receded, LET + 40),
      pose(LET + 40, T({ sx: 0.7, sy: 0.7 }), ease.smooth),
      pose(LET + 300, T({ sx: 1.03, sy: 1.03 }), ease.smooth),
      pose(D, T()),
    ]),
    actor('field', '10.6px 10.6px', [
      light(0, 0, 'scale(1.2)'), light(SHRINK - 20, 0, 'scale(1.2)', ease.settle),
      light(SHRINK + 80, 0.85, 'scale(1.05)', ease.smooth), light(700, 0, 'scale(.8)'), light(D, 0, 'scale(1.2)'),
    ]),
  ]),
  shape: 'Search lens + minus. Motion (study): the tool eases in .5 up its handle axis, is pulled back 1.3 down it and caught at 1.1 (part spring); the minus, a beat behind, recedes to .7; the corners of the old view appear at the rim and close in as they fade; released, all slide home.',
};
