# Glyph

A static icon at a size in an ink. React: `Glyph` wrapping any MetalUI icon. SwiftUI: `MetalGlyph(.search, size: .small, tone: .ink2)`.

## Use it for

- A mark beside words that is not a control: the lens beside a query, a field's leading search mark, a menu row's icon.

## Don't use it for

- Anything pressable: use `IconButton`. A glyph that carries meaning alone: give its host an accessible name instead.

## Props

- `size`: `small` (14, default) or `regular` (16). `tone`: `ink`, `ink2` (default), `ink3`.
- It is `aria-hidden`; the icon inside inherits the ink.
