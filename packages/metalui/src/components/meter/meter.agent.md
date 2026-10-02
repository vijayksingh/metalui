# Meter

A level in a range. React: `Meter` from `@unlocalhosted/metalui`, on Base UI Meter. SwiftUI: `MetalMeter`. Every segment sits in the reviewed opaque socket and uses the same per-colorway state inks and lit halo (the `status` recipe); the `meter` recipe adds the segments and the sweep.

## Use it for

- A measurement that sits in a known range: storage used, battery, signal, a quota.

## Don't use it for

- A task's progress (use progress), or a value someone sets (use a slider).

## Anatomy

- Head (optional): label at the left (ui type), value at the right (meta type).
- Segments: 16 lamps in a row, 10 tall, 2 apart, radius 2.5; the socket bezel takes 1 inside that existing footprint. Lit up to the value; dark (the off lamp) above.
- Colour by position: green, amber from 75 % of the range, red from 90 % (`warn`, `danger`), measured toward the bad end: the top by default, the bottom with `bad="low"` (a battery).

## States and motion

| State | Look | Motion |
|---|---|---|
| level | lit up to the value | – |
| rising | more segments light | one segment every 16 ms upward from the old edge, each fading in 90 ms |
| falling | segments go dark | one every 16 ms downward from the old edge |

Reduce Motion: every segment changes at once (web scoped data-mu-motion/OS, native additive metalReduceMotion/OS). Only lamp opacity transitions; nothing runs at rest.

## API

| React | SwiftUI |
|---|---|
| `value`, `min` (0), `max` (100) | `value:`, `in:` |
| `label`, `showValue`, `format` | leading label, `showValue:`, optional `valueText:` |
| `segments` (16), `warn` (0.75), `danger` (0.9), `bad` (`high`, `low`) | `segments:`, `warn:`, `danger:`, `bad:` |

## Keyboard and accessibility

- A `meter` with aria-valuenow, min and max; the label names it. It takes no focus. The colours repeat what the value says; never use colour alone to warn (say it in text too).

## Rules

- A meter measures; it never counts down a task.
- Keep the zones meaningful: amber and red only where the level is a problem.
