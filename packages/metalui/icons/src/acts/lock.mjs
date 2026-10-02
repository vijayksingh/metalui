import { actor, ease, end, motion, pose, spring, T } from '../motion.mjs';

/* LOCK / catch the shackle in its closed body
 * Verb/object: secure access. The shackle presses into two catches in the fixed body.
 * Invariant: the body and key slot remain fixed; the shackle never opens or leaves its catches.
 * Neighbours: not Eye-off (visibility), not Save (a retained record).
 * 0 rest; 170ms shackle seats1.3; 230ms release and part-spring rest.
 * Motion-off: closed shackle, solid body and key slot remain readable at16.
 */
const TIMING = { shackleSeat: 170, shackleRelease: 230 };
const moves = [
  [pose(0, T(), ease.accelerate), pose(TIMING.shackleSeat, T({ y: 1.3, sy: .92 }), ease.smooth), ...spring(TIMING.shackleRelease, { y: 1.3, sy: .92 }, {}, 'part')],
];
const D = Math.max(...moves.map(end));
const finish = (frames) => end(frames) === D ? frames : [...frames, pose(D, T())];
export const act = {
  body: `<path data-part="shackle" d="M8.5 11V7.3a3.5 3.5 0 0 1 7 0V11"/><rect class="f" style="--duo:.12" x="6.5" y="11" width="11" height="9.2" rx="2"/><path d="M12 14.6v2.4"/>`,
  study: motion(D, 'The closed shackle seats in its catches; the secure body stays fixed.', ['Secure', 'Catch', 'Seat'], [
    actor('shackle', '12px 11px', finish(moves[0])),
  ]),
  shape: 'Closed3.5-radius shackle over an11-wide secure body with a central key slot. Only the shackle presses into its catches and returns on the part spring.',
};
