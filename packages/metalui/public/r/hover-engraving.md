# Hover engraving

A block's identity, shown on a dwell, never on a pass. React: `HoverEngraving` from `@unlocalhosted/metalui`. SwiftUI: `.metalHoverEngraving(...)` or `MetalHoverEngraving`. the reference brief: 03 §5, DS-31.

## Use it for

- Telling what a block is and where it came from, without a card: `LOG · 07:40 · SLEEP 6 H · ALSO TIRED`, `TASK · TOMORROW 16:00 · #POSTER · RECOGNIZER ✓`, `LUNCH? 0.71`, `NOT SENT · LOOKS LIKE A SECRET`.

## Don't use it for

- Anything a person must read to act. The engraving repeats or names what the block already shows (the label role never carries information alone).
- Controls. It is not interactive and ignores the pointer.
- Tooltips on chrome. Those are tooltips; the provenance of a single cue is the provenance tooltip.

## Anatomy

A 22 tall frosted pill (`engraving-bg`, blur 12, `raise-sm`) with 10 padding and 8 gaps: the text in the `label` role, engraved with the lip, the kind emphasised; derived tags as hollow 15 tall pills; the recognizer's status after a 5 pt LED (green live, amber waiting, red failed, off). Beside the first line of a text block (4 to the right, 9 down); below a material block (8 under). It never covers the next line of a stacked list.

## States and motion

| State | Look | Motion |
|---|---|---|
| pass | hidden | – |
| dwell 420 ms | shown | settle fade, sliding 3 in (beside) or 2 down (below) |
| leave | hidden at once | settle, no delay |
| selected, writing | hidden (`open={false}`) | – |
| Reduce Transparency | opaque `frost-opaque` fill, no blur | – |

Reduce Motion: settle is a crossfade, so it fades in place.

## API

| React | SwiftUI | Notes |
|---|---|---|
| `kind` | `kind:` | emphasised first |
| `details` | `details:` | joined with ` · ` |
| `tags` | `tags:` | derived tags only |
| `status` | `status:` | `{ led, text }`; `MetalEngravingStatus` |
| `placement` | `placement:` | `beside`, `below` |
| `open`, `immediate` | `isPresented:` | controlled; the dwell still applies unless `immediate` |

```tsx
<div className="mu-icon-trigger block" aria-describedby="eng-1">
  slept badly, up at 5
  <HoverEngraving id="eng-1" kind="LOG" details={['07:40', 'SLEEP 6 H', 'ALSO TIRED']} status={{ led: 'live', text: 'RECOGNIZER ✓' }} open={selected || editing ? false : undefined} />
</div>
```

## Rules

- A dwell, never a pass: 420 ms before it shows, nothing on the way out.
- Beside the first line, never under a text block (it would cover the next line of a list).
- Hidden while selected or writing.
- Status carries its LED and its words; never colour alone.

## Accessibility

- It is a `note`; point the block's `aria-describedby` at its `id` so assistive tech reads the identity with the block.
- It never takes the pointer or focus.

## Tokens

`--mu-engraving-*`, per colorway `--mu-engraving-bg`, `--mu-engraving-emphasis`, `--mu-engraving-tag-ring`; `--mu-engrave`, `--mu-lip`, `--mu-raise-sm`, `--mu-led-*`, `--mu-type-label`. Swift: `MetalEngraving`.
