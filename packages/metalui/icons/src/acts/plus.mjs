import { actor, ease, end, light, motion, pose, spring, T } from '../motion.mjs';

/* ── PLUS / the upright is driven into the waiting crossbar ───
 * Verb, object   make a new one. The plus is assembled: its upright is set into the
 *                crossbar, and the tile it is made on takes the blow.
 * Invariant      an upright plus on its tile; it never turns (at 45° it is Close), the
 *                upright never leaves its axis, and it always crosses the crossbar (lifted,
 *                its foot still reaches 1.2 below the bar), so a minus never shows.
 * Causal parts   cause: the upright, lifted along its axis and driven down into the bar.
 *                Receiver: the crossbar, pushed down and widened by the contact, then the
 *                tile, heavier, a beat later. Payoff: the knock runs out along the bar and
 *                leaves its two ends as a pair of beads.
 * Neighbours     not Close (never turned), not Zoom In (no lens), not a swell (nothing
 *                grows: the upright travels, the bar is struck).
 * Forbidden      axial shrink/grow as the action, a spin, a whole-tile pulse.
 *
 *    0ms  rest
 *  170ms  the upright lifts 2 along its axis, drawn out a little (1.04)
 *  250ms  it is driven down past its seat (.6) and squashes (.86) on the bar
 *  265ms  the crossbar is pushed .6 down and widens (1.07) under the contact
 *  290ms  the tile takes the blow a beat later (.96 tall, 1.02 wide)
 *  300ms  beads leave the bar's two ends and run out to the tile's walls, fading by 540
 *  250ms+ upright and bar recover on the part spring, the tile on the object spring
 *  875ms  exact rest
 * ────────────────────────────────────────────────────────── */
const up = spring(250, { y: 0.6, sy: 0.86 }, {}, 'part');
const bar = spring(265, { y: 0.6, sx: 1.07 }, {}, 'part');
const tile = spring(290, { sx: 1.02, sy: 0.96 }, {}, 'object');
const D = Math.max(end(up), end(bar), end(tile));
const fin = (frames) => (end(frames) === D ? frames : [...frames, pose(D, T())]);
export const act = {
  body: `<g data-part="tile"><rect class="f" style="--duo:.12" x="4.5" y="4.5" width="15" height="15" rx="3.5"/></g><path data-part="bar" d="M8.8 12h6.4"/><path data-part="upright" d="M12 8.8v6.4"/><path class="ac" data-part="beads" opacity="0" d="M7 12h.01M17 12h.01" style="stroke-width:calc(var(--sw) * .7)"/>`,
  study: motion(D, 'The upright is lifted and driven into the waiting crossbar; the knock runs out to the bar\'s ends.', ['Lift', 'Insert', 'Propagate'], [
    actor('upright', '12px 12px', [
      pose(0, T(), ease.smooth),
      pose(170, T({ y: -2, sy: 1.04 }), ease.accelerate),
      ...fin(up),
    ]),
    actor('bar', '12px 12px', [
      pose(0, T(), ease.linear),
      pose(245, T(), ease.strike),
      ...fin(bar),
    ]),
    actor('tile', '12px 12px', [
      pose(0, T(), ease.linear),
      pose(255, T(), ease.smooth),
      ...fin(tile),
    ]),
    actor('beads', '12px 12px', [
      light(0, 0, 'scale(.95,1)'), light(285, 0, 'scale(.95,1)', ease.settle),
      light(320, 1, 'scale(1,1)', ease.smooth), light(540, 0, 'scale(1.15,1)'), light(D, 0, 'scale(.95,1)'),
    ]),
  ]),
  shape: 'Tile 15 × 15 r3.5, tinted .12; plus arms 6.4 on the centre, always upright: at 45° a plus is the close glyph, so it never turns. Motion (study): the upright lifts 2 along its axis and is driven down into the crossbar, squashing .86; the bar is pushed .6 and widens 1.07 under it, the tile takes the blow a beat later on the object spring, and two beads run out off the bar\'s ends.',
};
