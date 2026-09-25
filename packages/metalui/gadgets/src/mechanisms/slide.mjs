// slide: caps travel along their slots to a new mix, one after another, and settle.
// Verb: adjust. Invariant: a cap never leaves its slot; a value is a place along it. Causal parts: the
// caps (the slot is a cut in the body and never moves). Forbidden: a sound while nothing moves; a cap
// passing the end of its slot (the ends are walls).
import { mechanism, scrape, detent, stop } from '../mechanism.mjs';

export const slide = mechanism('slide', {
  mode: 'held',
  caption: 'Caps travel along their slots to a new mix, one after another; they scrape as they go, tick past each detent, and knock if they reach the end.',
  stages: ['Push', 'Travel', 'Settle'],
  slots: { caps: 'actor', slot: 'cut', lamp: 'lamp' },
  spring: 'part',
  held: {
    drive: 'number',
    slot: 'caps',
    from: { y: 92 }, to: { y: -92 },   // value 0 at the bottom of the slot, 1 at the top
    detents: 8,                        // ticks at every eighth of the travel
    stagger: 40,                       // ms between one cap starting and the next
    wall: 0.25,                        // a cap hitting an end comes back a quarter as fast
    impactFull: 1.5,                   // travel per second that hits an end at full knock
    scrapeFull: 3,                     // travel per second that scrapes at full speed
    tickMin: 0.15,                     // slower than this, crossing a detent is a wobble, not a tick
    tickGap: 40,                       // ms: at most one tick per cap this often
    step: 240,                         // integration steps per second, the same on both platforms
  },
  cues: [scrape('caps', 1), detent('caps', 0.45), stop('caps', 0.8)],   // scrape: of sound.scrape's own level
  states: {},
  reduced: ['lamp', 'sound'],
});
