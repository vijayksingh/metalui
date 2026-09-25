# Perfect preview

Hold to perfect. React: `PerfectPreview` from `@unlocalhosted/metalui`. SwiftUI: `MetalPerfectPreview` (not yet).

## Use it for

- The pen or pencil held still at the end of a rough line, circle, rectangle or triangle (DRAWING.md DR-05). The core's `shape_recognize` gives the fitted shape.

## Don't use it for

- A large closed loop released without holding: that is still a region.

## Flow

1. Pointer still for a moment with a fitted shape: `phase="holding"`, `d` = fitted outline.
2. The outline traces round over 450 ms (`--mu-r-perfect-self-hold`). `onHeld` fires when it closes.
3. Host sets `phase="done"` and morphs the drawn points to the shape over 180 ms on the settle spring (`--mu-r-perfect-self-morph`, `--mu-spring-settle`); the outline fades over the same time. Then `idle`.
4. Still holding after the morph: `phase="tuning"` with `tune={centre, pointer, angle, scale}`. The host turns and resizes the shape around its centre from the pointer (angle catches at every 45° within 5°); this draws the centre dot, the dashed guide and the readout. Letting go places it.
5. Pointer moves or Escape during 1–2: `phase="idle"` at once; keep the hand-drawn stroke.

## Look

1.5 green line (screen width at any zoom), 70 %. Graphite uses the lighter green. Reduce Motion: shown whole, no trace.

## API

`PerfectPreview d phase tune scale onHeld`

Recognition (the core's `shape_recognize`) should judge closed strokes on the convex hull: biggest inner triangle ≥ .62 of it → triangle; fills ≥ .835 of its tightest box, or its biggest 4-gon ≥ .77 → rectangle (that box, level within 10°); else ellipse in that box. See the docs page's measured table.
