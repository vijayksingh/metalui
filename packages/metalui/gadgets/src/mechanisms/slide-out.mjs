// slide-out: a drawer is pulled out toward you on its runners, stops against them, is held open a
// moment, and springs home. Verb: store. Invariant: the tray and its pull move as one along the
// runners and come back to where they were. Causal parts: the tray and the pull (the body never moves).
// Forbidden: a stop before the tray reaches the end of its runners; the tray leaving its line.
//
// Seen from above, "out toward you" is down the canvas (y), where a drawer front faces the viewer.
import { T, spring, pose, actor, ease, strike, friction, landing, mechanism } from '../mechanism.mjs';

const OUT = 60;                                       // units the runners let it out
const PULLED = 180, LET_GO = 420;                     // ms: out against the runners by 180, let go at 420
const HOME = LET_GO + landing('object');              // the spring first brings it home: it knocks shut
const tray = [pose(0, T(), ease.accelerate), pose(PULLED, T({ y: OUT }), ease.linear), pose(LET_GO, T({ y: OUT }), ease.linear), ...spring(LET_GO, { y: OUT }, {}, 'object').slice(1)];

export const slideOut = mechanism('slide-out', {
  mode: 'momentary',
  caption: 'The drawer is pulled out toward you on its runners, stops against them, is held a moment, and springs home.',
  stages: ['Pull', 'Hold', 'Home'],
  slots: { tray: 'actor', pull: 'actor', lamp: 'lamp' },
  spring: 'object',
  duration: tray[tray.length - 1].at,
  tracks: [actor('tray', 'centre', tray), actor('pull', 'centre', tray)],
  cues: [
    friction(0, PULLED, 'tray', 0.15),                // the runners, while it slides out
    strike(PULLED, 'tray', { level: 0.6 }),           // the runners' stop
    strike(HOME, 'tray', { level: 0.5 }),             // and home again
  ],
  states: { open: { hold: 'tray', pose: { y: OUT } }, full: { hold: 'tray', pose: { y: 22 } } },
  reduced: ['lamp', 'sound'],
});
