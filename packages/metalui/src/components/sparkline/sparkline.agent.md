# Sparkline

A small series plot. React: `Sparkline`. SwiftUI: `MetalSparkline`.

## Use it for

- A trend over a short window: one slot per day, `null` for a day with no value (the line breaks).

## Behaviour

- The last dot is in the intent green; the others ring ink2. A dot with `onSelect` is a button named by its `title` ("WED 24 SEP · 6.5"): selecting it focuses its source.
- The dashed baseline sits at the average. Values are plotted, never summarised with a face or a colour.
