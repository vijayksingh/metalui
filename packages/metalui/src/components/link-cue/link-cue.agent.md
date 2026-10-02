# Link cue

A Component for operating the URL written in a document. The existing MarkUrl host-chip Part remains a real anchor; the separate canonical pen key opens an anchored field. The recognizer never changes the destination.

## Source contract

React `LinkCue` and native `MetalLinkCue` take controlled `value`, `label` and an explicit nonempty `footprint` of the widest permitted source words and resolved host display alternatives. Reserve it before editing, including raw mode. The footprint never grows from a draft. An oversized URL is refused in the field, so neighbouring words do not move. The complete current URL is accessible, even while the chip displays its host.

`onBegin` captures a source range; `onChange(words)` writes only confirmed exact source words and can return false for a stale range; `onCommit` ends one history entry; `onCancel` restores the captured source and UTF16 selection. A field draft is local input, never a second selected URL. Escape, outside dismissal, changed source/footprint, read-only/disabled, unmount or native backgrounding cancels the old transaction. Pass `editing` so external source typing invalidates it. A no-op confirmation makes no history entry.

Only absolute HTTP(S) destinations with a host and no literal whitespace are navigable. Validation parses for navigation/display, never serialises URL.href back into source: authored case, escaping, path, query and hash are retained. `validate(words)` can add a host constraint and return a message. Invalid or oversized drafts remain editable and do not mutate source.

## Interaction

Enter or a pointer on the real link follows its current URL. The separate named edit key opens the shared regular Field in a Popover; typing changes the draft, Enter/Apply confirms, and Escape/Cancel/outside dismisses without writing. Read-only retains navigation while refusing edit. Disabled refuses both. Canonical pen/check/close glyphs carry the operation; no local SVG is drawn. The edit key appears on hover/focus in the already reserved meaning clearance, with no extra wrapper Tab stop.

React forwards its ref and common anchor events/ARIA to the actual link for provenance help; `editProps` reaches the actual edit key and `inputAria` reaches the field. Intrinsic operation descriptions join authored source descriptions. Base UI Popover/Field own focus, keyboard and ARIA. Native uses a real SwiftUI Link, a focusable edit button and TextField, the same URL pill/menu/field/button recipes, and scoped motion policy. Reduced motion cancels travel; no clock runs at rest. Source-history proof belongs to the host; SwiftUI views do not claim TextKit IME/caret ownership.

## Feature receipt

`e2e/link-cue.spec.ts` operates the source-backed document in both colorways and reduced motion: actual anchor navigation, field draft isolation, exact case/path/query/hash confirmation, fixed footprint, one Undo with UTF16 selection, refusal, external invalidation, read-only/disabled, raw display and unmount cancellation. `e2e/native/run-link-cue-proof.py` launches a real macOS app and drives the public Link, edit key and native field; all thirteen source/navigation/history/keyboard states pass in both colorways. Captures live under `docs/captures/web/link-*` and `docs/captures/native/link-cue-*`. This verifies the public control and source host; it does not claim TextKit caret/IME ownership.
