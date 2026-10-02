import { actor, ease, end, motion, pose, spring, T } from '../motion.mjs';

/* BRIGHTNESS / open a level shade inside a fixed lamp
 * Verb/object: adjust light level. Lamp enclosure and four rays remain fixed.
 * Receiver: internal shade opens1.3 at150ms, seats after210ms on the part spring.
 * Neighbours: Sun names daylight with eight rays; Brightness has a half-lit level indicator.
 * Forbidden: whole-disc pulses or extending the shade beyond the lamp enclosure.
 * Motion-off: the complete rest geometry remains visible at16.
 */
const TIMING = { shadeSeat: 150, shadeRelease: 210 };
const moves = [
  [pose(0, T(), ease.accelerate), pose(TIMING.shadeSeat, T({ x: -1.3 }), ease.smooth), ...spring(TIMING.shadeRelease, { x: -1.3 }, {}, 'part')],
];
const D = Math.max(...moves.map(end));
const finish = (frames) => end(frames) === D ? frames : [...frames, pose(D, T())];
export const act = {
  body: `<circle cx="12" cy="12" r="3.8"/><g clip-path="url(#lamp)"><path class="f" style="--duo:.16" data-part="shade" d="M12 8.2a3.8 3.8 0 0 1 0 7.6Z"/></g><path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2"/>`,
  defs: `<clipPath id="lamp"><circle cx="12" cy="12" r="3.8"/></clipPath>`,
  study: motion(D, 'The level shade opens inside the fixed lamp and seats back at its half-lit position.', ['Adjust light', 'Open level', 'Seat'], [
    actor('shade', '12px 12px', finish(moves[0])),
  ]),
  shape: 'Duotone half-lit circular lamp with four cardinal rays. A clipped shade adjusts the lit area inside the fixed disc; the silhouette distinguishes brightness adjustment from the eight-ray daylight Sun.',
};
