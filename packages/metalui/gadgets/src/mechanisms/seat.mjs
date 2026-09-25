// seat: a plug that lifts out of its jack, hangs a moment, and seats again with a click.
// Verb: reconnect. Invariant: the plug returns to exactly where it was. Causal parts: the plug and
// its shadow (the shadow opens as the plug rises, closes as it lands). Forbidden: the jack moving;
// a sound before the plug lands.
import { T, spring, pose, light, actor, ease, strike, beep, lamp, landing, mechanism } from '../mechanism.mjs';

const UP = { y: -14, sx: 1.04, sy: 1.04 };          // lifted 14 units and nearer the light
const LIFTED = 140, HANG = 300;                      // ms: up by 140, released at 300
const SEATED = HANG + landing('part');              // the spring first brings it home: the click

const plug = [pose(0, T(), ease.accelerate), pose(LIFTED, T(UP), ease.smooth), pose(HANG, T(UP), ease.strike), ...spring(HANG, UP, {}, 'part', { still: 0.5 }).slice(1)];
const duration = plug[plug.length - 1].at;
// Its shadow opens (larger, softer, further away) while it is up, and closes as it lands.
const OPEN = T({ x: 6, y: 10, sx: 1.25, sy: 1.25 });
const shadow = [light(0, 1, T()), light(LIFTED, 0.55, OPEN), light(HANG, 0.55, OPEN), light(SEATED, 1, T()), light(duration, 1, T())];

export const seat = mechanism('seat', {
  mode: 'momentary',
  caption: 'The plug lifts, its shadow opens, and it seats again with a click.',
  stages: ['Lift', 'Hang', 'Seat'],
  slots: { plug: 'actor', socket: 'trim', lamp: 'lamp', beeper: 'trim?' },
  spring: 'part',
  duration,
  tracks: [actor('plug', 'centre', plug), actor('plug.shadow', 'centre', shadow)],
  cues: [
    strike(120, 'plug', { level: 0.2, pitch: 0.8 }),   // the pull: soft and a little low
    strike(SEATED, 'plug', { level: 0.85 }),           // the seat, the moment it lands (a heavy gadget's weight thumps through)
    lamp(SEATED, 'flicker'),                           // the lamp answers the click
    beep(SEATED + 20),                                 // and the state's own news, just after
  ],
  states: { half: { hold: 'plug', pose: { y: -7 } }, out: { hold: 'plug', pose: { x: -22, y: -46, r: -14 } } },
  reduced: ['lamp', 'sound'],
});
