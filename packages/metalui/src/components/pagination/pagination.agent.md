# Pagination

Moving through pages of results. React: `Pagination` from `@unlocalhosted/metalui`. SwiftUI: `MetalPagination` (work in progress). The track, thumb and keys are the `switcher` recipe; the `pagination` recipe adds the page window.

## Use it for

- Results people move through by page and may return to by number: search results, an archive, a table.

## Don't use it for

- A feed people scroll (load more as they reach the end), or steps of a task (use a stepper).

## Anatomy

- `nav` named "Pagination", holding the switcher's sunk track.
- Keys: previous (the shared `chevron`, turn 90), the page numbers (at least 28 wide, tabular figures), next (the same glyph, turn 270).
- The current page: the switcher's raised thumb.
- Long runs: the first and last pages, the current one and `siblings` (1) on each side, ellipses for the gaps.

## States and motion

| State | Look | Motion |
|---|---|---|
| current | the raised thumb under its number | – |
| choose a page | the thumb under the new number | glides on the part spring |
| first / last page | previous / next disabled (40 %) | – |
| focus | the switcher's focus ring | – |

Reduce Motion: the thumb moves at once and the chevron stays complete and still. Previous/next keys play one chevron act on hover, focus or press; disabled end keys play nothing. Glyph dimensions come from `pagination.arrow.size` on both platforms.

## API

| React | SwiftUI |
|---|---|
| `page` (from 1), `count`, `onPageChange` | `page:`, `count:` |
| `siblings` (1) | – |
| `aria-label` ("Pagination") | – |

## Keyboard and accessibility

- A `nav` landmark; every key is a button named "Page 3", "Previous page", "Next page"; the current page says `aria-current="page"`. Tab moves through the keys.

## Rules

- Keep the page in the address when you can, so a page can be shared.
- Show the page count somewhere near ("Page 3 of 12") when it matters.
