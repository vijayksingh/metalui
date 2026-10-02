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

Lens sizes: 8 (default) and 6 (small). An opaque #242427 socket adds 1 on each side: total footprints 10 and 8. Every lit kind has the same soft halo; off is a dull, unlit socket. Shared inks are in `recipes.status.props.ink`; measured contrast and colour-vision limitations are in `docs/STATUS-COLORS.md`.

## Gestures

How the lamp behaves over time (tokens `status.gestures`). Only the inner lens and halo animate opacity, down to the shared dim level. The opaque socket never fades. Waiting breathes by default; failure double-blinks once; live and link hold steady; off stays dark.

| Gesture | Behaviour | Use it for |
|---|---|---|
| steady | holds | live or link: a state that simply is |
| flicker | one burst of activity (0.8 s), then on | something just happened: a sync finished, a value arrived |
| breathe | a slow loop (2.4 s) | something in progress: syncing, searching |
| blink2 | two sharp flashes, then on | a failure, once; never repeat it |
| rise | comes on slowly (1.2 s) | a first start, a machine waking |

Reduced motion (OS, html.rm or scoped data-mu-motion=reduce) holds every gesture at its final level. Words still identify the state. Offscreen and hidden web lamps pause; native lamps stop their frame clock while inactive or absent, and after a finite gesture completes. Changing the gesture, or the kind, plays it again.

## API

`Led kind size ("default" | "small") gesture ("steady" | "flicker" | "breathe" | "blink2" | "rise")`

Use `gesture="steady"` when an amber ink names a static fact: an away person's presence, a historical Fixed changelog heading, or a negative weekly comparison. `waiting` defaults to breathing for a currently pending operation; words must make that pending state explicit. A hidden hover engraving pauses its lamp until the host is hovered or the engraving is explicitly presented. Visible lamps still pause off screen or in a hidden tab, and reduced motion removes the loop.

The docs' intentional active examples are auditable: `apps/docs/src/pages/components/LensBar.tsx` mounts one `source="asking"` fixture (the playground starts at model), and `apps/docs/src/pages/components/Status.tsx` mounts a waiting LED and a waiting badge in its five-state gallery. Those are one and two pending lamps respectively; `apps/docs/src/ui/WipNotice.tsx` adds the shared Work in progress lamp while visible. `e2e/led-semantic-idle.spec.ts` checks static consumers, hidden/shown engraving, real LensBar asking-to-model and Status waiting-to-live changes. `e2e/clocks-sleep.spec.ts` covers off-screen pause and wake. These examples justify their specific pending loops; they do not permit other infinite motion at rest.

SwiftUI: `MetalLED(.live, gesture: .flicker)`.
