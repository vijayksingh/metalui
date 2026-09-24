# Size readout

A graphite pill that reads a measured value. React: `SizeReadout` from `@unlocalhosted/metalui`. SwiftUI: `MetalSizeReadout`. The Selection frame places one under its object; this is the same readout on its own. Kamui brief: 04 §10, 03 §7.

## Use it for

- An object's measured size (`● 320 × 214`), a multi-selection (`● 3 · 540 × 180`), a copy (`● COPIED · PNG 130 × 215`, for 900 ms), a zoom level (`● 100 %`).

## Don't use it for

- Status with words (use the status pill), counts in a list (use the readout type role inline), or anything a person edits.

## Anatomy

A 24 tall pill (`presence-readout-bg`, its stack), padding 0 11 0 10, gap 7: a 4 pt green LED, then the value in the `readout` role (Martian Mono 10.5, tabular), tracked .04em, `#E9E9E7`; the `×` and `·` in `#6E6E72`.

## States and motion

| State | Look |
|---|---|
| live | LED on |
| writing (inside the Selection frame) | .78 |
| moving | 1 |
| copied | `COPIED · PNG …` for 900 ms |

Opacity changes ride settle. The value changes in place without motion (figures are tabular, so the pill does not jitter).

## API

| React | SwiftUI |
|---|---|
| `width`, `height` | `size:` |
| `count` | `count:` |
| `copied` | `copied:` |
| `value` | `value:` |
| `led` | `led:` |

## Rules

- It reads a measurement, never a constant.
- Short: one value, never a sentence.

## Accessibility

- It repeats what the object states (its size is the host's to expose). Where it is the only carrier (a zoom level), give it a label or make it a live status in the host.

## Tokens

`--mu-presence-readout-*`, `--mu-led-green`, `--mu-led-ring`, `--mu-type-readout`. Swift: `MetalPresence`.
