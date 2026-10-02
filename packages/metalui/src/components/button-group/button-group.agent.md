# Button group and split button

Related operations cut from one raised cap. React: `ButtonGroup`, `ButtonGroupReadout`, `SplitButton`; Swift: `MetalButtonGroup`, `MetalButtonGroupReadout`, `MetalButtonGroupToggle`, `MetalSplitButton`.

## Use it for

Undo / Redo, steppers around a zoom window, and a primary operation with a menu of alternatives. Use `ToggleGroup joined` for choices that stay latched; it keeps Base UI's roving focus and each key's lamp. Do not group unrelated operations or more than four keys.

## Material and motion

One Button recipe draws the whole bar. Padding and gaps are zero; only the outer ends round. The Rule recipe cuts fixed hairline grooves with a light lip, inset by one nest. Each segment has square inner edges, lights itself on hover, and sinks one point into the shared Button pressed recipe. Its neighbours and the seams stay still. Focus is inset inside the segment; disabled keys remain visible at the Button opacity and refuse activation. Whole-group disabled forwards to the child keys. Compact uses the existing Button 26/14 dimensions.

`rocker` is an optional experiment for exactly two action keys: the bar tips one degree toward the operated end on the part spring, and returns on release, blur, pointer leave/cancel. No tilt under scoped, OS or document reduced motion. Keep it off for windows, latched sets and longer bars.

A `ButtonGroupReadout` is an output window in the field well recipe. Its figures turn with SwapText (Swift numericText), are tabular, and never become a keyboard stop. Reset requires a separately named action rather than an invisible click on the number.

SplitButton infers cap and size from its main Button. Both halves inherit one material and ink. Its chevron is behind a seam, width30/glyph12, and stays sunk while the Base UI menu is open. The shared chevron morphs down ↔ up on the glyph settle in React and Swift; no second CSS rotation runs. Reduced motion lands immediately. Escape/outside close returns focus; choosing an alternative closes the menu. Waiting/done/disabled on the main key also disables alternatives. Use a primary cap on the main Button when this is the group's signal operation.

## API

- `ButtonGroup`: required `aria-label`, `cap` standard/primary, `size` default/compact, `disabled`, optional `rocker`, Button children.
- `ButtonGroupReadout`: `value` string and required `aria-label`.
- `SplitButton`: one Button child, `menu` MenuItem/Separator children, `menuLabel`, optional `heading`, `disabled`.
- `ToggleGroup joined`: existing ToggleGroup API and Toggle children; Base UI arrows and latch semantics remain intact.

```tsx
<ButtonGroup aria-label="Zoom">
  <Button aria-label="Zoom out" onClick={out}>−</Button>
  <ButtonGroupReadout aria-label="Zoom level" value={`${zoom} %`} />
  <Button aria-label="Zoom in" onClick={in}>+</Button>
</ButtonGroup>
```

```swift
MetalButtonGroup("History", rocker: true) {
    MetalButton("Undo", icon: .undo) { undo() }
    MetalButton("Redo", icon: .redo) { redo() }
}
MetalSplitButton("More export options", cap: .primary,
    menu: [MetalMenuItem("PNG") { exportPNG() }, MetalMenuItem("SVG") { exportSVG() }]) {
    MetalButton("Export PDF") { exportPDF() }
}
```

Swift resolves actual key bounds once layout settles to place fixed seams. The shared MetalButtonStyle handles segment presses and group latches; disabled and focus remain native controls. Swift SplitButton uses the existing MetalMenuPanel in a native popover, tracks the presentation binding, holds its key until the menu closes and restores focus when the panel closes. The host owns the result and request state of its main action.
