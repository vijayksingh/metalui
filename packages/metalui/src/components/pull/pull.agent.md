# Pull

A drawer's handle, seen from above. React: `Pull` from `@unlocalhosted/metalui`. SwiftUI: `MetalPull`. A part: it has a look and no job of its own.

## Use it for

- The front of something that slides out: a drawer, a tray.

## Don't use it for

- Something that swings open: that's a Lid (its grip is part of it).
- A control a person turns: that's a cap.

## Anatomy

- **Bar**: a metal capsule 96 × 14 standing 6 units out in front of the drawer front on two posts 12 in from its ends. Lit on its upper curve (a crown lighter than the metal, a darker foot) with a thin sheen, and casting a small shadow below it.
- **Recess**: a finger slot cut into the front: dark inside, with a lit lower lip.

Drawn by itself it sits on a pale clay front. Tokens: `gadgets.pull`.

## States

None of its own: it rests. In a gadget the drawer's `slide-out` moves it with the tray, and a strike on it is metal (a bar) or clay (a recess).

## API

`Pull style? front? size? host?` (style: `bar` or `recess`; front: the drawer front's OKLCH).

SwiftUI: `MetalPull(style: .bar, size: 160)`.
