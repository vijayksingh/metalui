# Slider

A value on a track. React: `Slider` from `@unlocalhosted/metalui`, on Base UI Slider. Give it props and it draws itself; or compose its parts `Slider.Track`, `Slider.Marks` (fractions), `Slider.Ticks` (labelled fractions) and `Slider.Knob` inside it for a host that draws its own scale (the time scrubber). SwiftUI: `MetalSlider`.

## Use it for

- A value in a known range that a person sets by feel: zoom, volume, brightness, a quality level, a position in time.

## Don't use it for

- An exact number someone types (use a number field), a level nobody sets (use a meter), or one of a few named options (use a switcher).

## Anatomy

- The track: a track well, 6 / 10 / 14 tall for `compact` / `regular` / `large`; the fill: the green intent gradient at full strength up to the knob, deeper on bone so it stands at least 2:1 from the pale groove, with an inset hairline edge.
- The knob: 16 / 22 / 28, a knurled conic finish with a bright inner ring and a small drop shadow. Size sets the groove and the knob together.
- The optional knob glyph uses the existing Bone ink on the silver cap in both colorways. The cap keeps that material scope independently of the surrounding page; end glyphs follow the page ink2.
- One travel: the groove is the full width; the knob's centre travels half a knob in from each end, so at the minimum and the maximum the knob sits flush inside the groove's rounded ends, never past them. The fill runs to the knob's centre, and marks and ticks sit on the same travel, so a tick, the fill's end and the knob line up at every value.
- Marks: notches cut across the groove (2 wide, the groove's full height), for steps, detents or moments. Only where there is a step or an event: never loose decoration.
- Ticks: a short line a gap under the groove and its label under that, in the meta type (11) at ink2, so labels read at 4.5:1 or better on the surface in both colorways. A host that engraves its own scale (the time scrubber) passes its own `Label` node, and in SwiftUI `tickStyle: .engraved`. With `ticks`, the slider reserves room for them below.
- Glyphs (optional): `startIcon` and `endIcon` at ink2, 14 / 16 / 18, a gap from the groove. Each plays its act when the value arrives at its end. They are decorative; the knob carries the name and value.
- Value (optional): `showValue` writes the value beside the groove in the figure type with `format`. It reserves every formatted step when there are 24 or fewer, otherwise the endpoints and midpoint; range readouts reserve the combined amount. Choose a formatter whose widest label occurs among these samples. The digits turn on the drum; native reserves the endpoints and midpoint too.
- Width: full width of its container by default; `width` sets it (a number is px, a string any CSS length). SwiftUI: frame it as any view; it fills the width it is given.
- Put the slider on a plain surface (a panel, a card) or give it clear space: a busy or dotted backdrop never runs through its labels.

## API

| React | SwiftUI |
|---|---|
| `value` / `defaultValue` (a number or array), `min`, `max`, `onValueChange` | `value:` or `values:` (a binding), `in:` |
| `minStepsBetweenValues`, `thumbs` (individual names/disabled stops) | `minStepsBetweenValues:`, `thumbLabels:`, `disabledThumbs:` |
| `step` (1), `largeStep` (10) | `step:`, `largeStep:` |
| `size` (`compact`, `regular`, `large`) | `size:` (`.compact`, `.regular`, `.large`) |
| `startIcon`, `endIcon` (a glyph node) | `startIcon:`, `endIcon:` (`MetalIconName`) |
| `showValue`, `format` | `showsValue:`, `valueText:` |
| `valueBubble`, `knobIcon` | `valueBubble:`, `knobIcon:` |
| `orientation`, `height` for a vertical host | `orientation:`, `.frame(height:)` |
| `centered`, `tone` (`green` / `neutral`), `detents` | `centered:`, `tone:`, `detents:` |
| `marks` (values), `ticks` (`{ value, label }[]`) | `marks:`, `ticks:` (fractions), `tickStyle:` |
| `width` (full by default) | `.frame(width:)` |
| `aria-label` | `label:` |
| `disabled` | `.disabled(true)` |
| parts: `Slider.Track`, `Slider.Marks`, `Slider.Ticks`, `Slider.Knob` | `onFocusChange:`, `onDragChange:`, `isExternallyDragging:` |

## States and motion

| State | Look | Motion |
|---|---|---|
| rest | the knurled face, a small drop shadow | – |
| hover (over the groove) | the knob lifts ×1.08, a longer shadow | settle spring |
| pressed, dragging | the knob presses ×0.94, a tight shadow; the fill follows the pointer 1:1 | settle spring; no spring on the value while dragging |
| focus (keyboard) | the green ring around the knob | – |
| disabled | the whole slider at 40 %; no pointer, no keys | – |
| refused (a key pushing past an end) | the groove and knob nudge one nest toward that end and ring back; the value stays | refusal spring |

- The knob's face grows away from the nearer end (its origin follows the value), so even lifted it never pokes past the groove; the refusal moves the groove with the knob, so the knob never leaves it.
- Reduce Motion: jumps land at once, the readout crossfades, the lift and press change at once, and nothing nudges.

## Keyboard and motion

- Arrows step (`step`), Shift + arrows and Page Up / Down step large (`largeStep`); Home / End go to each knob's allowed ends. RTL reverses physical horizontal arrows. Each range knob has independent keyboard focus, name, value and disabled state; Base UI keeps the configured number of steps between them.
- A jump rides the part spring; a drag follows the pointer exactly. Knobs translate and a full-sized fill translates/scales; width and position never animate. The Slider-only `part-clamped` curve clips the authored part spring's sampled progress to 0…1, preserving its duration and leaving the generic spring unchanged. Swift clamps interpolated fractions every frame. Both respect physical hard stops; reduced motion lands at once.
- An array draws a range between its first and last knobs. A centred single slider fills from the midpoint to the knob; `tone="neutral"` uses ink2 with the same fill shadow stack. Vertical travel puts the minimum below the maximum and requires an explicit host height.
- A value bubble uses the tooltip plate above a horizontal knob or beside a vertical knob, appearing only while dragging or using the keyboard. The adjacent and bubble readouts turn on the drum (Swift numeric text); reduced motion crossfades. `format` supplies the spoken value independently of decorative glyphs.
- `detents` requests one shared haptic catch per accepted stepped change, never on mount or a refused unchanged amount. Haptic feedback remains independent of reduced motion. Disabled knobs do not catch. Pushing past a stop gives one axis-correct refusal until the pointer re-enters; keys refuse toward the physical stop.
- SwiftUI `onDragChange` reports drag start before the first value change and drag end after release. `isExternallyDragging` lets an offscreen host or controlled gesture suppress the jump spring during a scrub.
- Name the knob (`aria-label`) and give it a value text a person reads: `format` does both ("40%"); with parts, `getAriaValueText` on `Slider.Knob` ("THU 24 SEP · 14:10").

## Rules

- A jump springs, a drag does not.
- Marks and ticks mean something: a step, an event, a labelled value.
- Keep labels plain and readable, on a plain surface.
