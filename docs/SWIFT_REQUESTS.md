# Swift parity requests

## Lens symbol

- **Object:** `MetalIcon(.lens)` with regular and 16 point symbol assets in the generated catalog.
- **Missing:** `MetalIconName.lens` and its `mu.lens` / `mu.lens.16` assets. Mac client still carries `LensGlyphTwin` until the reference icon is authored in MetalUI's icon source and generated for Swift.
- **Demo source:** `app.js:44` draws a 20 by 20 view box, outer circle centered at 10 with radius 6, inner circle radius 2.2, round caps and a 1.55 stroke. `style.css:420` displays it at 14 by 14 in `--ink2` on the lens bar. Keep the 16 point cut legible at that size.

## Composition refactor (docs/COMPOSITION.md)

Primitives and blocks the React side now has. Mirror each with the same name (Metal prefix), slots and recipe; the recipe parity check lists what is still missing.

### New primitives and variants

- **`MetalRow`** (recipe `row`): variants `list`, `panel`, `option` (active: raised with a 2.5 green rail at the left edge); `checked` strikes the text in ink3; `maybe` at .55. Slots `lead:`, `text:`, `trail:`.
- **`MetalLabel`** (recipe `label`): new variants `query`, `cell`, `value`, `valueSmall`, `display`, `displayQuiet`, `onGraphite`, `readoutDim`; an editable form (a `TextField` with the label's look, green caret, no field chrome).
- **`MetalChip`** (recipe `chip`): new variant `tag` (engraved mono in a .5 hairline pill, no fill). The suggestion variant's tracking is `-0.18px` (the page's tracking as a length), not an em of 11.5.
- **`MetalButton`** (recipe `button`): new caps `link` (green mono word, no cap, no press), `graphite` (24 tall light cap on graphite), `strip` and `stripDanger` (28 tall flat caps in a graphite tool strip; hover fill, pressed well, 1.5 green focus ring).
- **`.metalTooltip`**: the label takes a view; a `dim:` detail in the key ink; `wrap` lets a note wrap at 280.
- **`MetalMark`**: new kind `match` (weight 650, green .55 underline 1.5, offset 2.5), result rows only.

### Blocks

- **`MetalSuggestionChip`** is now a composition block: `MetalChip(.suggestion) { text: question; Label(.small, confidence); actions: IconButton(.mini, accept) ✓, IconButton(.mini) × }`. Move it to `Blocks/`. The `suggestionChip` recipe is gone: read the chip, label and icon-button recipes; layout from `MetalSuggestion` (rest opacity, arrival, `confMarginStart` 2, `confMarginEnd` 3).
- **`MetalRegion`** (rename `MetalRegionView.swift` to `Blocks/MetalRegion.swift`) is a composition block: root `MetalWell(.region, over:)` or `MetalSurface(.lens)` at radius 26; slots `header:` (name `MetalLabel(.title)` with the "name this region" placeholder and an inline rename field, rule `MetalLabel(.engraved)` in the accent tone while over, count `MetalLabel(.count)`) and `rows:` (`MetalRegionRow` = `MetalRow(.list)` with a `MetalCheckbox(size: .row)` lead and the day as an engraving). The `region` recipe is gone; layout from `MetalRegion` (`nameMin` 20, `rowMetaTop` 3, head and body values). Dim .35 and past 0 fade the whole.
- **`MetalCheckbox`**: `size: .row` (14, radius 5, tick at 4.5 / 2, 3.5 × 7).
- **`MetalLabel`**: `tone: .accent` (green, no lip, cross-fades on settle) and a placeholder for an empty label; `count` tracks at -0.18 pt.
