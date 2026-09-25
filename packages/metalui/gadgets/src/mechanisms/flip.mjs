// flip: a lid swings about its hinge to where the state holds it (closed, ajar, open); emptied, it
// swings open and slams shut. Verb: dispose. Invariant: the lid turns about its hinge and nothing else
// moves; closed is a wall it thuds against. Causal parts: the lid. Forbidden: a sound while it rests;
// a thud without the lid reaching the wall; red anywhere but the lamp and the lid's underside.
import { mechanism, scrape, stop } from '../mechanism.mjs';

export const flip = mechanism('flip', {
  mode: 'held',
  caption: 'The lid swings about its hinge: it creaks as it rises, and thuds shut against the rim. Emptied, it swings open and slams.',
  stages: ['Lift', 'Swing', 'Thud'],
  slots: { lid: 'actor', lamp: 'lamp' },
  spring: 'hinge',                     // a heavy flap: it swings, overshoots a little, and falls back
  held: {
    drive: 'state',
    slot: 'lid',
    from: { r: 0 }, to: { r: -70 },    // closed at 0, open at 1; the gadget turns it about its own hinge
    detents: 0,
    stagger: 0,
    wall: 0.2,                         // shut is a wall: it bounces back a fifth as fast
    impactFull: 2,                     // travel per second that shuts at full thud
    scrapeFull: 3,
    tickMin: 0.15, tickGap: 40,
    step: 240,
    pulse: 900,                        // ms: an act (emptied) swings it open and lets it fall at half of this
  },
  cues: [scrape('lid', 0.08), stop('lid', 0.9)],   // the creak, low; the thud as it shuts
  states: { open: { hold: 'lid', pose: { r: -70 } }, ajar: { hold: 'lid', pose: { r: -18 } } },
  reduced: ['lamp', 'sound'],
});
