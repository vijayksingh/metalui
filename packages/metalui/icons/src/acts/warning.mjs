import { actor, ease, end, motion, pose, spring, T } from '../motion.mjs';

/* WARNING / seat an alert in a fixed triangle
 * Verb/object: attend to a warning. The triangle and alert dot never move.
 * Receiver: the inset alert stem seats1.2 at150ms, then releases at200ms.
 * Neighbours: Info is circular; Sync-error describes a specific failed round trip.
 * Forbidden: shaking the whole triangle, a colour-only warning, an idle pulse.
 * Motion-off: the complete rest geometry remains visible at16.
 */
const TIMING = { stemSeat: 150, stemRelease: 200 };
const moves = [
  [pose(0, T(), ease.accelerate), pose(TIMING.stemSeat, T({ y: 1.2, sy: .92 }), ease.smooth), ...spring(TIMING.stemRelease, { y: 1.2, sy: .92 }, {}, 'part')],
];
const D = Math.max(...moves.map(end));
const finish = (frames) => end(frames) === D ? frames : [...frames, pose(D, T())];
export const act = {
  body: `<path class="f" style="--duo:.1" d="M11.2 4.5q.8-1.4 1.6 0l8.1 14q.8 1.4-.8 1.4H3.9q-1.6 0-.8-1.4Z"/><path data-part="stem" d="M12 8.5v5.4"/><circle class="s" cx="12" cy="17" r=".85"/>`,
  study: motion(D, 'The alert stem seats inside a fixed warning triangle; its dot remains visible.', ['Attend', 'Seat alert', 'Release'], [
    actor('stem', '12px 13.9px', finish(moves[0])),
  ]),
  shape: 'Rounded warning triangle with inset alert stem and separate dot. Fixed enclosure distinguishes the warning from circular information at16.',
};
