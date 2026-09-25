# Line handles

The presence of a drawn line or arrow. React: `LineHandles` from `@unlocalhosted/metalui`. SwiftUI: `MetalLineHandles` (not yet).

## Use it for

- A line or arrow drawn with the Line or Arrow tool that is not a connector.

## Don't use it for

- Rectangles, ellipses and strokes: use `SelectionFrame` (eight handles).
- Connectors: `Connector` has the same chrome built in.

## States

| State | Look |
|---|---|
| rest | nothing |
| hover | green halo along the line, hollow dot at each end (part spring fade) |
| selected | halo, a handle at each end; dragging one moves that end |

Uses the connector recipe's halo, dot and handle, so every selection on the canvas looks alike. Sizes keep their screen size (`scale`).

## API

`LineHandles from to state scale onHandlePointerDown`
