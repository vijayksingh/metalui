import { actor, ease, light, motion, pose, T } from '../motion.mjs';

/* ── SEARCH / the lens sweeps across and stops on something ──
 * Verb, object   look for. The magnifier is held by the end of its handle and swung across
 *                the field; it stops where something is, and the glass catches the light.
 * Invariant      a round lens up-left, the handle down-right at 45°, one rigid tool; it turns
 *                about the grip (19.8, 19.8) and never past 10°.
 * Causal parts   cause: the hand at the grip. Receiver: the lens, swung across and stopped.
 *                Payoff: the focus pulls in inside the glass (a ring closes to the subject)
 *                and a glint crosses the glass, after the stop, not before.
 * Neighbours     not Zoom (the tool swings about its grip, it never travels along its axis
 *                and nothing inside it changes size), not a found tick (MOT-14: no result).
 * Forbidden      a spin, a back-and-forth wiggle, a scale pulse of the lens.
 *
 *    0ms  rest
 *  180ms  drawn back: the lens swings 6° up and right (anticipate)
 *  380ms  swept across to -10.5°, caught against the stop: rebounds to -6.3°, holds at -7°
 *  400ms  a focus ring closes from the rim onto the subject (r4.2 → r2 by 540ms), gone by 700ms
 *  500ms  then a glint crosses the glass, -40° → 50° about its centre, by 840ms
 *  760ms  held on the find, then swung home, .9° past rest at 960ms
 * 1120ms  exact rest
 * ────────────────────────────────────────────────────────── */
const BACK = 180, SWEEP = 380, HOME = 760;
const D = 1120;

export const act = {
  body: `<g data-part="tool"><circle cx="10.6" cy="10.6" r="6.3"/><path d="M15.2 15.2 19.8 19.8"/>` +
    `<circle class="ac" data-part="focus" opacity="0" cx="10.6" cy="10.6" r="2" style="stroke-width:calc(var(--sw) * .6)"/>` +
    `<path class="ac" data-part="glint" opacity="0" d="M7.6 9.1a3.4 3.4 0 0 1 1.6-1.6" style="stroke-width:calc(var(--sw) * .8)"/></g>`,
  study: motion(D, 'The lens is swept across the field and stops; the focus closes in and a glint crosses the glass.', ['Draw back', 'Sweep', 'Find'], [
    actor('tool', '19.8px 19.8px', [
      pose(0, T(), ease.smooth),
      pose(BACK, T({ r: 6 }), ease.strike),
      // caught against the stop: one small rebound, then held on the find
      pose(SWEEP, T({ r: -10.5 }), ease.smooth),
      pose(SWEEP + 100, T({ r: -6.3 }), ease.smooth),
      pose(SWEEP + 200, T({ r: -7.3 }), ease.settle),
      pose(HOME, T({ r: -7 }), ease.smooth),
      // swung home, a light overshoot past rest, settled
      pose(HOME + 200, T({ r: 0.9 }), ease.smooth),
      pose(D, T()),
    ]),
    actor('focus', '10.6px 10.6px', [
      light(0, 0, 'scale(2.1)'), light(SWEEP + 20, 0, 'scale(2.1)', ease.settle),
      light(SWEEP + 160, 0.85, 'scale(1)', ease.smooth), light(700, 0, 'scale(.8)'), light(D, 0, 'scale(2.1)'),
    ]),
    actor('glint', '10.6px 10.6px', [
      light(0, 0, 'rotate(-40deg)'), light(SWEEP + 120, 0, 'rotate(-40deg)', ease.smooth),
      light(SWEEP + 240, 0.75, 'rotate(5deg)', ease.smooth), light(840, 0, 'rotate(50deg)'), light(D, 0, 'rotate(-40deg)'),
    ]),
  ]),
  shape: 'Circle keyline lens r6.3; handle 45°. Motion (study): the tool turns about its grip (19.8, 19.8): drawn back 6°, swept to -10.5° and caught at -7° with one rebound; a focus ring closes from r4.2 onto a r2 subject and a glint arc (r3.4) crosses the glass; swung home with a light overshoot.',
};
