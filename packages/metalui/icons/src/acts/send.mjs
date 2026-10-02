import { actor, ease, motion, pose, T } from '../motion.mjs';

/* SEND / a folded message leaves along its tip
 * Verb/object: dispatch this message to its recipient. Folded paper is the message, not a file tray.
 * Invariant: the fold and plane move together; the pointed tip always leads the flight.
 * Before/after: message ready, departure along the diagonal, next message ready.
 * Neighbours: not Share (no upward tray), not External (no window boundary).
 * Forbidden: whole-icon spin, bobbing, sparkle. Compact / motion-off retain the folded-plane shape.
 *   0ms rest; 140ms draw back; 320ms dispatch; 430ms gone; 600ms replacement; 850ms rest.
 */
const TIMING = { gather:140, launch:320, gone:430, reset:440, ready:600, end:850 };
export const act = {
  body: `<g data-part="message"><path class="f" style="--duo:.12" d="m3.8 10.5 16.4-6.7-6.7 16.4-3-6.7-6.7-3Z"/><path d="m10.5 13.5 9.7-9.7"/></g>`,
  study: motion(TIMING.end, 'The folded message draws back, leaves along its pointed tip, and the next message is ready.', ['Gather', 'Dispatch', 'Ready'], [
    actor('message','10.5px 13.5px',[
      {...pose(0,T(),ease.accelerate),opacity:1},
      {...pose(TIMING.gather,T({x:-.8,y:.8}),ease.strike),opacity:1},
      {...pose(TIMING.launch,T({x:2,y:-2}),ease.accelerate),opacity:1},
      {...pose(TIMING.gone,T({x:3,y:-3}),ease.linear),opacity:0},
      {...pose(TIMING.reset,T(),ease.linear),opacity:0},
      {...pose(TIMING.ready,T(),ease.settle),opacity:1},
      {...pose(TIMING.end,T()),opacity:1},
    ]),
  ]),
  shape: 'Folded paper plane with one diagonal crease; its tip leads dispatch up-right, while the fold stays attached. No receiving tray or window frame.',
};
