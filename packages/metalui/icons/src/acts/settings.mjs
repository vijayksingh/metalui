import { actor, ease, end, motion, pose, spring, T } from '../motion.mjs';

/* SETTINGS / adjust three rails
 * Verb/object: tune the settings. Three knobs travel on three fixed rails, then seat.
 * Invariant: the rails never move; each knob stays on its own horizontal guide.
 * Neighbours: not Filter (no funnel), not Sort (no ordering arrow).
 * 0 rest; 150/190/230ms knobs reach stops; 210/250/290ms part springs return home.
 * Motion-off: the three offset knobs still read as adjustment controls at16.
 */
const TIMING = { upperSeat: 150, upperRelease: 210, middleSeat: 190, middleRelease: 250, lowerSeat: 230, lowerRelease: 290 };
const moves = [
  [pose(0, T(), ease.accelerate), pose(TIMING.upperSeat, T({ x: 2.4 }), ease.smooth), ...spring(TIMING.upperRelease, { x: 2.4 }, {}, 'part')],
  [pose(0, T(), ease.accelerate), pose(TIMING.middleSeat, T({ x: -2.4 }), ease.smooth), ...spring(TIMING.middleRelease, { x: -2.4 }, {}, 'part')],
  [pose(0, T(), ease.accelerate), pose(TIMING.lowerSeat, T({ x: 2.4 }), ease.smooth), ...spring(TIMING.lowerRelease, { x: 2.4 }, {}, 'part')],
];
const D = Math.max(...moves.map(end));
const finish = (frames) => end(frames) === D ? frames : [...frames, pose(D, T())];
export const act = {
  body: `<path d="M4 6h16M4 12h16M4 18h16"/><rect class="f" style="--duo:.12" data-part="upper" x="7" y="3.8" width="3.4" height="4.4" rx="1"/><rect class="f" style="--duo:.12" data-part="middle" x="14" y="9.8" width="3.4" height="4.4" rx="1"/><rect class="f" style="--duo:.12" data-part="lower" x="8.5" y="15.8" width="3.4" height="4.4" rx="1"/>`,
  study: motion(D, 'Three adjustment knobs reach their rail stops in order and seat back into their settings.', ['Adjust', 'Reach stops', 'Seat'], [
    actor('upper', '8.7px 6px', finish(moves[0])),
    actor('middle', '15.7px 12px', finish(moves[1])),
    actor('lower', '10.2px 18px', finish(moves[2])),
  ]),
  shape: 'Three fixed horizontal rails with inset rectangular knobs, offset along their guides. Only the knobs travel 2.4 on the shared part spring.',
};
