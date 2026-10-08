# Empty state

A place with nothing in it yet. React: `EmptyState` from `@unlocalhosted/metalui`. SwiftUI: `MetalEmptyState`. A place: the glyph sits in a `well`; the `empty-state` recipe adds the layout and the arrival.

## Use it for

- A list, board or panel with nothing in it: first use, a cleared filter, everything done.

## Don't use it for

- Errors (say what went wrong and how to fix it), or loading (use a skeleton).

## Anatomy

- A 56 sunk well (radius 18) with a 24 glyph in ink3.
- Title (title type): what would be here. Description (body type, ink2): how to start.
- One action, 16 below.
- Compact: one line in ink3 and the action, for small places.

## States and motion

| State | Look | Motion |
|---|---|---|
| empties | the empty state | rises one nest from below on the settle spring (T9) |
| content arrives | the content | the empty state goes; the content's own arrival |

Reduce Motion: it fades in without travel.

## API

| React | SwiftUI |
|---|---|
| `title`, `description`, `icon`, `action` | `MetalEmptyState(title, description:, icon: MetalIconName) { action }`, or `icon: { any view }` |
| `compact` | `compact: true` |

## Keyboard and accessibility

- A polite `status`: when a place empties, assistive tech hears what would be here. The action is an ordinary button or link.

## Rules

- Say what would be here and how to start, not only "Nothing here".
- One action; the one that starts it.

## Comment host

The compact No comments action opens a real editor. Enter adds a line; Command/Control + Enter or Comment commits one post. Escape/Cancel discard an unlocked draft; pending requests lock just the editor and refuse a second post. Failures retain text for retry. The note glyph settles into check and the label turns Posted before the editor closes; Undo restores the comments captured before that request. The docs' Comment request panel controls latency and first-request failure. The executable native host lives in `swift/Examples/MetalCommentExample.swift`; it composes existing native EmptyState and Textarea controls without introducing another renderer.

The starting action names its work with the authored set: Attach files uses `attach`, New note uses `note`, and Comment uses its editor's `send` only when posting. This action stays the one focusable key, outside the decorative empty-place glyph. Native hosts supply `MetalButton("Attach files", icon: .attach)` or `MetalButton("New note", icon: .note)` through the action builder; the ContentUnavailableView body keeps its platform behavior.
