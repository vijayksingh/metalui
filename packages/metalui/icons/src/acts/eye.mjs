import { actor, ease, end, motion, pose, spring, T } from '../motion.mjs';

/* EYE / inspect through a fixed lens
 * Verb/object: reveal the value. The iris tracks once inside an unchanging almond lens.
 * Invariant: the visible opening stays complete and still; the iris cannot leave it.
 * Neighbours: Eye-off uses the same lens with its shutter crossing the opening.
 * 0 rest; 180ms iris tracks2 right; 250ms iris returns on the part spring.
 * Motion-off: the whole almond and pupil stay visible at16.
 */
const TIMING = { irisSeat: 180, irisRelease: 250 };
const moves = [
  [pose(0, T(), ease.accelerate), pose(TIMING.irisSeat, T({ x: 2 }), ease.smooth), ...spring(TIMING.irisRelease, { x: 2 }, {}, 'part')],
];
const D = Math.max(...moves.map(end));
const finish = (frames) => end(frames) === D ? frames : [...frames, pose(D, T())];
export const act = {
  body: `<path class="f" style="--duo:.08" d="M3.5 12Q12 1.5 20.5 12Q12 22.5 3.5 12Z"/><circle class="f" style="--duo:.16" data-part="iris" cx="12" cy="12" r="2.6"/>`,
  study: motion(D, 'The iris inspects through the fixed lens and returns to centre.', ['Inspect', 'Track', 'Centre'], [
    actor('iris', '12px 12px', finish(moves[0])),
  ]),
  shape: 'Fixed almond lens17 wide and10.5 high with a2.6 iris. Eye and Eye-off share the same enclosure; the iris tracks2 along the visible opening.',
};
