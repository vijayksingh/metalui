import { actor, ease, light, motion, pose, spring, T } from '../motion.mjs';

/* ── SEED / planted: the seed drops in, its sprout takes the blow ─
 * Verb, object   seed a sample: set a starting thing down so it can grow. The seed is the sample;
 *                the sprout and its leaf are what grows from it.
 * Invariant      a seed upright on its bottom with a stem and one leaf from its top; it never
 *                tilts, it rises at most 1.6, and the leaf turns only about where it joins the stem.
 * Causal parts   cause: the seed dropped onto the ground, squashing on its bottom (object spring).
 *                Receivers: the sprout, a beat late, sinking into the seed and springing up past
 *                rest; the leaf, lighter still, flopping down and swinging back.
 *                Payoff: two puffs of soil at the base where it lands.
 * Neighbours     not Plus/New (nothing is added), not Sparkles (no glitter), not a plant waving.
 * Forbidden      the old sprout scale-up, a sway loop, a whole-icon pulse.
 *
 *    0ms  rest
 *  160ms  the seed lifts 1.6 and stretches a little (sy 1.03); the sprout trails .4 low,
 *         the leaf lifts 6° in the air
 *  300ms  it lands: squash .9 on its bottom, 1.06 wide; soil puffs out at the base
 *  340ms  the sprout sinks .5 into the seed, the leaf flops down 18°
 *  460ms  the sprout springs up .7 past rest (it grew); leaf swings back −8° … 640ms +3°
 *  656ms  the seed's landing overshoot (object spring) … 1013ms still
 * 1040ms  exact rest
 * ────────────────────────────────────────────────────────── */
const D = 1040;
export const act = {
  body: `<g data-part="seed"><path class="f" style="--duo:.14" d="M12 7a5.6 6.6 0 1 1 0 13.2 5.6 6.6 0 1 1 0-13.2Z"/><g data-part="sprout"><path d="M12 4.4V7"/><g data-part="leaf"><path class="f" style="--duo:.2" d="M15.4 3.2c-.3 1.5-1.6 2.2-3.4 2 .5-1.5 1.8-2.2 3.4-2Z"/></g></g></g><path class="ac" data-part="soil" opacity="0" d="M8 21.3H6.8M16 21.3h1.2" style="stroke-width:calc(var(--sw) * .75)"/>`,
  study: motion(D, 'The seed is dropped in and lands on its bottom; the sprout takes the blow, springs up, and its leaf swings.', ['Lift', 'Plant', 'Take root'], [
    actor('seed', '12px 20.2px', [
      pose(0, T(), ease.settle),
      pose(160, T({ y: -1.6, sy: 1.03, sx: 0.98 }), ease.accelerate),
      ...spring(300, { sx: 1.06, sy: 0.9 }, {}, 'object'),
      pose(D, T()),
    ]),
    actor('sprout', '12px 7px', [
      pose(0, T(), ease.settle),
      pose(160, T({ y: 0.4 }), ease.accelerate),
      pose(300, T({ y: 0.2 }), ease.smooth),
      pose(340, T({ y: 0.5 }), ease.smooth),
      pose(460, T({ y: -0.7 }), ease.smooth),
      pose(580, T({ y: 0.2 }), ease.smooth),
      pose(700, T(), ease.settle),
      pose(D, T()),
    ]),
    actor('leaf', '12px 5.2px', [
      pose(0, T(), ease.settle),
      pose(260, T({ r: -6 }), ease.smooth),
      pose(360, T({ r: 18 }), ease.smooth),
      pose(500, T({ r: -8 }), ease.smooth),
      pose(640, T({ r: 3 }), ease.smooth),
      pose(780, T({ r: -0.8 }), ease.settle),
      pose(D, T()),
    ]),
    actor('soil', '12px 21.3px', [
      light(0, 0, 'scale(.6)'), light(290, 0, 'scale(.6)', ease.settle),
      light(330, 1, 'scale(1)', ease.smooth), light(560, 0, 'scale(1.35)'), light(D, 0, 'scale(.6)'),
    ]),
  ]),
  shape: 'Seed 11.2 × 13.2, tinted .14; sprout stem 2.6 and a tinted leaf from its top. Motion (study): the seed lifts 1.6 and lands on its bottom (squash .9, object spring); the sprout lags, sinks .5 into it and springs .7 past rest; the leaf flops 18° about its joint and swings back; two puffs of soil spread along the ground at its base.',
};
