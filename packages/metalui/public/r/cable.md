# Cable

A rubber patch cord between two plugs. React: `Cable` from `@unlocalhosted/metalui`. SwiftUI: `MetalCable`. A part: it has a look and no job of its own.

## Use it for

- A connection you can see: the patch bay's cord, and every wire in a rig (one gadget drives another).
- Showing what is connected to what. A cable always means that its two ends are joined.

## Don't use it for

- Decoration, or a divider. A cord with nothing plugged into either end is not a cable.
- Crossing a lamp: route it lower (more sag) instead.

## Anatomy

One cubic path drawn as layered strokes: a soft shadow (its own layer, `cable.shadow`), the rubber body, a darker underside, and a sheen along its top toward the light (tokens `gadgets.cable`). Its width matches a plug's stub, so the cord runs out of the plug without a seam. It has no lighting filter, so it can move every frame.

## Physics

- **Droop.** Give it a `length` and it hangs like a real cord: the parabola of a hanging cable, taut when the ends are pulled as far apart as its length, a U when they come together. Without a length it droops by a share of the distance (`sag` [0.18, 24, 90]); `sag` sets it outright.
- **Swing.** When an end moves, it goes at once (a hand or a plug holds it); the belly follows on the `hinge` spring and keeps its speed if the ends move again, so a flicked end swings the cord and it settles. With reduced motion the cord goes straight to its new shape.
- **Sound.** A cord makes no sound of its own. When one is dropped, the gadget strikes rubber softly (`parts.cable.strike`).

## API

`Cable from ([x, y]) to ([x, y]) sag? length? color? ({ L, C, H }) size? (px)`, all in canvas units on a 400-unit square.

SwiftUI: `MetalCable(from: CGPoint(x: 80, y: 150), to: CGPoint(x: 320, y: 150), length: 300, size: 160)`.

In a gadget spec: `{ "part": "cable", "role": "trim", "params": { "from": "plugA", "to": "plugB", "sag": 34 } }`. In a rig, cables come from the spec's `cables` and are routed for you.
