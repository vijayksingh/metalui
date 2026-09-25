import { actor, ease, light, motion, T } from '../motion.mjs';

/* ── OFFLINE / the satellite reaches for its slot and loses it ─
 * Verb, object   reconnect, failing. The satellite that has left the orbit swings back toward
 *                the empty slot in the gap, gets within a unit of it, and is thrown back out.
 * Invariant      the core and the orbit never move; the gap stays open and the satellite
 *                never enters it (it ends outside the ring, where it rests).
 * Causal parts   cause: the satellite's reach. Receiver: the core's link light, which rises as
 *                it nears and drops out when it misses. Payoff: the empty socket outlined in
 *                the gap at the closest pass, then gone.
 * Neighbours     not Synced (it never docks, no lap), not Sync Error (the orbit doesn't jam),
 *                not a disconnect animation that deletes anything.
 * Forbidden      a floaty drift loop, a blinking core, a shaking satellite.
 *
 *    0ms  rest: satellite out beyond the gap at 1:30, core dimmed (.55)
 *  160ms  it draws 0.7 further out (anticipate)
 *  440ms  swings in 2.4 along the diagonal, stopping a unit short of the slot;
 *         the core's light rises to .95 and the socket outlines in the gap
 *  520ms  stalls there
 *  560ms  the link fails: the core drops to .2
 *  680ms  the satellite is thrown back out 1.4 past rest; the socket fades
 *  820ms  falls back 0.4 inside rest, a small correction, the core returns to .55
 * 1100ms  exact rest
 * ────────────────────────────────────────────────────────── */
const sat = (at, d, easing = ease.smooth) => ({ at, transform: T({ x: d, y: -d }), easing });

export const act = {
  body: `<circle class="s" data-part="core" opacity=".55" cx="12" cy="12" r="2.1"/><circle cx="12" cy="12" r="7.6" pathLength="100" stroke-dasharray="76 24" transform="rotate(-3 12 12)"/><circle class="ac" data-part="socket" opacity="0" cx="17.37" cy="6.63" r="1.75" style="stroke-width:calc(var(--sw) * .6)"/><circle class="s" data-part="sat" cx="19" cy="5" r="1.6"/>`,
  study: motion(1100, 'The lost satellite swings back toward its slot, falls a unit short and is thrown back out.', ['Reach', 'Miss', 'Drift out'], [
    actor('sat', '19px 5px', [
      sat(0, 0), sat(160, .5, ease.strike), sat(440, -1.2), sat(520, -1.05, ease.accelerate),
      sat(680, 1, ease.smooth), sat(830, -.3), sat(960, .1, ease.settle), sat(1100, 0),
    ]),
    actor('core', '12px 12px', [
      { at: 0, opacity: .55, easing: ease.smooth }, { at: 200, opacity: .55, easing: ease.smooth },
      { at: 440, opacity: .95, easing: ease.linear }, { at: 520, opacity: .95, easing: ease.accelerate },
      { at: 580, opacity: .2, easing: ease.linear }, { at: 780, opacity: .2, easing: ease.smooth },
      { at: 1100, opacity: .55 },
    ]),
    actor('socket', '17.37px 6.63px', [
      light(0, 0, 'scale(.6)'), light(250, 0, 'scale(.6)', ease.settle), light(440, .7, 'scale(1)'),
      light(520, .7, 'scale(1)', ease.smooth), light(720, 0, 'scale(.7)'), light(1100, 0, 'scale(.6)'),
    ]),
  ]),
  shape: 'Same orbit as Synced with a 76/24 dash turned −3° (an 86° gap); the satellite (r1.6) has left the ring (r≈9.9) and the core is dimmed to .55. Motion (study): the satellite swings 2.4 in toward its slot, the core\'s light rises and the empty socket outlines in the gap; it misses, the core drops to .2 and the satellite is thrown back out past rest before settling.',
};
