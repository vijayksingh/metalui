# Toggle

A latching push button, alone or in a row. React: `Toggle` and `ToggleGroup` from `@unlocalhosted/metalui`, on Base UI Toggle and ToggleGroup. SwiftUI: `MetalToggle` (work in progress). The cap is the `button` recipe and the lamp is the LED part; the `toggle` recipe adds the depths and the motion.

## Use it for

- A mode or a tool that stays on until you turn it off, shown as a key: "Grid", "Snap", Bold / Italic / Underline.
- `ToggleGroup` for a set of such keys, several at once (`multiple`) or at most one.

## Don't use it for

- A setting in a list (use a switch), one of several views that is always chosen (use a switcher), or an action that happens once (use a button).

## Anatomy

- Key: the button cap (32 tall, pill, ui type).
- Lamp: the small LED at the start of the label; unlit off, green on. `lamp={false}` hides it for an icon key whose icon shows its state.
- Group: keys 4 apart in a row.

## States and motion

| State | Look | Motion |
|---|---|---|
| off | the raised cap, lamp dark | – |
| pressing | the pressed look, 2 down (past the catch) | 50 ms, linear |
| on | the pressed look, 1 down, lamp lit | rises to the latch on the part spring (may overshoot against the catch) |
| off again | raised, lamp dark | rises all the way on the release spring |
| focus | the green ring | – |
| disabled | 40 % | – |

Reduce Motion: the latch snaps to its depth; the lamp still lights.

## API

| React | SwiftUI |
|---|---|
| `Toggle` `pressed`, `defaultPressed`, `onPressedChange`, `value` (in a group), `lamp` | `isOn:` |
| `ToggleGroup` `value` (array), `defaultValue`, `onValueChange`, `multiple` | `selection:` |
| `disabled` | `.disabled()` |

## Keyboard and accessibility

- A button with `aria-pressed`. Space or Enter latch and unlatch. In a group, arrow keys move between keys and Tab leaves the group.
- The label names it; an icon key needs `aria-label`.

## Rules

- The label names the mode, not the action: "Grid", not "Show grid".
- The lamp is the promise that it latches; keep it unless the icon itself shows the state.

`ToggleGroup joined` uses the machined ButtonGroup bar: one raised surface, fixed engraved seams, square interior faces, inset focus and each latched key’s lamp. Base UI still owns arrows and roving tab stops. See ButtonGroup for the material contract.
