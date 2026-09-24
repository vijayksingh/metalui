# Brush cursor

The pointer while drawing (P) or erasing (E) on the canvas. React: `BrushCursor` from `@unlocalhosted/metalui`. SwiftUI: `MetalBrushCursor` (on the Mac, an `NSCursor` image drawn from the same values). Its look is the `brush` recipe.

## Use it for

- The draw and erase tools, over the canvas only. Hide the system cursor there (`cursor: none`) and pass the pointer position.

## Anatomy

- Pen: a disc in the ink colour, diameter = stroke width × zoom (× pressure while drawing), never under `brush.min` (6); a 0.5 light ring and a 0.5 dark edge so it reads on any ink and on both colorways.
- Eraser: a dashed ring (1 pt, 3 / 2) of the eraser's diameter; dark on Bone, light on Graphite.

## States and motion

| State | Look |
|---|---|
| hover | follows the pointer in the same frame |
| drawing | the disc's size follows pressure at once |
| off the canvas | hidden (`at = null`); the system cursor returns |

No easing: the brush shows the stroke you are about to make.

## API

| React | SwiftUI |
|---|---|
| `mode` (`pen`, `eraser`) | `mode:` |
| `at` | the cursor's position |
| `size` | `size:` |
| `color` | `color:` |

## Rules

- The brush is the stroke's true size on screen, always.
- The eraser ring is the area it removes.
