import { actor, ease, end, motion, pose, spring, T } from '../motion.mjs';

/* MOON / seat the night shade
 * Verb/object: show night. The crescent outline stays complete and fixed.
 * Receiver: an inset shade seam seats inward1.2 at130ms, releases at180ms.
 * Neighbours: Sun is a full illuminated disc with rays; Moon does not indicate loading.
 * Forbidden: rotating the crescent, sparkle decoration or an idle loop.
 * Motion-off: the complete rest geometry remains visible at16.
 */
const TIMING = { shadeSeat: 130, shadeRelease: 180 };
const moves = [
  [pose(0, T(), ease.accelerate), pose(TIMING.shadeSeat, T({ x: -1.2, y: .3 }), ease.smooth), ...spring(TIMING.shadeRelease, { x: -1.2, y: .3 }, {}, 'part')],
];
const D = Math.max(...moves.map(end));
const finish = (frames) => end(frames) === D ? frames : [...frames, pose(D, T())];
export const act = {
  body: `<path class="f" style="--duo:.1" d="M17.2 3.9a8.4 8.4 0 1 0 2.9 12.9 8 8 0 0 1-2.9-12.9Z"/><path data-part="shade" d="M13.1 7.2a8 8 0 0 0 2.5 8.3"/>`,
  study: motion(D, 'The inset night shade seats against a fixed crescent and returns to its quiet position.', ['Shade', 'Seat', 'Rest'], [
    actor('shade', '13.1px 7.2px', finish(moves[0])),
  ]),
  shape: 'Fixed crescent moon with a short inset shade seam. Only the shade seats1.2 inward and returns; the crescent silhouette remains whole.',
};
