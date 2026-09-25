# Bezel

An inset gadget's body: a frame around a sunk glass face. React: `Bezel` from `@unlocalhosted/metalui`. SwiftUI: `MetalBezel`. A part: it has a look and no job of its own.

## Use it for

- The body of an inset gadget: the scope, the needle gauge, the glass badge. Where a slab gadget's parts stand on it, an inset gadget's face sits below its frame.
- A glass face that something shows through: a sweeping beam, a needle, a glyph.

## Don't use it for

- A slab with holes: that's a Slab with cuts.
- A screen in the interface: that's the Glass face component (dark glass). This glass is the gadget's own: light and icy, in the gadget's face colour.

## Anatomy

A frame, the body outline in the body's material (stone, metal or clay), 22 units at its narrowest, around a round or square opening. The glass face fills the opening, sunk 12 units: the frame's top wall shades it, its lower lip catches the light. The glass is lighter at the centre and darker to the rim, with engraved rings and a crosshair, a rim shade and a glare up toward the light. Anything that glows inside the glass is drawn between the glass and its surface. Tokens: `gadgets.bezel`, `gadgets.glass`.

## API

`Bezel material? ("stone" | "metal" | "clay") color? glass? ({ L, C, H }: a gadget's resolved face) opening? ("round" | "square") width? rings? size? host? children?` (children: light inside the glass, on the 400-unit canvas).

SwiftUI: `MetalBezel(.stone, glass: face, opening: .round, size: 160) { light }`.

In a gadget spec: `{ "part": "bezel", "role": "body", "params": { "opening": "round" } }` with a `glass-face` part inside it; the gadget's container is `inset`.
