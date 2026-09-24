# Size readout

A graphite pill that reads a measured value. React: `SizeReadout` from `@unlocalhosted/metalui`. SwiftUI: `MetalSizeReadout`. The Selection frame places one under its object; this is the same readout on its own. Built from `Surface`, `Led` and `Label`; a component rather than a block because the Selection frame block uses it.

## Use it for

- An object's measured size (`● 320 × 214`), a multi-selection (`● 3 · 540 × 180`), a copy (`● COPIED · PNG 130 × 215`, for 900 ms), a zoom level (`● 100 %`).

## Don't use it for

- Status with words (use the status pill), counts in a list (use the readout type role inline), or anything a person edits.

## Anatomy

`Surface material="graphite-deep" radius="pill"`, 22 tall, padding 0 10, gap 6: `Led kind="live"` (5 pt), then the value in `Label variant="readout"` (10.5 mono at 1, tracked .04em, `#EDEDEF`); the `×` and `·` in `Label variant="readout-dim"` (`#7C7D82`).

## States and motion

| State | Look |
|---|---|
| live | LED on |
| writing (inside the Selection frame) | .78 |
| moving | 1 |
| copied | `COPIED · PNG …` for 900 ms |

Opacity changes ride settle. The value changes in place without motion; the pill's width follows the figures, as the reference's does.

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
