import { actor, ease, motion, pose, spring, T } from '../motion.mjs';

// A currency-neutral minted disc. The paired bars stamp an I, never Info's stem and dot.
// The rim and stamp stay enclosed in both cuts. One quarter tilt reveals its edge, then settles.
const turn = [pose(0, T(), ease.accelerate), pose(170, T({ sx: .28, r: -12 }), ease.smooth),
  ...spring(240, { sx: .28, r: -12 }, {}, 'object')];
export const act = {
  body: `<g data-part="coin"><circle class="f" style="--duo:.16" cx="12" cy="12" r="8.2"/><circle cx="12" cy="12" r="5.2"/><path d="M12 9v6M10.3 9h3.4M10.3 15h3.4"/></g>`,
  study: motion(turn.at(-1).at, 'The minted coin tilts to its edge once and returns to its stamped face.',
    ['Face', 'Quarter tilt', 'Face again'], [actor('coin', '12px 12px', turn)]),
  shape: 'Two concentric closed wire rims at12,12 with radii8.2 and5.2; inner capital-I stamp spans3.4u and6u. The outer disc takes duotone fill; no currency symbol is assumed.',
};
