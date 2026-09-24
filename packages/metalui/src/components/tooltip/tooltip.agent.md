# Tooltip

Names an icon-only control and its key, one hover away. React: `Tooltip`, `TooltipProvider` from `@unlocalhosted/metalui` (Base UI Tooltip). SwiftUI: `.metalTooltip(_:shortcut:edge:)`. Behaviour: the reference design's `#tip`.

## Use it for

- Every icon-only control: a tool, a lens bar pin, a close button. The name and its key.

## Don't use it for

- Where a cue came from: use the `ProvenanceTooltip` block (a wrapped note with its detail in `Tooltip.Dim`).
- Anything to click or read at length: use a popover or a menu. A tooltip holds no controls.
- A control that already shows its name in words.

## Anatomy

- **Chip**: a graphite pill (`.mu-frost-graphite` fill and shadow), padding 5 × 9, the label role (9 mono uppercase), ink `#E9E9EB`.
- **Key**: after a middle dot, dimmed (`#8E8E93`): `SELECT · V`.
- **Dim** (`Tooltip.Dim`): the same dimmed ink for any detail in a `label` node.
- **Wrap** (`wrap`): a longer note wraps at 280 instead of one line.
- **Placement**: 10 from the trigger, above by default; flips near the edge.

## States and motion

| State | Look | Motion |
|---|---|---|
| rest | nothing | – |
| hover / focus, 120 ms | the chip | fades in on settle |
| next trigger in the group | the next chip at once | instant |
| leave / press | gone | fades out on settle |
| Reduce Transparency | opaque graphite | – |

## API

```tsx
<TooltipProvider>
  <Tooltip label="Undo" shortcut="⌘Z">
    <button aria-label="Undo"><UndoIcon size={16} /></button>
  </Tooltip>
</TooltipProvider>
```

```swift
Button(action: undo) { MetalIcon(.undo, size: 16) }
    .accessibilityLabel("Undo")
    .metalTooltip("Undo", shortcut: "⌘Z")
```

## Rules

- Every icon-only control has one, and its own accessible name; the tooltip is visual.
- One line. Name, then key. No sentences, no punctuation beyond the middle dot. Only a block's note (`wrap`) runs longer.

## Accessibility

- The trigger carries `aria-label` (and `aria-keyshortcuts` when it has a key). Keyboard focus shows the tooltip as hover does.

## Tokens

`--mu-tooltip-*`, `--mu-frost-graphite-*`, `--mu-spring-settle`. Swift: `MetalTooltipMetrics`.
