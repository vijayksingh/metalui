# Drop zone

A place that receives files, by drop or by picking. React: `DropZone` from `@unlocalhosted/metalui`. SwiftUI: `MetalDropZone` (`dropDestination(for:)` and `fileImporter` are the system's). A place: it receives files and holds none itself; the files it took are the caller's `Attachment`s, below it. The tray is a `well`; the `drop-zone` recipe adds the edge, the sink and the motion.

## Use it for

- Attaching files to a thing: a region, a message, a form.
- Compact, the attach row of a composer.

## Don't use it for

- A whole canvas or window that takes drops: handle the drop there; a drop zone is a bounded place.
- One image with a preview (an avatar picker): a button that opens the picker.

## Anatomy

- A sunk tray (well look), radius 20, at least 176 tall, padding 24.
- A 44 raised well with a 20 glyph; the title (ui type); what it takes (meta type, ink3); "or choose files" (meta, ink2, underlined).
- An edge drawn inside the tray (1.5), clear at rest.
- Compact: one 56 row: glyph, words, "or choose files" at the end. Words can shrink and truncate before the choose-files text; the input keeps the full title as its accessible name. The host owns the width, including a narrow composer.

## States and motion

| State | Look | Motion |
|---|---|---|
| rest | the tray; edge clear | – |
| armed (files dragged anywhere in the window) | edge green at 40% | settle spring |
| over | edge green; tray at 0.985; glyph up 4; "Let go to attach" | part spring; the line turns on the drum |
| refused (over, a type it won't take) | edge in the invalid ink; "This file isn't taken here" | the drum; dropping shakes it (refusal) |
| drop | back to rest | the tray comes up on the object spring, with its overshoot |
| focus (keyboard) | the focus ring | – |
| disabled | 50% | – |

Reduce Motion: edge and line change at once; nothing sinks, rises or shakes.

## API

| React | SwiftUI |
|---|---|
| `onFiles(files, refused)` (refused: `{ file, reason: 'type' \| 'size' \| 'count' }[]`) | `onFiles: ([URL]) -> Void` |
| `accept` (the input's accept: `"image/*,.pdf"`), `maxSize` (bytes), `multiple` (true) | `accept: [UTType]`, `maxSize:`, `multiple:` |
| `title`, `description`, `overTitle`, `refusedTitle`, `chooseLabel`, `glyph`, `icon` | `title`, `description`, `icon`, `systemImage` |
| `compact`, `disabled` | `compact:`, `.disabled()` |

While dragging, only the MIME type is known, so an extension pattern (`.pdf`) is checked on drop; size too.

## Keyboard and accessibility

- The tray is the label of a real file input: Tab reaches it, Space or Enter opens the picker, a click anywhere on it does too.
- The input is named by `title` and described by `description`.
- Dragging is not the only way in: the picker always works.
- Say what was refused and why near the zone (the `refused` list), not only with the shake.

## Rules

- Name what it takes and the largest size in `description`.
- Show what it took right away, as attachments that land below it.
- A drop that misses the zone is swallowed while it is on the page, so the browser never opens the file.

## Result glyph and acceptance

`glyph` selects canonical geometry (default `document`, or `image` for an image receiver). It stays mounted as one `MorphIcon`: successful receipt morphs to `check`; refusal morphs to `close`, with a live count of accepted and refused files. A new drag interrupts from the current shape; the result returns to the receiver glyph after `result.pause` (1.6s). Reduced motion lands the whole meaning immediately. Existing `icon` custom artwork remains an escape hatch; use `glyph` for the shared result morph.

Native `MetalDropZone` uses the same well/surface recipes and 20pt `MetalMorphIcon`, with `icon:`, `maxSize:`, `multiple:` and `onRefused:`. Type, size and count are checked before callbacks for both picker and URL drops. `onFiles` receives accepted URLs; `onRefused` receives `MetalDropRefusal` with `.type`, `.size` or `.count`. The caller starts security-scoped access when reading a returned URL. The system’s URL drop destination cannot inspect item types until delivery, so native refusal appears after dropping; target lighting starts when the tray is targeted. Custom `systemImage:` callers retain their artwork. Neither custom artwork escape hatch invents a cross-shape animation.
