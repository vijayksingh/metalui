import { actor, ease, end, light, motion, pose, spring, T } from '../motion.mjs';

/* ── SYNC ERROR / the orbit tries to turn and catches ─────────
 * Verb, object   sync, refused. Synced's own motion failing: the orbit heaves forward to turn,
 *                jams against a stop, and rings back and forth against it until it dies out.
 * Invariant      the ring keeps its one gap and its centre; the "!" stays upright and whole;
 *                nothing leaves the ring.
 * Causal parts   cause: the ring's leading end driving into the gap and meeting the stop.
 *                Receiver: the mark, jolted up by the catch, landing and squashing.
 *                Payoff: a spark of three rays at the leading end, the instant it catches.
 * Neighbours     not Synced (no satellite, no lap), not Refresh (it never gets round),
 *                not a generic error shake (the ring turns about its centre; the rattle is
 *                the refusal spring, not a wiggle).
 * Forbidden      a spin, a whole-icon shake, a pulsing "!".
 *
 *    0ms  rest
 *  120ms  settles back 4° to take the strain (anticipate)
 *  330ms  heaves 14° clockwise, gathering speed, and catches (strike); the spark fires
 *  437ms  refusal spring: rings back 7.4° past rest …
 *  544ms  … 3.9°, −2°, 1.1° … every 107 ms, dying out
 *  400ms  the mark jolts up 1.6 on the catch
 *  520ms  it lands, squashed 12% across, then a small rebound
 * 1185ms  exact rest
 * ────────────────────────────────────────────────────────── */
const ring = [
  pose(0, T(), ease.smooth),
  pose(120, T({ r: -4 }), ease.accelerate),
  ...spring(330, { r: 14 }, {}, 'refusal'),
];
const D = end(ring);
// the ring's leading end (−72°) after its 14° heave is (16.03, 5.55); the rays fan out ahead of it, into the gap
const SPARK = 'M16.85 3.95 17.39 2.88M17.78 5.15 18.95 4.88M17.47 6.63 18.43 7.36';

export const act = {
  body: `<g data-part="orbit"><circle cx="12" cy="12" r="7.6" pathLength="100" stroke-dasharray="85 15" transform="rotate(-18 12 12)"/></g><g data-part="mark"><path d="M12 8.6v4.2"/><circle class="s" cx="12" cy="15.7" r="1.05"/></g><path class="ac" data-part="spark" opacity="0" d="${SPARK}" style="stroke-width:calc(var(--sw) * .7)"/>`,
  study: motion(D, 'The orbit heaves to turn, catches on a stop and rattles against it; the mark jolts.', ['Heave', 'Catch', 'Rattle out'], [
    actor('orbit', '12px 12px', ring),
    actor('mark', '12px 16.75px', [
      pose(0, T(), ease.linear), pose(330, T(), ease.strike),
      pose(400, T({ y: -1.6 }), ease.accelerate),
      pose(520, T({ y: .3, sx: 1.12, sy: .88 }), ease.smooth),
      pose(620, T({ y: -.25 }), ease.smooth),
      pose(730, T({ y: .05, sx: 1.02, sy: .98 }), ease.settle),
      pose(D, T()),
    ]),
    actor('spark', '16.03px 5.55px', [
      light(0, 0, 'scale(.5)'), light(320, 0, 'scale(.5)', ease.settle),
      light(350, 1, 'scale(.9)', ease.smooth), light(560, 0, 'scale(1.3)'), light(D, 0, 'scale(.5)'),
    ]),
  ]),
  shape: 'Orbit r7.6 with the same 85/15 dash as Synced turned −18°, the core replaced by "!" (4.2 stem, r1.05 dot). Motion (study): the ring winds back 4°, heaves 14° clockwise and catches; it rattles out on the refusal spring while a three-ray spark fires at its leading end and the mark jolts up 1.6 and lands squashed.',
};
