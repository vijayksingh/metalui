# Drum

A numbered wheel seen through a window. React: `Drum` from `@unlocalhosted/metalui`. SwiftUI: `MetalDrum`. A part: it has a look and no job of its own.

## Use it for

- A counter you can read at a glance: the counter drum's digits (a streak, a count of things).
- A number that changes by steps and should be seen to change.

## Don't use it for

- A number in the interface. Use text in the readout role.
- A measure that isn't a count (a level, a proportion): that's a needle or a fader.

## Anatomy

A drum the Part's 52 × 88, its face ceramic or clay (or the accent on the digit you read first). Its strip carries 0 to 9, 36 units apart, in the mono face and the face's own ink, and wraps: 9 runs on into 0. The cylinder turns away at the top and bottom, so it darkens toward each edge, and a glint lies across its upper curve. Tokens: `gadgets.drum`.

## States

- **At rest.** `value` a whole digit, centred in the window.
- **Rolling.** In a gadget, the `roll` mechanism turns it: `value` passes between digits, forward through 9 into 0, ticking at each digit and settling without overshoot with a small knock.

## API

`Drum value? (0 to 10, wraps) accent? face? ("ceramic" | "clay") color? glyphs? ("digits" | "ticks") size?`

SwiftUI: `MetalDrum(value: 7, face: .ceramic, size: 96)`.

In a gadget spec: `{ "part": "drum", "role": "actor", "params": { "digits": 10, "face": "ceramic" } }`, several bound to `roll`'s `drums` slot, lowest digit last.
