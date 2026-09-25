// roll: numbered drums turn to show a count, the lowest digit first, like an odometer.
// Verb: count. Invariant: counting up, a drum only ever turns forward (9 runs on into 0). Causal parts:
// the drums (the window is a cut and never moves). Forbidden: a drum turning back through 8 on the way
// from 9 to 0; a higher drum moving when its digit does not change.
import { mechanism, detent, settle } from '../mechanism.mjs';

export const roll = mechanism('roll', {
  mode: 'held',
  caption: 'The drums turn to the new count, the lowest first; each ticks past its digits and settles with a small knock.',
  stages: ['Turn', 'Carry', 'Settle'],
  slots: { drums: 'actor', window: 'cut', lamp: 'lamp' },
  spring: 'settle',                    // a drum settles on its digit without a visible overshoot
  held: {
    drive: 'count',
    slot: 'drums',
    roll: true,                        // no walls: a drum turns round and round
    stagger: 60,                       // ms: a higher drum starts this long after the one below it
    tickMin: 0.5,                      // digits a second: slower than this, crossing a digit is a wobble
    tickGap: 30,                       // ms: at most one tick per drum this often
    rest: 0.01,                        // digits: this close and still, a drum has settled
    step: 240,                         // integration steps per second, the same on both platforms
  },
  cues: [detent('drums', 0.35), settle('drums', 0.2)],
  states: {},
  reduced: ['lamp', 'sound'],
});
