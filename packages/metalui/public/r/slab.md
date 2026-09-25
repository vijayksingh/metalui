# Slab

The thick panel a gadget is cut from. React: `Slab` from `@unlocalhosted/metalui`. SwiftUI: `MetalSlab`. A part: it has a look and no job of its own.

## Use it for

- The body of a slab gadget: the panel faders slide in, jacks sit in, keycaps rest in.
- A panel with cuts: a slot for a fader, a hole for a lamp or a jack, a tray for keys, a shallow well.

## Don't use it for

- A surface people put content on: that is a Surface or a Well.
- A control: a slab is never pressed. Strike it only as part of a gadget's act.

## Materials

clay, stone, ceramic, rubber, metal and resin (tokens `gadgets.parts.slab`). Each is lit by the one light with its own bevel, gloss, grain and flecks (Foundations › Materials); each sounds as its material when struck (Foundations › Sound).

## Cuts

| Cut | Shape | Default depth |
|---|---|---|
| slot | a capsule along its long side | 14 |
| hole | a circle | 18 |
| tray | a rounded rectangle | 10 |
| well | a softer rounded rectangle | 6 |

A cut's floor is the slab's own pigment in shadow, darker the deeper the cut (`gadgets.hole.floor`). Its top wall is shaded and its lower lip catches the light.

## Detail by size

Full lighting from 96 px, lite (no grain or flecks, a softer bevel) from 48 px, flat (no filters) below. The host changes only the world around it: shadows deepen on graphite, and very bright bodies step down.

## API

`Slab material color? ({ L, C, H } OKLCH) cuts? ([{ kind, at, size, depth?, radius? }], 400-unit canvas) size? (px, default 160) host? ("bone" | "graphite")`, with children drawn between the body and the cut lips.

SwiftUI: `MetalSlab(.stone, cuts: [.init(.slot, at: (200, 200), size: (18, 212))], size: 160)`.
