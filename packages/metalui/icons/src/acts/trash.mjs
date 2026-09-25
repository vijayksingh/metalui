import { actor, ease, light, motion, pose, spring, T } from '../motion.mjs';

/* ── TRASH / the lid swings open on its hinge and slams shut ──
 * Verb, object   throw this away. The bin is the stable receiver; the lid is the hinged part
 *                you work: it swings up about its left pin, hangs open, and is let fall.
 * Invariant      the bin stands where it is (it only gives under the impact, 6%); the lid
 *                turns about its hinge at 4.4/7 and never opens past 15.5°, so its handle and
 *                free end stay inside the live area.
 * Causal parts   cause: the lid falling shut. Receiver: the bin, which squashes under it (the
 *                lid rides down with the rim, so they never part or pass through). Payoff:
 *                two puffs of air from under the free edge at contact.
 * Neighbours     not Send-away (nothing is swallowed), not Archive (no box, no slot),
 *                not Delete-forever (no scrap, no flash: a gesture, not a claim, MOT-14).
 * Forbidden      a shake, a whole-bin bounce, the lid simply tilting and untilting.
 *
 *    0ms  rest
 *  240ms  the lid swings up about its hinge to −15.5° (lift)
 *  360ms  hangs back to −13.5 and holds open (a hinge overshoot, not a float)
 *  440ms  let go: falls, accelerating
 *  560ms  contact: lid flat on the rim
 *  600ms  both compress: bin .94 tall and 1.03 wide from its foot, the lid down .8 with the rim;
 *         puffs from under the free edge
 *  690ms  the lid kicks up 3.5° off the rebounding rim, then settles on its hinge spring
 *  ~960ms exact rest
 * ────────────────────────────────────────────────────────── */
const lid = [
  pose(0, T(), ease.strike),
  pose(240, T({ r: -15.5 }), ease.smooth),
  pose(360, T({ r: -13.5 }), ease.smooth),
  pose(440, T({ r: -14 }), ease.accelerate),
  pose(560, T(), ease.strike),
  pose(600, T({ y: 0.8 }), ease.smooth),
  ...spring(690, { r: -3.5 }, {}, 'hinge', { still: 0.4 }),
];
const bin = [
  pose(0, T(), ease.linear),
  pose(560, T(), ease.strike),
  ...spring(600, { sx: 1.03, sy: 0.94 }, {}, 'part', { still: 0.2 }),
];
const D = Math.max(lid[lid.length - 1].at, bin[bin.length - 1].at);
const hold = (f) => (f[f.length - 1].at < D ? [...f, { at: D, transform: f[f.length - 1].transform }] : f);

export const act = {
  body: `<g data-part="lid"><path d="M4.4 7h15.2"/><path d="M9.4 7V5.6a1.4 1.4 0 0 1 1.4-1.4h2.4a1.4 1.4 0 0 1 1.4 1.4V7"/></g><g data-part="bin"><path class="f" style="--duo:.12" d="M6.2 7h11.6l-.86 11.1a2.3 2.3 0 0 1-2.3 2.1H9.36a2.3 2.3 0 0 1-2.3-2.1Z"/><path d="M10.2 10.6v5.8M13.8 10.6v5.8"/></g><path class="ac" data-part="puff" opacity="0" d="M20.9 6.1l1-.6M20.9 7.9l1 .6" style="stroke-width:calc(var(--sw) * .7)"/>`,
  study: motion(D, 'The lid swings up on its hinge, hangs open, then falls shut; the bin gives under it and air puffs from the edge.', ['Lift', 'Slam', 'Settle'], [
    actor('lid', '4.4px 7px', hold(lid)),
    actor('bin', '12px 20.2px', hold(bin)),
    actor('puff', '20.4px 7px', [
      light(0, 0, 'scale(.6)'), light(570, 0, 'scale(.6)', ease.settle),
      light(620, 1, 'scale(1)', ease.smooth), light(820, 0, 'scale(1.5)'), light(D, 0, 'scale(.6)'),
    ]),
  ]),
  shape: 'Portrait keyline bin, tapered 0.9u each side, lid hinged at the left end. Motion (study): the lid swings up 15.5° about its hinge, hangs, falls shut; the bin squashes .94 from its foot with the lid riding the rim, air puffs from the free edge, and the lid kicks 3.5° and settles.',
};
