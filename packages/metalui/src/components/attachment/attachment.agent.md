# Attachment

A file someone attached. React: `Attachment` from `@unlocalhosted/metalui` (named so it never shadows the browser's `File`). SwiftUI: `MetalAttachment`. An object: the plate is the raised `surface`, the type sits in a `well`, the upload uses the progress fill; the `attachment` recipe adds the layout and the land and leave.

## Use it for

- Files attached to a note, a message or a form: before, during and after upload.

## Don't use it for

- Browsing files (use a table or a list of cards), or links (use a link card).

## Anatomy

- Plate: raised, at least 52 tall, filling its host's column without an intrinsic min/max width. The host chooses a narrow composer or a full-width list. Radius 14, padding 8; errors expand the plate with Try again below their own line.
- Type: a 36 sunk well with the extension engraved (PDF, PNG).
- Name: ui type; a long name keeps its extension and cuts the middle.
- Line: a canonical 14 glyph and meta type, ink3: the size, "Uploading · 40 %", "Uploaded · 2.5 MB", or the error in red. The extension well remains visible.
- Track (uploading): 3 tall, the progress fill. Try again (failed), Remove (a mini key).

## States and motion

| State | Look | Motion |
|---|---|---|
| added | the plate | lands from one nest above on the object spring (T5b) |
| uploading | upload glyph; the track fills; the line counts | settle spring; no idle glyph clock |
| complete | check and Uploaded with the size | the glyph morphs; the words turn on the shared drum |
| failed | sync-error and the reason in red; Try again with retry glyph | morph; announced once |
| removed | – | one nest down, fading, on the release spring (T9); then gone |

Reduce Motion: it appears and goes at once; the fill still conveys progress, and the glyph settles at its full contour. Completion persists until the host changes the receipt; the component runs no reset timer.

## API

| React | SwiftUI |
|---|---|
| `name`, `size` (bytes) | `name:`, `size:` |
| `progress` (0–100 while uploading) | `progress:` |
| `uploadState?: "idle" / "uploading" / "complete" / "error"` | `uploadState: MetalAttachmentUploadState?` |
| `error`, `onRetry` | `error:`, `retry:` |
| `onRemove` (called after it has left) | `remove:` |
| `onLeaveStart` (capture neighbors before leaving) | `onLeaveStart:` |

## Keyboard and accessibility

- A `group` named by the file name. The progress is a named `progressbar`; a failure is an `alert`. Remove is a button named "Remove report.pdf"; move focus to a neighbour after removing.
- `onLeaveStart` fires once before motion, including immediate removal under Reduce Motion. Capture neighboring bounds there, then close the list after `onRemove`. `leaveRow` handles interruption, repeated calls and cleanup; the remove and retry keys stay disabled while leaving.

## Rules

- The host controls completion. With `uploadState` omitted, existing `progress` / `error` infer uploading / error / idle. Clearing either prop can mean cancellation, so it never infers success. At 100 %, the glyph remains upload until the host explicitly supplies `"complete"` / `.complete`. Retry requests work; it does not claim delivery.
- Success uses a polite web status; error keeps its alert. Native posts an `AccessibilityNotification.Announcement` when a completion/error receipt changes, and exposes the same words as its accessibility value.
- Say why an upload failed in a few words ("Too large, 25 MB at most"), and offer to try again.
- Keep the extension visible; cut the middle of long names.
