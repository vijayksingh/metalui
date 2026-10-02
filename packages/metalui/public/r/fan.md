# Fan

A canvas tool control that keeps its current tool and context in a compact graphite bar. Tools unfold from their cap; contextual actions open in a tray. Every choice stays visible.

## Contract

- `Fan aria-label`: one open cell; Escape and an outside press fold it and restore its cap's focus. No idle animation or polling.
- `Fan.Label label="Canvas"`: a context glyph, named by tooltip and accessibility label. Omit `label` to retain a text context.
- `Fan.Picker`: controlled `value`, `options`, `onValueChange`, `label`; three columns, ordered in related groups. Include select/text/region, drawing tools, shapes, eraser. The current option remains latched in the grid. `direction="up"` unfolds above the bar; `both` centres rows above and below. Arrows move in two dimensions without wrapping rows; Enter/Space chooses and restores cap focus.
- `Fan.Tray label icon`: context controls, with a close glyph at the end. It wraps on narrow hosts. Shared Base UI Toolbar handles arrow focus inside the tray.
- `Fan.Action label icon shortcut?`: a graphite glyph key with accessible name and shared tooltip. The glyph's act follows hover/press; native disabled semantics apply. `onClick` performs the real action.
- `Fan.Ink value onValueChange`: five inks in a named group. Accessible names and tooltips read `Ink: red`; the current ink latches.
- `Fan.Width value onValueChange ink`: three strokes of the chosen ink in a named group. Names read `Width: fine`; the current width latches. Keep the ink and width groups together while drawing.

## Motion and host layout

Tool caps use the existing icon-button.tool recipe, toolbar gap and part spring. Grid cells travel from behind the cap, staggered by distance. The tray changes natural width once and scales its material backing between widths; it never animates CSS width. Only transforms and opacity move. Reduced motion subscribes to the OS, site switch and scoped motion attribute; cells appear in their final positions with opacity alone. Provide enough canvas area above the cap for four rows; do not place a selection switcher over the choices. The docs include a stroke sample so ink and width have an observable consequence.

## Example

```tsx
<Fan aria-label="Canvas tools">
  <Fan.Label label="Ink"><DrawIcon /></Fan.Label>
  <Fan.Picker label="Tool" value={tool} options={TOOLS} onValueChange={setTool} />
  <Fan.Tray label="Ink" icon={<DrawIcon />}>
    <Fan.Ink value={ink} onValueChange={setInk} />
    <Fan.Width value={width} onValueChange={setWidth} ink={ink} />
  </Fan.Tray>
</Fan>
```

Swift uses `MetalFan`, `MetalFanLabel(icon:)`, `MetalFanPicker`, `MetalFanTray`, `MetalFanAction`, `MetalFanInk` and `MetalFanWidth`. It shares the same materials, grouped grid, current selection, part spring, named groups and widths. Host bindings own tool/ink/width and action consequences.
