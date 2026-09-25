# Plug

A knurled cap that seats in a Jack. React: `Plug` from `@unlocalhosted/metalui`. SwiftUI: `MetalPlug`. A part: it has a look and no job of its own.

## Use it for

- The moving half of a connection: the patch bay's plugs, a rig's cable ends.
- The part a person would reach for: give that one the accent, and only that one.

## Don't use it for

- A knob or a button: a plug lifts and seats (the seat mechanism); it never turns.
- More than one accent plug in a gadget.

## Anatomy

Seen from above: a round face on a darker skirt (its side, showing 0.15 of the radius below), six grip knurls, a centre boss, and optionally a cable stub leaving up, left or right (tokens `gadgets.plug`). Its shadow is a separate layer (`plug.shadow`), so when the plug lifts its shadow opens: larger, softer, further away.

## API

`Plug accent? color? ({ L, C, H } OKLCH) stub? ("up" | "left" | "right" | "none") size? (px) host?`

SwiftUI: `MetalPlug(accent: true, stub: .up, size: 96)`.

In a gadget spec: `{ "part": "plug", "role": "actor", "material": "accent" }`; the seat mechanism binds it to its `plug` slot.
