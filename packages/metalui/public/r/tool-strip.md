# Tool strip

Selection actions on a graphite strip. React `ToolStrip` and `verbsFor` from `@unlocalhosted/metalui`; Swift `MetalToolStrip`, `metalVerbsFor`. Compose Surface, Button, Rule, Menu and Tooltip; Base UI owns the web toolbar's arrows, popup placement and menus.

## Use it for

A click selection on a canvas or list. The host owns the selected data, results and Undo. Finishing a gesture makes a quiet selection; do not show it while dragging, resizing, in the past or while the palette is open.

## Selection grammar

Give each selected object `{ id, kind }`, and each kind its verb set. `verbsFor(selection, sets)` intersects stable verb IDs across all selected kinds. Unknown kinds produce no actions. `singleOnly` keeps Rename only for one object. `order` supplies a catalog-wide ordering; otherwise kind-set insertion order determines it. Disabled reasons and busy state merge from the matching kind sets. Swift takes an explicit `order: [String]` so Dictionary iteration cannot change muscle memory.

```tsx
<ToolStrip label="2 blocks" selection={selection} verbSets={sets}
  anchor={viewportBounds} boundary={canvasElement} maxVisible={5} />
```

You can continue passing fixed `items`. Each item has `id?`, `label`, `icon?`, `onSelect?`, `menu?` (MenuItem children), `menuOpen?` / `onMenuOpenChange?`, `order?`, `singleOnly?`, `shortcut?`, `disabled?`, `disabledReason?`, `busy?`, `destructive?`, `irreversible?`. The leading count defaults to selection length; supply `count` for a fixed list. A glyph key has an accessible name and tooltip; worded legacy actions remain supported. Menu keys name themselves and expose their menu with the standard trigger semantics.

## Placement and overflow

`anchor` accepts an Element or viewport `{ x, y, width, height }`. The host updates selection bounds after each canvas pan or zoom. Base UI follows the element or the inert bounds marker, positions 12 above the selection, flips below when needed and shifts at edges. `boundary` confines the strip to a canvas Element or viewport rectangle. No position clock runs at rest. When used inline, placement belongs to the host.

`maxVisible` limits regular keys; available boundary width can reduce it further. More occupies the last regular slot. The destructive action remains visible after More and an engraved Rule. Keep one destructive action. Very small boundaries still need enough room for a count, More and that action.

Swift uses parent-space `anchor: CGRect` and `viewport: CGRect` inside a ZStack. Pass updated bounds after pan/zoom. Its `maxVisible` and viewport capacity reveal More before the destructive action. Native menu panels expose overflow actions. `entrance: false` supports a settled capture.

## States and motion

The strip rises 4 on the part spring. Selection changes resize the backing surface through scale, translate retained keys from their old positions on settle, fade arriving actions in and departing actions out. Only transform and opacity animate. With the OS preference, site switch or scoped motion reduction, geometry changes instantly. Swift matches key positions and scales its backing on settle.

A disabled reason appears in the tooltip and is announced; its key stays focusable and cannot run. `busy` delegates waiting feedback to Button: 400ms show delay, a 300ms minimum display, no repeat activation. Only an irreversible destructive action sets `irreversible`: pointer, Space or Enter must be held until Button confirms. Reversible Send away can run immediately with Undo.

## Accessibility and delivery

The web toolbar is named `Tools for ${label}`, has one tab stop and Base UI arrow navigation. Tooltips describe glyph actions; menus own menu-key focus. Disabled reasons are descriptions, never an excuse to remove the action's name. Swift has spoken labels, hints, tooltips, arrow navigation and the same held action.

React, Swift, docs and targeted integration captures ship together. Tokens are existing toolstrip layout, button strip/strip-danger caps, graphite-strip Surface, Rule, Menu and shared springs. No new material numbers.
