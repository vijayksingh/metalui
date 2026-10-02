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
| checked | a dark pressed key; a pen draws the white tick on | the check glyph's tick, drawn along its route: a 40 ms beat (`tick.delay`), the short leg into the corner (`tick.down`, 90 ms, ease-press), a dwell at the corner (`tick.pace`, 30 ms), then the long leg on the part spring, overshooting a little at the tail and settling back to the tip |
| unticked (from checked) | the tick draws back from the tail to the corner and out, then the key goes light | `tick.withdraw` (140 ms, shared by the legs' lengths, ease-press) with the same dwell at the corner, then the 160 ms fade |
| doing | a half-filled green square inside the well | – |
| mixed (a group parent, some ticked) | the dark key with a white dash: the tick laid flat across its width | the dash draws left to right on the part spring (no dwell: the pen only pauses where it turns); mixed → checked bends the dash into the tick on the settle spring, and back; mixed → unticked withdraws it right to left |
| ghost | a hollow 14 ring, radius 5; hover: a green ring | 160 ms |
| row (`size="row"`) | 14, radius 5, the same tick at 14; in flow at the start of a list row | as above |
| pressed, unticked | the dark on look (the press points at the result) | 50 ms; the tick draws on release; dragging off cancels |
| pressed, ticked | the key stays dark | release draws the tick back, then the key goes light |
| disabled | 40 % | – |

Interrupted (ticked again mid-withdraw, say), the pen starts from the length on screen. Reduce Motion: the tick or dash is whole, or gone, at once; the key's colour still fades.

## The tick

The tick is the icon set's `check` tick (`icons/src/acts/check.mjs`, read into `icons/tick.generated.ts` and `MetalTickRoute`), drawn on the 24 grid across the whole well, so it is the same mark as the `check` icon at 16 or 14. Its pen is `tick.pen` (2.4 grid units: 1.6 pt at 16). `tick.rotate` turns it about its corner (0 by default). Durations and curves are tokens: `tick.delay`, `tick.down`, `tick.pace`, `tick.withdraw`, `--mu-ease-press` and the part and settle springs; in a group, the pen also waits for its key's cascade delay.

## Keyboard and accessibility

- Space toggles; the focus ring is the 2 pt green ring at offset 2.
- Give it an accessible name (`aria-label`: the task's text). `doing` announces as mixed.
- Ticking is a person's action: the host writes the change and offers Undo.

The pen is shared through internal `TickGlyph` / `MetalTickGlyph`; selected rows and menu checks use the same generated route and draw/withdraw/bend clock. The checkbox owns its dark key, while the pen reports when its ink has gone.
