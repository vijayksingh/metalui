import { actor, ease, end, motion, pose, spring, T } from '../motion.mjs';

/* ATTACH / catch a paperclip jaw
 * Verb/object: attach a file. The open outer loop stays fixed; the inner jaw seats within it.
 * Receiver: jaw inserts1.2 at160ms then releases220ms; attachment persists as a paperclip.
 * Neighbours: Lock has a closed secure body; Link is two interlocking rings.
 * Forbidden: rotating the whole clip or replacing attachment with a document icon.
 * Motion-off: the complete rest geometry remains visible at16.
 */
const TIMING = { jawSeat: 160, jawRelease: 220 };
const moves = [
  [pose(0, T(), ease.accelerate), pose(TIMING.jawSeat, T({ y: -1.2, sy: .94 }), ease.smooth), ...spring(TIMING.jawRelease, { y: -1.2, sy: .94 }, {}, 'part')],
];
const D = Math.max(...moves.map(end));
const finish = (frames) => end(frames) === D ? frames : [...frames, pose(D, T())];
export const act = {
  body: `<path d="M8 8.5V7a4 4 0 0 1 8 0v9.5a5.5 5.5 0 0 1-11 0V9"/><path data-part="jaw" d="M8 8.5v7.7a2.4 2.4 0 0 0 4.8 0V8.5"/>`,
  study: motion(D, 'The inner paperclip jaw catches against its fixed outer loop and seats back.', ['Attach', 'Catch jaw', 'Seat'], [
    actor('jaw', '10.4px 8.5px', finish(moves[0])),
  ]),
  shape: 'Open paperclip outer loop and inset catching jaw. The jaw inserts1.2 into the outer loop on the shared part spring. Distinct from an upright lock shackle.',
};
