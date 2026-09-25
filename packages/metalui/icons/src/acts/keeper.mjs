import { actor, ease, light, motion, pose, T } from '../motion.mjs';

/* ── CHARACTER GLYPH / the buddy notices, nods and winks: kept ─────────
 * Verb, object   keep this. The character looks up at what you handed it, perks up, and nods it
 *                in with a slow blink; its ring, the thing it holds on to, tips with the nod.
 * Invariant      a solid round body with two eye holes, wearing a ring tilted −12°; the ring's
 *                front passes in front of the body (a clear gap cut into the body) and its back
 *                hides behind it, on every frame (the cuts move with their parts, MOT-07).
 * Causal parts   cause: the eyes looking up (attention). Receiver: the body, which perks up
 *                and nods; the ring (heavier, loose on the body) follows a beat late and tips
 *                further. Payoff: three notice rays over the head as it looks up, then the blink
 *                at the bottom of the nod.
 * Neighbours     not Bot/Assistant (no antenna, no speech), not Save (no disk, no arrow),
 *                not Saturn/Orbit (the ring is worn, it never turns round).
 * Forbidden      a bounce of the whole glyph, a spinning ring, a blink loop, a wobble.
 *
 *    0ms  rest
 *  200ms  the eyes glance up and right (0.5, −1.1); the body perks up 0.6, stretching 4%;
 *         the notice rays open over the head; the ring tips back 4° a beat later
 *  380ms  held: it has seen it
 *  470ms  the nod: the body drops 0.9 and squashes 7% across; the eyes come back down
 *         and close (a slow blink, .15)
 *  520ms  the ring, lagging, tips 10° forward with the nod
 *  620ms  the body rebounds 0.35 above rest; the eyes open (680)
 *  680ms  the ring swings back 4° past rest, then 1.5°, .4°
 * 1150ms  exact rest
 * ────────────────────────────────────────────────────────── */
const RING = [
  pose(0, T(), ease.smooth), pose(260, T({ r: 4 }), ease.smooth), pose(400, T({ r: 4 }), ease.accelerate),
  pose(520, T({ r: -10 }), ease.smooth), pose(680, T({ r: 4 }), ease.smooth), pose(820, T({ r: -1.5 }), ease.smooth),
  pose(960, T({ r: .4 }), ease.settle), pose(1150, T()),
];
const FRONT = 'M2.2 12.8a9.8 2.5 0 0 0 19.6 0';
const BACK = 'M2.2 12.8a9.8 2.5 0 0 1 19.6 0';
const TILT = 'transform="rotate(-12 12 12.8)"';
const RSW = 'style="stroke-width:calc(var(--sw) * .88)"';

export const act = {
  defs: `<mask id="&-k" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#fff" stroke="none"/><g data-part="eyes"><rect x="8.9" y="7.5" width="2.4" height="4.2" rx="1.2" fill="#000" stroke="none"/><rect x="12.7" y="7.5" width="2.4" height="4.2" rx="1.2" fill="#000" stroke="none"/></g><g data-part="ring"><path d="${FRONT}" fill="none" stroke="#000" stroke-width="4" ${TILT}/></g></mask><mask id="&-kb" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#fff" stroke="none"/><circle cx="12" cy="11.4" r="8" fill="#000" stroke="none"/></mask>`,
  // The eyes are holes in the body: their knockouts in the mask carry the part; the body keeps
  // one empty anchor for the part so the track binds (nothing is drawn there).
  body: `<g data-part="body"><g mask="url(#&-kb)"><g data-part="ringb"><path d="${BACK}" ${TILT} ${RSW}/></g></g><circle class="s" mask="url(#&-k)" cx="12" cy="11.4" r="6.8"/><g data-part="ring"><path d="${FRONT}" ${TILT} ${RSW}/></g><g data-part="eyes"/></g><path class="ac" data-part="notice" opacity="0" d="M8.9 3.6 8.2 2.7M12 3.1V2.1M15.1 3.6 15.8 2.7" style="stroke-width:calc(var(--sw) * .7)"/>`,
  study: motion(1150, 'The character looks up at it, perks up, and nods it in with a slow blink; its ring tips with the nod.', ['Notice', 'Nod', 'Settle'], [
    actor('body', '12px 18.2px', [
      pose(0, T(), ease.smooth), pose(200, T({ y: -.6, sy: 1.04 }), ease.linear),
      pose(380, T({ y: -.6, sy: 1.04 }), ease.accelerate), pose(470, T({ y: .9, sx: 1.07, sy: .93 }), ease.smooth),
      pose(620, T({ y: -.35, sy: 1.02 }), ease.smooth), pose(760, T({ y: .1 }), ease.settle), pose(900, T(), ease.linear),
      pose(1150, T()),
    ]),
    actor('ring', '12px 12.8px', RING),
    actor('ringb', '12px 12.8px', RING),
    actor('eyes', '12px 9.6px', [
      pose(0, T(), ease.strike), pose(200, T({ x: .5, y: -1.1 }), ease.linear), pose(380, T({ x: .5, y: -1.1 }), ease.smooth),
      pose(470, T({ y: .2, sy: .15 }), ease.linear), pose(580, T({ y: .2, sy: .15 }), ease.smooth),
      pose(680, T({ y: -.1, sy: 1.05 }), ease.settle), pose(820, T(), ease.linear), pose(1150, T()),
    ]),
    actor('notice', '12px 4px', [
      light(0, 0, 'scale(.6)'), light(140, 0, 'scale(.6)', ease.settle), light(230, 1, 'scale(1)', ease.smooth),
      light(440, 0, 'scale(1.2)'), light(1150, 0, 'scale(.6)'),
    ]),
  ]),
  shape: 'The buddy as a glyph: solid body r6.8 with eye capsules knocked out (2.4×4.2), accretion ring rx9.8 ry2.5 tilted −12°; the front arc knocks a 1.1u gap into the body, the back arc hides behind it. Everything rides the body part; the eye and front-arc knockouts move on their own parts. Motion (study): the eyes glance up and the body perks up under three notice rays, then nods 0.9 down with a slow blink while the ring, lagging, tips 10° forward and swings back to rest.',
};
