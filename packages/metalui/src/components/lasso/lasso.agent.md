# Lasso

The box a drag on empty canvas draws, with a count of what it will select. React: `Lasso` from `@unlocalhosted/metalui`. SwiftUI: `MetalLasso`. It uses the Size readout for its count.

## Use it for

- A drag that starts on empty canvas (the Select tool, or no tool). Every object the box touches is selected when the drag ends.

## Don't use it for

- Showing a selection that already exists (that is the Selection frame), or a region (a region is an object you made).

## Anatomy

- A rectangle in world coordinates from where the drag began to the pointer; a drag up or left works the same.
- Its edge is `presence.lasso-width` (1 pt) in `presence.guide`; its fill is `presence.lasso-fill` (intent green at 6 %). Graphite: `guide-dark` and `lasso-fill-dark`.
- Under it, centred, `presence.readout-gap` / 2 (8 pt) below: `SizeReadout` reading `● 3 blocks` (the count, then the unit dimmed). No readout while the count is 0.
- The line and the readout keep their screen size at every zoom: pass the canvas `scale`.

## States and motion

| State | Look |
|---|---|
| rest | nothing |
| drawing | the box and the count, updated in the same frame as the pointer |
| release | the box fades on the release spring; the Selection frame takes over |

No marching ants, no glow. Reduce Motion: it clears at once.

## API

| React | SwiftUI |
|---|---|
| `rect` (`x`, `y`, `width`, `height`, or `null`) | `rect:` |
| `count` | `count:` |
| `scale` | `scale:` |
| `unit` | `unit:` |

## Rules

- The count is what the box touches now, never a guess.
- The box never moves objects; it only chooses them.
