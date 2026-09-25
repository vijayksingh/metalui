import { actor, ease, end, light, motion, pose, spring, T } from '../motion.mjs';

/* ── ZOOM IN / the lens is pushed in and the plus is magnified ──
 * Verb, object   magnify. The magnifier is pushed along its handle toward the subject, and
 *                what is under the glass grows because the glass came closer.
 * Invariant      lens up-left, handle at 45°, plus upright in the lens (turned it would pass
 *                through ×, clear); the plus never outgrows the glass (arms ≤ 6.3 of 10.9).
 * Causal parts   cause: the hand pushes the tool along its axis. Receiver: the plus, which
 *                is magnified a beat after the lens arrives (optics follow the glass).
 *                Payoff: four marks between the arms are thrown outward as the view widens.
 * Neighbours     not Search (the tool travels along its axis, it doesn't swing about the grip),
 *                not Zoom Out (it pushes in and the sign grows), not Add (the plus is inside
 *                a lens and never moves by itself).
 * Forbidden      a scale pulse of the whole icon, a turning plus, a spin.
 *
 *    0ms  rest
 *  160ms  drawn back .6 down the handle axis; the plus eases to .94 (anticipate)
 *  350ms  pushed in 1.2 up the axis and stopped (part spring, one small rebound)
 *  390ms  the plus is magnified to 1.34, then holds at 1.3 on the part spring
 *  400ms  four marks between the arms are thrown outward along the diagonals, gone by 700ms
 *  720ms  released: the tool slides home and the plus comes back to 1 with it
 * 1140ms  exact rest
 * ────────────────────────────────────────────────────────── */
const BACK = 160, PUSH = 350, MAG = 390, LET = 720, D = 1140;
const IN = { x: -1.2, y: -1.2 };

const pushed = spring(PUSH, { x: -1.45, y: -1.45 }, IN, 'part');
const magnified = spring(MAG, { sx: 1.36, sy: 1.36 }, { sx: 1.3, sy: 1.3 }, 'part', { still: 0.05 });
const upTo = (frames, t) => frames.filter((f) => f.at < t);

export const act = {
  body: `<g data-part="tool"><circle cx="10.6" cy="10.6" r="6.3"/><path d="M15.2 15.2 19.8 19.8"/>` +
    `<g data-part="sign"><path d="M8.2 10.6h4.8M10.6 8.2v4.8"/></g>` +
    `<path class="ac" data-part="throw" opacity="0" d="M13.15 8.05l.5-.5M13.15 13.15l.5.5M8.05 13.15l-.5.5M8.05 8.05l-.5-.5" style="stroke-width:calc(var(--sw) * .75)"/></g>`,
  study: motion(D, 'The lens is pushed in along its handle and the plus under it is magnified.', ['Draw back', 'Push in', 'Magnify'], [
    actor('tool', '19.8px 19.8px', [
      pose(0, T(), ease.smooth),
      pose(BACK, T({ x: 0.6, y: 0.6 }), ease.strike),
      ...upTo(pushed, LET),
      pose(LET, T(IN), ease.smooth),
      pose(LET + 240, T({ x: 0.2, y: 0.2 }), ease.smooth),
      pose(D, T()),
    ]),
    actor('sign', '10.6px 10.6px', [
      pose(0, T(), ease.smooth),
      pose(BACK, T({ sx: 0.94, sy: 0.94 }), ease.accelerate),
      pose(PUSH, T({ sx: 1.05, sy: 1.05 }), ease.strike),
      ...upTo(magnified, LET + 40),
      pose(LET + 40, T({ sx: 1.3, sy: 1.3 }), ease.smooth),
      pose(LET + 300, T({ sx: 0.97, sy: 0.97 }), ease.smooth),
      pose(D, T()),
    ]),
    actor('throw', '10.6px 10.6px', [
      light(0, 0, 'scale(1)'), light(MAG, 0, 'scale(1)', ease.settle),
      light(MAG + 70, 0.85, 'scale(1.15)', ease.smooth), light(700, 0, 'scale(1.2)'), light(D, 0, 'scale(1)'),
    ]),
  ]),
  shape: 'Search lens + plus (4.8u arms), the plus always upright: turned, it passes through ×, "clear". Motion (study): the tool draws back .6 down its handle axis, is pushed in 1.2 up it and stopped with a small rebound; the plus, a beat behind, is magnified to 1.3 (part spring); four diagonal marks are thrown outward between the arms; released, all slide home.',
};
