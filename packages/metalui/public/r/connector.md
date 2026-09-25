# Connector

The look around ink whose ends sit on two blocks. React: `Connector` from `@unlocalhosted/metalui`. SwiftUI: `MetalConnector` (not yet).

## Use it for

- A line, arrow or pen stroke whose first and last points land on two blocks (the core's `ink_endpoints`), per DRAWING.md DR-07.

## Don't use it for

- Drawing the ink itself. The host fills the core's outline; this draws only the halo, ends and label.
- Plain strokes that touch no block.

## Anatomy

An SVG at the world origin (inside the transformed world) with the halo (9 wide, green at .24) and two end circles; a label chip (cap surface, 12.5 UI type, padding 2 × 7, radius 7) centred on `labelAt`. All sizes are divided by `scale`.

## States and motion

| State | Look | Motion |
|---|---|---|
| rest | ink and label only | – |
| hover | halo; end dot 4.5, solid (attached) or hollow (free) | fades in on the part spring |
| selected | halo; end handles 5, white with a green line | – |
| a block moves | host re-routes `d`, ends and `labelAt` in the same frame | none |

## API

`Connector d from={x,y,attached} to={…} state label labelAt scale onEndPointerDown`
