import { actor, ease, motion, pose, spring, T } from '../motion.mjs';

/* PLAY / advance the transport into motion
 * One closed wire triangle reaches one grid step along its pointing direction, then
 * its key returns on the shared part spring. It keeps its direction and area throughout.
 * Neighbours: not Send (no paper or flight), not Chevron (closed transport key).
 * Reduced motion: the complete triangle remains; no clock at rest.
 */
const arrow = [pose(0, T(), ease.accelerate), pose(170, T({ x: 1 }), ease.smooth),
  ...spring(240, { x: 1 }, {}, 'part')];
export const act = {
  body: `<path data-part="transport" class="f" style="--duo:.16" d="M8 5 19 12 8 19Z"/>`,
  study: motion(arrow.at(-1).at, 'The transport key advances one step and returns ready to resume.',
    ['Advance', 'Run', 'Ready'], [actor('transport', '8px 12px', arrow)]),
  shape: 'Closed wire triangle from8,5 through19,12 to8,19; duotone tint inside. Advances1u along its direction then returns on the part spring.',
};
