import { actor, ease, motion, pose, spring, T } from '../motion.mjs';

/* UPLOAD / cross the upper transfer boundary
 * Verb/object: transfer content out to the service.
 * Invariant: the arrow always points up; the receiving boundary never becomes the other direction.
 * Contact: arrow compresses at the boundary; receiver gives 1 then returns on its part spring.
 * Neighbours: not Share (an open sending tray), not Save (no retained storage case).
 * No generic spin/pulse: motion follows the transfer axis; full glyph remains under reduced motion.
 *   0ms rest; 220ms rise; 350ms contact; 490ms transferred; 760ms next transfer ready; 1020ms rest.
 */
const TIMING = { approach: 220, contact: 350, received: 490, reset: 500, ready: 760, end: 1020 };
const receiver = [pose(0, T(), ease.smooth), pose(TIMING.contact-30,T(),ease.accelerate), pose(TIMING.contact, T({ y: -1 }), ease.strike),
  ...spring(TIMING.contact+30, { y: -1 }, {}, 'part').slice(0,-1), pose(TIMING.end,T())];
export const act = {
  body: `<path data-part="receiver" d="M4.8 7.5v-2a1.7 1.7 0 0 1 1.7-1.7h11a1.7 1.7 0 0 1 1.7 1.7v2"/><path data-part="arrow" d="M12 19.8v-11M8.8 12 12 8.8 15.2 12"/>`,
  study: motion(TIMING.end, 'The arrow rises to the upper boundary; the boundary receives it and releases.', ['Travel', 'Receive', 'Ready'], [
    actor('receiver', '12px 3.8px', receiver),
    actor('arrow', '12px 8.8px', [
      { ...pose(0,T(),ease.accelerate), opacity:1 },
      { ...pose(TIMING.approach,T({y:-0.9}),ease.strike), opacity:1 },
      { ...pose(TIMING.contact,T({y:-4.3,sy:.88}),ease.smooth), opacity:1 },
      { ...pose(TIMING.received,T({y:-4.5,sy:.78}),ease.linear), opacity:0 },
      { ...pose(TIMING.reset,T(),ease.linear), opacity:0 },
      { ...pose(TIMING.ready,T(),ease.settle), opacity:1 },
      { ...pose(TIMING.end,T()), opacity:1 },
    ]),
  ]),
  shape: 'Vertical up arrow with an upper receiving boundary. Contact compresses the arrow along its shaft; boundary releases on the shared part spring; a fresh arrow is ready at rest.',
};
