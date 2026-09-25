# Draw tools

The drawing group of the toolbar. A composition block. React: `DrawTools` from `@unlocalhosted/metalui`. SwiftUI: not yet.

## Use it for

- Picking a drawing tool, its ink and its width on the canvas.

## Don't use it for

- Select, text or region tools: those are the main toolbar.

## Anatomy

`Toolbar` › `ToolButton` × 8 › `ToolbarSeparator` › `InkPicks` › `ToolbarSeparator` › `WidthPicks`.

Keys: P pen, N pencil, M marker, L line, A arrow, R rectangle, O ellipse, E eraser. V or ⎋ goes back to select (the host handles it).

## States

- One tool latched with its LED, or none.
- Eraser latched: inks and widths at 40 %.
- The host remembers the last ink and width per tool.

## API

`DrawTools tool onToolChange ink onInkChange width onWidthChange variant`
