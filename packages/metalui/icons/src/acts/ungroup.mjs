import { actor, ease, light, motion, pose, spring, T } from '../motion.mjs';

/* ── UNGROUP / a pair pressed together in the tray springs apart ─
 * Verb, object   take these apart. The two cards are the grouped things; the open tray holds
 *                them. They are pressed down together as one block, then let go: they spring up
 *                and apart, each leaning out on its own, and settle into their separate places.
 * Invariant      the tray stays where it is (it only gives, 5–8%); the cards pivot about their
 *                own bottom centres and never leave the live area (at rest they already touch
 *                its sides and top, so all the travel is inward and down first).
 * Causal parts   cause: the squeeze (the cards pressed upright, side by side, 2.2 into the tray).
 *                Receiver: the tray, loaded as they press and kicked as they launch. Payoff:
 *                a crack of light down the seam where the two let go of each other.
 *                The right card, heavier, lags the left by 30ms.
 * Neighbours     not Group (they end apart and out, nothing goes in), not Duplicate (two
 *                cards, equal, nothing copied), not Split view (no divider, no panes).
 * Forbidden      the old spread-wider hover, a spread-and-shrink, a whole-icon bounce.
 *
 *    0ms  rest
 *  260ms  pressed together: each slides .8 in, stands upright (±6°) and sinks 2 into the tray;
 *         the tray takes the load (.95)
 *  340ms  pressed harder (2.2)
 *  440ms  let go: they spring up and apart past rest, .6 high and 1.5° further out; the tray
 *         kicks down (.93); the seam flashes between them
 *  ...    object spring back into place; ~1000ms exact rest
 * ────────────────────────────────────────────────────────── */
const card = (s, lag) => [
  pose(0, T(), ease.smooth),
  pose(260 + lag, T({ x: 0.8 * s, y: 2, r: 6 * s }), ease.smooth),
  pose(340 + lag, T({ x: 0.8 * s, y: 2.2, r: 6 * s }), ease.strike),
  ...spring(440 + lag, { x: -0.15 * s, y: -0.6, r: -1.5 * s }, {}, 'object', { still: 0.3 }),
];
const left = card(1, 0), right = card(-1, 30);
const tray = [
  pose(0, T(), ease.smooth),
  pose(260, T({ sx: 1.01, sy: 0.95 }), ease.smooth),
  pose(340, T({ sx: 1.015, sy: 0.94 }), ease.strike),
  ...spring(440, { sx: 1.02, sy: 0.92 }, {}, 'part', { still: 0.2 }),
];
const D = Math.max(...[left, right, tray].map((f) => f[f.length - 1].at));
const hold = (f) => (f[f.length - 1].at < D ? [...f, { at: D, transform: f[f.length - 1].transform }] : f);

export const act = {
  body: `<g data-part="left"><rect class="f" style="--duo:.1" x="3.2" y="3.4" width="8" height="9.4" rx="1.6" transform="rotate(-6 7.2 12.8)"/></g>`
    + `<g data-part="right"><rect class="f" style="--duo:.1" x="12.8" y="3.4" width="8" height="9.4" rx="1.6" transform="rotate(6 16.8 12.8)"/></g>`
    + `<g data-part="tray"><path d="M3.5 15.2v2.4a2.5 2.5 0 0 0 2.5 2.5h12a2.5 2.5 0 0 0 2.5-2.5v-2.4"/></g>`
    + `<path class="ac" data-part="seam" opacity="0" d="M12 4.6v7.2" style="stroke-width:calc(var(--sw) * .7)"/>`,
  study: motion(D, 'The two cards are pressed together into the tray, then let go: they spring up and apart and a crack of light opens down the seam.', ['Press together', 'Let go', 'Settle apart'], [
    actor('left', '7.2px 12.8px', hold(left)),
    actor('right', '16.8px 12.8px', hold(right)),
    actor('tray', '12px 20.1px', hold(tray)),
    actor('seam', '12px 8.2px', [
      light(0, 0, 'scale(.5)'), light(430, 0, 'scale(.5)', ease.settle),
      light(470, 1, 'scale(1)', ease.smooth), light(560, .8, 'scale(1.05)', ease.smooth), light(760, 0, 'scale(1.2)'), light(D, 0, 'scale(.5)'),
    ]),
  ]),
  shape: 'Open tray (flap only) with two cards lifted out, ±6° at rest (drawn as rest rotations inside each card). Motion (study): the cards are pressed upright and together 2.2 into the tray, then spring up and apart past rest; the tray loads and kicks; a line of light opens on the seam between them.',
};
