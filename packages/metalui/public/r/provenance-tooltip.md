# Provenance tooltip

One hover away from every cue: where it came from. React: `ProvenanceTooltip` (and `ProvenanceProvider` around a canvas) from `@unlocalhosted/metalui`, on Base UI Tooltip. SwiftUI: `.metalProvenance(_:detail:)` or `MetalProvenanceTooltip`. Kamui brief: 03 §5.

## Use it for

- Every cue the app applied: `RULE · DATE PARSER`, `JEV · 0.82`, `REGION · DONE`, `CLUSTER · POSTER`, `FORMULA`, `YOU` (a correction).

## Don't use it for

- Tooltips on chrome (a tool's name and key). Those are the toolbar's tooltips.
- Long explanations. One line: the source, then the detail.
- Hiding confidence. If the app guessed, the number is shown.

## Anatomy

A graphite frosted tag (the graphite frost recipe), radius 11, padding 6 / 10, max 280 wide, in the `readout` role (10.5 mono) uppercase, tracked .05em: the source in `ink`, the detail after a middle dot in `dim`. It sits 8 above the cue, or 34 above a cue that shows its own value chip on hover, and flips below near the top of the view.

The readout role, not the label role: provenance carries information on its own, and the label role never does (DS-06).

## States and motion

| State | What shows | Motion |
|---|---|---|
| rest | nothing | – |
| hovered or focused 380 ms | the tooltip | fade on settle |
| next cue within the group | the next tooltip at once | – |
| leave, Escape | hidden | fade on settle |
| Reduce Transparency | opaque graphite | – |

## API

```tsx
<ProvenanceProvider>
  <ProvenanceTooltip source="Jev" detail={['0.82']} clearsChip>
    <Cue kind="date" resolved="TUE 30 SEP">tomorrow</Cue>
  </ProvenanceTooltip>
</ProvenanceProvider>
```

| Prop | Notes |
|---|---|
| `source` | first, in ink |
| `detail` | dimmed, after a middle dot |
| `clearsChip` | the cue has its own value chip: sit above it |
| `open` | controlled |

## Rules

- Every applied cue has provenance, and a guess shows its number.
- One line, the source first.
- It never covers the cue's own value chip.

## Accessibility

- Base UI Tooltip: it opens on hover and on keyboard focus and closes on Escape. Base UI tooltips are visual only, so the component also sets the cue's `aria-description` to the provenance ("Jev, 0.82"). The cue stays the focusable element.
- It never holds interactive content.

## Tokens

`--mu-provenance-*`, `--mu-frost-graphite-*`, `--mu-backdrop`, `--mu-type-readout`, `--mu-spring-settle`. Swift: `MetalProvenance`, `MetalFrost.graphite`.
