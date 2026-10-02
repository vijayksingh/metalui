# Person cue

A Component for a known person's exact source name. The host supplies names and optional Avatar Objects; the Mark Part receives that object through its meaning slot. A shared person glyph is the fallback. It never infers an identity or constructs an Avatar.

## Source and history

React `PersonCue` and SwiftUI `MetalPersonCue` take a controlled `value`, unique nonempty `choices` and `label`. Each choice has exact source `value`, optional picker `label`, host `avatar`, and `disabled`. The visible inline name is always `value`, even when a picker label differs or the current source is unknown. All permitted full names and the current source reserve the same content-font footprint before opening; changing names does not move neighbouring words.

`onBegin` captures the host's source range. `onChange(words)` confirms one exact chosen name; returning false rejects a stale range. `onCommit` ends one history entry; `onCancel` restores the captured source and UTF16 selection. `useCueDocument`/`MetalCueDocument` supply this lifecycle. Arrow/typeahead highlight is only an instrument and never previews source. Choosing the current name is a no-op history entry. Pass `editing` so unrelated source typing invalidates an open transaction. Changed vocabulary, disabled/read-only, backgrounding (native), dismissal or unmount cancel it. No local selected-name copy can outlive source.

## Interaction and appearance

Click, Enter or Space opens the shared names plate. Arrows, Home/End and typeahead highlight; Return or pointer chooses; Escape/outside closes without changing the name. Disabled choices are skipped. React Base UI Select owns ARIA, focus return and keyboard navigation. Native uses actual SwiftUI buttons and a focused names list with selected accessibility traits. Read-only exposes the current value and refuses edits; disabled never opens. Common top-level trigger events/ARIA, optional `triggerProps`, and the forwarded ref reach React's actual trigger for provenance help, without another Tab stop. Set `hint={false}` / native `hint: false` when provenance owns visual help; intrinsic keyboard instructions remain.

At rest the Mark quiet underline and small host avatar identify the name. `raw` fades decoration, retaining the same source and footprint. The existing SwapText drum changes confirmed words; reduced motion uses its crossfade and the plate's donor fade. Native uses the same content type, Mark, menu plate/rows, highlight, pen and settle transition. No material, dimensions, recurring timer or rest animation are introduced. This is a SwiftUI source surface; a TextKit host still owns caret/IME and attributes, rather than pretending these views are an editor.

Live native motion reduction rebuilds only the selected word face and disables its inherited animation transaction. The actual button, focus, picker and source snapshot keep their identities. The public macOS feature receipt switches scope during a confirmed name swap and compares rendered words with a fresh reduced-motion control, as well as checking source history and cancellation.
