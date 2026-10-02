# Breadcrumbs

Where you are, as a path you can climb. React: `Breadcrumbs` from `@unlocalhosted/metalui`. SwiftUI: `MetalBreadcrumbs` (work in progress). The `breadcrumbs` recipe sets the gaps, the chevrons, the fold key and the arrival; the fold opens the `menu`.

## Use it for

- Deep, nested places: a folder in a folder, a region inside a canvas inside a space.

## Don't use it for

- A flat site (use the navigation menu), steps of a task (use a stepper), or history (use Back).

## Anatomy

- `nav` named "Breadcrumb", an ordered list.
- Levels above: links in ui type, ink2, ink on hover. The current level: ink, not a link.
- Separators: the shared `chevron` at 10, quarter-turned right and static in ink3, hidden from assistive tech.
- Fold: past `max` (4) levels, the first stays, then a quiet shared `more` glyph key (glyph 12) (22 tall, radius 6) that opens a menu of the hidden levels, then the last two.

## States and motion

| State | Look | Motion |
|---|---|---|
| first render | the path | still |
| deeper | a new last crumb | arrives one grid step from the right, fading in, on the settle spring |
| up | fewer crumbs | the path shortens |
| folded | shared `more` key | its menu opens on the menu's own motion |
| focus | the green ring on a link | – |

Reduce Motion: the new crumb fades in without travel.

## API

| React | SwiftUI |
|---|---|
| `items` (`id`, `label`, `href`) | `path:` |
| `max` (4) | – |
| `renderLink(item, props)` (a router's link) | – |
| `onNavigate(item)` (a folded level chosen) | `onSelect:` |

## Keyboard and accessibility

- A `nav` landmark ("Breadcrumb") with an ordered list; the current level says `aria-current="page"`. Tab moves through the links and the fold key; the fold opens with Enter or ↓.

## Rules

- The last crumb is where you are and is not a link.
- Name levels as they are named where they live.

The separators use `Icon` / `MetalIcon(.chevron)` from the set with animation disabled: they name a path, not an action. The fold key uses the shared `more` act and its accessible level count. Reduced motion keeps both glyphs complete and still.
