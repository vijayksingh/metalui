import { actor, ease, end, motion, pose, spring, T } from '../motion.mjs';

/* PALETTE / seat a paint well in its palette
 * Verb/object: choose the paint family. The palette outline and thumb hole remain fixed.
 * Receiver: paint well seats1.2 at160ms; part spring releases220ms.
 * Neighbours: Settings adjusts values; Palette chooses a paint family or appearance.
 * Forbidden: colouring the whole icon to replace its silhouette or spinning the palette.
 * Motion-off: the complete rest geometry remains visible at16.
 */
const TIMING = { wellSeat: 160, wellRelease: 220 };
const moves = [
  [pose(0, T(), ease.accelerate), pose(TIMING.wellSeat, T({ y: 1.2, sy: .9 }), ease.smooth), ...spring(TIMING.wellRelease, { y: 1.2, sy: .9 }, {}, 'part')],
];
const D = Math.max(...moves.map(end));
const finish = (frames) => end(frames) === D ? frames : [...frames, pose(D, T())];
export const act = {
  body: `<path class="f" style="--duo:.08" d="M20.2 12.2c0-5.3-3.3-8.4-8.2-8.4a8.2 8.2 0 1 0 0 16.4h1.4c1.2 0 1.7-.8 1.3-1.8l-.6-1.2c-.4-.8.1-1.6 1-1.6H17c1.9 0 3.2-1.5 3.2-3.4Z"/><circle cx="16.8" cy="12" r="1.3"/><circle class="s" cx="8" cy="8" r=".9"/><circle class="s" cx="12" cy="6.8" r=".9"/><circle class="s" cx="16" cy="8" r=".9"/><circle class="s" data-part="well" cx="7.5" cy="12.8" r="1.15"/>`,
  study: motion(D, 'A paint well seats in the fixed palette while its thumb hole stays open.', ['Choose paint', 'Seat well', 'Release'], [
    actor('well', '7.5px 12.8px', finish(moves[0])),
  ]),
  shape: 'Rounded physical palette with open thumb hole and four paint wells. Only the lower well seats1.2; colours are optional because the contour names the palette.',
};
