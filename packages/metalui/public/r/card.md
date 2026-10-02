# Card

A person's thing, held on a raised plate. React: `Card` from `@unlocalhosted/metalui`. SwiftUI: `MetalCard` (work in progress). An object: the plate is the raised `surface`; the `card` recipe adds the layout, the hover lift and the selected ring. For a link with its site's preview, use the link card; for code, the code card.

## Use it for

- One thing among several of its kind: a document, a project, a place, a person's saved item.

## Don't use it for

- Grouping controls (use a fieldset or a section), or a single block of page text (no plate needed).

## Anatomy

- Plate: raised surface, the card radius, padding 16, parts 6 apart.
- Media (optional): bleeds to the plate's edges at the top, 160 tall.
- Title (title type, an h3 by default); with `href`, its link stretches over the whole card.
- Description (body type, ink2); Footer: actions, 12 apart, above the stretched link.

## States and motion

| State | Look | Motion |
|---|---|---|
| rest | the raised plate | – |
| hover (with a link) | one grid step up, a larger shadow | settle spring (the hover lift) |
| pressed | back down | press time |
| focus | the green ring round the card | – |
| selected | the green ring, 3 out | – |
| without a link | still | – |

Reduce Motion: no lift; the shadow still grows.

## API

| React | SwiftUI |
|---|---|
| `Card` `selected`, `render` (another element) | `MetalCard { … }` |
| `Card.Media` (an image's attributes) | `media:` |
| `Card.Title` `href`, `render` (a router's link), `level` (3) | `title:` |
| `Card.Description`, `Card.Footer` | `description:`, `actions:` |

## Keyboard and accessibility

- An `article`. With `href`, the title is the card's one link (Tab reaches it; the whole card is its hit area); footer actions are separate buttons after it. The card shows the focus ring when its link has focus. Never nest a button inside the link.

## Rules

- One link per card; everything else is an explicit action in the footer.
- Only cards that go somewhere move.

Footer actions carry their canonical meaning glyph: Share uses `icon={<ShareIcon />}`, while Choose stays a plain choice. A host-supplied Card menu uses shared `trash`, `duplicate`, `pen` and `pin` as appropriate; Card does not manufacture a menu or own its effects. Swift's content slot accepts `MetalButton("Share", icon: .share, size: .compact, action: share)`. Keep those actions outside any title link. The native Card body itself remains WIP.
