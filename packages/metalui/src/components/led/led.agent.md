# LED

A tiny lamp lit from the top left that says one state by colour. React: `Led` from `@unlocalhosted/metalui`. SwiftUI: `MetalLED`. A part: it has a look and no job of its own.

## Use it for

- One state, beside the words that name it: in a status badge, a size readout, a hover engraving, the lens bar.

## Don't use it for

- A state on its own, with no words: colour alone is not enough.
- Something pressable: the LED is decorative (`aria-hidden`).

## Kinds and sizes

| Kind | Colour | Means |
|---|---|---|
| live | green | on, working, latched |
| waiting | amber | in progress, asking |
| failed | red | stopped, needs you |
| link | blue | points somewhere else |
| off | grey | idle |

Sizes: 5 (default) and 4 (small, in dense readouts).

## API

`Led kind size ("default" | "small")`
