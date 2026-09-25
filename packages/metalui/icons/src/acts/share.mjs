import { actor, ease, light, motion, pose, spring, T } from '../motion.mjs';

/* ── SHARE / the arrow is sent out of the tray, and the next one rises ───
 * Verb, object   send this out. The tray is what you have; the arrow is what leaves it.
 * Invariant      an open tray with an upright arrow over its mouth, pointing up; the arrow
 *                never tilts and never turns into a download (it only ever travels up).
 * Causal parts   cause: the arrow crouching into the tray and pushing off its floor.
 *                Receiver: the tray, pressed down by the push, springing back.
 *                Payoff: two puffs of air at the tray's mouth as the arrow clears it.
 * Neighbours     not Upload (no bar to reach), not Download (never travels down while
 *                visible), not a bounce (it leaves; a new one rises from inside).
 * Forbidden      a whole-icon lift, a scale pulse, a wiggle.
 *
 *    0ms  rest
 *  160ms  the arrow crouches 1.3 into the tray, squashed .86 along its shaft; the tray
 *         floor gives (.95 from its base)
 *  250ms  push-off: the arrow springs up 1.6, stretched 1.07; the tray rebounds on its
 *         part spring; the puffs open at the mouth (270)
 *  270ms  the next arrow (an accent) starts up from 4.2 deep inside the tray
 *  360ms  the sent arrow is gone past the top (2.8 up, faded out); the next is rising
 *  500ms  the next arrow rises 0.6 past rest, 590 dips .15, 650 lands at rest
 *  650ms  the part takes over from the accent at the identical pose (no visible swap)
 *  900ms  the tray's spring is spent; exact rest
 * ────────────────────────────────────────────────────────── */
export const act = {
  body: `<g data-part="tray"><path d="M8.4 9.6H7.4A2.4 2.4 0 0 0 5 12v5.6a2.4 2.4 0 0 0 2.4 2.4h9.2a2.4 2.4 0 0 0 2.4-2.4V12a2.4 2.4 0 0 0-2.4-2.4h-1"/></g><g data-part="arrow"><path d="M12 14.2V3.9M8.9 7 12 3.9 15.1 7"/></g><path class="ac" data-part="next" opacity="0" d="M12 14.2V3.9M8.9 7 12 3.9 15.1 7"/><path class="ac" data-part="puff" opacity="0" d="M9.9 9.2 8.7 8M14.1 9.2 15.3 8" style="stroke-width:calc(var(--sw) * .7)"/>`,
  study: motion(900, 'The arrow crouches into the tray, pushes off and leaves; the next one rises in its place.', ['Crouch', 'Send', 'Rise again'], [
    actor('arrow', '12px 14.2px', [
      { ...pose(0, T(), ease.accelerate), opacity: 1 },
      { ...pose(160, T({ y: 1.3, sy: 0.86 }), ease.strike), opacity: 1 },
      { ...pose(250, T({ y: -1.6, sy: 1.07 }), ease.linear), opacity: 1 },
      { ...pose(360, T({ y: -2.8, sy: 1.04 }), ease.linear), opacity: 0 },
      { ...pose(370, T(), ease.linear), opacity: 0 },
      { ...pose(640, T(), ease.linear), opacity: 0 },
      { ...pose(650, T(), ease.linear), opacity: 1 },
      { ...pose(900, T()), opacity: 1 },
    ]),
    actor('next', '12px 14.2px', [
      light(0, 0, T({ y: 4.2 })), light(270, 0, T({ y: 4.2 }), ease.settle),
      light(390, 1, T({ y: 1.1 }), ease.settle),
      light(500, 1, T({ y: -0.6 }), ease.smooth),
      light(590, 1, T({ y: 0.15 }), ease.settle),
      light(650, 1, T()), light(665, 0, T()), light(900, 0, T({ y: 4.2 })),
    ]),
    actor('tray', '12px 20px', [
      pose(0, T(), ease.accelerate),
      pose(160, T({ sx: 1.03, sy: 0.95 }), ease.smooth),
      ...spring(210, { sx: 1.03, sy: 0.95 }, {}, 'part').slice(0, -1),
      pose(900, T()),
    ]),
    actor('puff', '12px 9.6px', [
      light(0, 0, 'scale(.5)'), light(220, 0, 'scale(.5)', ease.settle),
      light(270, 0.9, 'scale(1)', ease.smooth), light(480, 0, 'scale(1.5)'), light(900, 0, 'scale(.5)'),
    ]),
  ]),
  shape: 'Open tray (r2.4) with a 10u arrow. Motion (study): the arrow crouches 1.3 into the tray and squashes .86, pushes off (the tray floor gives and springs back), leaves 2.6 up fading out, while the next arrow (an accent) rises from 4.2 down inside the tray and settles; the part takes over at rest; two air puffs open at the mouth on push-off.',
};
