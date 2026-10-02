# Select

One value from a list of named options. React: `Select` from `@unlocalhosted/metalui`. SwiftUI: `MetalSelect`.

## Use it for

- A value picked from a list: an icon, a folder colour, where to move a block, a preset, a setting with more than four choices.

## Don't use it for

- Two to four short options that fit side by side: `Switcher`.
- A long list someone will search: a combobox (to come).
- An action: `Menu`.
- On or off: `Switch` or `Checkbox`.

## Anatomy

A trigger that is a raised cap (the button cap, it is clicked): the value (with its lead, if any) and the shared down chevron (up while open). The list is the menu's frosted plate: rows 30 tall, a selected-mark slot (14, shared tick at 12), an optional lead, the label; groups get an engraved heading and a separator.

## States and motion

| State | Look | Motion |
|---|---|---|
| rest | the raised cap; placeholder in ink3 | – |
| hover | the cap lightens; chevron ink2 | .16 s fade |
| press | the cap sinks | button press |
| open | the cap stays pressed in; chevron ink | button spring |
| focus | focus ring (keyboard) | – |
| disabled | 40 % | – |
| invalid | a thin red ring inside the cap | – |
| list opens | the chosen row over the trigger when there is room, else below | scale .97 → 1 and fade, surface spring |
| list closes | – | fade .12 s |
| highlight | one soft highlight shared by pointer and keys | glides row to row, settle spring, no bounce |
| chosen row | shared tick before the label | same pen draw/withdraw as Checkbox |

Keys: ↵, Space or ↓ opens; ↑ ↓, Home, End, type-ahead move; ↵ chooses; ⎋ closes. Reduce Motion: fade only.

## API

`Select options value onValueChange placeholder size ("regular" 32 | "compact" 28) disabled invalid aria-label name`

`options` is `[{ value, label, lead?, disabled? }]` or groups `[{ label, options }]`.

## Scoped colorways

The list portals to the document body and copies the trigger’s nearest `data-mu-colorway` onto its positioner. Open lists follow ancestor colorway changes. No local override retains document inheritance; clipped hosts never clip the list. Native `MetalSelect` carries its colorway through the SwiftUI environment.

The state chevron uses `MorphIcon` on settle; SwiftUI uses `MetalIcon(.chevron)` on the same class. Selected marks use shared `TickGlyph` / `MetalTickGlyph`, keeping the checkbox corner dwell, sprung tail and withdrawal. Reduced motion changes direction and marks in place.

The native trigger uses `MetalMorphIcon(.chevron, turn: open ? .up : .down)`, sharing the exact planner with the React `MorphIcon` rather than rotating a static shape. A changed OS or scoped reduction settles its full orientation immediately.
