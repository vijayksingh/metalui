import { actor, ease, end, motion, pose, spring, T } from '../motion.mjs';

/* INFO / read an information window
 * Verb/object: read information. The circular enclosure and information dot remain fixed.
 * Receiver: the inset stem seats within its window;150ms contact,200ms release.
 * Neighbours: Warning is triangular; Check describes a completed result.
 * Forbidden: pulsing the whole badge or replacing the information label with colour.
 * Motion-off: the complete rest geometry remains visible at16.
 */
const TIMING = { stemSeat: 150, stemRelease: 200 };
const moves = [
  [pose(0, T(), ease.accelerate), pose(TIMING.stemSeat, T({ y: 1.2, sy: .9 }), ease.smooth), ...spring(TIMING.stemRelease, { y: 1.2, sy: .9 }, {}, 'part')],
];
const D = Math.max(...moves.map(end));
const finish = (frames) => end(frames) === D ? frames : [...frames, pose(D, T())];
export const act = {
  body: `<circle class="f" style="--duo:.08" cx="12" cy="12" r="8.1"/><circle class="s" cx="12" cy="7.6" r=".9"/><path data-part="stem" d="M10.7 11h1.3v5.8h1.5"/>`,
  study: motion(D, 'The information stem seats in its fixed circular window and releases.', ['Read', 'Seat stem', 'Release'], [
    actor('stem', '12px 16.8px', finish(moves[0])),
  ]),
  shape: 'Circular information window with dot and inset stem. The circle and dot stay fixed while the stem seats1.2 and returns on the shared part spring.',
};
