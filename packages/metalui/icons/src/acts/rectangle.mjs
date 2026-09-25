import { actor, ease, light, motion, parsePose, pose, T } from '../motion.mjs';

/* ── RECTANGLE / drag a box out from its pinned corner ────────
 * Verb, object   draw a box. The top-left corner is where the drag began and stays pinned;
 *                the bottom-right corner is under the pointer, and the box is always the
 *                rectangle between the two.
 * Invariant      a rounded box: four corners of the same radius joined by straight sides;
 *                the top-left corner never moves, the corners never distort.
 * Causal parts   cause: a handle on the bottom-right corner, grabbed and dragged. Receiver:
 *                the far corners ride with it and the four sides lengthen and shorten
 *                between them (sides stretch along their length only, corners stay round).
 *                Payoff: the handle lets go past the end and a ring marks the corner as it
 *                springs back to size.
 * Neighbours     not Frame or Image (nothing inside), not Crop (no cut edges), not a zoom.
 * Forbidden      scaling the whole box (thins the stroke and squashes the corners), a pulse.
 *
 *    0ms  rest
 *  110ms  the handle appears on the corner; the corner is tugged out .6 (anticipate)
 *  320ms  dragged in toward the pinned corner: the box is 9 × 8
 *  370ms  held there a beat
 *  560ms  dragged out, carried .9 past its size
 *  560ms  let go: the handle drops away, the corner ring opens
 *  730ms  the box springs back just under its size
 *  920ms  exact rest
 * ────────────────────────────────────────────────────────── */

// The drag as the bottom-right corner's offset from rest; every moving piece is written from it.
const drag = [
  pose(0, T(), ease.smooth),
  pose(110, T({ x: .6, y: .5 }), ease.smooth),
  pose(320, T({ x: -8.4, y: -6 }), ease.smooth),
  pose(370, T({ x: -8.4, y: -6 }), 'cubic-bezier(.3,0,.25,1)'),
  pose(560, T({ x: .9, y: .8 }), ease.smooth),
  pose(730, T({ x: -.25, y: -.2 }), ease.smooth),
  pose(920, T()),
].map((f) => ({ ...parsePose(f.transform), at: f.at, easing: f.easing }));
const D = 920;
const W = 10.8, H = 7.6; // the straight top/bottom and left/right sides at rest
const track = (part, origin, fn) => actor(part, origin, drag.map(({ at, x, y, easing }) => ({ at, transform: T(fn(x, y)), ...(at < D ? { easing } : {}) })));

export const act = {
  body: `<path d="M3.4 8.2A3.2 3.2 0 0 1 6.6 5"/><path data-part="top" d="M6.6 5L17.4 5"/><path data-part="tr" d="M17.4 5A3.2 3.2 0 0 1 20.6 8.2"/><path data-part="right" d="M20.6 8.2L20.6 15.8"/><path data-part="br" d="M20.6 15.8A3.2 3.2 0 0 1 17.4 19"/><path data-part="bottom" d="M17.4 19L6.6 19"/><path data-part="bl" d="M6.6 19A3.2 3.2 0 0 1 3.4 15.8"/><path data-part="left" d="M3.4 15.8L3.4 8.2"/><circle class="ac s" data-part="handle" opacity="0" cx="20.6" cy="19" r="1.4"/><circle class="ac" data-part="ring" opacity="0" cx="20.6" cy="19" r="2.6" style="stroke-width:calc(var(--sw) * .7)"/>`,
  study: motion(D, 'A handle grabs the far corner and drags the box in toward its pinned corner, then out past its size; let go, it springs back.', ['Grab', 'Drag out', 'Let go'], [
    track('top', '6.6px 5px', (x) => ({ sx: 1 + x / W })),
    track('tr', '20.6px 5px', (x) => ({ x })),
    track('right', '20.6px 8.2px', (x, y) => ({ x, sy: 1 + y / H })),
    track('br', '20.6px 19px', (x, y) => ({ x, y })),
    track('bottom', '6.6px 19px', (x, y) => ({ y, sx: 1 + x / W })),
    track('bl', '3.4px 19px', (x, y) => ({ y })),
    track('left', '3.4px 8.2px', (x, y) => ({ sy: 1 + y / H })),
    actor('handle', '20.6px 19px', drag.map(({ at, x, y, easing }) => {
      const on = at >= 110 && at <= 560;
      return { at, opacity: on ? 1 : 0, transform: T({ x, y, sx: on ? 1 : .4, sy: on ? 1 : .4 }), ...(at < D ? { easing: at === 0 ? ease.settle : easing } : {}) };
    })),
    actor('ring', '20.6px 19px', [
      light(0, 0, 'translate(0px,0px) scale(.5)'), light(560, 0, 'translate(.9px,.8px) scale(.5)', ease.settle),
      light(620, .85, 'translate(.5px,.45px) scale(.9)', ease.smooth), light(840, 0, 'translate(0px,0px) scale(1.4)'),
      light(D, 0, 'translate(0px,0px) scale(.5)'),
    ]),
  ]),
  shape: 'A 17.2 × 14 rounded box (r3.2), open, drawn as eight pieces (four corner arcs, four straight sides) that join into the same contour. Motion (study): a handle appears on the bottom-right corner and drags the box in to 9 × 8 toward its pinned top-left corner, then out .9 past its size; the far corners translate with the drag and the sides stretch only along their length, so the corners stay round and the stroke keeps its width. Let go, the handle drops, a ring opens at the corner and the box springs back.',
};
