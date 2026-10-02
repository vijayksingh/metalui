import { actor, ease, motion, pose, spring, T } from '../motion.mjs';

/* SIDEBAR RAIL / the same window retains its narrowed navigation panel
 * Verb/object: collapse navigation words to a rail; the content enclosure stays fixed.
 * Invariant: outer shell identical to Sidebar, left boundary7.2 rather than9.2.
 * Compact: the rail's word marks withdraw, keeping3.4u between its boundary and shell.
 * Neighbours: not Layout or a right sidebar. Expansion uses Sidebar, never a half turn.
 *    0ms rail at its stop;140ms seats .5u inward;200ms part spring releases to its stop.
 */
const seat = [pose(0, T(), ease.smooth), pose(140, T({ x: -.5 }), ease.smooth),
  ...spring(200, { x: -.5 }, {}, 'part')];
export const act = {
  body: `<rect class="f" style="--duo:.08" x="3.8" y="4.8" width="16.4" height="14.4" rx="2"/><path data-part="rail" d="M7.2 5.5v13"/>`,
  study: motion(seat.at(-1).at, 'The narrow sidebar rail seats once inside its fixed window and returns to its stop.',
    ['Rail', 'Seat', 'Ready'], [actor('rail', '7.2px 12px', seat)]),
  shape: 'Sidebar’s exact rounded enclosure and duotone fill; its left boundary shifts9.2 to7.2. Word marks withdraw when collapsed. The shared1.85 compact stroke preserves a visible gap between rail and frame at14px and16px. Morph with Sidebar to collapse or expand; turn180 only mirrors the physical side.',
};
