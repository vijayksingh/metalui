# LED and status badge

A lamp for a state, and a badge that names it. React: `Led`, `StatusBadge` from `@unlocalhosted/metalui`. SwiftUI: `MetalLED`, `MetalStatusBadge`. Sheet reference: KAMUI-16; Kamui brief: 04 §10.

## Use it for

- `Led`: beside words that name a state (a badge, a readout, an engraving, a glass tag). Green live or ok, amber waiting or urgent, red failed, blue a link kind, off idle.
- `StatusBadge`: a system state in the corner: `JEV LIVE`, `JEV OFFLINE · ADD KEY TO KEYCHAIN`, `JEV · NO CONNECTION`, with the command that fixes it as its hint.

## Don't use it for

- Buttons or toggles. A badge is not pressable; a latched tool has its own LED inside the tool button.
- Colour alone. An LED always sits beside words.
- Success or warning banners. Use a toast (success always carries a check) or a notice.

## Anatomy

- **LED**: 5 pt (4 small), a radial recipe centred at 40 % / 35 %, a .5 dark ring; green adds a ≤ 2 pt bloom at 55 %.
- **Badge**: 24 tall pill on the cap material (`btn-bg`, `btn-sh`), padding 0 10 0 9, gap 7: the LED, then the state in the `label` role, ink2.

## API

| React | SwiftUI |
|---|---|
| `Led kind size` | `MetalLED(_:size:)` |
| `StatusBadge led hint` + children | `MetalStatusBadge(_:led:hint:)` |

## Rules

- One LED per object. Its colour means what the list above says, nothing else.
- The badge text is the state, short, uppercase; the fix is the hint, never the label.

## Accessibility

- The badge is a `status` region (announced when it changes). With a hint it is focusable, and the hint is its description and a tooltip on hover and focus.
- LEDs are decorative (`aria-hidden`): the words carry the state.

## Tokens

`--mu-status-*`, `--mu-led-*`, `--mu-led-ring`, `--mu-btn-bg`, `--mu-btn-sh`, `--mu-type-label`. Swift: `MetalStatusMetrics`, `MetalShared.led*`.
