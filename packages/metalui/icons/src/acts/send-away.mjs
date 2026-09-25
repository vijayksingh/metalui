import { actor, ease, light, motion, pose, spring, T } from '../motion.mjs';

/* ── SEND-AWAY / the well draws the dot in and swallows it ────
 * Verb, object   send this away (a soft delete). The spiral is a well; the dot is the thing
 *                being sent. The well turns and pulls the dot round and down into its centre.
 * Invariant      the spiral is always the same spiral about 12/12 (it only turns, never more
 *                than 26°); the dot is either on its way in or on its rest spot on the rim.
 * Causal parts   cause: the well turning (the spiral leads). Receiver: the dot, drawn
 *                into the mouth and 300° down the groove between the arms (it never crosses a
 *                stroke), gathering speed and shrinking as it sinks.
 *                Payoff: a gulp ring at the centre as it goes under. Then a fresh dot rises on
 *                the rim, so the rest glyph is whole again.
 * Neighbours     not Refresh/Sync (nothing loops back round; the dot is taken in, not
 *                circulated), not Loading (one pass, then stillness), not Trash (no container).
 * Forbidden      a free spin of the whole glyph, a scale pulse of the dot in place.
 *
 *    0ms  rest
 *  160ms  the dot draws back 12° against the pull; the well winds up −6° (anticipate)
 *  700ms  carried 300° round the groove and 7.2 units in, accelerating; the well turns +24°
 *  720ms  gone under at the centre; the gulp ring opens
 *  740–800ms  (hidden) the carrier returns to the rim
 *  860ms  a new dot rises on the rim, overshoots 1.15 at 940, settles (part spring)
 *  1200ms  the well has unwound; 1245ms exact rest
 * ────────────────────────────────────────────────────────── */

// The spiral exactly as icons.mjs draws it (Archimedean, clockwise, outer end at −50°).
const C = 12;
const f = (n) => +n.toFixed(2);
function spiral() {
  const turns = 1.62, r0 = 1.05, r1 = 8.5;
  const Th = turns * 2 * Math.PI;
  const endA = (-50 * Math.PI) / 180;
  const a0 = endA - Th;
  const N = 70;
  let d = '';
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const r = r0 + (r1 - r0) * Math.pow(t, 0.92);
    const a = a0 + Th * t;
    d += (i ? 'L' : 'M') + f(C + r * Math.cos(a)) + ' ' + f(C + r * Math.sin(a));
  }
  const dotA = endA + (38 * Math.PI) / 180, dotR = 8.35;
  return { d, dot: [f(C + dotR * Math.cos(dotA)), f(C + dotR * Math.sin(dotA))], dotA };
}
const SP = spiral();
const ux = Math.cos(SP.dotA), uy = Math.sin(SP.dotA);
const inward = (k) => ({ x: -ux * k, y: -uy * k });
const [dx, dy] = SP.dot;

// The groove: at each angle the dot runs midway between the arm outside it and the arm one turn
// in, so it never crosses a stroke. It enters at the mouth (the outer end), then follows the
// channel round, counter-clockwise, down into the core. Sampled every 30° of its travel.
const Th = 1.62 * 2 * Math.PI, endA = (-50 * Math.PI) / 180, a0 = endA - Th;
const arm = (a) => { const t = (a - a0) / Th; return t < 0 ? 0 : 1.05 + 7.45 * Math.pow(Math.min(t, 1), 0.92); };
const groove = (deg) => {
  const psi = SP.dotA + (deg * Math.PI) / 180;
  if (psi > endA) { const c = (8.5 + arm(endA - 2 * Math.PI)) / 2; return c + (8.35 - c) * ((psi - endA) / (SP.dotA - endA)); }
  return (arm(psi) + (psi - 2 * Math.PI >= a0 ? arm(psi - 2 * Math.PI) : 0)) / 2;
};
const TRAVEL = [0, -30, -60, -90, -120, -150, -180, -210, -240, -270, -300];
const radius = (deg) => (deg > -270 ? groove(deg) : deg === -270 ? 2.7 : 1.1); // the core: straight down the drain
const t0 = 160, t1 = 700;
const when = (i) => Math.round(t0 + (t1 - t0) * Math.pow(i / (TRAVEL.length - 1), 1 / 1.7)); // gathering speed
const drawIn = (fn) => TRAVEL.map((deg, i) => pose(when(i), T(fn(deg)), ease.linear));

const orb = [
  pose(0, T(), ease.smooth),
  pose(120, T({ r: 12 }), ease.smooth),
  ...drawIn((deg) => ({ r: deg })),
  pose(740, T({ r: -300 }), ease.linear),
  pose(800, T()),
];
const rad = [
  pose(0, T(), ease.smooth),
  pose(120, T(inward(-0.3)), ease.smooth),
  ...drawIn((deg) => inward(8.35 - radius(deg))),
  pose(740, T(inward(8.35 - 1.1)), ease.linear),
  pose(800, T()),
];
const dot = [
  { at: 0, transform: T(), opacity: 1, easing: ease.smooth },
  pose(160, T(), ease.smooth),
  pose(290, T({ sx: 0.72, sy: 0.72 }), ease.linear), // small enough for the channel (2.2 clear) as it enters the mouth
  pose(560, T({ sx: 0.6, sy: 0.6 }), ease.accelerate),
  { at: 700, transform: T({ sx: 0.4, sy: 0.4 }), opacity: 1, easing: ease.accelerate },
  { at: 720, transform: T({ sx: 0.2, sy: 0.2 }), opacity: 0, easing: ease.linear },
  { at: 860, transform: T({ sx: 0.2, sy: 0.2 }), opacity: 0, easing: ease.strike },
  ...spring(940, { sx: 1.15, sy: 1.15 }, {}, 'part', { still: 0.4 }).map((fr, i) => (i ? fr : { ...fr, opacity: 1 })),
];
const well = [
  pose(0, T(), ease.smooth),
  pose(160, T({ r: -6 }), ease.accelerate),
  pose(700, T({ r: 24 }), ease.settle),
  pose(780, T({ r: 26 }), ease.smooth),
  pose(1080, T({ r: -1.5 }), ease.smooth),
  pose(1200, T()),
];
const D = Math.max(dot[dot.length - 1].at, well[well.length - 1].at);
const hold = (frames) => (frames[frames.length - 1].at < D ? [...frames, { ...frames[frames.length - 1], at: D, easing: undefined }] : frames);
// A frame without an easing key: drop the undefined so the build sees only real properties.
const clean = (frames) => frames.map((fr) => Object.fromEntries(Object.entries(fr).filter(([, v]) => v !== undefined)));

export const act = {
  body: `<g data-part="well"><path d="${SP.d}"/><g data-part="orb"><g data-part="rad"><circle data-part="dot" class="s" cx="${dx}" cy="${dy}" r="1.4"/></g></g></g><circle class="ac" data-part="gulp" opacity="0" cx="12" cy="12" r="2.3" style="stroke-width:calc(var(--sw) * .7)"/>`,
  study: motion(D, 'The well turns and draws the dot round and down into its centre; it goes under with a gulp and a new dot rises on the rim.', ['Wind up', 'Draw in', 'Rise again'], [
    actor('well', '12px 12px', clean(hold(well))),
    actor('orb', '12px 12px', clean(hold(orb))),
    actor('rad', '12px 12px', clean(hold(rad))),
    actor('dot', `${dx}px ${dy}px`, clean(hold(dot))),
    actor('gulp', '12px 12px', [
      light(0, 0, 'scale(.4)'), light(690, 0, 'scale(.4)', ease.settle),
      light(740, 0.9, 'scale(.8)', ease.smooth), light(960, 0, 'scale(1.6)'), light(D, 0, 'scale(.4)'),
    ]),
  ]),
  shape: 'Archimedean spiral r = 1.05→8.5 over 1.62 turns, clockwise, outer end at −50°. Dot r1.4 at 38° ahead of the end on r8.35, carried by two nested parts (orb turns about the centre, rad moves it along its radius). Motion (study): the well turns +26°, the dot is drawn 300° down the groove between the arms, shrinks and goes under with a gulp ring; a new dot rises on the rim.',
};
