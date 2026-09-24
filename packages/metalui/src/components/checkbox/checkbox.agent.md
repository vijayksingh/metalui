# Checkbox

The dimple checkbox. React: `Checkbox` (earlier `Dimple`) from `@unlocalhosted/metalui`, on Base UI Checkbox. SwiftUI: `MetalCheckbox` (earlier `MetalDimple`).

## Use it for

- A task's checkbox in the margin of a line of text; a row's checkbox in a list of tasks.
- `ghost`: a task that was inferred, not written (a hollow ring hanging in the margin).
- `doing`: in progress (a half-filled green square, announced as mixed).

## States and motion

| State | Look | Motion |
|---|---|---|
| rest | a recessed well, 16, radius 6 | – |
| hover | the well darkens a step | 160 ms |
| checked | a dark pressed key; the white tick draws on | the tick: 220 ms ease-out after a 40 ms beat (not sprung); instant under Reduce Motion |
| doing | a half-filled green square inside the well | – |
| ghost | a hollow 14 ring, radius 5; hover: a green ring | 160 ms |
| disabled | 40 % | – |

## Keyboard and accessibility

- Space toggles; the focus ring is the 2 pt green ring at offset 2.
- Give it an accessible name (`aria-label`: the task's text). `doing` announces as mixed.
- Ticking is a person's action: the host writes the change and offers Undo.
