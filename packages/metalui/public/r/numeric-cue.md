# Numeric cue

Component: an inline canonical quantity you operate. Its scale exists only while dragging and is an Instrument. Mark supplies display grammar; Base UI NumberField supplies the spinbutton, locale parsing, focus, bounds, numeric keyboard steps and vertical scrub.

## Contract

`value: { value, unit }`, `onValueChange`, `units`, `min`, `max`, `label`, and `footprint` are required. Bounds use canonical quantity. Each unit supplies positive `factor` (canonical quantity per displayed unit), display `format(number)` and lossless `source(number)`. Minutes factor 1, hours factor 60; display is canonical / factor. A unit conversion changes its spelling, preserving the canonical quantity. Hosts supply explicit money factors; no exchange lookup occurs.

Use `kind` (date/duration/amount/measurement), `meaning`, `raw`, `locale`, `numberFormat`, `disabled`, `readOnly`, `name` as needed. `footprint` must include the widest raw and formatted faces across every allowed unit and value. It reserves real inherited font width; no per-frame measurement occurs. The semantic line reserves above-text glyph clearance independently.

## Source history

Wire `onBegin` to `useCueDocument.begin(range)`, `onSourceChange(words)` to `.replace(words)`, `onCommit` to `.commit()` and `onCancel` to `.cancel()`. One drag is one undo entry. `onCancel('external')` invalidates an obsolete capture: retain the externally supplied document; do not restore old source. Escape and pointer cancellation restore the captured canonical value, unit and spelling. Hosts own source ranges and UTF16 selection. Native supplies the same callbacks through `MetalNumericCue` and can use `MetalCueDocument`.

## Interaction

Vertical drag steps the amount; horizontal drag converts units after each existing spacing stop. Axis locks for that gesture. Shift selects the unit's `largeStep`; Alt/Option its `smallStep`. Arrow Up/Down step through Base UI. Alt/Option Left/Right converts units; plain Left/Right remains a typing caret. Tab focuses the input; Enter commits; double-click types. Each accepted stop calls shared detent haptic once. No callback/haptic occurs for a disabled or read-only interaction or a rejected endpoint step. Escape cancels without a later blur commit. Source changes always follow a deliberate action, never recognition.

## Materials and motion

Use existing Mark underline/glyph, shared SwapText drum and tooltip chip recipes. No new fill, color, spacing, font, elevation or spring. Rest runs no gesture listener or animation. Scale appears only while held. Shared OS, site and scoped motion policy makes value changes settle without travel. Haptics remain independent of visual motion.

Swift `MetalNumericCueValue`, `MetalNumericCueUnit` and `MetalNumericCue` match canonical and source semantics. The native inline face uses `MetalCueText`, a plain editing TextField, real keyboard/VoiceOver adjustments and a fixed hidden-text maximum footprint. macOS and iOS hosts control source/history; a preview alone is not TextKit caret proof.

`allowTyping={false}` retains formatted words and Base UI numeric arrows/scrub, blocks text insertion/paste and leaves Root mutable. Use for civil date/time controls whose typed numeric ordinal would be meaningless. `inputAria` is limited to popup/help relations on the actual spinbutton. Escape restores the exact source spelling captured on begin, even if a host formatter changes. Swift supplies the same `allowTyping` policy.
