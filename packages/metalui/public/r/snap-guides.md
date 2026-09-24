# Snap guides

The lines that explain a snap while a person moves or resizes an object on the canvas. React: `SnapGuides` from `@unlocalhosted/metalui`. SwiftUI: `MetalSnapGuides`.

## Use it for

- Moving or resizing objects on the canvas, when the core's snap lands an edge or a centre on a neighbour's. Pass the core's `guides` for this frame.

## Don't use it for

- Showing a grid, a ruler or a selection. Guides exist only while something is being moved, and only for the alignments that actually snapped.

## Anatomy

- One line per alignment, in world coordinates, drawn inside the transformed canvas world.
- `presence.guide-width` (1 pt) in `presence.guide` (`#3FB97A`; `presence.guide-dark` `#78D6A5` in Graphite).
- Edges solid; centres dashed `presence.guide-dash` on, the same off (3 / 3).
- Each line spans every aligned object plus `presence.guide-overshoot` (8 pt) at both ends.
- Width, dash and overshoot are screen points: pass the canvas `scale` and they stay the same at every zoom.

## States and motion

| State | Look |
|---|---|
| rest | nothing |
| snapping | the lines for this frame, updated in the same frame as the snap, never animated |
| release | the last lines fade on the release spring, then clear |

Reduce Motion: they clear at once.

## Haptics

`onEngage` fires once when a snap catches a line that was not caught in the previous frame. Staying on a line is silent; letting go is silent; catching a second line while on the first fires again.

- Mac: play `NSHapticFeedbackManager.defaultPerformer.perform(.alignment, performanceTime: .now)` in the same frame as the snap. `MetalSnapGuides` does this itself.
- Web: browsers on a Mac trackpad or an iPhone have no haptics. Where `navigator.vibrate` exists (Android), a host may call `navigator.vibrate(8)`. Never replace a haptic with a sound or a flash.

## API

| React | SwiftUI |
|---|---|
| `guides: SnapGuide[]` (`axis`, `position`, `start`, `end`, `kind`) | `guides:` |
| `scale` | `scale:` |
| `onEngage` | built in (the alignment haptic) |

## Rules

- A guide explains a snap that happened. Never draw one the snap did not use.
- Guides move with the snap in the same frame. A lagging guide would contradict the snap.
- ⌘ held turns snapping off, so there are no guides and no haptic.
- One haptic per new line caught, never one per frame.
