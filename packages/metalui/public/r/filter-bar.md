# Filter bar

Names the question a filter asks and switches how the answer is shown. A composition block on Base UI Toolbar. React: `FilterBar` (earlier `LensBar`) from `@unlocalhosted/metalui`. SwiftUI: `MetalFilterBar` (earlier `MetalLensBar`).

## Use it for

- While a filter is open: `open tasks about the poster · 6 MATCHES · VIA MODEL`, with its views (In Place, List, Table, Timeline, Gallery), pin and close.

## Don't use it for

- Search fields or command entry. The palette asks; the filter bar names what was asked.
- Filtering that moves or hides content permanently. A filter never moves anything.

## Anatomy

`Surface material="frost" radius="pill"`, 38 tall, padding 0 6 0 14, gap 8, at the top centre: a `Glyph` (14, ink2); the query in `Label variant="query"`, ellipsised at 340; `N MATCHES` in `Label variant="engraved"`; the note (`ASKING…` after a waiting `Led`, `VIA MODEL`, `LOCAL`); a compact `Segmented`; two `IconButton variant="ghost"`, pin and close.

## States and motion

| State | Look | Motion |
|---|---|---|
| open | the bar | drops in 8 from above, from .98, on surface; Reduce Motion: fades in place |
| pending | amber LED + the note | – |
| view change | the thumb glides | part |
| icon hover | the ghost button's well, ink | settle |
| close | removed | the host fades it out on release |

## API

| React | SwiftUI | Notes |
|---|---|---|
| `query`, `count`, `note` | same | `note: { text, pending }` |
| `view`, `onViewChange`, `views` | `view:` (Binding), `views:` | pass `[]` for no switcher |
| `onPin` | `onPin:` | omit when it cannot be kept |
| `onClose` | `onClose:` | also ⎋ in the host |
| `glyphs` | (MetalIcon built in) | `{ filter, pin, close }` at 14 |

`LensBar` remains: `source` (`asking`, `local`, or a source's name) becomes the note, `mode` / `onModeChange` / `modes` the views, `glyphs.lens` the filter glyph.

## Rules

- A filter never moves anything. In place dims non-matches; the other views gather matches in a panel without moving them.
- Hidden confidence is a bug: when words were judged beyond the rules, the note says where.

## Accessibility

- A Base UI toolbar named "Filter: …": one tab stop with arrow navigation; the view switcher is a radio group; pin and close have labels and titles.
- The match count is announced politely when it changes.

## Tokens

Layout: `--mu-lensbar-*`. Look: the surface, glyph, label, status, segmented and icon-button recipes. Motion: `--mu-spring-surface`, `--mu-travel-surface`.
