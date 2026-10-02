# Field and search field

React: `Field` with parts `Field.Root`, `Field.Icon`, `Field.Input`, `Field.Trail`; `SearchField`. SwiftUI: `MetalField { icon: … input: … trail: … }`, `MetalSearchField`.

## Field

- Three sizes (`size`): `large` (the default: 44 tall, radius 17, a 15 glyph, the input in 15 pt; the palette's field), and the form sizes `regular` (32, radius 11, 14 glyph, ui type) and `compact` (28, radius 9, 12 glyph), which line up with the select.
- A hint in ink3, a green caret; trailing keycaps in `Field.Trail`.
- `invalid`: the foundation's invalid ring on the well, and `aria-invalid` on the input. `disabled`: 40 %, and the input is disabled.
- `Field.Input` is a plain input; pass it as a Base UI combobox input's `render` to join a listbox.
- SwiftUI: `MetalField` has the large size; the form sizes and the invalid and disabled states are work in progress there.

## Search field

- A button, not an input: it opens search (a palette). 38 tall (radius 15) with a 14 glyph, the placeholder and a keycap (`⌘K`); graphite in a dark strip, light elsewhere.

## Keyboard and accessibility

- Field: the input takes focus. At the large size (a palette, where the field always has focus) the caret is the focus; the form sizes show the flush green ring. Name the input with a visible label or `aria-label`; say why a value is invalid in text near it. Search field: a button with `aria-keyshortcuts`, the green ring on focus.

## Tag attachment host

The docs' compact Tag field commits one attachment. It normalizes a leading hash, rejects an existing tag or a name over 32 characters, and keeps failures separate from value validation so retry submits the same draft. Enter submits; Escape or Cancel clears only an unlocked draft. Tag's authored glyph becomes check while the label turns Tagged, then the field clears after the shared result beat. Undo restores the tag list captured before that request. The native executable composition is `swift/Examples/MetalTagExample.swift`; it uses the shared compact well recipe rather than claiming the alpha `MetalField` renders compact fields.
