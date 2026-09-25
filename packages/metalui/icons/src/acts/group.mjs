import { actor, ease, light, motion, pose, spring, T } from '../motion.mjs';

/* ── GROUP / two loose cards are squared into a stack and dropped in the folder ─
 * Verb, object   put these together. The two fanned cards are the things; the folder is the
 *                container. The cards lift, square up into one stack, and are dropped in; the
 *                stack splays back into the resting fan as it lands.
 * Invariant      the folder back stands still (MOT-05); the cards stay above the flap's edge
 *                (the clip moves with the flap), the front card always covers the back one,
 *                and the back's clearance follows each card (MOT-07).
 * Causal parts   cause: the stack falling into the folder. Receiver: the flap, which squashes
 *                .93 from its foot. Payoff: air puffs out of the folder's mouth at both corners.
 *                The back card, heavier, follows the front one 40ms late.
 * Neighbours     not Ungroup (the cards come together, not apart, and end inside), not Folder
 *                (the folder never opens), not Duplicate (two different cards, no copy).
 * Forbidden      the old rise-and-fan hover, a swell of the folder, a whole-icon bounce.
 *
 *    0ms  rest
 *  120ms  the cards settle down .4 (anticipate)
 *  380ms  lifted 2.6 and squared: each slides 2.3 toward the other and turns flat (gather)
 *  420ms  the back card arrives (lag)
 *  540ms  dropped: the stack lands .7 below rest; the flap squashes .93; puffs at the corners
 *  ...    object spring: the stack splays back into its fan and rises to rest
 * ────────────────────────────────────────────────────────── */
const lift = (dx, r, lag) => [
  pose(0, T(), ease.smooth),
  pose(120 + lag, T({ y: 0.4 }), ease.smooth),
  pose(380 + lag, T({ x: dx, y: -2.6, r }), ease.accelerate),
  ...spring(540, { x: dx, y: 0.7, r }, {}, 'object', { still: 0.25 }),
];
const front = lift(-2.3, -5, 0);   // card2: the front card, from the right
const back = lift(2.3, 8, 40);     // card1: the back card, from the left, heavier
const flap = [
  pose(0, T(), ease.linear),
  pose(530, T(), ease.strike),
  ...spring(560, { sx: 1.03, sy: 0.93 }, {}, 'part', { still: 0.2 }),
];
const D = Math.max(...[front, back, flap].map((f) => f[f.length - 1].at));
const hold = (f) => (f[f.length - 1].at < D ? [...f, { at: D, transform: f[f.length - 1].transform }] : f);

const C1 = `x="5.6" y="6.4" width="8.2" height="10" rx="1.7" transform="rotate(-8 9.7 16.4)"`;
const C2 = `x="10.2" y="7.4" width="8.2" height="10" rx="1.7" transform="rotate(5 14.3 17.4)"`;
const FLAP = 'M3.5 12.2h17v5.4a2.5 2.5 0 0 1-2.5 2.5H6a2.5 2.5 0 0 1-2.5-2.5Z';

export const act = {
  defs: `<mask id="&-m" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#fff" stroke="none"/><path data-part="flap" d="M1 11.2h22V24H1Z" fill="#000" stroke="none"/></mask>`
    + `<mask id="&-b" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#fff" stroke="none"/><g fill="#000" stroke="#000" stroke-width="3.3"><g data-part="card1"><rect ${C1}/></g><g data-part="card2"><rect ${C2}/></g></g></mask>`
    + `<mask id="&-c" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#fff" stroke="none"/><g data-part="card2"><rect ${C2} fill="#000" stroke="#000" stroke-width="3.3"/></g></mask>`,
  body: `<path mask="url(#&-b)" d="M3.5 12.4V6.3a1.9 1.9 0 0 1 1.9-1.9h3.1a1.6 1.6 0 0 1 1.2.53l1.2 1.37h7.7a1.9 1.9 0 0 1 1.9 1.9v4.2"/>`
    + `<g mask="url(#&-m)"><g mask="url(#&-c)"><g data-part="card1"><rect ${C1}/></g></g><g data-part="card2"><rect class="f" style="--duo:.14" ${C2}/></g></g>`
    + `<g data-part="flap"><path class="f" style="--duo:.16" d="${FLAP}"/></g>`
    + `<path class="ac" data-part="puff" opacity="0" d="M2.8 10.2l-.7-.7M21.2 10.2l.7-.7" style="stroke-width:calc(var(--sw) * .7)"/>`,
  study: motion(D, 'The two cards lift, square up into one stack and drop into the folder, splaying back into place as the flap takes the landing.', ['Gather', 'Drop in', 'Land'], [
    actor('card1', '9.7px 16.4px', hold(back)),
    actor('card2', '14.3px 17.4px', hold(front)),
    actor('flap', '12px 20.1px', hold(flap)),
    actor('puff', '12px 12.2px', [
      light(0, 0, 'scale(.9)'), light(545, 0, 'scale(.9)', ease.settle),
      light(600, 1, 'scale(1)', ease.smooth), light(820, 0, 'scale(1.08)'), light(D, 0, 'scale(.9)'),
    ]),
  ]),
  shape: 'Folder back (tab left) knocked out around two fanned cards (−8° / +5°, drawn as rest rotations inside each card); the front card knocks out the back card; both clipped 1u above the flap, and the clip moves with the flap. Frosted flap = duotone 16%. Motion (study): the cards lift 2.6, square into one stack, drop .7 past rest and splay back into the fan; the flap squashes .93 and air puffs from the mouth.',
};
