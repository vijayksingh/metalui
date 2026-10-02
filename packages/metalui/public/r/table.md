# Table

Rows of a person's things, read across and compared down. React: `Table` from `@unlocalhosted/metalui`. SwiftUI: `MetalTable` (work in progress; use SwiftUI `Table` on macOS). An object: engraved `label`s, `rule` hairlines and the row `checkbox`; the `table` recipe adds the sizes, the sort arrow and the travel.

## Use it for

- Many things with the same few properties that people compare or sort: files, trips, members, invoices.

## Don't use it for

- Layout (use a grid), one thing's details (use a list of rows), or a handful of things (use cards).

## Anatomy

- Caption: names the table (title type), or hidden for assistive tech only.
- Head: 32 tall, engraved labels; a sortable label is a button with an arrow.
- Rows: 40 tall, padding 12 at the sides, parted by hairlines; numbers align to the end with tabular figures.
- Selection (optional): a first column of row checkboxes; select-all in the head.

## States and motion

| State | Look | Motion |
|---|---|---|
| hover | the row sinks a touch | – |
| sort | the arrow points the way; rows reorder | shared arrow morph on the settle spring; each row travels from where it was on the settle spring |
| selected | a quiet green tint; head checkbox mixed or ticked | the checkbox's own |
| empty | one quiet line | – |

Reduce Motion: rows jump to their places; the arrow turns at once.

## API

| React | SwiftUI |
|---|---|
| `columns` (`key`, `header`, `cell`, `sortBy`, `align`), `rows`, `rowKey` | `Table(rows) { TableColumn(…) }` |
| `caption`, `captionHidden` | – |
| `sort`, `defaultSort`, `onSortChange` | `sortOrder:` |
| `selected`, `onSelectedChange`, `rowLabel` | `selection:` |
| `empty` | – |

## Keyboard and accessibility

- A real `table` with a caption and column headers; a sortable header says `aria-sort` and its button is in the tab order. Row checkboxes are named "Select Lisbon"; select-all announces mixed when some are chosen.

## Rules

- Right-align numbers and use tabular figures.
- Sort only columns where order means something.

The sort indicator is the icon set's `arrow`, aligned vertically once; state changes use `MorphIcon`, with no CSS direction transition. Select-all uses `mixed`, the shared checkbox dash, while individual rows use the same tick pen. Native `MetalTable` owns rows and cells only; a caller's custom sortable header uses `MetalIcon(.arrow)` at the sort glyph token.
