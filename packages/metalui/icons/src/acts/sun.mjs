import { actor, ease, end, motion, pose, spring, T } from '../motion.mjs';

/* SUN / open one daylight beam
 * Verb/object: show daylight. The disc and seven rays remain fixed.
 * Receiver: the east beam opens1.2 at130ms, seats after180ms on the part spring.
 * Neighbours: Moon is a shaded crescent; Brightness is an adjustable light level.
 * Forbidden: whole-sun spinning, breathing, scale pulses or loops.
 * Motion-off: the complete rest geometry remains visible at16.
 */
const TIMING = { beamSeat: 130, beamRelease: 180 };
const moves = [
  [pose(0, T(), ease.accelerate), pose(TIMING.beamSeat, T({ x: 1.2 }), ease.smooth), ...spring(TIMING.beamRelease, { x: 1.2 }, {}, 'part')],
];
const D = Math.max(...moves.map(end));
const finish = (frames) => end(frames) === D ? frames : [...frames, pose(D, T())];
export const act = {
  body: `<circle class="f" style="--duo:.1" cx="12" cy="12" r="3.8"/><path d="M12 3v2.3M12 18.7V21M3 12h2.3M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M5.6 18.4l1.6-1.6M16.8 7.2l1.6-1.6"/><path data-part="beam" d="M18.7 12H21"/>`,
  study: motion(D, 'One daylight beam opens from the fixed sun and seats back at its source.', ['Open light', 'Reach', 'Seat beam'], [
    actor('beam', '18.7px 12px', finish(moves[0])),
  ]),
  shape: 'Fixed daylight disc and seven fixed rays. The eighth beam extends1.2 once and returns; the disc never pulses or spins.',
};
