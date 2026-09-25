import { actor, ease, end, light, motion, pose, spring, T, trace } from '../motion.mjs';

/* ── CHECK / a pen makes the tick, heavy into the corner ──────
 * Verb, object   yes, this one. A pen writes the tick: down the short leg, a press at the
 *                vertex, a flick up the long leg.
 * Invariant      the tick's shape never changes and its vertex never moves; the drawn tick
 *                is always on the page (it lightens to a guide while the pen goes over it),
 *                and it only ever turns about the vertex, at most 6°.
 * Causal parts   cause: the pen's ink, drawn from the short leg's end. Receiver: the tick,
 *                which takes the pen's weight at the vertex (tilts 6° into it) and is flicked
 *                back past rest when the long leg is thrown up. Payoff: two rays off the tip
 *                when the pen leaves it.
 * Neighbours     not Task (no box), not Close (never crossed), not a nod (the turn is caused
 *                by the pen's pressure, not added to agree).
 * Forbidden      a scale pulse, a bounce, a wiggle; a check that disappears.
 *
 *    0ms  rest
 *  120ms  the tick lightens to a .3 guide; the pen touches down at the short leg's end
 *  260ms  the ink reaches the vertex, slowing in; the tick tilts 5° into the pressure
 *  300ms  a beat at the corner, pressed to 6°
 *  420ms  the flick: the ink runs up the long leg to the tip; the tick swings to −6°
 *  450ms  two rays spring off the tip, fading by 640
 *  520ms  the tick is full again under the ink; 530 the ink hands over (identical, unseen)
 *  420ms+ the tick settles on the hinge spring
 *  793ms  exact rest
 * ────────────────────────────────────────────────────────── */
const swing = spring(420, { r: -6 }, {}, 'hinge', { still: 0.5 });
const D = end(swing);
const TICK = 'M5.4 12.6l4.1 4.1 9.1-9.4';
export const act = {
  body: `<g data-part="nod"><path data-part="tick" d="${TICK}"/><path class="ac" data-part="ink" opacity="0" pathLength="1" d="${TICK}"/><path class="ac" data-part="rays" opacity="0" d="M20.28 7.06l1.19 -0.17M18.84 5.62l0.17 -1.19" style="stroke-width:calc(var(--sw) * .7)"/></g>`,
  study: motion(D, 'A pen writes the tick: down the short leg, pressed into the corner, flicked up the long leg, and the tip rings.', ['Touch down', 'Press and flick', 'Ring out'], [
    actor('nod', '9.5px 16.7px', [
      pose(0, T(), ease.smooth),
      pose(120, T(), ease.smooth),
      pose(260, T({ r: 5 }), ease.smooth),
      pose(300, T({ r: 6 }), ease.strike),
      ...swing,
    ]),
    actor('tick', '9.5px 16.7px', [
      { at: 0, opacity: 1, easing: ease.smooth }, { at: 120, opacity: 0.3, easing: ease.linear },
      { at: 440, opacity: 0.3, easing: ease.smooth }, { at: 520, opacity: 1 }, { at: D, opacity: 1 },
    ]),
    actor('ink', '9.5px 16.7px', [
      { ...trace(0, 0, ease.linear), opacity: 0 },
      { ...trace(110, 0, ease.linear), opacity: 0 },
      { ...trace(120, 0, ease.smooth), opacity: 1 },
      { ...trace(260, 0.31, ease.linear), opacity: 1 },
      { ...trace(300, 0.31, ease.strike), opacity: 1 },
      { ...trace(420, 1, ease.linear), opacity: 1 },
      { ...trace(520, 1, ease.linear), opacity: 1 },
      { ...trace(530, 1, ease.linear), opacity: 0 },
      { ...trace(D, 0), opacity: 0 },
    ]),
    actor('rays', '18.6px 7.3px', [
      light(0, 0, 'scale(.5)'), light(415, 0, 'scale(.5)', ease.settle),
      light(455, 0.9, 'scale(1)', ease.smooth), light(640, 0, 'scale(1.3)'), light(D, 0, 'scale(.5)'),
    ]),
  ]),
  shape: 'Tick 4.1 / 9.1 legs about the vertex (9.5, 16.7). Motion (study): a pen rewrites it. The tick lightens to a guide, ink draws down the short leg and slows into the vertex, where the tick tilts 6° under the pressure, then flicks up the long leg; the tick swings back past rest on the hinge spring and two rays ring off the tip.',
};
