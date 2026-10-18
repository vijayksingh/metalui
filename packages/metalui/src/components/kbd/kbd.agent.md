# Keycap

A key's glyph on a small raised cap. React: `Kbd` from `@unlocalhosted/metalui`. SwiftUI: `MetalKbd`.

## Use it for

- Showing the key for an action: a search well's `⌘K`, a palette footer (`↑↓ move · ↩ open`), a toast's Undo `⌘Z`, a tooltip's `Select · V`.

## Don't use it for

- Buttons. A keycap is shown, never pressed.
- Words or long shortcuts. Glyphs only: ⌘ ⌥ ⇧ ⌃ ⎋ ↩ ⌫ ↑ ↓ and single letters; one cap per key.

## Anatomy

20 tall (16 `small` in a dense footer), min width 19, padding 0 5, radius 6 (`key`), the cap material (`cap-bg`, `cap-sh`), the `readout` role in ink2. On a graphite strip (`surface="strip"`): `#303033 → #262628` with a light top lip, ink `#A6A6A9`. Sunk in a toast's Undo (`surface="sunk"`): an inset pill in the colorway, pressed bone `#E9E8E4 → #EFEEEA` with ink `#5C5C60` on bone, `#232326 → #1C1C1E` with ink `#9A9A9E` on graphite.

## API

| React | SwiftUI |
|---|---|
| children | first argument |
| `size` | `size:` (`.default`, `.small`) |
| `surface` | `surface:` (`.default`, `.strip`, `.sunk`) |
| `label` | `label:` |

## Accessibility

- A `kbd` element; modifier glyphs are named for assistive tech ("Command K").

## Tokens

`--mu-kbd-*`, `--mu-cap-bg`, `--mu-cap-sh`, `--mu-radius-key`, `--mu-type-readout`. Swift: `MetalKbdMetrics`.
