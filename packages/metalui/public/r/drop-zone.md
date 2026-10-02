# Drop zone

A place that receives files, by drop or by picking. React: `DropZone` from `@unlocalhosted/metalui`. SwiftUI: `MetalDropZone` (work in progress; `dropDestination(for:)` and `fileImporter` are the system's). A place: it receives files and holds none itself; the files it took are the caller's `Attachment`s, below it. The tray is a `well`; the `drop-zone` recipe adds the edge, the sink and the motion.

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
| `accept` (the input's accept: `"image/*,.pdf"`), `maxSize` (bytes), `multiple` (true) | `accept: [UTType]` |
| `title`, `description`, `overTitle`, `refusedTitle`, `chooseLabel`, `icon` | `title`, `description`, `systemImage` |
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
