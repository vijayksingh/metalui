// swing: a needle swings to a value, overshoots a little and settles; the ends of its scale are pegs.
// Verb: measure. Invariant: the needle points at the value once it settles. Causal parts: the needle
// (its face never moves). Forbidden: a sound while it swings (a needle is silent; the beeper speaks
// when the value crosses the threshold, through the gadget's state).
import { mechanism } from '../mechanism.mjs';

export const swing = mechanism('swing', {
  mode: 'held',
  caption: 'The needle swings to the value, overshoots a little and settles; at the ends of its scale it bounces off the pegs.',
  stages: ['Swing', 'Overshoot', 'Settle'],
  slots: { needle: 'actor', face: 'trim', lamp: 'lamp', beeper: 'trim?' },
  spring: 'part',                      // a light needle: it overshoots and comes back
  held: {
    drive: 'number',
    slot: 'needle',
    from: { r: -60 }, to: { r: 60 },  // a 120° scale; the gadget turns it by its needle's own arc
    detents: 0,
    stagger: 0,
    wall: 0.35,                        // a peg sends it back a third as fast
    impactFull: 1, scrapeFull: 1,
    tickMin: 0.15, tickGap: 40,
    step: 240,
  },
  cues: [],
  states: {},
  reduced: ['lamp', 'sound'],
});
