import { actor, ease, motion, pose, spring, T } from '../motion.mjs';

/* DOWNLOAD / cross the lower receiving tray
 * Verb/object: transfer content into this device.
 * Invariant: the arrow always points down; the receiving boundary never becomes the other direction.
 * Contact: arrow compresses at the boundary; receiver gives 1 then returns on its part spring.
 * Neighbours: not Share (an open sending tray), not Save (no retained storage case).
 * No generic spin/pulse: motion follows the transfer axis; full glyph remains under reduced motion.
 *   0ms rest; 180ms travel; 300ms contact; 420ms received; 650ms next transfer ready; 900ms rest.
 */
const TIMING = { approach: 180, contact: 300, received: 420, reset: 430, ready: 650, end: 900 };
const receiver = [pose(0, T(), ease.smooth), pose(TIMING.contact-30,T(),ease.accelerate), pose(TIMING.contact, T({ y: 1 }), ease.strike),
  ...spring(TIMING.contact+30, { y: 1 }, {}, 'part').slice(0,-1), pose(TIMING.end,T())];
export const act = {
  body: `<path data-part="receiver" d="M4.8 16.5v2a1.7 1.7 0 0 0 1.7 1.7h11a1.7 1.7 0 0 0 1.7-1.7v-2"/><path data-part="arrow" d="M12 4.2v11M8.8 12 12 15.2 15.2 12"/>`,
  study: motion(TIMING.end, 'The arrow descends into the receiving tray; the tray takes its weight and releases.', ['Travel', 'Receive', 'Ready'], [
    actor('receiver', '12px 20.2px', receiver),
    actor('arrow', '12px 15.2px', [
      { ...pose(0,T(),ease.accelerate), opacity:1 },
      { ...pose(TIMING.approach,T({y:0.9}),ease.strike), opacity:1 },
      { ...pose(TIMING.contact,T({y:4.3,sy:.88}),ease.smooth), opacity:1 },
      { ...pose(TIMING.received,T({y:4.5,sy:.78}),ease.linear), opacity:0 },
      { ...pose(TIMING.reset,T(),ease.linear), opacity:0 },
      { ...pose(TIMING.ready,T(),ease.settle), opacity:1 },
      { ...pose(TIMING.end,T()), opacity:1 },
    ]),
  ]),
  shape: 'Vertical down arrow with a lower receiving boundary. Contact compresses the arrow along its shaft; boundary releases on the shared part spring; a fresh arrow is ready at rest.',
};
