import { actor, ease, motion, pose, spring, T } from '../motion.mjs';

/* SAVE / seat a write in a closed storage card
 * Verb/object: retain this document. The case stays shut; the write window seats into it.
 * Invariant: the storage case and its label stay fixed; no content leaves the case.
 * Receiver/payoff: the inset write window gives one press then returns on its part spring.
 * Neighbours: not Download (no outgoing/down arrow), not Document (closed storage case).
 * Motion-off / label-off: a cut-corner disk with write window and lower label; legible at16.
 *   0ms rest; 160ms write seats 1.3 down; 220ms pressure releases; exact rest after spring.
 */
const TIMING = { seat: 160, release: 220 };
const write = [pose(0, T(), ease.accelerate), pose(TIMING.seat, T({ y: 1.3, sy: .92 }), ease.smooth),
  ...spring(TIMING.release, { y: 1.3, sy: .92 }, {}, 'part')];
export const act = {
  body: `<path class="f" style="--duo:.1" d="M6.5 3.8h9l4 4v10.4a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2V5.8a2 2 0 0 1 2-2Z"/><rect data-part="write" x="8" y="4.8" width="6.4" height="4.7" rx=".6"/><path d="M7.8 20.2v-6.3h8.4v6.3M10 16.5h4"/>`,
  study: motion(write.at(-1).at, 'The write window seats into the storage case, records the document, then releases.', ['Seat', 'Record', 'Release'], [actor('write', '11.2px 9.5px', write)]),
  shape: 'Closed cut-corner storage case, inset write window and lower label. The write window presses 1.3 into its seat and returns on the shared part spring; the case never leaves.',
};
