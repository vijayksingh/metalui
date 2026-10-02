import { actor, ease, end, motion, pose, spring, T } from '../motion.mjs';

/* STOP / contact a square stop pad
 * Verb/object: stop the current operation. The case stays fixed; the square remains whole.
 * Receiver: inset stop pad contacts at140ms; release starts200ms with the press mass.
 * Neighbours: Close dismisses a view; Pause suspends an operation and can resume.
 * Forbidden: morphing the stop square into an X or pulsing its entire case.
 * Motion-off: the complete rest geometry remains visible at16.
 */
const TIMING = { padSeat: 140, padRelease: 200 };
const moves = [
  [pose(0, T(), ease.accelerate), pose(TIMING.padSeat, T({ y: 1.2, sy: .94 }), ease.smooth), ...spring(TIMING.padRelease, { y: 1.2, sy: .94 }, {}, 'release')],
];
const D = Math.max(...moves.map(end));
const finish = (frames) => end(frames) === D ? frames : [...frames, pose(D, T())];
export const act = {
  body: `<rect class="f" style="--duo:.08" x="4.5" y="4.5" width="15" height="15" rx="2.2"/><rect class="s" data-part="pad" x="8" y="8" width="8" height="8" rx=".65"/>`,
  study: motion(D, 'The square stop pad contacts its seat once and releases inside the fixed case.', ['Stop', 'Contact', 'Release'], [
    actor('pad', '12px 16px', finish(moves[0])),
  ]),
  shape: 'Fixed rounded stop case with a solid inset square pad. The pad presses1.2 into its seat once on the release spring; the square stays a square.',
};
