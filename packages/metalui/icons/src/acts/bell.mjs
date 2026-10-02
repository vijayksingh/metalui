import { actor, ease, end, motion, pose, spring, T } from '../motion.mjs';

/* BELL / strike a bell rim once
 * Verb/object: notify once. The bell shell and its suspension stay fixed.
 * Cause: striker swings32deg at180ms into the left rim at6.2/18.3.
 * Receiver: rim yields.8 at205ms; both recover on the part spring after contact.
 * Neighbours: Warning describes attention; Bell describes a notification event.
 * Forbidden: shaking the entire bell or ringing while idle.
 * Motion-off: the complete rest geometry remains visible at16.
 */
const TIMING = { strikerSeat: 180, strikerRelease: 240, rimSeat: 205, rimRelease: 260 };
const moves = [
  [pose(0, T(), ease.accelerate), pose(TIMING.strikerSeat, T({ r: 32 }), ease.smooth), ...spring(TIMING.strikerRelease, { r: 32 }, {}, 'part')],
  [pose(0, T(), ease.accelerate), pose(TIMING.rimSeat, T({ y: .8 }), ease.smooth), ...spring(TIMING.rimRelease, { y: .8 }, {}, 'part')],
];
const D = Math.max(...moves.map(end));
const finish = (frames) => end(frames) === D ? frames : [...frames, pose(D, T())];
export const act = {
  body: `<path class="f" style="--duo:.1" d="M6 17.5v-6.7a6 6 0 0 1 12 0v6.7"/><path d="M12 3v1.8"/><path data-part="rim" d="M4.5 17.5h15"/><circle class="f" style="--duo:.16" data-part="striker" cx="12" cy="20" r="1.2"/>`,
  study: motion(D, 'The striker swings once into the bell rim; the rim receives the contact and both seat.', ['Swing striker', 'Ring contact', 'Seat'], [
    actor('striker', '12px 9px', finish(moves[0])),
    actor('rim', '12px 17.5px', finish(moves[1])),
  ]),
  shape: 'Fixed bell shell and suspension with a separate rim and visible striker. The striker swings32 degrees about its suspension into the rim; the rim yields. One contact and no idle ringing.',
};
