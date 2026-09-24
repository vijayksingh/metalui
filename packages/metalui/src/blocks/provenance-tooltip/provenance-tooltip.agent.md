# Provenance tooltip

One hover away from every cue: where it came from. A composition block: a wrapped `Tooltip` with the detail in `Tooltip.Dim`. React: `ProvenanceTooltip` (and `ProvenanceProvider` around a canvas) from `@unlocalhosted/metalui`. SwiftUI: `.metalProvenance(_:detail:)` or `MetalProvenanceTooltip`.

## Use it for

- Every cue the app applied: `Rule · date parser`, `Recognizer · 0.82`, `Region · Done`, `Cluster · poster`, `Formula`, `You` (a correction).

## Don't use it for

- Tooltips on chrome (a tool's name and key). Those are the toolbar's tooltips.
- Long explanations. The source, then the detail.
- Hiding confidence. If the app guessed, the number is shown.

## Anatomy

`Tooltip wrap` (the graphite fill with no backdrop, radius 11, padding 6 / 10, max 280 wide, 10 mono at 1.45, tracked .05em): the source in its ink, the detail after a middle dot in `Tooltip.Dim`. It waits 380 ms, sits 8 above the cue, or 34 above a cue that shows its own value chip on hover, and flips below near the top of the view.

## States and motion

| State | What shows | Motion |
|---|---|---|
| rest | nothing | – |
| hovered or focused 380 ms | the tooltip | fade on settle |
| next cue within the group | the next tooltip at once | – |
| leave, Escape | hidden | fade on settle |

## API

```tsx
<ProvenanceProvider>
  <ProvenanceTooltip source="Recognizer" detail={['0.82']} clearsChip>
    <Mark kind="date" resolved="TUE 30 SEP">tomorrow</Mark>
  </ProvenanceTooltip>
</ProvenanceProvider>
```

| Prop | Notes |
|---|---|
| `source` | first, in the tooltip's ink |
| `detail` | dimmed, after a middle dot |
| `clearsChip` | the cue has its own value chip: sit above it |
| `open` | controlled |

## Rules

- Every applied cue has provenance, and a guess shows its number.
- The source first.
- It never covers the cue's own value chip.

## Accessibility

- Base UI Tooltip: it opens on hover and on keyboard focus and closes on Escape. Tooltips are visual only, so the block also sets the cue's `aria-description` to the provenance ("Recognizer, 0.82"). The cue stays the focusable element.
- It never holds interactive content.

## Tokens

Timing and placement: `--mu-provenance-delay-ms`, `--mu-provenance-offset`, `--mu-provenance-chip-offset`. Look: the tooltip recipe. Swift: `MetalProvenance`.
