# Menubar

An app's commands under a few words across the top. React: `Menubar` from `@unlocalhosted/metalui`, on Base UI Menubar with the library's `Menu` inside. SwiftUI: `MetalMenubar` (work in progress; on macOS, use the system menu bar through `.commands`). The plates and rows are the `menu` recipe; the `menubar` recipe adds the keys.

## Use it for

- A desktop-style app in the browser with many commands grouped under a few words: File, Edit, View, Insert.

## Don't use it for

- A website's sections (use the navigation menu), or a few actions (use a toolbar or buttons).

## Anatomy

- Bar: keys 2 apart, padding 2.
- Key: a word in ui type, 26 tall, padding 10, radius 8; it lifts (the list row's look) on hover.
- Menu: the menu's frosted plate below its key, with rows, shortcuts and separators.

## States and motion

| State | Look | Motion |
|---|---|---|
| rest | quiet words | – |
| hover (nothing open) | that key lifts | – |
| open | the plate below the key; one highlight under the key | the plate fades in on settle |
| moving across while open | the highlight follows; the next menu opens | the highlight glides on the settle spring; the next menu opens at once as the last fades on release |
| close | Esc, a click outside, or a choice | the plate fades on release |

Reduce Motion: the highlight moves at once.

## API

| React | SwiftUI |
|---|---|
| `Menubar` `aria-label`, `loopFocus`, `modal`, `disabled` | `.commands { … }` |
| `Menubar.Menu` `label`, `heading`, `disabled`, children (MenuItem, MenuSeparator) | `CommandMenu(label)` |

## Keyboard and accessibility

- A `menubar`; ← → move between keys, ↓ or Enter opens a menu, ↑ ↓ move within it, ← → move to the next menu while open, Esc closes it and returns focus to its key.

## Rules

- Few words, most used first: File, Edit, View.
- Every command also has a shortcut or a place elsewhere; the bar is where people look them up.

The category words File/Edit/View stay words. Their commands use the set at14px: New canvas `board`, Open document `document`, Export `download`, Undo `undo`, Redo `redo`, Select all `select`, Show grid `layout`. Actual size stays its precise word: `fit` would promise a different operation. A menu command's glyph shares its row trigger and never becomes another focus stop. Native system Menu/Commands hosts use the same custom symbol, e.g. `Label { Text("Export…") } icon: { MetalIcon(.download, size: 14) }`; the MetalMenubar body remains WIP. Existing word keys contain no drawn chevron to replace or rotate.
