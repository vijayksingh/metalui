// press: keys drop into their skirts and spring back, one after another: a chord.
// Verb: invoke. Invariant: a key returns exactly to where it was. Causal parts: each key's face (its
// skirt stays). Forbidden: a key rising above its rest; a sound before it bottoms out.
import tokens from '../../../../../tokens/tokens.json' with { type: 'json' };
import { T, spring, pose, actor, ease, strike, lamp, landing, mechanism } from '../mechanism.mjs';

const [dy, sx, sy] = tokens.gadgets.key.press;
const DOWN = { y: dy, sx, sy };                       // into the skirt, spreading a little under the finger (tokens gadgets.key)
const BOTTOM = 70, HELD = 110;                        // ms: bottomed out by 70, let go at 110
const TOP = HELD + landing('release');                // the spring first brings it home: the up-stroke's click

const key = [pose(0, T(), ease.accelerate), pose(BOTTOM, T(DOWN), ease.smooth), pose(HELD, T(DOWN), ease.strike), ...spring(HELD, DOWN, {}, 'release', { still: 0.3 }).slice(1)];

export const press = mechanism('press', {
  mode: 'momentary',
  caption: 'The keys drop into their skirts one after another and spring back: a chord.',
  stages: ['Down', 'Hold', 'Up'],
  slots: { keys: 'actor', lamp: 'lamp' },
  spring: 'release',
  duration: key[key.length - 1].at,
  stagger: 60,                                        // ms between one key and the next in a chord
  tracks: [actor('keys', 'centre', key)],
  cues: [
    strike(BOTTOM, 'keys', { level: 1 }),             // each key bottoms out: the down-stroke
    strike(TOP, 'keys', { level: 0.35, pitch: 1.3 }), // and hits its top stop coming back: quieter, higher
    lamp(BOTTOM, 'flicker'),                          // the lamp answers the first key
  ],
  states: {},
  reduced: ['lamp', 'sound', 'press'],
});
