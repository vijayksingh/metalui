import { actor, ease, motion, pose, spring, T } from '../motion.mjs';

/* PAUSE / catch the transport between two stops
 * Two upright stops move half a grid step inward together, then release on the same
 * part spring. The clear central gap stays open; neither stop rotates or changes area.
 * Neighbours: not Stop (no square), not Equal (vertical transport stops).
 * Reduced motion: both complete wire stops remain; no clock at rest.
 */
const frames = x => [pose(0, T(), ease.accelerate), pose(170, T({ x }), ease.smooth),
  ...spring(240, { x }, {}, 'part')];
const left = frames(.5), right = frames(-.5);
export const act = {
  body: `<rect data-part="left" class="f" style="--duo:.16" x="8" y="5" width="2" height="14" rx=".7"/><rect data-part="right" class="f" style="--duo:.16" x="14" y="5" width="2" height="14" rx=".7"/>`,
  study: motion(left.at(-1).at, 'The two transport stops catch together and release to their ready gap.',
    ['Catch', 'Hold', 'Ready'], [actor('left', '9px 12px', left), actor('right', '15px 12px', right)]),
  shape: 'Two closed rounded wire stops,8..10 and14..16 by5..19. Both catch .5u inward then return together on the part spring. The16px drawing opens the central gap by1u.',
};
