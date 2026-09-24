# Swift parity requests

## Lens symbol

- **Object:** `MetalIcon(.lens)` with regular and 16 point symbol assets in the generated catalog.
- **Missing:** `MetalIconName.lens` and its `mu.lens` / `mu.lens.16` assets. Mac client still carries `LensGlyphTwin` until the reference icon is authored in MetalUI's icon source and generated for Swift.
- **Demo source:** `app.js:44` draws a 20 by 20 view box, outer circle centered at 10 with radius 6, inner circle radius 2.2, round caps and a 1.55 stroke. `style.css:420` displays it at 14 by 14 in `--ink2` on the lens bar. Keep the 16 point cut legible at that size.

## Selection frame recipe and native caret timing

- **Object:** `MetalSelectionFrame` with a generated `selectionFrame` recipe for selected, lite, hover and writing states. `MetalSizeReadout` needs its own layered recipe or an explicit reference to the selection readout recipe.
- **Missing:** `check:recipes` reports both Swift components without matching component recipes. The existing `presence` tokens provide measurements and colors, but do not declare the ring/collar/readout layer order, handle variants, or the part-spring entrance. The native client temporarily draws the frame from those tokens in an AppKit overlay; the Swift component cannot yet replace that overlay with recipe parity.
- **Demo source:** reference demo `style.css:349-364` defines the full ring and pale collar, `lite` ring, handle and grip shapes, writing readout opacity, and graphite readout. Reference demo `app.js:828-868` reuses the ring elements, suppresses a bare-caret ring, and selects lite for multiple blocks.
- **Token request:** native writing needs the 1.1 second step caret blink named in the Mac scope `SCOPE.md:355` and reference demo `README.md:214`; the browser uses its native caret at reference demo `style.css:150`. Add a generated timing token for Swift rather than a local UI duration literal.

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
- **`MetalPastBanner`** (move to `Blocks/`) is a composition block: `MetalSurface(.graphitePlain, radius: .pill)` (the graphite fill, no backdrop) › `MetalLabel(.dark)` MEMORY + `MetalLabel(.onGraphite)` the moment + `MetalButton(cap: .graphite)` Back to Now with a `MetalKbd` ⎋ 7 after it. `MetalPastBannerMetrics.ink`, `engrave*` and `button*` remain only until the port reads those recipes; `keyGap` 7 is new.
- **`MetalToolStrip`** (move to `Blocks/`) is a composition block: `MetalSurface(.graphiteStrip, radius: .strip)` (16) › `MetalButton(cap: .strip)` × n, then `MetalRule(tone: .graphite)` 16 tall and `MetalButton(cap: .stripDanger)`. `MetalToolStripMetrics` ink, hover, active, danger and sep values remain only until the port reads those recipes.
- **`MetalSurface`**: materials `graphitePlain` (no backdrop) and `graphiteStrip` (plain blur 22, no saturation), both on the graphite recipe.
- **`MetalCheckbox`**: `size: .row` (14, radius 5, tick at 4.5 / 2, 3.5 × 7).
- **`MetalLabel`**: `tone: .accent` (green, no lip, cross-fades on settle) and a placeholder for an empty label; `count` tracks at -0.18 pt.
