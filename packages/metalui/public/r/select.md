# Select

One value from a list of named options. React: `Select` from `@unlocalhosted/metalui`. SwiftUI: `MetalSelect` (not yet).

## Use it for

- A value picked from a list: an icon, a folder colour, where to move a block, a preset, a setting with more than four choices.

## Don't use it for

- Two to four short options that fit side by side: `Segmented`.
- A long list someone will search: a combobox (to come).
- An action: `Menu`.
- On or off: `Switch` or `Checkbox`.

## Anatomy

A trigger that is a raised cap (the button cap, it is clicked): the value (with its lead, if any) and an up-down chevron. The list is the menu's frosted plate: rows 30 tall, an LED slot (14), an optional lead, the label; groups get an engraved heading and a separator.

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
| chosen row | green LED before the label | – |

Keys: ↵, Space or ↓ opens; ↑ ↓, Home, End, type-ahead move; ↵ chooses; ⎋ closes. Reduce Motion: fade only.

## API

`Select options value onValueChange placeholder size ("regular" 32 | "compact" 28) disabled invalid aria-label name`

`options` is `[{ value, label, lead?, disabled? }]` or groups `[{ label, options }]`.
