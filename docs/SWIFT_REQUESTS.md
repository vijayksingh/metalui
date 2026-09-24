# Swift parity requests

## Cue recipe for inferred values and life glyph

- **Object:** `cue` recipe parts for `MetalCueInferred` and `MetalCueLife`, with the in-flow text marks documented as metric-neutral.
- **Missing:** the generated cue foundations include `inferred-height`, `inferred-pad`, `inferred-ring`, `life-gap-before`, `life-gap-after`, and `life-drop`, but no `MetalRecipes.cue`. Swift's existing views still assemble a transparent inferred pill and life run with literals. Give inferred/date/measurement values and the life run recipe parts so Swift can paint the same layers and type without a local twin. Until it lands, the Mac host uses generated `MetalCue` values and the existing `MetalCueInferred`/`MetalCueLife` components.
- **Demo CSS:** `style.css:191-205` defines cue underlines, resolved chips and the 17 px inferred date pill; `style.css:257-261` defines the middle dot, 16 px life glyph, vertical lift and host-hover tint.

## Status badge type cascade

- **Object:** `status` badge text in both colorways.
- **Mismatch:** the generated `status.badge.font` is `500 9.5px/1 mono`, but the paired isolated React crop is 7 physical pixels narrower than Swift's recipe-driven badge at 2×. Headless computed style confirms React renders `9px/12px` with `0.99px` tracking from `.mu-type-label`. `StatusBadge` applies both `mu-badge` and `mu-type-label`; give the badge recipe priority in the React cascade so both render the same declared font. Swift keeps the generated recipe.
- **Reference CSS:** `packages/metalui/src/components/status/status.css:19-34` declares the badge font and tracking; `packages/metalui/src/components/tokens.css:506` declares `.mu-type-label` with a different font and tracking.

## Suggestion chip composition metadata

- **Object:** `MetalSuggestionChip`, now composed from `MetalChip(.suggestion)`, `MetalLabel(.small)` and two `MetalIconButton(.mini)` controls in `swift/Sources/MetalUI/Blocks/`.
- **Missing:** `packages/metalui/src/blocks/suggestion-chip/meta.json` still points to `swift/Sources/MetalUI/Components/MetalSuggestionChip.swift`. Point it to the block path so the registry and recipe checker treat this as a composition block without its own recipe.
- **Reference CSS:** `packages/metalui/src/blocks/suggestion-chip/suggestion-chip.css:5-23` owns only layout and arrival; paint comes from `packages/metalui/src/components/chip/chip.css:5-14`, the label recipe, and icon-button utilities.

## Placement marker and twin outline

- **Object:** generated `placement` recipe for a transcluded block's marker and `twin` presence state.
- **Missing:** marker inset, height inset, 2 px width, radius and green-deep .45 fill; the twin plate's raised-lite shadows and green-deep .35 hairline. Swift temporarily reads the closest generated region-over tint and spacing steps.
- **Demo CSS:** `style.css:311-313` defines `.frag.t-ref::after` at left 2 px, top/bottom 13 px, 2 px width and `.45` green-deep fill, then `.frag.twin .plate` with raised-lite plus a 1 px `.35` green-deep outline.

## Canvas ink stroke

- **Object:** a generated `ink-stroke` recipe for a drawn path and its live preview.
- **Missing:** `stroke.width`, `stroke.opacity`, `live.opacity`, round cap/join and the transparent 6 px outset hit path. The client can store and smooth paths, but its paint cannot be exact without these values.
- **Demo CSS:** `style.css:108-109` draws the live path at 1.8 px and .85 opacity; `style.css:307-309` draws the settled path at 1.8 px and .82 opacity with round caps and joins.

## File card

- **Object:** `file-card` recipe and matching Swift component.
- **Missing:** the raised slab, extension tile, name and size engraving as one generated composition, including both colorways. The native file face still draws this locally because no component recipe exists.
- **Demo CSS:** `style.css:303-306` sets the slab's 18 px radius, 10/14 px padding, 10 px gap, 32 by 38 px tile, type roles and layered raised shadows.

## Image glass face

- **Object:** `glass-face` image screen.
- **Missing:** generated `image.max-width` and `image.saturation` / `image.contrast` properties. `MetalImageFace` uses the common glass bezel and screen layers now; these image-only values should drive the native pixel filter and width cap.
- **Demo CSS:** `style.css:301-302` sets `.imgobj` max-width to 340 px and its image to `saturate(.92) contrast(1.04)` with a 15 px image radius. `style.css:265-270` provides the shared bezel, screen and glare layers.

## Checkbox disabled state

- **Object:** `checkbox` recipe.
- **Missing:** a `self.disabled` opacity property. Swift currently reads the shared button disabled token for the same 0.4 value; the checkbox should own it in the generated recipe.
- **Reference CSS:** `packages/metalui/src/components/checkbox/checkbox.css:23` sets opacity 0.4 for `[data-disabled]`.

## Lens symbol

- **Object:** `MetalIcon(.lens)` with regular and 16 point symbol assets in the generated catalog.
- **Missing:** `MetalIconName.lens` and its `mu.lens` / `mu.lens.16` assets. Mac client still carries `LensGlyphTwin` until the reference icon is authored in MetalUI's icon source and generated for Swift.
- **Demo source:** `app.js:44` draws a 20 by 20 view box, outer circle centered at 10 with radius 6, inner circle radius 2.2, round caps and a 1.55 stroke. `style.css:420` displays it at 14 by 14 in `--ink2` on the lens bar. Keep the 16 point cut legible at that size.

## Selection frame recipe and native caret timing

- **Object:** `MetalSelectionFrame` with a generated `selectionFrame` recipe for selected, lite, hover and writing states. `MetalSizeReadout` needs its own layered recipe or an explicit reference to the selection readout recipe.
- **Missing:** `check:recipes` reports both Swift components without matching component recipes. The existing `presence` tokens provide measurements and colors, but do not declare the ring/collar/readout layer order, handle variants, or the part-spring entrance. The native client temporarily draws the frame from those tokens in an AppKit overlay; the Swift component cannot yet replace that overlay with recipe parity.
- **Demo source:** reference demo `style.css:349-364` defines the full ring and pale collar, `lite` ring, handle and grip shapes, writing readout opacity, and graphite readout. Reference demo `app.js:828-868` reuses the ring elements, suppresses a bare-caret ring, and selects lite for multiple blocks.
- **Token request:** native writing needs the 1.1 second step caret blink named in the Mac scope `SCOPE.md:355` and reference demo `README.md:214`; the browser uses its native caret at reference demo `style.css:150`. Add a generated timing token for Swift rather than a local UI duration literal.

## Lens result plate

- **Object:** a generated `lensPanel` recipe (or a named `MetalSurface` panel variant) for the list, table, timeline and gallery projections.
- **Missing:** the panel's layout values are not generated: 10 px inset, 760 px width cap and 230 px viewport height reserve. `MetalSurface(.panel, radius: .card)` now supplies the correct 24 px blur, translucent fill and raised shadow stack; `MetalRow(.panel)` supplies the rows. The Mac client temporarily owns only the panel placement and layout.
- **Demo CSS:** reference `style.css:428-439` defines `#panel`, `.prow`, checked text and weak-match opacity. The other projections follow at lines 440-454.

## Timeline result row

- **Object:** a generated timeline row recipe or `MetalRow` timeline variant, including the day rule.
- **Missing:** the vertical rule and rounded hover fill are still assembled from generic color tokens; the 42 px time column, 12 px gap, 6 px vertical inset, 14 px horizontal inset and day header spacing are client-owned.
- **Demo CSS:** reference `style.css:445-450` defines `.tl-day`, its trailing rule, `.tl-item`, hover and time engraving.

## Gallery result card

- **Object:** a gallery card layout recipe that composes `MetalSurface(.raiseLite, radius: .plate)`.
- **Missing:** grid minimum 170 px and gap 10 px, card minimum height 96 px, padding 12/14 px, four-line text clamp, and the 46 px colour/image band with radius 12 are still client-owned.
- **Demo CSS:** reference `style.css:451-453` defines `.gallery`, `.gcard`, `.gcard .lt` and `.gcard .sw`.

## Composition refactor (docs/COMPOSITION.md)

Primitives and blocks the React side now has. Mirror each with the same name (Metal prefix), slots and recipe; the recipe parity check lists what is still missing.

### New primitives and variants

- **`MetalRow`** (recipe `row`): variants `list`, `panel`, `option` (active: raised with a 2.5 green rail at the left edge); `checked` strikes the text in ink3; `maybe` at .55. Slots `lead:`, `text:`, `trail:`.
- **`MetalLabel`** (recipe `label`): new variants `query`, `cell`, `value`, `valueSmall`, `display`, `displayQuiet`, `onGraphite`, `readoutDim`; an editable form (a `TextField` with the label's look, green caret, no field chrome).
- **`MetalChip`** (recipe `chip`): new variant `tag` (engraved mono in a .5 hairline pill, no fill). The suggestion variant's tracking is `-0.18px` (the page's tracking as a length), not an em of 11.5.
- **`MetalButton`** (recipe `button`): new caps `link` (green mono word, no cap, no press), `graphite` (24 tall light cap on graphite), `strip` and `stripDanger` (28 tall flat caps in a graphite tool strip; hover fill, pressed well, 1.5 green focus ring).
- **`.metalTooltip`**: the label takes a view; a `dim:` detail in the key ink; `wrap` lets a note wrap at 280.
- **`MetalMark`**: new kind `match` (weight 650, green .55 underline 1.5, offset 2.5), result rows only.
- **`MetalKbd`**: new surface `plain`, which draws no cap because the host paints the key. The toast's Undo ⌘Z uses it with the toast recipe's key ink.
- **Tailwind (web only):** tokens.json now carries `$utilities` (raw declarations) on recipes, on layout groups (`engraving`, `region`, `presence`, `palette`) and on `motion` and `swap`, plus a top-level `animations` map. These are CSS-only; the Swift generator skips `$` keys and `animations`, and no Swift value changed.

### Blocks

- **`MetalSuggestionChip`** is now a composition block: `MetalChip(.suggestion) { text: question; Label(.small, confidence); actions: IconButton(.mini, accept) ✓, IconButton(.mini) × }`. Move it to `Blocks/`. The `suggestionChip` recipe is gone: read the chip, label and icon-button recipes; layout from `MetalSuggestion` (rest opacity, arrival, `confMarginStart` 2, `confMarginEnd` 3).
- **`MetalRegion`** (rename `MetalRegionView.swift` to `Blocks/MetalRegion.swift`) is a composition block: root `MetalWell(.region, over:)` or `MetalSurface(.lens)` at radius 26; slots `header:` (name `MetalLabel(.title)` with the "name this region" placeholder and an inline rename field, rule `MetalLabel(.engraved)` in the accent tone while over, count `MetalLabel(.count)`) and `rows:` (`MetalRegionRow` = `MetalRow(.list)` with a `MetalCheckbox(size: .row)` lead and the day as an engraving). The `region` recipe is gone; layout from `MetalRegion` (`nameMin` 20, `rowMetaTop` 3, head and body values). Dim .35 and past 0 fade the whole.
- **`MetalPastBanner`** (move to `Blocks/`) is a composition block: `MetalSurface(.graphitePlain, radius: .pill)` (the graphite fill, no backdrop) › `MetalLabel(.dark)` MEMORY + `MetalLabel(.onGraphite)` the moment + `MetalButton(cap: .graphite)` Back to Now with a `MetalKbd` ⎋ 7 after it. `MetalPastBannerMetrics.ink`, `engrave*` and `button*` remain only until the port reads those recipes; `keyGap` 7 is new.
- **`MetalToolStrip`** (move to `Blocks/`) is a composition block: `MetalSurface(.graphiteStrip, radius: .strip)` (16) › `MetalButton(cap: .strip)` × n, then `MetalRule(tone: .graphite)` 16 tall and `MetalButton(cap: .stripDanger)`. `MetalToolStripMetrics` ink, hover, active, danger and sep values remain only until the port reads those recipes.
- **`MetalSurface`**: materials `graphitePlain` (no backdrop) and `graphiteStrip` (plain blur 22, no saturation), both on the graphite recipe.
- **`MetalCheckbox`**: `size: .row` (14, radius 5, tick at 4.5 / 2, 3.5 × 7).
- **`MetalLabel`**: `tone: .accent` (green, no lip, cross-fades on settle) and a placeholder for an empty label; `count` and `onGraphite` track at -0.18 pt; `readoutDim` is the readout type in `#7C7D82`.
- **`MetalProvenanceTooltip`** (move to `Blocks/`) is a composition block: `.metalTooltip` wrapped, the detail in its dim part, 380 ms, 8 above (34 above a value chip). No backdrop, no uppercase (the reference `#tip`). The tooltip recipe loses its blur.
- **`MetalSizeReadout`** stays a component (the selection frame block uses it), rebuilt as `MetalSurface(.graphiteDeep, radius: .pill)` › `MetalLed(.live)` + each figure a `MetalLabel(.readout)` and each mark a `MetalLabel(.readoutDim)`, 6 apart. `MetalPresence` readout values now match the reference: 22 tall, padding 10, gap 6, LED 5, ink `#EDEDEF`, dim `#7C7D82`, the graphite shadow.
- **`MetalHoverEngraving`** (move to `Blocks/`) is a composition block: `MetalSurface(.tip, radius: .pill)` › `MetalLabel(.engraved)` with the kind as its emphasis (a new label `emphasis` part: weight 500, `.62` / `.55` ink) + `MetalChip(.tag)` per derived tag + `MetalLabel(.engraved)` with a `MetalLed` before the status. Layout and timing from `MetalEngraving` (new: `fadeMs` 160, `moveMs` 200, `ledGap` 4, `ledLift` 1). `MetalRecipes.hoverEngraving` is kept (`$pendingSwiftPort`) only until the port composes the block; then delete it.
- **`MetalFilterBar`** (rename `MetalLensBar`, keep a typealias; `Blocks/MetalFilterBar.swift`) is a composition block: `MetalSurface(.frost, radius: .pill)` › `MetalGlyph` (new primitive: 14 / 16 in ink, ink2, ink3) + `MetalLabel(.query)` + `MetalLabel(.engraved)` count + `MetalLabel(.engraved)` note with a waiting `MetalLed` when pending + `MetalSegmented(.compact)` views + `MetalIconButton(.ghost)` pin and close. The source is now a `note: (text, pending)` the host writes; `MetalLensBarMetrics.height` is 38 (the reference) and `noteLedGap` 5 is new.
- **`MetalTimeScrubber`** (rename `MetalMemoryScrubber`, keep a typealias; `Blocks/MetalTimeScrubber.swift`) is a composition block: a readout (`MetalLabel(.engraved)` with `MetalGlyph(size: .tiny, tone: .inherit)`, the clock, 5 before the title; `MetalButton(cap: .link)` NOW in the past) over `MetalSlider` (track, marks, day ticks as engraved labels, knob) filling the 330 × 50 box. New: a `title` (default MEMORY); `MetalScrubberMetrics.glyphGap` 5 and `glyphDrop` -1. `MetalGlyph` gains `tiny` (10) and `inherit`.

## Pinned lens region

- **Object:** generated `region` recipe for `MetalRegionView` and its pinned lens rows.
- **Missing:** `check:recipes` reports `MetalRegionView` without a component recipe. The generated `MetalRegion` measurements and colorway materials cover most of the well, but do not declare the complete lens background, header/body placement, row hover, weak-match fade, and the two viewport-centred sizes (280 × 220, `me` 300 × 250). The native client temporarily composes the well, native editable name, and `MetalRegionResultRow` from existing MetalUI values. It needs a row part that keeps the checkbox action separate from row focus.
- **Demo CSS:** reference demo `style.css:319-344` defines the well, live material, 44 px head, 46 px body top, 12 px inset, row hover and checked states. Reference demo `app.js:2749-2758` sets pin geometry; `app.js:2760-2785` limits the body to twelve ranked rows and its empty copy.

## Command palette

- **Object:** `MetalCommandPalette` as a composition block built from the generated `MetalSurface`, `MetalRow(.option)`, `MetalLabel`, `MetalKbd`, field and icon recipes.
- **Missing:** `check:recipes` reports no command palette recipe. The Swift component still assembles a plate from generic frost and palette measurements; the generated recipe should specify the 24 px blur and saturation, 560 px width cap, 6 px inset, raised selected row, green rail, field well, focus and keyboard hint layers. The palette must keep the field and row's key grammar while drawing the same layers as the browser.
- **Demo CSS:** reference demo `style.css:517-532` defines the palette scrim, plate, field, section rows, selected rail and footer. Reference demo `app.js:2991-3060` defines Arrow, Return, Shift-Return and Escape behavior.

## Me series layout

- **Object:** a generated Me panel and pinned Me summary layout composed from `MetalSparkline`, `MetalLabel` and the panel/region surfaces.
- **Missing:** the `sparkline` recipe contains line, dots, baseline and heights, but its 4 px plot inset is still implicit. Add `plot.pad` so the Swift port can read it directly. The four panel columns (92/110/flexible/120 px, 14 px gap, 12/14 px row padding) and the mini layout (58/flexible/44 px, 8 px gap, 34 px row height, 6 px inset) lack a generated composition recipe. The client temporarily keeps these layout values in its owned layout file.
- **Demo CSS:** reference demo `style.css:457-470` defines Me rows, sparklines and mini rows. Reference demo `app.js:2906-2965` plots the 4 px inset, gap semantics, last dot and five-metric mini limit.
