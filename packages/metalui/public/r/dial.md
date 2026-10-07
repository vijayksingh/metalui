# Dial

A slider wound into a ring: a value you turn. React: `Dial` from `@unlocalhosted/metalui`. It draws its own track (the `dial` recipe's colours) and wears the slider's knob.

## Use it for

- A value with a direction of travel where room is short: time you turn back, a level you wind.
- The wound form of a bar that needs less room: give it `curl` and it winds and unwinds the same track.

## Don't use it for

- Picking from a few named options (a segmented control), or a value typed exactly (a field).

## Anatomy

- One track of one length. `curl` 0 is a straight bar; 1 is a ring of `sweep` degrees with the max end level at twelve o'clock.
- Fill from min to the knob; marks across the track; ticks outside it (labels only while it is a bar).
- The slider's knob, a `role="slider"` element. A readout in the ring's centre (`children`).

## States and motion

| State | Look | Motion |
|---|---|---|
| rest | track, fill, knob, readout | none |
| drag | the knob at the track's nearest point to the pointer | follows exactly; never jumps across the gap |
| wheel | one step a notch; down turns back | follows |
| keys | ← ↓ back, → ↑ on, shift for a large step, PageUp/PageDown, Home, End | follows |
| curl | the one track winds or unwinds; marks, ticks and knob ride it | surface spring, no overshoot; the readout fades in as the ring closes |

Reduce Motion: the curl resolves without travel.

## Accessibility

- The knob is the slider: give `aria-label` and `aria-valuetext` (the value in words).
