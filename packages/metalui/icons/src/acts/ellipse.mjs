import { actor, ease, light, motion, T } from '../motion.mjs';

/* ── ELLIPSE / a pen traces the ellipse all the way round ─────
 * Verb, object   draw an ellipse. The pen goes down on the rightmost point and draws the
 *                whole curve in one stroke, back to where it started.
 * Invariant      the ellipse is always there: the old outline dims to a guide, never goes;
 *                the new stroke lies exactly on it. Nothing changes size or shape.
 * Causal parts   cause: the pen point, landing and travelling clockwise. Receiver: the new
 *                stroke, drawn exactly as far as the pen has gone (by arc length).
 *                Payoff: the loop closes where it began and a ring marks the join.
 * Neighbours     not Loading (it goes round once, eases in and out, and stops), not Circle
 *                or Target (no centre, no rings at rest), not Rectangle (traced, not dragged).
 * Forbidden      a spin, a stretch toward a circle (shape tweening), a pulse.
 *
 *    0ms  rest
 *  160ms  the pen comes down on the right point and presses (.8); the outline dims to .22
 *  220ms  the pen sets off clockwise, gathering speed
 *  800ms  it arrives back at its start: the stroke is whole
 *  810ms  the ring opens at the join; the outline comes back up under the new stroke
 *  920ms  the pen lifts away
 * 1100ms  exact rest (the new stroke is folded away under the outline)
 * ────────────────────────────────────────────────────────── */

const CX = 12, CY = 12, RX = 8.6, RY = 6.9;
const at = (a) => [CX + RX * Math.cos(a), CY + RY * Math.sin(a)];
// Arc length from the start (the rightmost point) to angle a, clockwise on screen, as a fraction.
const LEN = (() => {
  const n = 720, acc = [0];
  for (let i = 1; i <= n; i++) {
    const [x0, y0] = at(((i - 1) / n) * 2 * Math.PI), [x1, y1] = at((i / n) * 2 * Math.PI);
    acc.push(acc[i - 1] + Math.hypot(x1 - x0, y1 - y0));
  }
  return (a) => acc[Math.round((a / (2 * Math.PI)) * n)] / acc[n];
})();

// The pen's journey: 16 steps round, spaced in time by an ease-in-out so it gathers speed and
// arrives gently. Between steps it moves in a straight line (a sixteenth of the way round).
const T0 = 220, T1 = 800, N = 16;
const steps = Array.from({ length: N + 1 }, (_, k) => {
  const p = k / N;
  // when the pen has gone this share of the way round, on an ease-in-out (quadratic) clock
  const u = p < .5 ? Math.sqrt(p / 2) : 1 - Math.sqrt((1 - p) / 2);
  return { at: Math.round(T0 + (T1 - T0) * u), a: p * 2 * Math.PI };
});
const penAt = (a) => { const [x, y] = at(a); return { x: x - (CX + RX), y: y - CY }; };

export const act = {
  body: `<ellipse data-part="outline" cx="12" cy="12" rx="8.6" ry="6.9"/><ellipse data-part="stroke" pathLength="1" cx="12" cy="12" rx="8.6" ry="6.9"/><circle class="ac s" data-part="pen" opacity="0" cx="20.6" cy="12" r="1.4"/><circle class="ac" data-part="join" opacity="0" cx="20.6" cy="12" r="2.6" style="stroke-width:calc(var(--sw) * .7)"/>`,
  study: motion(1100, 'A pen comes down on the ellipse and draws it again all the way round; the loop closes where it began.', ['Pen down', 'Trace', 'Close'], [
    actor('outline', '12px 12px', [
      { at: 0, opacity: 1, easing: ease.smooth }, { at: 180, opacity: .22, easing: ease.smooth },
      { at: 790, opacity: .22, easing: ease.smooth }, { at: 880, opacity: 1 }, { at: 1100, opacity: 1 },
    ]),
    actor('stroke', '12px 12px', [
      { at: 0, draw: 0, easing: ease.linear },
      ...steps.map((s) => ({ at: s.at, draw: +LEN(s.a).toFixed(4), easing: ease.linear })),
      { at: 900, draw: 1, easing: ease.linear }, { at: 1100, draw: 0 },
    ].filter((f, i, all) => i === 0 || f.at > all[i - 1].at)),
    actor('pen', '20.6px 12px', [
      light(0, 0, T({ sx: 1.8, sy: 1.8 }), ease.accelerate),
      light(160, 1, T({ sx: .8, sy: .8 }), ease.smooth),
      ...steps.map((s, i) => light(s.at, 1, T({ ...penAt(s.a), sx: 1, sy: 1 }), ease.linear)),
      light(820, 1, T({ sx: .85, sy: .85 }), ease.smooth),
      light(920, 0, T({ sx: 1.6, sy: 1.6 }), ease.smooth),
      light(1100, 0, T({ sx: 1.8, sy: 1.8 })),
    ]),
    actor('join', '20.6px 12px', [
      light(0, 0, 'scale(.5)'), light(790, 0, 'scale(.5)', ease.settle),
      light(850, .85, 'scale(.9)', ease.smooth), light(1040, 0, 'scale(1.45)'), light(1100, 0, 'scale(.5)'),
    ]),
  ]),
  shape: 'An 8.6 × 6.9 ellipse, open, as wide as the Image frame, with a second copy on top that draws. Motion (study): a pen point comes down on the rightmost point and travels clockwise once round (16 steps, eased in and out), the new stroke drawn behind it by arc length while the old outline dims to a .22 guide; at the join a ring opens, the outline comes back up and the pen lifts away.',
};
