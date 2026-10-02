import { actor, ease, end, motion, pose, spring, T } from '../motion.mjs';

/* SORT / commit an ordering direction
 * Verb/object: order the rows. A list stays fixed while the directional shaft presses its stop.
 * Invariant: three rows retain their ordered lengths; the arrow keeps its down direction.
 * Neighbours: not Filter (no funnel), not Download (no receiver).
 * 0 rest; 170ms arrow presses 1.3; 230ms release to part-spring rest.
 * Motion-off: ascending row lengths and the ordering shaft remain complete at16.
 */
const TIMING = { orderSeat: 170, orderRelease: 230 };
const moves = [
  [pose(0, T(), ease.accelerate), pose(TIMING.orderSeat, T({ y: 1.3, sy: .94 }), ease.smooth), ...spring(TIMING.orderRelease, { y: 1.3, sy: .94 }, {}, 'part')],
];
const D = Math.max(...moves.map(end));
const finish = (frames) => end(frames) === D ? frames : [...frames, pose(D, T())];
export const act = {
  body: `<path d="M4 5.5h7.5M4 11.5h5.5M4 17.5h3.5"/><path data-part="order" d="M17.5 4.8v13.4m-3.2-3.2 3.2 3.2 3.2-3.2"/>`,
  study: motion(D, 'The ordering shaft presses its terminal and returns; the ordered rows stay fixed.', ['Order', 'Commit', 'Seat'], [
    actor('order', '17.5px 12px', finish(moves[0])),
  ]),
  shape: 'Three descending row lengths beside a down ordering shaft. Turn the whole glyph for the opposite state; only the shaft presses its stop during an act.',
};
