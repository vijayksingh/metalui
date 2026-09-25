# Draw picks

The ink and width choices beside the drawing tools. React: `InkPicks`, `WidthPicks` from `@unlocalhosted/metalui`. SwiftUI: `MetalInkPicks`, `MetalWidthPicks` with `Binding<MetalInk>` and `Binding<MetalInkWidth>`.

## Use it for

- Choosing the ink (ink, red, blue, green, amber) and width (fine, regular, bold) of the pen, pencil, marker, line, arrow, rectangle and ellipse.

## Don't use it for

- A free colour picker. The set is fixed on purpose.
- Anything outside a `Toolbar`: the picks are toolbar buttons.

## Anatomy

A 28 round cap. Ink: a 14 bead in its colour with a gloss. Width: a dot of 3, 6 or 10 in the current ink. Picks sit 2 apart.

## States and motion

| State | Look | Motion |
|---|---|---|
| hover | bead or dot at 1.14 | part spring |
| press | .88 | 80 ms |
| chosen | sunk well (the latched tool's) | at once |
| focus | 1.5 ring, no offset | – |
| disabled | 40 % (eraser latched) | – |

## API

| React | Notes |
|---|---|
| `InkPicks value onValueChange disabled` | `Ink`: `'ink' \| 'red' \| 'blue' \| 'green' \| 'amber'` |
| `WidthPicks value onValueChange ink disabled` | `InkWidth`: `'fine' \| 'regular' \| 'bold'` |
| `inkColor(ink)` | the CSS colour to draw with |
