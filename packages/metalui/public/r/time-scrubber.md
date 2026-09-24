# Time scrubber

Time as a dimension of the surface: drag or step back through what was written. A composition block. React: `TimeScrubber` (earlier `MemoryScrubber`) from `@unlocalhosted/metalui`. SwiftUI: `MetalTimeScrubber` (earlier `MetalMemoryScrubber`).

## Use it for

- Viewing the canvas as it was: blocks that did not exist yet fade out, edited ones show their old text, the world takes a faint sepia (the host's), and the past banner appears.

## Don't use it for

- Undo. Scrubbing only looks; it changes nothing.
- Picking a date for data (a due date, a range). Use a date field.

## Anatomy

330 × 50, bottom left of the canvas:
- a **readout** above: `Label variant="engraved"` with a tiny `Glyph` (the clock at 10, in the engraving's ink), `MEMORY · NOW` or `MEMORY · TUE 23 SEP · 14:10`, and `Button cap="link"` NOW while in the past;
- a `Slider` filling the box: its **track** well (10 tall) with the intent fill up to the knob, **marks** (2 × 4) for moments, **ticks** beneath with the day names (`MON` … `TODAY`, at most seven) as engraved labels, and the knurled 22 pt **knob**.

## States and motion

| State | Look | Motion |
|---|---|---|
| now | knob at the right end, `MEMORY · NOW` | – |
| dragging | the knob under the pointer, grabbing cursor | follows exactly; within 1 % of now it snaps to now |
| a click on the track, ← →, ⇧ ← → | the knob jumps an hour, or a day | part spring (instant under Reduce Motion) |
| past | the readout names the moment; `NOW` shows | – |
| focus | the 2 pt focus ring around the knob | – |

The knob is the one place the scrubber's own arrows win over selection nudges: the host must not nudge while it has focus.

## API

| React | SwiftUI | Notes |
|---|---|---|
| `start`, `end` | `range:` | ms / `ClosedRange<Date>` |
| `value`, `onValueChange` | `selection:` (Binding<Date?>) | `null`/`nil` is now |
| `marks` | `marks:` | block and edit moments |
| `format` | `format:` | the readout for a past moment |
| `title` | `title:` | the word before the moment, default MEMORY |
| `glyph` | (MetalIcon built in) | the clock at 10 |

## Rules

- Scrubbing never changes anything. ⎋ or NOW returns to the present.
- The readout always names the moment; the aria value text says it too.
- Only chrome that changes while in the past is the past banner.

## Accessibility

- A Base UI slider labelled "Scrub through time": ← → step an hour, Shift a day, Home and End jump to the start and now; its value text reads the moment ("TUE 23 SEP · 14:10", or "Now").
- NOW is a real button.

## Tokens

Layout and timing: `--mu-scrubber-*` (box, readout gap, glyph spacing, steps, snap). Look: the slider, label, glyph and button recipes. Swift: `MetalScrubberMetrics`.
