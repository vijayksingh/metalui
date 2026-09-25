import { actor, ease, light, motion, pose } from '../motion.mjs';

/* ── SELECT / the pointer reaches a thing and clicks it ───────
 * Verb, object   pick this. The pointer is the hand; its tip is where the choice lands.
 * Invariant      an arrow pointing up-left with its tip leading; it never turns past 9°
 *                and never leaves its footprint by more than 1.6.
 * Causal parts   cause: the pointer driving into its tip. Receiver: the point under the tip.
 *                Payoff: a click ring at the tip, after contact, not before.
 * Neighbours     not Send (nothing flies away), not Move (no drag), not a highlight bounce.
 * Forbidden      sparkles, a whole-icon pulse, a spin.
 *
 *    0ms  pointer at rest
 *  150ms  draws back down-right, heel lifting (anticipate)
 *  300ms  darts up-left onto its tip and squashes along its length (strike)
 *  330ms  the click ring opens at the tip
 *  400ms  held on the press
 *  560ms  springs back past rest; the ring widens and fades
 *  720ms  a small correction
 *  900ms  exact rest
 * ────────────────────────────────────────────────────────── */
export const act = {
  body: `<g data-part="cursor"><path class="f" d="M6.1 4.9 18.3 10.6a.5.5 0 0 1-.04.93L13 13.2l-2.2 5.1a.5.5 0 0 1-.93-.02L6.1 4.9Z"/></g><circle class="ac" data-part="click" opacity="0" cx="6.1" cy="4.9" r="3.2" style="stroke-width:calc(var(--sw) * .7)"/>`,
  study: motion(900, 'The pointer draws back, clicks its tip down, and a ring opens where it lands.', ['Draw back', 'Click', 'Release'], [
    actor('cursor', '6.1px 4.9px', [
      pose(0, 'translate(0px,0px) rotate(0deg) scale(1,1)', ease.accelerate),
      pose(150, 'translate(1.5px,1.5px) rotate(5deg) scale(1,1)', ease.strike),
      pose(300, 'translate(-.9px,-.9px) rotate(-8deg) scale(.86,.86)', ease.smooth),
      pose(400, 'translate(-.7px,-.7px) rotate(-7deg) scale(.9,.9)', ease.smooth),
      pose(560, 'translate(.45px,.45px) rotate(2deg) scale(1.03,1.03)', ease.smooth),
      pose(720, 'translate(-.12px,-.12px) rotate(-.6deg) scale(1,1)', ease.settle),
      pose(900, 'translate(0px,0px) rotate(0deg) scale(1,1)'),
    ]),
    actor('click', '6.1px 4.9px', [
      light(0, 0, 'scale(.3)'), light(290, 0, 'scale(.3)', ease.settle),
      light(340, .9, 'scale(.75)', ease.smooth), light(640, 0, 'scale(1.5)'), light(900, 0, 'scale(.3)'),
    ]),
  ]),
  shape: 'Arrow polygon, 4 vertices, round join; the two outer vertices get 0.5u radius arcs. Motion (study): the pointer draws back 1.5 down-right, darts onto its tip and squashes .86 along its length; the click ring opens at the tip after contact and widens as it fades.',
};
