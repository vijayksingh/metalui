import { actor, ease, end, motion, pose, spring, T } from '../motion.mjs';

/* EYE-OFF / close the visibility shutter
 * Verb/object: conceal the value. A diagonal shutter crosses the same fixed eye lens.
 * Invariant: the eye enclosure stays recognizable; the shutter and its knockout travel together.
 * Neighbours: Eye has an unobstructed lens; Lock describes access rather than visibility.
 * 0 rest; 180ms shutter seats1.3 along its diagonal; 240ms release to part-spring rest.
 * Motion-off: the eye and crossing shutter are both whole and unambiguous at16.
 */
const TIMING = { shutterSeat: 180, shutterRelease: 240 };
const moves = [
  [pose(0, T(), ease.accelerate), pose(TIMING.shutterSeat, T({ x: .92, y: .92 }), ease.smooth), ...spring(TIMING.shutterRelease, { x: .92, y: .92 }, {}, 'part')],
];
const D = Math.max(...moves.map(end));
const finish = (frames) => end(frames) === D ? frames : [...frames, pose(D, T())];
export const act = {
  body: `<g mask="url(#visibility)"><path class="f" style="--duo:.08" d="M3.5 12Q12 1.5 20.5 12Q12 22.5 3.5 12Z"/><circle cx="12" cy="12" r="2.6"/></g><path data-part="shutter" d="M4.5 4.5l15 15"/>`,
  defs: `<mask id="visibility"><rect width="24" height="24" fill="white"/><path data-part="shutter" d="M4.5 4.5l15 15" stroke="black" stroke-width="4.4" fill="none"/></mask>`,
  study: motion(D, 'The visibility shutter seats across the fixed lens, then returns to its concealed position.', ['Conceal', 'Seat shutter', 'Release'], [
    actor('shutter', '12px 12px', finish(moves[0])),
  ]),
  shape: 'The Eye lens and iris under a diagonal visibility shutter. A matching knockout follows the shutter so the crossing remains clear on either material at16.',
};
