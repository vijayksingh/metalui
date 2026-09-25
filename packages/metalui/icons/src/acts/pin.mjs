import { actor, ease, light, motion, pose, spring, T } from '../motion.mjs';

/* ── PIN / the pin is worked up and driven home ───────────────
 * Verb, object   pin this in place. The pushpin is the part you press; the line under it is
 *                its contact shadow on the board. The pin is drawn up, rocking on its needle,
 *                then pushed straight down onto its point.
 * Invariant      a pushpin standing on its needle over its shadow; it turns only about its tip
 *                (never past 6°) and stays upright when it strikes; the shadow never moves
 *                off the needle's line.
 * Causal parts   cause: the thumb driving the cap down. Receiver: the pin (squashes .93 along
 *                its length at contact) and its shadow, which fades as it lifts and darkens
 *                and spreads as it lands. Payoff: a shock running out along the board.
 * Neighbours     not Location (no teardrop), not Bookmark/Board (no ribbon), not Download
 *                (the pin comes back up to rest; nothing is delivered).
 * Forbidden      a hover lift and hold, a wobble, a scale pulse.
 *
 *    0ms  rest
 *  220ms  drawn up 1.4 and rocked 6° on its tip; the shadow shrinks to .6 and fades (lift)
 *  300ms  hangs, rocking back to 4°
 *  390ms  driven down upright, .9 past rest, squashing .93 on its point; the shadow spreads
 *         1.35 and darkens; the shock runs out along the board (strike)
 *  ...    part spring back to rest; ~850ms exact rest
 * ────────────────────────────────────────────────────────── */
const pin = [
  pose(0, T(), ease.smooth),
  pose(220, T({ y: -1.4, r: 6 }), ease.smooth),
  pose(300, T({ y: -1.5, r: 4 }), ease.accelerate),
  ...spring(390, { y: 0.9, sx: 1.04, sy: 0.93 }, {}, 'part', { still: 0.15 }),
];
const shadow = [
  { at: 0, transform: T(), opacity: 0.35, easing: ease.smooth },
  { at: 220, transform: T({ sx: 0.6 }), opacity: 0.12, easing: ease.smooth },
  { at: 300, transform: T({ sx: 0.6 }), opacity: 0.12, easing: ease.accelerate },
  { at: 390, transform: T({ sx: 1.35 }), opacity: 0.7, easing: ease.smooth },
  ...spring(420, { sx: 1.3 }, {}, 'part', { still: 0.15 }),
];
shadow[shadow.length - 1].opacity = 0.35;
const D = Math.max(pin[pin.length - 1].at, shadow[shadow.length - 1].at);
const hold = (f) => { const last = f[f.length - 1]; if (last.at === D) return f; const { easing, ...rest } = last; return [...f, { ...rest, at: D }]; };

export const act = {
  body: `<g data-part="pin"><path class="f" style="--duo:.16" d="M8.8 3.8h6.4M9.9 3.8v4.9L7.2 12a.7.7 0 0 0 .54 1.14h8.52a.7.7 0 0 0 .54-1.14L14.1 8.7V3.8"/><path d="M12 13.2v6.4"/></g>`
    + `<path data-part="shadow" opacity=".35" d="M10.6 20.8h2.8"/>`
    + `<path class="ac" data-part="shock" opacity="0" d="M8.9 20.8h-1.3M15.1 20.8h1.3" style="stroke-width:calc(var(--sw) * .7)"/>`,
  study: motion(D, 'The pin is drawn up rocking on its point, then driven straight down; its shadow spreads and a shock runs out along the board where it lands.', ['Lift', 'Drive in', 'Settle'], [
    actor('pin', '12px 19.6px', hold(pin)),
    actor('shadow', '12px 20.8px', hold(shadow)),
    actor('shock', '12px 20.8px', [
      light(0, 0, 'scale(.6)'), light(380, 0, 'scale(.6)', ease.settle),
      light(430, 1, 'scale(1)', ease.smooth), light(640, 0, 'scale(1.25)'), light(D, 0, 'scale(.6)'),
    ]),
  ]),
  shape: 'Pushpin: 5.2u cap, collar, flared base, needle. Contact line under the needle at .35. Motion (study): the pin is drawn up 1.4 rocking 6° on its tip, then driven down .9 past rest, squashing .93 on its point; the shadow fades as it lifts and spreads as it lands; a shock runs out along the board.',
};
