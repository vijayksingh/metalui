import { actor, ease, end, motion, pose, spring, T } from '../motion.mjs';

/* PERSON / seat a portrait above fixed shoulders
 * Verb/object: identify a person. Shoulders remain fixed, head remains round.
 * Receiver: portrait seats above the shoulders at150ms; part spring releases210ms.
 * Neighbours: Me is the personal canvas marker; Person is a neutral profile/assignee portrait.
 * Forbidden: turning the portrait into data bars or looping a breathing avatar.
 * Motion-off: the complete rest geometry remains visible at16.
 */
const TIMING = { headSeat: 150, headRelease: 210 };
const moves = [
  [pose(0, T(), ease.accelerate), pose(TIMING.headSeat, T({ y: 1.2 }), ease.smooth), ...spring(TIMING.headRelease, { y: 1.2 }, {}, 'part')],
];
const D = Math.max(...moves.map(end));
const finish = (frames) => end(frames) === D ? frames : [...frames, pose(D, T())];
export const act = {
  body: `<path class="f" style="--duo:.1" d="M5 20v-1a7 5 0 0 1 14 0v1Z"/><circle class="f" style="--duo:.1" data-part="head" cx="12" cy="7.6" r="3.3"/>`,
  study: motion(D, 'The portrait head seats above its fixed shoulders and returns to its place.', ['Recognize', 'Seat portrait', 'Rest'], [
    actor('head', '12px 10.9px', finish(moves[0])),
  ]),
  shape: 'Round3.3 portrait head above fixed shoulder enclosure. The head seats1.2 once; there are no rows, chart axes or counters.',
};
