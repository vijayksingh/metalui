# Glass face

A dark glass object. React: `GlassFace` with parts `GlassFace.Root` (the bezel) and `GlassFace.Screen`. SwiftUI: `MetalGlassFace { screen: … }`.

## Use it for

- An object that shows a screen: a link's preview, a block of code, an image behind glass.

## Anatomy

- The bezel: radius 22, padding 6, a dark gradient with a bright top edge, an inner glow and a deep drop shadow.
- The screen: radius 16, near black; the glare is a 115° sheen, a darkening toward the bottom, a bright top rim, a dark inner ring and an inner shadow. The screen's own fill (a hue, a gradient) is the caller's, under the glare.

## Behaviour

- No role; the content and its actions carry their own.
