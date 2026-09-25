# Slider

A value on a track. React: `Slider` with parts `Slider.Root` (value, min, max, step, largeStep, onValueChange), `Slider.Track`, `Slider.Marks` (fractions), `Slider.Ticks` (labelled), `Slider.Knob`. SwiftUI: `MetalSlider(value:in:) { marks: … ticks: … }`.

## Anatomy

- The track: a 10 tall track well; the fill: the green intent gradient at 55 % up to the knob.
- Marks: 2 × 4 ticks along the track; ticks: labels under it with a short tick line each.
- The knob: 22, a knurled conic finish with a bright inner ring and a small drop shadow.

## Keyboard and motion

- Arrows step (`step`), Shift + arrows step large (`largeStep`); Home / End go to the ends.
- A jump (a click on the track, a key) rides the part spring; a drag follows the pointer exactly. Under Reduce Motion a jump lands at once.
- SwiftUI `onDragChange` reports drag start before the first value change and drag end after release. `isExternallyDragging` lets an offscreen host or controlled gesture suppress the jump spring during a scrub.
- Name the knob (`aria-label`) and give it a value text (`getAriaValueText`) a person reads ("THU 24 SEP · 14:10").
