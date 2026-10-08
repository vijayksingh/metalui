# Dial

A slider wound into a ring: a value you turn. React: `Dial` from `@unlocalhosted/metalui`. SwiftUI: `MetalDial`. It draws its own track (the `dial` recipe's colours) and wears the slider's knob.

## Use it for

- A value with a direction of travel where room is short: time you turn back, a level you wind.
- The wound form of a bar that needs less room: give it `curl` and it winds and unwinds the same track.

## Don't use it for

- Picking from a few named options (a segmented control), or a value typed exactly (a field).

## Anatomy

- One track carries the curl. `curl` 0 is a straight bar; 1 is a ring of `sweep` degrees with the gap at six o'clock, min at seven, max at five. `barLength` optionally supplies the unwound length; otherwise the length stays fixed.
- Fill from min to the knob; marks across the track; ticks outside it (labels only while it is a bar).
- The bar's slider knob travels to the centre and grows into a knurled disc; the disc and indicator dot face the value. The host places its readout beside the dial (there is no `children` slot).

## States and motion

| State | Look | Motion |
|---|---|---|
| rest | track, fill, knob, readout | none |
| drag | value at the track's nearest point; disc faces it | follows exactly; never jumps across the gap |
| wheel | one step a notch; down turns back | follows |
| keys | ← ↓ back, → ↑ on, shift for a large step, PageUp/PageDown, Home, End | follows |
| curl | the one track winds or unwinds; marks and ticks ride it; knob grows into centre disc | surface spring, no overshoot; labels fade out while winding |

Reduce Motion: the curl resolves without travel.

## Accessibility

- The knob is the slider: give `aria-label` and `aria-valuetext` (the value in words).
- SwiftUI: `MetalDial(value: $value, in: min...max, step: step, curl: curl, label: "Level", valueText: formatter)`; supports slider keys and VoiceOver adjustable actions. `onFocusChange` and `onDragChange` tell the host when it is being handled. Scroll is scoped to its bounds, on macOS and iPad with a pointing device.
