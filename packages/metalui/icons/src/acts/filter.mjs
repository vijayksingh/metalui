import { actor, ease, end, motion, pose, spring, T } from '../motion.mjs';

/* FILTER / seat the throat in the funnel
 * Verb/object: narrow the results. A broad fixed mouth converges to a small throat.
 * Invariant: the mouth remains fixed; the throat travels only along its insertion axis.
 * Neighbours: not Sort (no rows or arrow), not Download (no incoming arrow).
 * 0 rest; 180ms throat inserts 1.3; 240ms release and part-spring seat.
 * Motion-off: the tapered mouth and narrow exit read without an act at16.
 */
const TIMING = { throatSeat: 180, throatRelease: 240 };
const moves = [
  [pose(0, T(), ease.accelerate), pose(TIMING.throatSeat, T({ y: -1.3, sy: .92 }), ease.smooth), ...spring(TIMING.throatRelease, { y: -1.3, sy: .92 }, {}, 'part')],
];
const D = Math.max(...moves.map(end));
const finish = (frames) => end(frames) === D ? frames : [...frames, pose(D, T())];
export const act = {
  body: `<path class="f" style="--duo:.1" d="M4 4.8h16l-6 7.2h-4Z"/><path class="f" style="--duo:.1" data-part="throat" d="M10 11.2v9l4-2.2v-6.8"/>`,
  study: motion(D, 'The throat seats in the fixed funnel and narrows the result stream.', ['Narrow', 'Seat throat', 'Release'], [
    actor('throat', '12px 11.2px', finish(moves[0])),
  ]),
  shape: 'Wide funnel mouth at4.8 tapering to a four-unit throat. The throat inserts 1.3 and springs home; the fixed mouth keeps filtering distinct from sorting.',
};
