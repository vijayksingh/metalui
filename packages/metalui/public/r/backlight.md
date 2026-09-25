# Backlight

Light behind a translucent part. React: `Backlight` from `@unlocalhosted/metalui`, placed inside a `Bezel`. SwiftUI: `MetalBacklight`, placed in a `MetalBezel`'s content. A part: it has a look and no job of its own.

## Use it for

- A scope's sweeping beam and its blips; a cell grid's glow; a lens lit from behind.
- Light that comes from inside a gadget, seen through its glass.

## Don't use it for

- A status light: that's the LED, a lamp in its own hole.
- Light on an opaque part. A backlight only shows through glass or resin.

## Anatomy

In its own colour, fading to nothing at its edge (not a screen blend: the gadget glass is light, and screening light onto it washes the colour out). A **glow** is a soft radial light half the part's radius across. A **beam** is a radar wedge from the centre, 70° wide, drawn as 14 slices growing fainter behind a bright leading edge; `heading` turns it (a mechanism sweeps it). A **dot** is a blip with a hot core. Its colour is a signal's (`live`, `link`, `waiting`, `failed`), the accent, or the glass's own colour lifted. Tokens: `gadgets.backlight`.

## States

- **Dark.** No light: leave it out, or `alpha` 0.
- **Lit.** `alpha` up to 1. In a gadget, a mechanism sets it: the `sweep` turns the beam and lights each blip as the beam crosses it, and the blip fades.

## API

`Backlight shape? ("glow" | "beam" | "dot") color ({ signal } | { accent: true } | { glass: face }) alpha? heading? at? size?`

SwiftUI: `MetalBacklight(.beam, color: .glass(face), heading: 40, size: 160)`.
