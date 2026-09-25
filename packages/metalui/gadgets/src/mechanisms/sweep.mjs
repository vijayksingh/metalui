// sweep: a radar beam turns once around the glass; each blip lights as the beam crosses it and fades.
// Verb: search. Invariant: the beam turns at one steady speed and comes back to where it started.
// Causal parts: the beam (turning) and the blips (lit by it). Forbidden: a blip lighting before the
// beam reaches it; a tick with no blip.
import { T, pose, light, actor, ease, strike, mechanism } from '../mechanism.mjs';

const TURN = 1400;                                    // ms for one turn
const beam = [pose(0, T(), ease.linear), pose(TURN, T({ r: 360 }))];
// A blip's own light, from the moment the beam crosses it: up fast, then fading over 600 ms.
const blip = [light(0, 0, 'none', ease.linear), light(40, 1, 'none', ease.settle), light(640, 0)];

export const sweep = mechanism('sweep', {
  mode: 'momentary',
  caption: 'The beam turns once around the glass; each blip lights as the beam crosses it, and fades.',
  stages: ['Turn', 'Cross', 'Fade'],
  slots: { beam: 'actor', face: 'trim', blips: 'actor?', lamp: 'lamp' },
  spring: 'part',
  duration: TURN,
  // Each blip's time comes from where it sits: its angle around the beam, as a share of the turn.
  phase: { blips: { by: 'angle', about: 'beam' } },
  loop: true,                                         // while the state that started it holds
  tracks: [actor('beam', 'centre', beam), actor('blips', 'centre', blip)],
  cues: [strike(0, 'blips', { level: 0.3 })],         // a glass tick as the beam crosses each blip
  states: { stopped: { hold: 'beam', pose: { r: 200 } } },
  reduced: ['lamp', 'sound'],
});
