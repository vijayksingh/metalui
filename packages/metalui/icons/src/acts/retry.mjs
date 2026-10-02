import { actor, ease, end, motion, pose, spring, T } from '../motion.mjs';

/* RETRY / seat a return arrow for another attempt
 * Verb/object: try the operation again. The nearly circular route remains fixed.
 * Receiver: return elbow seats toward the route at170ms; part spring releases230ms.
 * Neighbours: Redo reverses an editor undo; Synced completes a round trip without an arrow.
 * Forbidden: full-circle spinning, looping retry motion or implying success.
 * Motion-off: the complete rest geometry remains visible at16.
 */
const TIMING = { returnSeat: 170, returnRelease: 230 };
const moves = [
  [pose(0, T(), ease.accelerate), pose(TIMING.returnSeat, T({ x: -1.2, y: 1.2 }), ease.smooth), ...spring(TIMING.returnRelease, { x: -1.2, y: 1.2 }, {}, 'part')],
];
const D = Math.max(...moves.map(end));
const finish = (frames) => end(frames) === D ? frames : [...frames, pose(D, T())];
export const act = {
  body: `<path d="M19.2 11.8a7.2 7.2 0 1 1-3.2-5.9"/><path data-part="return" d="M16 3.8v4.8h-4.8"/>`,
  study: motion(D, 'The return arrow pulls toward its fixed route and seats for one more attempt.', ['Retry', 'Reach route', 'Seat'], [
    actor('return', '16px 8.6px', finish(moves[0])),
  ]),
  shape: 'Fixed nearly circular return route with an inset return elbow. Only the elbow reaches the route and seats; no full rotation. Retry concerns another attempt, Redo an editor operation.',
};
