// glow: light rises behind resin cells; they light in turn from the bottom row up, the one filling now
// part way, and the backlight brightens with them. Verb: keep. Invariant: the lit share is the value's
// share once it settles, and cells light in order (never one out of turn). Causal parts: the cells and
// the light behind them. Forbidden: a sound while it fills (light is silent; a first run is marked by
// the lamp and a ready beep, through the gadget's state).
import { mechanism } from '../mechanism.mjs';

export const glow = mechanism('glow', {
  mode: 'held',
  caption: 'Light rises behind the resin: the cells light in turn from the bottom row up, and the backlight brightens with them.',
  stages: ['Rise', 'Fill', 'Settle'],
  slots: { cells: 'actor', light: 'trim', lamp: 'lamp' },
  spring: 'settle',                    // light eases in and comes to rest; it never overshoots
  held: {
    drive: 'number',
    slot: 'cells',
    from: {}, to: {},                  // nothing moves: the gadget paints the share as light
    detents: 0,
    stagger: 0,
    wall: 0,                           // full is full: no bounce
    impactFull: 1, scrapeFull: 1,
    tickMin: 0.15, tickGap: 40,
    step: 240,
  },
  cues: [],
  states: {},
  reduced: ['lamp', 'sound'],
});
