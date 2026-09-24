# Keycap

A key's glyph on a small raised cap. React: `Kbd` from `@unlocalhosted/metalui`. SwiftUI: `MetalKbd`. Kamui brief: 04 §9.

## Use it for

- Showing the key for an action: a search well's `⌘K`, a palette footer (`↑↓ move · ↩ open`), a toast's Undo `⌘Z`, a tooltip's `Select · V`.

## Don't use it for

- Buttons. A keycap is shown, never pressed.
- Words or long shortcuts. Glyphs only: ⌘ ⌥ ⇧ ⌃ ⎋ ↩ ⌫ ↑ ↓ and single letters; one cap per key.

## Anatomy

20 tall (16 `small` in a dense footer), min width 19, padding 0 5, radius 6 (`key`), the cap material (`cap-bg`, `cap-sh`), the `readout` role in ink2. On a graphite strip (`surface="strip"`): `#303033 → #262628` with a light top lip, ink `#A6A6A9`. Sunk in a toast's Undo (`surface="sunk"`): a dark inset pill, ink `#9A9A9E`.

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
