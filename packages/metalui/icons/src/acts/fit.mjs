import { actor, ease, end, light, motion, pose, spring, T } from '../motion.mjs';

/* ── FIT / the content grows to the frame and the corners clamp onto it ──
 * Verb, object   fit to frame. The content is brought up to the edges of the view, and the
 *                four corners of the frame close on it like the jaws of a vise.
 * Invariant      four corner brackets on the square keyline, one rounded square centred in
 *                them; the square stays square and centred, the corners stay on their
 *                diagonals and never cross the content.
 * Causal parts   cause: the content expanding toward the frame. Receiver: the corners, which
 *                close in and seat a unit off it (the content gives a little under the clamp).
 *                Payoff: the frame's four open sides flash shut between the clamped corners.
 * Neighbours     not Expand/Fullscreen (the corners come in, not out), not Crop (nothing is
 *                cut away), not Frame/Select (the content changes size to meet the frame).
 * Forbidden      a scale pulse of the whole icon, the corners pumping in and out, a spin.
 *
 *    0ms  rest
 *  160ms  the corners open .5 along their diagonals; the content draws in to .92 (anticipate)
 *  360ms  the content has grown to 1.45 (strike)
 *  380ms  the corners clamp in 1.3 along their diagonals and seat back to 1.0, a unit's
 *         margin off the content; the content gives to 1.35 and recovers to 1.42 (part)
 *  390ms  seams flash in the frame's open sides between the corners, gone by 700ms
 *  720ms  released: the corners let go (release) and the content comes back to 1 (settle)
 * 1160ms  exact rest
 * ────────────────────────────────────────────────────────── */
const OPEN = 160, GROW = 360, CLAMP = 380, LET = 720, D = 1160;
const IN = 1, BIG = 1.42;
const CORNERS = [
  { part: 'nw', d: 'M3.8 8.6V6.4a2.6 2.6 0 0 1 2.6-2.6h2.2', sx: 1, sy: 1 },
  { part: 'ne', d: 'M15.4 3.8h2.2a2.6 2.6 0 0 1 2.6 2.6v2.2', sx: -1, sy: 1 },
  { part: 'se', d: 'M20.2 15.4v2.2a2.6 2.6 0 0 1-2.6 2.6h-2.2', sx: -1, sy: -1 },
  { part: 'sw', d: 'M8.6 20.2H6.4a2.6 2.6 0 0 1-2.6-2.6v-2.2', sx: 1, sy: -1 },
];
const released = (c) => spring(LET, { x: c.sx * IN, y: c.sy * IN }, {}, 'release');
const squeezed = spring(CLAMP, { sx: BIG * 0.95, sy: BIG * 0.95 }, { sx: BIG, sy: BIG }, 'part', { still: 0.05 });
const upTo = (frames, t) => frames.filter((f) => f.at < t);

const corner = (c) => {
  const rel = released(c);
  return [
    pose(0, T(), ease.smooth),
    pose(OPEN, T({ x: -c.sx * 0.5, y: -c.sy * 0.5 }), ease.linear),
    pose(OPEN + 100, T({ x: -c.sx * 0.5, y: -c.sy * 0.5 }), ease.strike),
    pose(CLAMP, T({ x: c.sx * (IN + 0.3), y: c.sy * (IN + 0.3) }), ease.smooth),
    pose(CLAMP + 90, T({ x: c.sx * IN, y: c.sy * IN }), ease.linear),
    pose(LET, T({ x: c.sx * IN, y: c.sy * IN }), rel[0].easing),
    ...rel.slice(1, -1),
    { ...rel[rel.length - 1], easing: ease.linear },
    ...(end(rel) < D ? [pose(D, T())] : []),
  ];
};

export const act = {
  body: CORNERS.map((c) => `<path data-part="${c.part}" d="${c.d}"/>`).join('') +
    `<rect data-part="content" class="f" style="--duo:.18" x="9" y="9" width="6" height="6" rx="1.7"/>` +
    `<path class="ac" data-part="seams" opacity="0" d="M10.9 4.8h2.2M19.2 10.9v2.2M13.1 19.2h-2.2M4.8 13.1v-2.2" style="stroke-width:calc(var(--sw) * .6)"/>`,
  study: motion(D, 'The content grows to the frame and the four corners clamp onto it; the open sides of the frame flash shut.', ['Open', 'Grow and clamp', 'Let go'], [
    ...CORNERS.map((c) => actor(c.part, '12px 12px', corner(c))),
    actor('content', '12px 12px', [
      pose(0, T(), ease.smooth),
      pose(OPEN, T({ sx: 0.92, sy: 0.92 }), ease.strike),
      pose(GROW, T({ sx: BIG * 1.02, sy: BIG * 1.02 }), ease.smooth),
      ...upTo(squeezed, LET),
      pose(LET, T({ sx: BIG, sy: BIG }), ease.smooth),
      pose(LET + 300, T({ sx: 0.97, sy: 0.97 }), ease.settle),
      pose(D, T()),
    ]),
    // the frame's open sides flash shut where the clamped corners meet: the view is closed round its content
    actor('seams', '12px 12px', [
      light(0, 0, 'scale(1.1)'), light(CLAMP + 10, 0, 'scale(1.1)', ease.strike),
      light(CLAMP + 70, 0.8, 'scale(1)', ease.smooth), light(700, 0, 'scale(1.06)'), light(D, 0, 'scale(1.1)'),
    ]),
  ]),
  shape: "Four r2.6 corner brackets on the square keyline + 6u rounded square. Motion (study): the corners open .5 while the content draws in, then the content grows to 1.42 and the corners clamp in 1.3 along their diagonals and seat at 1.0 (the content gives to 1.35 and recovers); seams flash in the frame's open sides between them; the corners let go on the release spring and the content settles back.",
};
