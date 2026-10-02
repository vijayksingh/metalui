# Combobox

Type to find one of many. React: `Combobox` from `@unlocalhosted/metalui`, on Base UI Combobox. SwiftUI: `MetalCombobox` (work in progress). The well is the field look; the plate and rows are the `menu` recipe (with its gliding highlight); the `combobox` recipe adds the size and the fit.

## Use it for

- One value from a long list people know by name: a city, a person, a font, a timezone.

## Don't use it for

- A short list (use a select), commands (use the command palette), or free text with no list (use a field).

## Anatomy

- Well: the form field's, `size` regular (32, the default) or compact (28), at least 220 wide; the text in ui type; a clear key (24, the shared `close` glyph at 10) at the end once a value is chosen.
- Plate: the menu's frosted plate, as wide as the well, 6 below it; at most 7 rows, then it scrolls.
- Rows: the menu's rows under one gliding highlight. Nothing found: one quiet row in ink3.

## States and motion

| State | Look | Motion |
|---|---|---|
| rest | the well and its placeholder | – |
| typing | the plate opens; rows filter | the plate fades in on settle; rows change at once; the plate's height settles to the new count |
| moving | one row highlighted | the highlight glides on settle |
| chosen | the field holds the value | the plate fades out on release |
| chosen, then clear | the mark shows; it takes the choice away | fades in on settle |
| nothing found | "No matches" | – |
| focus | the flush green ring on the well | – |
| invalid | the foundation's invalid ring; aria-invalid | – |
| disabled | 40 % | – |

Reduce Motion: the height snaps; the fades stay, and the glyph remains complete and static. The clear key uses `Icon` / `MetalIcon(.close)` from the set; no inline drawing. It keeps the input's chosen value and clear behavior on Base UI. SwiftUI exposes the same clear action while its field/plate material remains WIP.

## API

| React | SwiftUI |
|---|---|
| `items` (strings), `value`, `defaultValue`, `onValueChange` | `selection:`, `items:` |
| `placeholder`, `aria-label`, `emptyText` ("No matches") | `prompt:` |
| `size` (`regular`, `compact`), `invalid`, `disabled` | `.disabled()` |

## Keyboard and accessibility

- A combobox input with a listbox; ↑ ↓ move the highlight, ↩ chooses, Esc closes, typing filters. Name it with a visible label or `aria-label`.

## Rules

- Filter as people type; never make them press a button to search.
- The plate grows and shrinks with the matches; it never jumps.

Inline completion hosts may opt into `defaultOpen` and `autoFocus` for a newly captured source range. `renderItem(item)` supplies its existing semantic face; the complete string stays the Base UI value and accessible choice. Ordinary fields keep their defaults. Searching does not commit source; the host handles selection and dismissal.
