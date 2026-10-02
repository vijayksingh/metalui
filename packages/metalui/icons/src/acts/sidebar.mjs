import { actor, ease, end, motion, pose, spring, T } from '../motion.mjs';

/* SIDEBAR / slide a rail inside its fixed window
 * Verb/object: toggle a sidebar. The window frame and content area stay fixed.
 * Receiver: the rail slides toward the left stop1.8 at160ms, releases at220ms.
 * Neighbours: Layout divides content; Sidebar specifically holds a navigation rail.
 * Opposite side: turn180 places this same rail on the right; collapse uses Sidebar Rail.
 * Forbidden: translating the complete window or using an unrelated hamburger.
 * Motion-off: the complete rest geometry remains visible at16.
 */
const TIMING = { railSeat: 160, railRelease: 220 };
const moves = [
  [pose(0, T(), ease.accelerate), pose(TIMING.railSeat, T({ x: -1.8 }), ease.smooth), ...spring(TIMING.railRelease, { x: -1.8 }, {}, 'part')],
];
const D = Math.max(...moves.map(end));
const finish = (frames) => end(frames) === D ? frames : [...frames, pose(D, T())];
export const act = {
  body: `<rect class="f" style="--duo:.08" x="3.8" y="4.8" width="16.4" height="14.4" rx="2"/><path data-part="rail" d="M9.2 5.5v13M6 9h.8M6 12h.8M6 15h.8"/>`,
  study: motion(D, 'The sidebar rail slides toward its frame and seats back; the content enclosure stays fixed.', ['Collapse rail', 'Seat', 'Ready'], [
    actor('rail', '9.2px 12px', finish(moves[0])),
  ]),
  shape: 'Fixed rounded window with a left rail panel and three small rail marks. The rail travels1.8 toward its frame. Turn180 for a right rail without changing its construction.',
};
