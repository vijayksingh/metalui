import { actor, ease, light, motion, T } from '../motion.mjs';

/* ── SYNCED / the satellite laps the core once and clicks home ─
 * Verb, object   round-trip. The satellite goes all the way round its orbit and comes back
 *                to its own slot: everything that left has returned.
 * Invariant      the core never moves; the orbit keeps its one gap; the satellite is always
 *                on the orbit (in the gap at rest, riding the ring like a bead on a wire).
 * Causal parts   cause: the satellite, wound back against the gap's rear edge, released.
 *                Receiver: the gap's front edge, which it strikes on arrival; the ring (heavier)
 *                is shoved forward and swings back. Payoff: a detent ring at the slot.
 * Neighbours     not Refresh (no arrows, the ring itself does not spin), not Offline (the
 *                satellite never leaves the orbit), not Sync Error (it completes the lap).
 * Forbidden      a spinning ring, a whole-icon rotation, a core pulse, a loop.
 *
 *    0ms  rest: satellite in its gap at 1:30
 *  150ms  winds back 9° until it touches the gap's rear edge (anticipate)
 *  150ms  released: one lap clockwise, gathering then braking (the lap is the "lap" track;
 *         the satellite hands over to it in 1 ms at the same spot, as 360° cannot rest)
 *  660ms  arrives 12° past its slot, into the gap's front edge (strike)
 *  660ms  the ring is shoved 6° forward; the detent ring opens at the slot
 *  760ms  the satellite rebounds 3° short, the ring swings back 2° past rest
 * 1100ms  exact rest
 * ────────────────────────────────────────────────────────── */
const SLOT = '17.37px 6.63px';
const LAP = 'cubic-bezier(.5,0,.45,.9)'; // gathers speed, still moving when it meets the stop
const sat = (at, r, opacity, easing = ease.smooth) => ({ at, transform: T({ r }), opacity, easing });

export const act = {
  body: `<circle class="s" cx="12" cy="12" r="2.1"/><g data-part="orbit"><circle cx="12" cy="12" r="7.6" pathLength="100" stroke-dasharray="85 15" transform="rotate(-18 12 12)"/></g><circle class="s" data-part="sat" cx="17.37" cy="6.63" r="1.75"/><circle class="ac s" data-part="lap" opacity="0" cx="17.37" cy="6.63" r="1.75"/><circle class="ac" data-part="dock" opacity="0" cx="17.37" cy="6.63" r="3.2" style="stroke-width:calc(var(--sw) * .7)"/>`,
  study: motion(1100, 'The satellite winds back, laps the core once and clicks home into its slot.', ['Wind back', 'Lap', 'Click home'], [
    actor('sat', '12px 12px', [
      sat(0, 0, 1), sat(150, -9, 1, ease.linear), sat(151, -9, 0, ease.linear), sat(659, 12, 0, ease.linear),
      sat(660, 12, 1, ease.smooth), sat(770, -3, 1), sat(880, 1, 1), sat(980, -.3, 1, ease.settle), sat(1100, 0, 1),
    ]),
    actor('lap', '12px 12px', [
      sat(0, -9, 0, ease.linear), sat(150, -9, 0, ease.linear), sat(151, -9, 1, LAP), sat(660, 372, 1, ease.linear),
      sat(661, 372, 0, ease.linear), sat(1100, -9, 0),
    ]),
    actor('orbit', '12px 12px', [
      { at: 0, transform: T(), easing: ease.linear }, { at: 655, transform: T(), easing: ease.strike },
      { at: 720, transform: T({ r: 6 }), easing: ease.smooth }, { at: 830, transform: T({ r: -2 }), easing: ease.smooth },
      { at: 940, transform: T({ r: .6 }), easing: ease.settle }, { at: 1100, transform: T() },
    ]),
    actor('dock', SLOT, [
      light(0, 0, 'scale(.4)'), light(650, 0, 'scale(.4)', ease.settle),
      light(700, .9, 'scale(.8)', ease.smooth), light(980, 0, 'scale(1.5)'), light(1100, 0, 'scale(.4)'),
    ]),
  ]),
  shape: 'Core r2.1, orbit r7.6 with a fixed 85/15 dash turned −18° so its 54° gap centres on the satellite (r1.75, 1:30). Motion (study): the satellite winds back 9° to the gap edge, laps the core once clockwise and strikes the gap\'s front edge 12° past its slot; the ring is shoved 6° and swings back while a detent ring opens at the slot.',
};
