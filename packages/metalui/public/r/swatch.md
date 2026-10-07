# Swatch

A colour as a hard, glossy chip in its own colour. React: `Swatch` from `@unlocalhosted/metalui`. SwiftUI: `MetalSwatch`.

## Use it for

- A colour someone dropped or picked: a lone hex on the canvas, a palette entry, the colour a block is tinted with.
- Handing a colour to a picker: with `onClick` it is a button and the host opens its colour picker.

## Don't use it for

- Status or meaning. A swatch is the colour itself, never a signal (use an LED or a status badge).
- A row of choices to pick from. Several swatches side by side are fine, but the choosing is the host's picker.

## Anatomy

76 square, radius 22, the swatch recipe in the chip's own colour (`--mu-self`): a 135° sheen, a bright top edge and a dark bottom rim, an inner glow, a contact shadow and a drop shadow in its own colour. The label is engraved bottom left in 9.5 mono, dark ink above luma 150 and light ink below (`swatchInk(hex)`). A recessed LED dimple sits top right.

## API

| React | SwiftUI |
|---|---|
| `hex` (`#RGB` or `#RRGGBB`) | `hex:` |
| `label` (default: the hex) | `label:` |
| `onClick` (makes it a button) | `action:` |

```tsx
<Swatch hex="#FF6B3D" label="Colour" onClick={() => openPicker('#FF6B3D')} />
```

```swift
MetalSwatch(hex: "#FF6B3D", label: "Colour") { openPicker("#FF6B3D") }
```

## Accessibility

- Named "Colour #FF6B3D" unless you pass `aria-label`; with `onClick` it is a focusable button that answers Enter and Space.
- The engraving's ink follows the colour's luma so the label stays legible on any colour.

## Tokens

`--mu-r-swatch-self-size`, `--mu-r-swatch-self-radius`, `--mu-r-swatch-label-*`, `--mu-r-swatch-led-size`, `--mu-r-swatch-led-inset`; the colour is `--mu-self`. Set them on the swatch itself (it reads them there).
