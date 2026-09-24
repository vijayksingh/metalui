# Icon button

A pressable cap with only a glyph. React: `IconButton`. SwiftUI: `MetalIconButton`.

## Variants

- `tool`: a 38 graphite cap (radius 15). Pressed sinks 1 into a dark well (50 ms linear, back on release). `pressed={true}` latches it down with a 4 pt green LED 5 in from the top right.
- `ghost`: a 28 flat round button; hover fills it faintly and darkens the glyph.
- `mini`: an 18 × 16 flat pill inside a chip; `accept` turns its glyph green on hover.

## Keyboard and accessibility

- A `<button>`; Space and Enter activate. `label` is its accessible name; `pressed` sets `aria-pressed`.
- Focus: the green ring (2 pt, no offset: the cap is the target).
- Inside a toolbar, render it through the toolbar's button part so arrow keys move between tools.
