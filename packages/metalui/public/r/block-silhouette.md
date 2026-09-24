# Block silhouette

A block seen from far away. React: `BlockSilhouette` from `@unlocalhosted/metalui`. SwiftUI: `MetalBlockSilhouette`. Its look is the `silhouette` recipe.

## Use it for

- Every block on the canvas when the zoom is below the far-zoom threshold (the core's `lod_policy`, 0.35). The canvas swaps blocks for silhouettes on the camera commit, never in the middle of a gesture.

## Don't use it for

- Loading placeholders or skeletons. A silhouette is a real block, seen from far.

## Anatomy, per kind

| Kind | Silhouette |
|---|---|
| text | bars where its lines are (8 tall every 22), no plate; `lines` ends them after the last line |
| code | the dark code card with light bars (7 every 20) inside, 12 padding |
| link | the dark glass with the site's tint (`color`) glowing from the top right |
| swatch | its colour (`color`) |
| image | its average colour (`color`), lit a little from the top |
| file | a light plate |
| region | its tray and its name (`label`) at 56 pt, so it reads at 35 % |

No text other than a region's name, no shadows beyond a hairline: it must stay cheap for thousands of blocks.

## States and motion

| State | Look |
|---|---|
| enter | fades in over 160 ms on settle as the zoom crosses the threshold; Reduce Motion: at once |

## API

| React | SwiftUI |
|---|---|
| `kind` | `kind:` |
| `color` | `color:` |
| `label` | `label:` |
| `lines` | `lines:` |

## Rules

- The silhouette sits exactly where its block is and is exactly its size.
- Swap at the camera commit, never during a pinch or a pan.
- Both clients use the same threshold from the core, so a shared canvas looks the same to everyone.
