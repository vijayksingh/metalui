import { actor, ease, light, motion, pose, spring, T } from '../motion.mjs';

/* ── LINK / two links are tested under tension, then snap home ─
 * Verb, object   bind these two things. Each link carries the half of the bar it grips, so the
 *                bar is a telescoping pin: pulled, it lengthens and holds; pushed, it bottoms out.
 * Invariant      two capsule halves on the 45° axis joined by one unbroken bar; the halves only
 *                ever move along that axis, and the bar never shows a gap (its halves overlap
 *                3.96 units at rest; the widest pull uses 3.2 of it).
 * Causal parts   cause: the pull (tension) and its release. Receiver: the bar, which stretches,
 *                then is driven home and compressed 1.1 units shorter than rest. Payoff: a spark
 *                squeezed out sideways at the join, just after contact.
 * Neighbours     not Unlink (nothing breaks, the bar stays whole and the halves come back
 *                closer than they started), not Attach (no clip), not External link (no arrow).
 * Forbidden      a scale pulse of the whole chain, a spin, the halves simply sliding out and back.
 *
 *    0ms  rest
 *  230ms  pulled apart 1.5 units each along the axis; the bar stretches with them (tension)
 *  310ms  still straining: 1.65 units, held against the pin
 *  400ms  let go: snaps back past rest, .55 units into each other; the bar compresses (strike)
 *  420ms  the spark squeezes out either side of the join
 *  640ms  a small rebound out (part spring)
 *  ~950ms exact rest
 * ────────────────────────────────────────────────────────── */
const u = 1 / Math.SQRT2; // along the axis: la moves up-right (+x −y), lb down-left
const along = (d) => ({ x: d * u, y: -d * u });
const away = (d) => ({ x: -d * u, y: d * u });

const la = [
  pose(0, T(), ease.smooth),
  pose(230, T(along(1.5)), ease.smooth),
  pose(310, T(along(1.65)), ease.strike),
  ...spring(400, along(-0.55), {}, 'part', { still: 0.02 }),
];
const lb = [
  pose(0, T(), ease.smooth),
  pose(230, T(away(1.5)), ease.smooth),
  pose(310, T(away(1.65)), ease.strike),
  ...spring(400, away(-0.55), {}, 'part', { still: 0.02 }),
];
const D = la[la.length - 1].at;

export const act = {
  body: `<g data-part="la"><path d="M11.2 7.6l1.4-1.4a3.7 3.7 0 0 1 5.2 5.2l-1.4 1.4"/><path d="M10.6 13.4 14.2 9.8"/></g><g data-part="lb"><path d="M12.8 16.4l-1.4 1.4a3.7 3.7 0 0 1-5.2-5.2l1.4-1.4"/><path d="M9.8 14.2 13.4 10.6"/></g><path class="ac" data-part="spark" opacity="0" d="M13.7 13.7l.9.9M10.3 10.3l-.9-.9" style="stroke-width:calc(var(--sw) * .7)"/>`,
  study: motion(D, 'The two links are pulled apart on their bar, then snap back into each other and a spark squeezes out at the join.', ['Tension', 'Snap home', 'Settle'], [
    actor('la', '15.2px 8.8px', la),
    actor('lb', '8.8px 15.2px', lb),
    actor('spark', '12px 12px', [
      light(0, 0, 'scale(.4)'), light(395, 0, 'scale(.4)', ease.settle),
      light(440, 1, 'scale(.9)', ease.smooth), light(660, 0, 'scale(1.7)'), light(D, 0, 'scale(.4)'),
    ]),
  ]),
  shape: 'Two open capsule halves on the 45° axis, radius 3.7; the bridging bar is two overlapping halves (each 5.1u), one gripped by each link, so the bar telescopes. Motion (study): the links pull 1.65u apart along the axis, snap back .55u past rest, and a sideways spark marks the join.',
};
