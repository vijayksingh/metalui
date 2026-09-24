# Field and search field

React: `Field` with parts `Field.Root`, `Field.Icon`, `Field.Input`, `Field.Trail`; `SearchField`. SwiftUI: `MetalField { icon: … input: … trail: … }`, `MetalSearchField`.

## Field

- A 44 tall well (radius 17), a 15 glyph, the input in 15 pt, a hint in ink3, a green caret; trailing keycaps in `Field.Trail`.
- `Field.Input` is a plain input; pass it as a Base UI combobox input's `render` to join a listbox.

## Search field

- A button, not an input: it opens search (a palette). 38 tall (radius 15) with a 14 glyph, the placeholder and a keycap (`⌘K`); graphite in a dark strip, light elsewhere.

## Keyboard and accessibility

- Field: the input takes focus; its caret is the focus (no ring). Search field: a button with `aria-keyshortcuts`, the green ring on focus.
