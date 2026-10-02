# Sidebar

An app's side place for moving between places. React: `Sidebar` from `@unlocalhosted/metalui`. SwiftUI: `MetalSidebar` (work in progress; `NavigationSplitView` is the system's). A place: the highlight is the `row` recipe's lift, section titles are the engraved `label`, the rail's names are `tooltip`s; the `sidebar` recipe adds the widths and the collapse.

## Use it for

- An app with several places people move between often: spaces, views, settings.

## Don't use it for

- A site's sections (use the navigation menu), or a panel of properties (use a sheet or a split pane).

## Anatomy

- Width 232 (a rail 56), padding 8; header and footer stay while the sections scroll.
- Section: an engraved title and its items, 2 apart; sections 16 apart.
- Item: a 16 glyph and a word, 32 tall, radius 10, ink2 (ink when current or hovered).
- Toggle: collapses to the rail and back.

## States and motion

| State | Look | Motion |
|---|---|---|
| current | the lifted highlight under it | – |
| choose another | the highlight under it | glides on the settle spring |
| collapse | the rail | words fade on the release spring, then the width settles |
| expand | the full width | width settles, then the words fade in |
| rail, hover or focus | the name in a tooltip | the tooltip's own |

Reduce Motion: width and words change at once; the highlight moves at once.

## API

| React | SwiftUI |
|---|---|
| `Sidebar` `collapsed`, `aria-label` | `NavigationSplitView` |
| `Sidebar.Header`, `Sidebar.Footer` | – |
| `Sidebar.Section` `title` | `Section(title)` |
| `Sidebar.Item` `icon`, `href`, `active`, `render` (a router's link), children (the word) | `NavigationLink` |
| `Sidebar.Toggle` `collapsed`, `onCollapsedChange`, optional `icon` | `MetalSidebarToggle(collapsed:)` |

## Keyboard and accessibility

- A `nav` named by `aria-label`; sections are named groups; the current item says `aria-current="page"`. In the rail, items are named by their word and show it as a tooltip on focus. The toggle says whether it is expanded.

## Rules

- Few sections, short words; the most used places first.
- Remember whether someone collapsed it.

- Glyph wrappers are inert: only the navigation link or collapse button enters the Tab order, including in Chrome. Icons still act through the enclosing control trigger.

The default toggle morphs the shared `sidebar` and `sidebar-collapsed` glyphs at16px as its label turns on the drum. The frame stays fixed, the navigation boundary moves, and rail word marks withdraw. Pass `icon` only for custom artwork; it stays host-owned. Swift's operable `MetalSidebarToggle(collapsed:)` uses the same pair and spoken collapse/expand verbs; `.disabled` prevents a change. `MetalSidebar` itself remains a system List placeholder: the native gliding highlight and word/width choreography are still WIP. Reduced motion lands the toggle's glyph and label immediately.
