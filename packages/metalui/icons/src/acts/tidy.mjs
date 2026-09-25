import { actor, ease, end, light, motion, pose, spring, T } from '../motion.mjs';

/* ── TIDY / loose tiles are knocked square against the guide ──
 * Verb, object   tidy up. Three loose pills are squared against a straightedge, the way
 *                you knock a stack of cards flush on the table edge.
 * Invariant      the guide stays upright on the left; three pills, stacked, longest on top,
 *                never crossing the guide and never leaving their rows.
 * Causal parts   cause: the pills driven left, turned square as they go. Receiver: the
 *                guide, which gives a little under the knock. Payoff: registration ticks
 *                flash between guide and pills at the moment they sit flush.
 * Neighbours     not Layout (no grid, no gutter), not Align-left text (pills, not lines),
 *                not a list reorder (rows never change).
 * Forbidden      pills sliding without contact, a whole-icon pulse, a shuffle.
 *
 *    0ms  rest: the pills lie loose (1.6 / 2.8 / 0.9 right, -5° / 5° / -3°)
 *  160ms  drawn back: each drifts .7 further right, a touch looser (anticipate)
 *  330ms  top pill strikes flush and square, squashing .86 along its length;
 *         360ms middle; 390ms bottom (the heavier stack follows)
 *  330ms  the guide gives .6 left under the knock and springs back (part)
 *  350ms  registration ticks flash at the three rows; gone by 640ms
 *  ~700ms held square
 * 1280ms  the pills ease back to their loose rest, last-in first-out; exact rest
 * ────────────────────────────────────────────────────────── */
const PILLS = [
  { part: 'row1', x: 1.6, r: -5, y: 6.4, rect: 'x="7.2" y="4.4" width="12.6" height="4" rx="2"' },
  { part: 'row2', x: 2.8, r: 5, y: 12, rect: 'x="7.2" y="10" width="8.6" height="4" rx="2"' },
  { part: 'row3', x: 0.9, r: -3, y: 17.6, rect: 'x="7.2" y="15.6" width="11" height="4" rx="2"' },
];
const BACK = 160, HIT = 330, LAG = 30, HELD = 760, D = 1280;

// Each pill rests loose through a transform on its rect (inside the part). The part's pivot is
// the pill's loosened left end, so T({ x: -dx, r: -r }) cancels the rest pose exactly: flush and square.
const pill = ({ x, r }, i) => {
  const hit = HIT + i * LAG;
  const flush = { x: -x, r: -r };
  const sprung = spring(hit, { ...flush, sx: 0.86, sy: 1.08 }, flush, 'part');
  const turns = sprung.slice(0, -1);
  // the last small turning point settles straight into the held square pose
  const leave = Math.max(HELD + (2 - i) * 40, end(turns) + 120);
  return [
    pose(0, T(), ease.smooth),
    pose(BACK + i * LAG, T({ x: 0.7, r: r * 0.4 }), ease.accelerate),
    ...turns.slice(0, -1),
    { ...turns[turns.length - 1], easing: ease.settle },
    pose(leave, T(flush), ease.smooth),
    pose(D, T()),
  ];
};

export const act = {
  body: `<g data-part="guide"><path d="M4.3 3.8v16.4"/></g>` +
    PILLS.map((p) => `<g data-part="${p.part}"><rect class="f" ${p.rect} transform="translate(${p.x} 0) rotate(${p.r} 7.2 ${p.y})"/></g>`).join('') +
    `<path class="ac" data-part="ticks" opacity="0" d="M5.4 6.4h.9M5.4 12h.9M5.4 17.6h.9" style="stroke-width:calc(var(--sw) * .7)"/>`,
  study: motion(D, 'The loose pills are knocked square against the guide, and registration ticks flash where they sit flush.', ['Draw back', 'Knock square', 'Relax'], [
    actor('guide', '4.3px 12px', [
      pose(0, T(), ease.linear), pose(HIT, T(), ease.strike),
      ...spring(HIT + 40, { x: -0.6 }, {}, 'part').map((f, i, a) => (i === a.length - 1 ? { ...f, easing: ease.linear } : f)),
      pose(D, T()),
    ]),
    ...PILLS.map((p, i) => actor(p.part, `${7.2 + p.x}px ${p.y}px`, pill(p, i))),
    actor('ticks', '5.85px 12px', [
      light(0, 0, 'scale(.3,1)'), light(HIT + 10, 0, 'scale(.3,1)', ease.strike),
      light(HIT + 60, 0.9, 'scale(1,1)', ease.smooth), light(640, 0, 'scale(1.2,1)'), light(D, 0, 'scale(.3,1)'),
    ]),
  ]),
  shape: 'Guide + three pills (h4, r2), loose at rest (≤5°, a rest transform on each rect). Motion (study): the pills draw back .7, then are knocked flush and square against the guide in order (squash .86 along their length, part spring), the guide gives .6 under the knock; registration ticks flash between guide and pills; held square, they relax back to loose.',
};
