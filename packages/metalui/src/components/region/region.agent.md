# Region

A drawn rectangle with a name that carries a rule. React: `Region` and `RegionRow` from `@unlocalhosted/metalui`. SwiftUI: `MetalRegionView` and `MetalRegionRow`. Kamui brief: 04 §7, 03 §6.

## Use it for

- Arrangement that means something: `Done` ticks what lands, `To do` and `Doing` make tasks or reopen them, `This week`, `friday` or `tomorrow` date what lands, any other name tags what lands.
- Kanban (three adjacent regions), a pipeline (N in a row), an inbox (a pinned lens that makes tasks).
- A pinned lens: a live query kept on the canvas as a frosted plate of rows (`lens`).

## Don't use it for

- Grouping chrome, cards in a settings page or a list. It is a canvas object.
- A container that owns its blocks: blocks sit in it by position only, and dragging them out undoes the rule unless the rule says otherwise.

## Anatomy

- **Well**: a sunk rectangle (`region-fill`, `region-sh`), radius from the ladder by size: 30 when the short side is at least 240, else 24.
- **Head**, 44 tall (padding 14 / 18, grab cursor): the **name** in the `title` role (empty: "name this region" in ink3), the **rule** in the `label` role, engraved (`marks tasks done`, `tags them #poster`, `dates them friday`), and the **count** in the `readout` role, ink3.
- **Lens**: a frosted plate (`region-lens-fill`, blur 10, `raise-lite`) with its rows inset 12 under the head: `RegionRow` (padding 5 / 8, radius 12, a 14 pt dimple, the day engraved at the right; hover raises `row-hover` + `raise-sm`; checked rows are struck in ink3).

## States and motion

| State | Look | Motion |
|---|---|---|
| rest | the well | – |
| over (a block is dragged above) | green fill, 1 pt green ring, the rule reads `drop to mark tasks done` in green | fill and ring on settle |
| drop | the block settles inside its edges, never on a neighbour | the host lands it on the `object` spring (a stop) |
| dim (an in-place lens has no match inside) | .35 | settle |
| past (did not exist at the scrubbed time) | 0, no pointer | settle |
| rename | the name is a field; Enter commits, Escape restores | – |
| selected | the Selection frame at the region's radius | – |

## API

| React | SwiftUI | Notes |
|---|---|---|
| `name`, `rule`, `dropRule`, `count` | same | the host derives the rule from the name |
| `over`, `dim`, `past` | `state:` | |
| `lens` + children (`RegionRow`) | `lens:` + `rows:` | |
| `renaming`, `onRename`, `onRenameCancel` | `renaming:`, `onRename:` | |
| `width`, `height` | (its frame) | picks the radius |

```tsx
<Region name="Done" rule="marks tasks done" dropRule="drop to mark tasks done" count={3} over={dragOver === 'done'} width={320} height={260} />
<Region name="open tasks" rule="lens · live" lens width={300} height={220}>
  <RegionRow lead={<Dimple aria-label="Send the poster" />} meta="FRI">Send the poster</RegionRow>
</Region>
```

## Rules

- Placement is meaning, and reversible. A drop applies the rule with a toast that names it and offers Undo; dragging out undoes it unless the rule says otherwise.
- A dropped block settles inside the edges on `object` and never lands on a neighbour.
- The head says the rule in words; the over state says what the drop will do.
- A lens region holds nothing: its rows are the real blocks, and ticking a row ticks the block.

## Accessibility

- A region is a group named "Region Done, marks tasks done". Its rows are focusable and its dimples are real checkboxes.
- The drop is a pointer gesture; the keyboard path is the tool strip's Region verb and the palette.
- Colour is never alone: the over state also rewrites the rule in words.

## Tokens

`--mu-region-*`, per colorway `--mu-region-fill`, `--mu-region-sh`, `--mu-region-over-shade`, `--mu-region-lens-fill`, `--mu-raise-lite`, `--mu-row-hover`; `--mu-radius-card`, `--mu-radius-hero`, `--mu-type-*`. Swift: `MetalRegion`, `MetalTokens.<colorway>.region*`.
