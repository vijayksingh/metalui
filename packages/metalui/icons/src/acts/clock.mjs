import { actor, ease, light, motion, pose, T } from '../motion.mjs';

/* ── CLOCK / an hour passes, then the hands are set back ──────
 * Verb, object   time passing. The face is the clock; the two hands are geared 12 : 1.
 * Invariant      the face never moves; both hands turn only about the centre, and at every frame
 *                the hour hand has turned exactly 1/12 of the minute hand, so the face always shows
 *                a time a real clock can show.
 * Causal parts   cause: the movement taking up and driving the minute hand a full turn.
 *                Receiver: the hour hand, rigidly geared to it, stepping one hour on.
 *                Payoff: a tick at 12 the moment the minute hand arrives on the hour.
 * Neighbours     not History (no ring arrow; this goes forward first), not Timer/Stopwatch (no
 *                crown, no single sweep), not Sync (the face does not turn).
 * Forbidden      a free spin, the whole face turning, the hour hand moving on its own.
 *
 *    0ms  rest (minute on 12, hour at 4)
 *  120ms  take-up: the minute hand draws back 10° (hour −0.83°)
 *  700ms  an hour passes: minute sweeps +364° (overshooting 12 by 4° against its detent),
 *         hour +30.3°; the tick at 12 flashes as the minute hand arrives (660–720)
 *  780ms  minute recoils to 358.5°, hour to 29.9° … 840ms both exactly on the hour (360°, 30°)
 *  900ms  hold, the hour has passed
 * 1180ms  the hands are set back: minute −360° to −6° past 12 (hour −0.5°)
 * 1300ms  exact rest
 * ────────────────────────────────────────────────────────── */
const D = 1300;
const GEAR = 12;
const hands = [
  [0, 0, ease.settle],
  [120, -10, 'cubic-bezier(.45,0,.2,1)'],
  [700, 364, ease.smooth],
  [780, 358.5, ease.smooth],
  [840, 360, ease.linear],
  [900, 360, 'cubic-bezier(.5,0,.25,1)'],
  [1180, -6, ease.settle],
  [D, 0],
];
export const act = {
  body: `<path class="f" style="--duo:.08" d="M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 1 1 0-17Z"/><path data-part="hour" d="M12 12l3.2 2"/><path data-part="minute" d="M12 12V7.4"/><path class="ac" data-part="tick" opacity="0" d="M12 5v1" style="stroke-width:calc(var(--sw) * .8)"/>`,
  study: motion(D, 'An hour passes: the minute hand sweeps round as the hour hand steps one on, a tick marks the hour, and the hands are set back.', ['Take up', 'An hour', 'Set back'], [
    actor('minute', '12px 12px', hands.map(([at, deg, e]) => pose(at, T({ r: deg }), e))),
    actor('hour', '12px 12px', hands.map(([at, deg, e]) => pose(at, T({ r: +(deg / GEAR).toFixed(4) }), e))),
    actor('tick', '12px 5.5px', [
      light(0, 0, 'scale(.3)'), light(640, 0, 'scale(.3)', ease.settle),
      light(700, 1, 'scale(1)', ease.smooth), light(900, 0, 'scale(1.3)'), light(D, 0, 'scale(.3)'),
    ]),
  ]),
  shape: 'Face r8.5, tinted .08; two hands about the centre, minute 4.6 (up) and hour 3.8, so the face always shows a time a clock can show. Motion (study): hands geared 12 : 1 on one timeline: a 10° take-up, the minute hand sweeps a full turn (hour one hour on) into a detent overshoot, a tick flashes at 12 on the hour, then both are set back to rest.',
};
