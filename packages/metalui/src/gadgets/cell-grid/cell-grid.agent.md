# Cell grid

A gadget for something kept that fills, drawn from a spec. React: `<Gadget spec={cellGrid} value={share} />` from `@unlocalhosted/metalui/gadgets`. The spec is `fixtures/cell-grid.gadget.json`. An Object (an emblem): it stands for what a person keeps, and is never a control.

## Use it for

- Something kept that fills up: a memory, a library of captures, a cache warming.
- A first run: set the `first-run` state and the whole grid rises, the lamp breathes and the beeper says `ready`.

## Don't use it for

- An exact count a person reads: that's the counter drum.
- A level that rises and falls: that's the needle gauge.

## How it moves

The `glow` mechanism, held: `fill` (0 to 1) lights that share of the 16 cells on the settle spring, in order from the bottom row up, the one filling now part way; the light behind them burns from 0.08 to 0.92 as they fill. Light is silent. With reduced motion it goes straight to the share.

## States

The share decides the first three; a first run is the host's.

| State | Lamp | News |
|---|---|---|
| rest | off | none (no cell lit) |
| filling | live, steady | none |
| full | live, steady | none |
| first-run | live, breathing | `ready`, once; the grid lights all the way |

It says how much it keeps: "Memory: 40% kept".

In a rig: `fill` (number 0 to 1) and `first-run` (pulse) in, `full` (boolean) out.
