# Needle

A tapered pointer on a pivot cap over a printed scale. React: `Needle` from `@unlocalhosted/metalui`, placed inside a `Bezel`. SwiftUI: `MetalNeedle`, placed in a `MetalBezel`'s content. A part: it has a look and no job of its own.

## Use it for

- A level read at a glance: minutes read today, storage used, a health that rises and falls.
- A measure with a point that matters: its threshold zone marks where it becomes news.

## Don't use it for

- A count: that's the Drum.
- A setting a person moves: that's a fader cap or a knob.

## Anatomy

A pointer the Part's 96 long from its pivot, tapered from 7 at the base to 2.4 at the tip, with a short tail behind the pivot, in the accent; it stands just above the glass, so it casts a small shadow. A metal pivot cap with a lit crown sits over it. The scale is printed on the glass in the glass's own ink: its arc (90° to 150°, needle straight up in the middle), 5 to 21 ticks with every other one long, and past the threshold a band in the waiting signal's colour. Tokens: `gadgets.needle`.

## States

- **At a value.** `value` 0 is the arc's left end, 1 its right end.
- **Swinging.** In a gadget the `swing` mechanism carries it on the part spring: it overshoots a little and settles, and the ends of the scale are pegs it bounces back from. A needle is silent; the beeper speaks when the value crosses the threshold.

## API

`Needle value? arc? ticks? threshold? length? at? color? glass` (glass: the face colour it is printed on).

SwiftUI: `MetalNeedle(value: 0.6, arc: 120, ticks: 9, threshold: 0.75, glass: face, size: 160)`.
