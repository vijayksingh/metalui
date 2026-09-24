# Label

Text in a set role. React: `Label`. SwiftUI: `MetalLabel`.

## Use it for

- Engravings (`engraved`, `small`): counts, rules, sections, units, provenance; uppercase mono with a lip.
- Names (`title`), page titles (`heading`), a pinned query's words (`query`).
- Numbers: `count` (a mono count), `cell` (a mono table cell), `value` and `value-small` (a measured value, 22 and 12).
- `display` and `display-quiet`: a large line and its quieter continuation (an empty state's words).
- On graphite: `readout` with its `readout-dim` part, `on-graphite` for sans text, `dark` for an engraving.

## Behaviour

- Plain text: no role. An engraving that is the only name of a control is not an accessible name; give the control an `aria-label`.
- `as="input"`: an editable label (a region's name) that keeps the look, with the green caret and no field; give it an `aria-label`.
