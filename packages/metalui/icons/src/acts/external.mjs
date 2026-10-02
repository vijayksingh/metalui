import { actor, ease, motion, pose, spring, T } from '../motion.mjs';

/* EXTERNAL / pass through an open window corner
 * Verb/object: open the resource outside this context. The frame stays; arrow leaves its open corner.
 * Invariant: window remains fixed and open at top-right; arrow travels only along that opening.
 * Neighbours: not Link (no chain), not Upload (diagonal window exit, no horizontal boundary).
 * Reduced motion / compact: open frame plus exiting corner arrow names the action at rest.
 *   0ms rest; 170ms arrow reaches through corner; part spring returns to the ready position.
 */
const TIMING = { reach:170, release:240 };
const arrow = [pose(0,T(),ease.accelerate),pose(TIMING.reach,T({x:1.2,y:-1.2}),ease.smooth),
  ...spring(TIMING.release,{x:1.2,y:-1.2},{},'part')];
export const act = {
  body: `<path d="M10.2 4.5H6.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3.7"/><path data-part="arrow" d="m10.2 13.8 9.3-9.3M14 4.5h5.5V10"/>`,
  study: motion(arrow.at(-1).at,'The arrow reaches through the open window corner into the external context, then returns ready.', ['Reach','Open outside','Ready'],[actor('arrow','19.5px 4.5px',arrow)]),
  shape: 'Fixed open window frame and diagonal arrow through the top-right corner; the arrow reaches1.2 along the opening and returns on the shared part spring.',
};
