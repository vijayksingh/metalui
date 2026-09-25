# Cell

Raised blocks of translucent resin in a grid, lit from behind. React: `Cell` from `@unlocalhosted/metalui`. SwiftUI: `MetalCell`. A part: it has a look and no job of its own.

## Use it for

- Something kept that fills up: a memory, a cache, a library of what a person has made.
- A first run: the grid lights in turn to show it has begun.

## Don't use it for

- A level read at a glance: that's the Needle.
- An exact count: that's the Drum. A cell grid shows how full, not how many.

## Anatomy

Cells 44 units square (radius 23 % of the side), `cols` × `rows` (1 to 8 each), `gap` 6 to 14 units apart. Dark, a cell is the resin's colour dropped a little, deeper toward its foot, shaded by the resin's light. Lit, the light comes through: the resin lifted and made richer, near white at its core, thinner at its rim (the resin lets 60 % through there), with a halo spilling onto the slab. Tokens: `gadgets.cell`.

## States

- **Dark.** `lit` 0: every cell its resin colour.
- **Filling.** `lit` between 0 and cols × rows: cells light from the bottom row up, left to right, and the one filling now glows part way.
- **Full.** Every cell lit.

In a gadget the `glow` mechanism carries `lit` on the settle spring. A cell makes no sound.

## API

`Cell cols? rows? gap? lit? color? size? host?` (color: the resin's OKLCH, the accent by default).

SwiftUI: `MetalCell(cols: 4, rows: 4, lit: 6.5, size: 160)`.
