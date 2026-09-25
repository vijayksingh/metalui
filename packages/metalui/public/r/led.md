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

## Gestures

How the lamp behaves over time (tokens `status.gestures`). A gesture dims and brightens the lamp's glow; it never fades the lamp away.

| Gesture | Behaviour | Use it for |
|---|---|---|
| steady | holds | the default: a state that simply is |
| flicker | one burst of activity (0.8 s), then on | something just happened: a sync finished, a value arrived |
| breathe | a slow loop (2.4 s) | something in progress: syncing, searching |
| blink2 | two sharp flashes, then on | a failure, once; never repeat it |
| rise | comes on slowly (1.2 s) | a first start, a machine waking |

Reduced motion holds every gesture at its final level, so the colour still says the state. Changing the gesture, or the kind, plays it again.

## API

`Led kind size ("default" | "small") gesture ("steady" | "flicker" | "breathe" | "blink2" | "rise")`

SwiftUI: `MetalLED(.live, gesture: .flicker)`.
