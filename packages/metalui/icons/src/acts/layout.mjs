import { actor, ease, end, light, motion, pose, spring, T } from '../motion.mjs';

/* ── LAYOUT / the panes are pulled apart and snap back onto the grid ──
 * Verb, object   lay out. The three panes are regions of one grid; the gutter is the rule
 *                that holds them apart.
 * Invariant      one tall pane left, two squares stacked right; the columns never cross
 *                the gutter line and never swap, so the layout reads on every frame.
 * Causal parts   cause: the columns drawn apart and let go. Receiver: the gutter they seat
 *                against, the tall pane first, the squares a beat behind (heavier stack).
 *                Payoff: the gutter rule flashes where they land, then fades.
 * Neighbours     not Tidy (no loose tiles squared to a guide), not Grid/Group (nothing
 *                gathers), not a swap (the old act crossed the columns).
 * Forbidden      a whole-icon pulse, a slide-show swap, tiles flying off.
 *
 *    0ms  rest
 *  190ms  columns drawn apart: tall pane 1.1 left, squares 1.3 right (the top one leads)
 *  250ms  held open a beat
 *  370ms  tall pane strikes home, squashing .84 against the gutter
 *  400ms  top square strikes home; 430ms  bottom square
 *  380ms  the gutter rule flashes at the seam, then fades by 760ms
 *  ~1100ms each pane springs out of its squash on the object spring; exact rest
 * ────────────────────────────────────────────────────────── */
const OPEN = 190, HOLD = 250, HIT = 370;

// a column: drawn out to `dx`, struck back to its slot squashed against the gutter,
// then released on the object spring. `lag` delays the heavier stack a beat.
const pane = (dx, lag) => {
  const hit = HIT + lag;
  return [
    pose(0, T(), ease.smooth),
    pose(OPEN + lag, T({ x: dx }), ease.smooth),
    pose(HOLD + lag, T({ x: dx * 1.05 }), ease.accelerate),
    ...spring(hit, { sx: 0.84, sy: 1.06 }, {}, 'object'),
  ];
};
const tall = pane(-1.1, 0), top = pane(1.3, 30), bottom = pane(1.3, 60);
const D = Math.max(end(tall), end(top), end(bottom));
const hold = (f) => (end(f) < D ? [...f.slice(0, -1), { ...f[f.length - 1], easing: ease.linear }, pose(D, T())] : f);

export const act = {
  body: `<g data-part="tall"><rect class="f" style="--duo:.16" x="3.6" y="3.6" width="7" height="16.8" rx="2.4"/></g><g data-part="top"><rect x="13.4" y="3.6" width="7" height="7" rx="2.4"/></g><g data-part="bottom"><rect x="13.4" y="13.4" width="7" height="7" rx="2.4"/></g><path class="ac" data-part="rule" opacity="0" d="M12 4.6v14.8" style="stroke-width:calc(var(--sw) * .6)"/>`,
  study: motion(D, 'The panes are drawn apart, snap back onto the grid, and the gutter rule flashes where they seat.', ['Draw apart', 'Snap', 'Seat'], [
    // the pane squashes about the edge that meets the gutter
    actor('tall', '10.6px 12px', hold(tall)),
    actor('top', '13.4px 7.1px', hold(top)),
    actor('bottom', '13.4px 16.9px', hold(bottom)),
    actor('rule', '12px 12px', [
      light(0, 0, 'scale(1,.4)'), light(HIT, 0, 'scale(1,.4)', ease.strike),
      light(HIT + 50, 0.85, 'scale(1,1)', ease.smooth), light(760, 0, 'scale(1,1.04)'), light(D, 0, 'scale(1,.4)'),
    ]),
  ]),
  shape: 'One tall + two square tiles, radius 2.4, 2.8u gutter. Motion (study): the columns are drawn apart (tall 1.1 left, squares 1.3 right), snap back onto the gutter squashing .84 against it in order tall, top, bottom, and spring out of the squash on the object spring; a gutter rule flashes at the seam.',
};
