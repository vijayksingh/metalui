# Navigation menu

A site's sections across the top, with panels of links. React: `NavigationMenu` from `@unlocalhosted/metalui`, on Base UI Navigation Menu. SwiftUI: `MetalNavigationMenu` (work in progress). Keys are the `menubar` recipe's, the plate is the `menu` recipe's, links use the `row` recipe's lift; the `navigation-menu` recipe adds the panel's motion.

## Use it for

- A product or docs site's top navigation where some sections hold several pages worth describing.

## Don't use it for

- App commands (use the menubar), a path (use breadcrumbs), or views of one page (use tabs).

## Anatomy

- Keys: the menubar's words; a key with a panel has the shared `chevron`, sized by `navigation-menu.chevron.size`; `NavigationMenu.Link top` is a plain key that goes somewhere.
- Panel: the menu's frosted plate, 8 below the key, padding 8.
- Links in a panel: rows (padding 10 × 12, radius 12) with a title (ui type) and a line (body type, ink2).

## States and motion

| State | Look | Motion |
|---|---|---|
| hover / open key | the key lifts | – |
| open | the plate under the key; chevron turned over | rises one nest on the surface spring; shared glyph morphs to turn 180 on the settle spring |
| to the next key | the plate under it at the new panel's size | slides and resizes on the settle spring; content moves two grid steps the way you went and crossfades |
| close | – | fades on the release spring |
| current page | its link lifted (`active`) | – |

Reduce Motion: size and place snap; content crossfades without travel; the shared chevron reaches its whole new direction at once. The glyph follows Base UI's live `open` state, including hover, keyboard, Escape and dismissal. There is no separate CSS rotation. Swift's WIP container draws no internal glyph; section content owns its shared chevron.

## API

| React | SwiftUI |
|---|---|
| `NavigationMenu` `aria-label`, `value`, `onValueChange`, `delay`, `closeDelay` | – |
| `NavigationMenu.Item` `label`, children (the panel) | – |
| `NavigationMenu.Link` `href`, `description`, `active`, `top`, `render` (a router's link) | `NavigationLink` |

## Keyboard and accessibility

- A `nav` with a list of keys; Tab moves between keys, Enter or ↓ opens a panel and moves into it, Esc closes it and returns to the key. The current page's link says `aria-current="page"` (`active`).

## Rules

- A panel's links say what is there in a line, not just a name.
- Keep panels small: a few links a column, at most three columns.
