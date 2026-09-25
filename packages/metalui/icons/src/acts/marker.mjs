import { actor, ease, light, motion, pose, T } from '../motion.mjs';

/* ── MARKER / the chisel plants flat and sweeps a band ────────
 * Verb, object   highlight. The marker is lifted back, its chisel planted flat on the page
 *                (it squashes on contact), and swept right in one straight stroke: a
 *                see-through band is laid exactly as far as the tip has travelled.
 * Invariant      a marker at 45°, chisel down-left; it leans at most 5°, travels at most 1.5
 *                left and 3.1 right, and while it sweeps the band's right end is at its chisel.
 * Causal parts   cause: the chisel, planted then swept. Receiver: the page.
 *                Payoff: the translucent band (an accent), laid under the sweep, gone at rest.
 * Neighbours     not Draw/Pen (a straight, wide, see-through band, no line), not Paint bucket
 *                (nothing pours), not Eraser (it adds a mark).
 * Forbidden      a wiggle, a scribble, a marker spin, the band pulsing on its own.
 *
 *  The band is 5.2 × 3.2 at x 2.8, y 16.1 (duo .32), just under the chisel's flat face; its length is .1 + .9 × the sweep (same curve),
 *  so its right end stays ~.4 ahead of the chisel point (2.96 → 7.56).
 *
 *    0ms  rest
 *  160ms  lifts 1.3 and back, leaning back 4° (anticipate)
 *  280ms  plants its chisel flat at the start of the band: .3 into the page, squashed .94
 *  300ms  the band appears under the chisel
 *  320ms  sweeps right 4.6 in one straight stroke, trailing 5°; the band grows with it
 *  640ms  the band is laid; 740ms the marker flicks up off the page
 *  850ms  the band starts to fade, gone by 1050ms
 * 1020ms  the marker swings home past rest by .25
 * 1120ms  exact rest
 * ────────────────────────────────────────────────────────── */
const D = 1120;

export const act = {
  body: `<rect class="d ac" data-part="band" opacity="0" style="--duo:.32" x="2.8" y="16.1" width="5.2" height="3.2" rx="1.3"/><g data-part="marker"><g transform="translate(-1.6 .6) rotate(45 12 12)"><path class="f" style="--duo:.16" d="M9.4 4.6a1.4 1.4 0 0 1 1.4-1.4h2.4a1.4 1.4 0 0 1 1.4 1.4v8.8H9.4Z"/><path d="M10.2 13.4h3.6v2.1l-3.6 3.1Z"/></g></g>`,
  study: motion(D, 'The marker plants its chisel flat and sweeps right, laying a see-through band as far as it goes.', ['Plant', 'Sweep', 'Lift'], [
    actor('marker', '4.5px 16px', [
      pose(0, T(), ease.smooth),
      pose(160, T({ x: -1.1, y: -1.3, r: -4 }), ease.accelerate),
      pose(280, T({ x: -1.5, y: 0.3, r: 3, sx: 1.05, sy: 0.94 }), ease.smooth),
      pose(320, T({ x: -1.48, y: 0.15, r: 4, sx: 1.02, sy: 0.97 }), ease.smooth),
      pose(640, T({ x: 3.1, y: 0.1, r: 5, sx: 1.02, sy: 0.97 }), ease.smooth),
      pose(740, T({ x: 2.9, y: -1.5, r: -3 }), ease.smooth),
      pose(1020, T({ x: -0.25, y: 0.2, r: 1 }), ease.settle),
      pose(D, T()),
    ]),
    actor('band', '2.8px 17.7px', [
      light(0, 0, T({ sx: 0.1 })), light(290, 0, T({ sx: 0.1 }), ease.linear),
      light(320, 1, T({ sx: 0.1 }), ease.smooth), light(640, 1, T(), ease.linear),
      light(850, 1, T(), ease.smooth), light(1050, 0, T(), ease.linear), light(D, 0, T({ sx: 0.1 })),
    ]),
  ]),
  shape: 'A marker on the Draw pencil frame: the same 5.2 barrel, ending in a slanted chisel tip. Motion (study): the marker lifts back, plants its chisel flat (squash .94) and sweeps 4.6 right in one straight stroke; the see-through band (an accent, duo .32) is always as long as the chisel has travelled; it flicks up and swings home while the band fades.',
};
