# Connector

A line between two blocks, and everything around it. React: `Connector` from `@unlocalhosted/metalui`. SwiftUI: `MetalConnector` (not yet).

## Use it for

- A line or arrow whose ends land on two blocks (the core's `ink_endpoints`), per DRAWING.md DR-07.
- `look="current"` or `"stardust"` to show that something flows between two blocks.

## Don't use it for

- Plain strokes that touch no block.
- Current or stardust on every line: they animate all the time. Elastic is the default.

## Looks

| Look | What it is |
|---|---|
| elastic (default) | a taut band; its middle rides a spring (k 170, damping 13), so the line bends behind a moving block and whips back with one overshoot. Arrowheads show the flow. Still when settled. |
| current | a quiet line (28 %) with comets of light: each leaves the source slowly, speeds up, slows into the target, which glows as it lands. Quickens while a block moves. |
| stardust | 34 drifting, twinkling motes along the line; a shimmer runs in the flow's direction. Hover or select: the motes pull into a line. |

`flow`: `forward` (from → to), `backward`, `both`.

## Chrome

| State | Look | Motion |
|---|---|---|
| rest | the line and label | – |
| hover | green halo; end dot 4.5, solid (attached) or hollow (free) | part spring fade |
| selected | halo; end handles 5 | – |

The line is world ink (scales with zoom); halo, dots, handles, hit band (18) and label keep their screen size. Reduce Motion: elastic's straight line, no spring, no flow.

## API

`Connector from={x,y,attached} to={…} look flow ink width state label scale onHoverChange onPress onEndPointerDown`
