# Folder

A folder on the canvas: the closed state of a container. React: `Folder` from `@unlocalhosted/metalui`. SwiftUI: `MetalFolder` (not yet).

## Use it for

- Blocks put together by dropping one onto another, by ⌘G, or by the evening sort.
- Anything that should be kept together but not take space (one container, two states).

## Don't use it for

- A place you are working in: unfold it into its region (`Region` with the same `hue`).

## Anatomy

From the Soft Hardware sheet's stack folder, 220 × 204: a back panel (150 tall, radius 26) with a tab (92 × 40, rising 16); up to three cards (114 × 148, radius 16) with a 62-tall picture and three lines; a frosted flap (106 tall) with the name (title), `Folder · N blocks` (engraved) and the count chip.

## States and motion

| State | Cards (y, lean) | Flap | Spring |
|---|---|---|---|
| rest | -10: 10°, 2°, -5° | -15° | – |
| hover / focus | -30 / -37 / -44: 14°, -1°, -9° (staggered 50 ms) | -45° | object (cards), hinge (flap) |
| open (dragged over, or unfolding) | -86 / -96 / -106: 18°, -3°, -14° | -55° | same |
| landing | – | shuts past rest to -4°, settles | hinge |
| empty | none | -15° | – |

Colour: `hue` = neutral (the sheet), red, amber, green, blue, violet; soft paper on the back, washed through the flap's blur. Reduce Motion: poses at once.

## API

`Folder name count peeks={[{thumb, link}]} hue open landed onUnfold`

- `landed`: change it each time a block drops in (a counter).
- `onUnfold`: double-click or Enter.
