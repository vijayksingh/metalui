# Folder

A folder on the canvas: the closed state of a container. React: `Folder` from `@unlocalhosted/metalui`. SwiftUI: `MetalFolder` (not yet).

## Use it for

- Blocks put together by dropping one onto another, by ⌘G, or by the evening sort.
- Anything that should be kept together but not take space (one container, two states).

## Don't use it for

- A place you are working in: unfold it into its region (`Region` with the same `hue`).

## Anatomy

From the Soft Hardware sheet's stack folder, 220 × 204: a translucent paper back panel (150 tall, radius 26, tapering 10 per side toward the bottom) with a tab rising 16; up to three cards (114 × 148, radius 16) with a 62-tall picture and three lines; a frosted glass flap (106 tall, tapering 12 per side: a clipped blur layer under a see-through fill) with the name (title), `Folder · N blocks` (engraved) and the count chip.

## States and motion

Up to six cards peek, each posed by its place in the pile (t: 0 back → 1 front); the fan widens a little with the count. At three cards the poses are the sheet's exactly.

| State | Cards (y, lean, back → front) | Flap | Order |
|---|---|---|---|
| rest | -10: 10° → -5° | -15° | leaving hover: the front settles first |
| hover / focus | -30 → -44: 14° → -9° | -45° | the back lifts first, 45 ms apart (object spring) |
| open (dragged over, or unfolding) | -86 → -106: 18° → -14° | -55° | same |
| joining | the new card is added at the front, the others re-spread; its slot waits (`waiting`) until the block lands | open | – |
| landing | the fan settles together | shuts past rest to -4°, settles (hinge spring) | – |
| empty | none | -15° | – |

Past six, the oldest slides down into the pocket. Colour: `hue` = neutral (the sheet), red, amber, green, blue, violet; soft paper on the back, tinting the glass flap. Reduce Motion: poses at once.

## API

`Folder name count peeks={[{thumb, link}]} hue open landed onUnfold`

- `landed`: change it each time a block drops in (a counter).
- `onUnfold`: double-click or Enter.
