import { actor, ease, light, motion, pose, spring, T } from '../motion.mjs';

/* ── DUPLICATE / a copy is pressed off the original and pulled free ─
 * Verb, object   make another of this. The front card is the copy; the back card is the source
 *                it is taken from. The copy goes back to the source, takes the impression, and
 *                is pulled off; the source never moves.
 * Invariant      two equal rounded squares, the source fixed at 3.5/3.5 and always partly visible
 *                (the copy covers it by at most 3.2 of its 5 units of offset); the plus rides
 *                on the copy. The source's clearance (mask) moves on the copy's track (MOT-07).
 * Causal parts   cause: the copy pressing onto the source (contact squashes it .92). Receiver:
 *                the copy, peeled off diagonally, trailing a 7° twist, landing past rest.
 *                Payoff: an edge light catching inside the corner it lands on.
 * Neighbours     not Copy-to-clipboard (no clipboard), not Move (the source stays, the copy
 *                returns to its own place), not Add (the plus never detaches or grows).
 * Forbidden      the old slide-off-and-back, a swell of either card, a whole-icon bounce.
 *
 *    0ms  rest
 *  200ms  the copy slides back onto the source, 3 units up-left (gather)
 *  270ms  presses down on it: squash .92 (take the impression)
 *  330ms  holds the press
 *  470ms  peels off down-right, 1.4 past rest, trailing 7° (strike)
 *  770ms  back square and in place: an edge light catches inside its landing corner
 *  826ms  object spring: a small correction past rest, then exact rest at 1183ms
 * ────────────────────────────────────────────────────────── */
const copy = [
  pose(0, T(), ease.smooth),
  pose(200, T({ x: -3, y: -3 }), ease.strike),
  pose(270, T({ x: -3.2, y: -3.2, sx: 0.92, sy: 0.92 }), ease.smooth),
  pose(330, T({ x: -3.1, y: -3.1, sx: 0.94, sy: 0.94 }), ease.strike),
  ...spring(470, { x: 1.4, y: 1.4, r: 7 }, {}, 'object', { still: 0.15 }),
];
const D = copy[copy.length - 1].at;

export const act = {
  defs: `<mask id="&-m" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#fff" stroke="none"/><rect data-part="copy" x="7" y="7" width="15" height="15" rx="4.4" fill="#000" stroke="none"/></mask>`,
  body: `<rect mask="url(#&-m)" x="3.5" y="3.5" width="12" height="12" rx="3"/><g data-part="copy"><rect class="f" style="--duo:.16" x="8.5" y="8.5" width="12" height="12" rx="3"/><path d="M14.5 12.3v4.4M12.3 14.5h4.4"/></g><path class="ac" data-part="glint" opacity="0" d="M18.9 15.2v1.9a1.4 1.4 0 0 1-1.4 1.4h-1.9" style="stroke-width:calc(var(--sw) * .7)"/>`,
  study: motion(D, 'The copy slides back onto the original, presses to take its impression, and is peeled off into place.', ['Press', 'Peel off', 'Land'], [
    actor('copy', '14.5px 14.5px', copy),
    actor('glint', '17.5px 17.5px', [
      light(0, 0, 'scale(.7)'), light(690, 0, 'scale(.7)', ease.settle),
      light(770, 1, 'scale(1)', ease.smooth), light(1060, 0, 'scale(1.1)'), light(D, 0, 'scale(.7)'),
    ]),
  ]),
  shape: 'Two 12u squares r3, offset 5u; the back one (source) is masked by the front + 1.5u gap, and that clearance moves with the copy. Motion (study): the copy slides 3u back onto the source, presses (.92), peels off 1.4u past rest with a 7° twist, and an edge light catches inside its landing corner.',
};
