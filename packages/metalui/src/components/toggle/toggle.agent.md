# Toggle

A latching push button, alone or in a row. React: `Toggle`, `ToggleGroup` and `RadioKeys` from `@unlocalhosted/metalui`, on Base UI Toggle and ToggleGroup. SwiftUI: `MetalToggle` and `MetalRadioKeys`. The cap is the `button` recipe and the lamp is the LED part; the `toggle` recipe adds the depths and the motion.

## Use it for

- A mode or a tool that stays on until you turn it off, shown as a key: "Grid", "Snap", Bold / Italic / Underline.
- `RadioKeys` for one form value among latching caps (time slots, options). Repeating the chosen key keeps it chosen; there is no unlatched state after choosing.
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
| `ToggleGroup` `value` (array), `defaultValue`, `onValueChange`, `multiple` | Compose `MetalToggle` bindings; no native group type |
| `RadioKeys` scalar `value`, `defaultValue`, `onValueChange`, `name`, `required`, `readOnly`; `RadioKeys.Key value`, `disabled`, `lamp` | `MetalRadioKeys` scalar `selection:`, `options:`, `readOnly:` |
| `disabled` | `.disabled()` |

## Keyboard and accessibility

- A button with `aria-pressed`. Space or Enter latch and unlatch. In a group, arrow keys move between keys and Tab leaves the group.
- `RadioKeys` wraps Base UI RadioGroup and Radio. It renders real button caps, announces `radio` / `aria-checked`, submits one hidden native input with `name`, skips disabled keys with arrows, and has one Tab stop. Supply an initial value when a choice is required immediately. `readOnly` keeps focus and blocks edits. Native keys announce selected state; arrows choose an enabled option, and platform button focus remains native.
- The label names it; an icon key needs `aria-label`.

## Rules

- The label names the mode, not the action: "Grid", not "Show grid".
- The lamp is the promise that it latches; keep it unless the icon itself shows the state.

`ToggleGroup joined` uses the machined ButtonGroup bar: one raised surface, fixed engraved seams, square interior faces, inset focus and each latched key’s lamp. Base UI still owns arrows and roving tab stops. See ButtonGroup for the material contract.


## Single-choice example

```tsx
<RadioKeys name="time" value={time} onValueChange={setTime} aria-label="Free times">
  <RadioKeys.Key value="10:00">10:00</RadioKeys.Key>
  <RadioKeys.Key value="12:00">12:00</RadioKeys.Key>
</RadioKeys>
```

The time picker block uses this family directly. Host grid utilities may arrange the group, but never copy cap recipes. Custom Base UI `render` overrides own their contents; retain a lamp or another visible checked-state cue.
