# Number field

A number you step, scrub or type. React: `NumberField` from `@unlocalhosted/metalui`, on Base UI NumberField. SwiftUI: `MetalNumberField` (work in progress). The well is the `well` recipe's field look and the keycaps are compact buttons; the `number-field` recipe adds the size, and the motion is the system's swap drum and refusal.

## Use it for

- A count or amount with small steps and a sensible range: copies, columns, a font size, minutes.

## Don't use it for

- A value where the rough position matters more than the digits (use a slider), phone numbers or codes (use a field), or large free amounts (use a field with a unit).

## Anatomy

- Label (optional): ui type, ink (the form field's label), above; drag it sideways to scrub.
- Group: a pill in the field well, 132 × 32, padding 3.
- Keycaps: compact caps, 26 square, − at the start and + at the end.
- Window: the value, centred, lead type with tabular figures.

## States and motion

| State | Look | Motion |
|---|---|---|
| step (+ / ↑) | the new value | the cap sinks; the value turns one drum step up on the settle spring |
| step (− / ↓) | the new value | the drum turns down |
| hold | repeats | each step turns the drum |
| scrub | the label drags | the drum turns the way the value went |
| at a limit | that keycap disabled | – |
| past a limit (arrow key) | unchanged | only the digits shake on the refusal spring |
| typing | plain text | no drum; commits and formats on blur |
| focus | the flush green ring on the group | – |
| invalid | the foundation's invalid ring; aria-invalid | – |
| disabled | 40 % | – |

Reduce Motion: the drum crossfades; nothing shakes.

## API

| React | SwiftUI |
|---|---|
| `value`, `defaultValue`, `onValueChange` | `value:` |
| `min`, `max`, `step`, `largeStep` (Shift) | `in:`, `step:` |
| `format` (Intl.NumberFormat options) | `format:` |
| `label`, `decrementLabel`, `incrementLabel` | `label:` |
| `invalid`, `disabled`, `readOnly`, `required`, `name` | `.disabled()` |

## Keyboard and accessibility

- The input is a numeric text input described as "Number field" (Base UI): ↑ ↓ step, Shift+↑ ↓ by the large step, Home and End go to the limits. The keycaps are named "Decrease" and "Increase" and are skipped by Tab.
- `label` names the input (aria-labelledby); without it, pass `aria-label`.

## Rules

- Give it a range. A number field without limits is a text field.
- The drum turns the way the number went: up for more, down for less.
- A refusal moves only the digits.

The step keys use the icon set's shared `minus` and `plus` at `key.glyph`, with accessible decrease/increase names. React retains Base UI repeat, range and keyboard behavior. Native keys preserve the value/range/step API, repeat while held, disable at bounds and expose adjustable accessibility; native well/drum material remains WIP. Reduced motion keeps the glyphs static.
