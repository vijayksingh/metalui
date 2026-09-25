import { actor, ease, light, motion, pose, T } from '../motion.mjs';

/* ── CAPTURE / the viewfinder finds focus and the shutter fires ─
 * Verb, object   take the shot. The corner brackets close in on the subject and hunt for
 *                focus; once they lock, the shutter blinks over the aperture; the frame lets go.
 * Invariant      four corners on a square and a round aperture at the centre, every frame;
 *                the aperture never moves or changes size (the shutter is its own part).
 * Causal parts   cause: the brackets locking on the subject. Receiver: the aperture.
 *                Payoff: the shutter, a solid disc that snaps shut over the aperture and opens.
 * Neighbours     not Fit / Fullscreen (the corners come in and go back; no resize of the frame),
 *                not Record (no red dot, no loop), not Scan (no sweeping line).
 * Forbidden      a pulsing aperture, a zoom of the whole icon, a flash that fills the frame.
 *
 *    0ms  rest
 *  190ms  the corners close in 1.5 on the diagonal (strike)
 *  290ms  hunt back out to 0.8 …
 *  380ms  … and lock at 1.1
 *  430ms  the shutter snaps shut over the aperture (430 → 480)
 *  560ms  and opens again, fading as it shrinks
 *  600ms  the corners let go: out 0.35 past rest, a correction, rest
 *  950ms  exact rest
 * ────────────────────────────────────────────────────────── */
// each corner moves along its own diagonal toward the centre: (sx, sy) is that diagonal
const corner = (sx, sy) => {
  const at = (ms, d, e = ease.smooth) => pose(ms, T({ x: sx * d, y: sy * d }), e);
  return [at(0, 0, ease.accelerate), at(190, 1.5), at(290, .8), at(380, 1.1, ease.linear), at(600, 1.1, ease.smooth),
    at(720, -.35), at(830, .1, ease.settle), at(950, 0)];
};

export const act = {
  body: `<path data-part="nw" d="M3.8 8.4V7A3.2 3.2 0 0 1 7 3.8h1.4"/><path data-part="ne" d="M15.6 3.8H17A3.2 3.2 0 0 1 20.2 7v1.4"/><path data-part="se" d="M20.2 15.6V17a3.2 3.2 0 0 1-3.2 3.2h-1.4"/><path data-part="sw" d="M8.4 20.2H7A3.2 3.2 0 0 1 3.8 17v-1.4"/><circle class="f" style="--duo:.16" cx="12" cy="12" r="3.6"/><circle class="ac s" data-part="shutter" opacity="0" cx="12" cy="12" r="3.6"/>`,
  study: motion(950, 'The corners close in and hunt for focus, lock, and the shutter blinks over the aperture.', ['Focus', 'Shutter', 'Let go'], [
    actor('nw', '5.6px 5.6px', corner(1, 1)),
    actor('ne', '18.4px 5.6px', corner(-1, 1)),
    actor('se', '18.4px 18.4px', corner(-1, -1)),
    actor('sw', '5.6px 18.4px', corner(1, -1)),
    actor('shutter', '12px 12px', [
      light(0, 0, 'scale(.3)'), light(430, 0, 'scale(.3)', ease.strike), light(480, 1, 'scale(1)'),
      light(560, 1, 'scale(1)', ease.accelerate), light(640, 0, 'scale(.5)'), light(950, 0, 'scale(.3)'),
    ]),
  ]),
  shape: 'Four r3.2 corners (softer than Fit) around an aperture circle r3.6 tinted .16. Motion (study): the corners close in 1.5 along their diagonals, hunt out to 0.8 and lock at 1.1; a solid shutter disc snaps shut over the aperture and reopens; the corners let go past rest and settle.',
};
