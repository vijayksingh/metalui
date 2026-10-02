# Cue grammar and editing contract

Cues describe a person's own text. A mark is a **Part**; an editable cue is a **Component**; the scale or held-state preview is an **Instrument**. Recognition never writes text. Only a confirmed edit does. The raw string remains the saved document, and the host supplies reference dates, people, recent tags, enum choices and conversion factors.

## Survey before controls

| Recognised kind | Change in place | Pointer | Keyboard | Written source |
|---|---|---|---|---|
| Date | Step local calendar days; choose a day | Vertical scrub; hold opens Calendar | Up/Down step; Enter opens Calendar; Escape cancels | yesterday/today/tomorrow or an unambiguous weekday/date |
| Time | Step time of day in 15-minute stops | Vertical scrub; one haptic per landed stop | Up/Down step; Shift larger, Alt finer | 4pm, 4:15pm; preserves the host's clock convention |
| Duration | Step minutes, normally 5; change display unit | Vertical scrub; horizontal unit change | Up/Down; Left/Right unit change | 1h30, 95min, or decimal hours without loss of value |
| Amount | Step the numeric amount; switch currency through an explicit host factor | Vertical scrub; horizontal currency change | Up/Down; Shift larger, Alt finer; Left/Right currency | $40 or €36; demonstration factors are never represented as market rates |
| Measurement | Step the quantity; convert compatible units | Vertical scrub; horizontal unit change | Up/Down; Shift larger, Alt finer; Left/Right unit | 6h, 360min; other units require host conversions |
| Colour | Change hue while retaining saturation and lightness; choose a swatch | Open colour well, then drag hue | Enter opens; arrows change hue; Escape cancels | #FF6B3D, rewritten as a full six-digit hex value |
| Tag | Choose one of the host's recent tags | Wheel cycles; click opens list | Space cycles; Enter opens list; arrows choose | #poster; typing # offers the same recent list |
| Derived tag | Confirm a suggestion, then operate it as a tag | Click confirms; subsequent edits use tag control | Tab/Enter confirms; Escape declines | Only confirmation inserts or replaces the proposed tag |
| Enum tag | Step a host-declared finite state, distinct from a free tag | Wheel/vertical drag; adjacent states peek only while held | Space/Up/Down step; Escape restores | #todo, #doing, #done, #dropped |
| Link | Open destination; edit its URL in an anchored field | Click follows; edit action opens field | Enter follows; edit action opens field | Full URL; display-only host chip remains a link |
| Person | Choose a known person | Click opens avatar/name list | Enter opens; arrows and typeahead choose | Exact host-provided name; no inferred identity is invented |

## One rendering grammar

Time uses an engraved underline and a clock. Money uses a coin and tabular figures. Body quantities use the moon for sleep or the existing footsteps for steps. Colour uses its actual swatch. Links use the existing link chip. People use an avatar. Tags share one raised tab with a real punched hole; derived tags retain that tab and add an explicit suggestion state.

Text advance stays unchanged for display-only marks. Glyphs occupy space above their own chunk, with a shared, reserved clearance on every wrapped line in raw and cued views; they never overlap neighbouring words or consume the text's width. The glyph's tooltip names its meaning. Display glyphs stay decorative and add no Tab stop; the operated chunk exposes its meaning and help to keyboard users. A trailing glyph describes the whole line only and has its own name. Existing plain inline Mark users keep their metrics.

Tags use a stable NFC-normalised hash into a shared palette, rendered with full text ink. Hue is identity, never state. React and Swift use the same scalar hash and token palette. A quiet hash, clipped tag tip and punched hole distinguish the shape from a disabled chip.

## Recognition storyboard

While the caret is inside a candidate, show raw text. Suspend recognition throughout IME composition; recognition resumes only after composition commits and the caret leaves the candidate. Recognise after a word boundary or the caret leaves it. Draw its underline using scale on the settle spring; reveal its own glyph on the object spring. A colour swatch blooms once; a formatted amount uses the existing drum; a date's resolved chip rises using the existing chip distance. Play a short glyph act once for that recognition identity. Re-rendering, hovering another chunk or scrolling never repeats recognition.

Inferred values remain dashed and in secondary ink until explicitly confirmed. Confirmation presses the suggestion, makes it solid and emits a brief acknowledgement; reduction makes every stage immediate. A raw/cued switch fades marks and glyphs in their existing slots. It never remounts or moves the text.

## Editing and document ownership

Each editable cue exposes its current semantic value and writes the replacement words through a callback. The host replaces exactly the indicated source range, adjusts the retained selection by that range's length delta, and records one undo entry when the gesture ends. Intermediate drag frames update the current words without adding undo entries. Escape restores the captured source and selection. Undo restores both.

Reserve the widest permitted formatted value before interaction. The same fixed footprint remains in raw mode, during a drum turn, unit conversion, picker and cancellation. Adjacent text stays in place; the complete value remains accessible. Numeric limits and allowed formats belong to the host and bound this reservation.

Use Base UI NumberField for numeric focus, stepping and ARIA, and the existing Base UI-backed Calendar, Popover, Select/Combobox and colour parts for pickers. Extend gesture handling only for operations those parts do not provide. Every pointer operation has a keyboard equivalent. Read-only and disabled cues neither mutate text nor emit detent haptics.

At rest, no editing instrument runs or shows. Hover thickens the existing underline and gives the appropriate resize or rotation cursor; a first-use tooltip explains the operation. Dragging exposes the small scale or adjacent choices, then removes it. One shared detent haptic per changed stop; OS and scoped motion reduction cancel travel without changing values.

Native counterparts consume the same recipes and `@MetalMotionPreference`, provide selected/adjustable accessibility and perform the same semantic source callbacks. Native document hosts own their TextKit selection and undo manager; SwiftUI previews cannot claim text-editor caret proof.

## Delivery order

1. Review the grammar, palette/shape and recognition timing foundation.
2. Finish display marks, live recognition, legend and native examples.
3. Finish numbers first, including amounts, durations and unit conversions.
4. Finish enum, relative date/time, colour, then tag/person/link controls as individual slices.
5. Wire document history and the provenance text example; exercise pointer and keyboard edits, cancellation, one-step undo, fixed footprints and reduced motion in both colorways.

## Reviewed display foundation

The identity palette is the existing blue, orange, gold and green-deep, in that order. Red remains destructive. The shared Status tint sets the tab's quiet fill; full ink carries the entire name. Hash the NFC-normalised Unicode scalars with wrapping UInt32 `hash = hash * 31 XOR scalar`, then take the palette count. No currency, confidence or state is inferred from that colour.

Semantic hosts reserve the existing compact Button glyph plus space-2 above each content line. Raw mode retains this clearance. A background-only clipped tab and a space-2 punched hole never clip the name or its copied hash. Plain Mark callers keep the original text advance and leading. These recipes reuse the approved tag elevation and existing settle/object springs.
