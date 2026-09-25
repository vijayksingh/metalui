import { actor, ease, light, motion, pose, T } from '../motion.mjs';

/* ── ERASER / rub a mark out ──────────────────────────────────
 * Verb, object   erase this. The eraser's flat rubber end is pressed onto a mark and rubbed
 *                back and forth until the mark is gone.
 * Invariant      the eraser: a tilted block with round ends and one band line, rubber end
 *                down-left; it only leans a few degrees about its lowest corner, never flips.
 * Causal parts   cause: the eraser, pressed down (it compresses along the push) and rubbed.
 *                Receiver: the scribble under it, taken away a pass at a time. Payoff: two
 *                crumbs flicked out at the ends of the passes, falling away.
 * Neighbours     not Draw or Marker (nothing is laid down: the mark goes), not Trash (the
 *                eraser stays), not Clear-all (a local rub, not a sweep).
 * Forbidden      a wiggle in place (every pass travels and takes some of the mark), a spin.
 *
 *    0ms  rest; a scribble fades in under the rubber end: something to erase
 *  130ms  the eraser lifts 1.2 and tips back 5° (anticipate)
 *  250ms  pressed down onto the scribble, compressing .9 along the push, contact
 *  390ms  rubbed 2.4 left, leaning 7° into the drag; the scribble loses a third; a crumb flicks out
 *  530ms  rubbed 2.4 right, leaning the other way; another third, the second crumb
 *  660ms  a shorter pass left: the scribble is gone
 *  770ms  a last small pass, easing off
 *  870ms  let go: it springs up .6 off the page, the compression released
 * 1000ms  exact rest
 * ────────────────────────────────────────────────────────── */

const rub = [
  pose(0, T(), ease.accelerate),
  pose(130, T({ x: .3, y: -1.2, r: -5 }), ease.strike),
  pose(250, T({ x: 0, y: .5, sy: .9 }), ease.smooth),
  pose(390, T({ x: -2.4, y: .5, r: 7, sy: .93 }), ease.smooth),
  pose(530, T({ x: 2.4, y: .4, r: -7, sy: .92 }), ease.smooth),
  pose(660, T({ x: -1.4, y: .5, r: 5, sy: .93 }), ease.smooth),
  pose(770, T({ x: .5, y: .4, r: -2, sy: .95 }), ease.smooth),
  pose(870, T({ x: 0, y: -.6, sy: 1.02 }), ease.settle),
  pose(1000, T()),
];
const D = 1000;

export const act = {
  body: `<path class="ac" data-part="scribble" opacity="0" pathLength="1" d="M3.6 20.6c.9-.7 1.9-.7 2.8 0s1.9.7 2.8 0" style="stroke-width:calc(var(--sw) * .76)"/><circle class="ac s" data-part="crumb1" opacity="0" cx="4.6" cy="19.5" r=".8"/><circle class="ac s" data-part="crumb2" opacity="0" cx="9.4" cy="19.6" r=".7"/><g data-part="eraser"><g transform="translate(-1.6 .6) rotate(45 12 12)"><path class="f" style="--duo:.16" d="M8.8 5.4a2 2 0 0 1 2-2h2.4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-2.4a2 2 0 0 1-2-2Z"/><path d="M8.8 12.8h6.4"/></g></g>`,
  study: motion(D, 'The eraser is pressed onto a scribble and rubbed left, right and left; the scribble goes a pass at a time and crumbs flick away.', ['Press', 'Rub', 'Lift'], [
    actor('eraser', '7.2px 19.9px', rub),
    actor('scribble', '6.4px 20.3px', [
      { at: 0, opacity: 0, draw: 1, easing: ease.smooth },
      { at: 110, opacity: 1, draw: 1, easing: ease.smooth },
      { at: 260, opacity: 1, draw: 1, easing: ease.smooth },
      { at: 390, opacity: .85, draw: .64, easing: ease.smooth },
      { at: 530, opacity: .6, draw: .3, easing: ease.smooth },
      { at: 660, opacity: 0, draw: 0, easing: ease.linear },
      { at: 700, opacity: 0, draw: 1, easing: ease.linear },
      { at: D, opacity: 0, draw: 1 },
    ]),
    actor('crumb1', '4.6px 19.5px', [
      light(0, 0, 'translate(0px,0px)'), light(360, 0, 'translate(0px,0px)', ease.strike),
      light(430, 1, 'translate(-1.3px,-1.1px)', ease.accelerate), light(640, 0, 'translate(-2px,1.5px)'),
      light(D, 0, 'translate(0px,0px)'),
    ]),
    actor('crumb2', '9.4px 19.6px', [
      light(0, 0, 'translate(0px,0px)'), light(500, 0, 'translate(0px,0px)', ease.strike),
      light(570, 1, 'translate(1.1px,-1.2px)', ease.accelerate), light(790, 0, 'translate(1.7px,1.4px)'),
      light(D, 0, 'translate(0px,0px)'),
    ]),
  ]),
  shape: 'An eraser on the Draw pencil frame, a little wider (6.4) with round ends and one band line between sleeve and rubber; its flat rubber end faces down-left, lowest corner at 7.2,19.9. Motion (study): a scribble fades in under it; the eraser lifts, presses down (.9 along the push) and rubs left, right, left about its lowest corner, leaning 7° into each pass; the scribble is taken away a third per pass, two crumbs flick out and fall, and it springs up off the page back to rest.',
};
