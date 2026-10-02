import { actor, ease, end, motion, pose, spring, T } from '../motion.mjs';

/* VOLUME / reach a sound front from a fixed speaker
 * Verb/object: adjust sound level. Speaker cone and inner sound front remain fixed.
 * Receiver: outer front reaches1.3 at150ms then seats after210ms on the part spring.
 * Neighbours: Bell is a notification event; Volume names the adjustable sound level.
 * Forbidden: pulsing the complete speaker, an idle sound-wave loop or implying audio plays.
 * Motion-off: the complete rest geometry remains visible at16.
 */
const TIMING = { waveSeat: 150, waveRelease: 210 };
const moves = [
  [pose(0, T(), ease.accelerate), pose(TIMING.waveSeat, T({ x: 1.3 }), ease.smooth), ...spring(TIMING.waveRelease, { x: 1.3 }, {}, 'part')],
];
const D = Math.max(...moves.map(end));
const finish = (frames) => end(frames) === D ? frames : [...frames, pose(D, T())];
export const act = {
  body: `<path class="f" style="--duo:.1" d="M4 9.5h3.4L12 5.8v12.4l-4.6-3.7H4Z"/><path d="M15 9a4.2 4.2 0 0 1 0 6"/><path data-part="wave" d="M17.5 6.4a7.8 7.8 0 0 1 0 11.2"/>`,
  study: motion(D, 'The outer sound front reaches outward from the fixed speaker and seats back.', ['Sound', 'Reach front', 'Seat'], [
    actor('wave', '17.5px 12px', finish(moves[0])),
  ]),
  shape: 'Fixed speaker cone with two curved sound fronts. The outer front reaches1.3 outward once. The speaker and inner front remain fixed so volume reads as a sound level.',
};
