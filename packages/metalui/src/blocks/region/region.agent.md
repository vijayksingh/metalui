# Region

A drawn rectangle with a name that carries a rule. A composition block. React: `Region` (with parts `Region.Root`, `Region.Header`, `Region.Name`, `Region.Rule`, `Region.Count`, `Region.Body`, `Region.Row`) and `RegionRow` from `@unlocalhosted/metalui`. SwiftUI: `MetalRegion { header: … rows: … }` and `MetalRegionRow`.

## Use it for

- Arrangement that means something: `Done` ticks what lands, `To do` and `Doing` make tasks or reopen them, `This week`, `friday` or `tomorrow` date what lands, any other name tags what lands.
- Kanban (three adjacent regions), a pipeline (N in a row), an inbox (a pinned lens that makes tasks).
- A pinned lens: a live query kept on the canvas as a frosted plate of rows (`lens`).

## Don't use it for

- Grouping chrome, cards in a settings page or a list. It is a canvas object.
- A container that owns its blocks: blocks sit in it by position only, and dragging them out undoes the rule unless the rule says otherwise.

## Anatomy

- **Root**: `Well variant="region"` (a sunk rectangle, radius 26; `over` lights it green with a 1 pt ring), or `Surface material="lens"` for a pinned lens (a frosted plate, blur 10).
- **Header**, 44 tall (padding 14 / 18, grab cursor, baseline-aligned, gap 10): **Name** `Label variant="title"` (empty: "name this region" in ink3; a field while renaming), **Rule** `Label variant="engraved"` (`marks tasks done`; `tone="accent"` while over), **Count** `Label variant="count"`.
- **Body** (lens only): inset 12, 46 from the top, holding **Row**s: `Row variant="list"` with a `Checkbox size="row"` lead, the text, and the day as an engraving at the right.

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
| parts: `Region.Root` … `Region.Row` | `header:`, `rows:` | rearrange without forking |
| `renaming`, `onRename`, `onRenameCancel` | `renaming:`, `onRename:` | |
| `width`, `height` | (its frame) | picks the radius |

```tsx
<Region name="Done" rule="marks tasks done" dropRule="drop to mark tasks done" count={3} over={dragOver === 'done'} width={320} height={260} />
<Region name="open tasks" rule="lens · live" lens width={300} height={220}>
  <RegionRow lead={<Checkbox size="row" aria-label="Send the poster" />} meta="FRI">Send the poster</RegionRow>
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

Layout: `--mu-region-*` (head, body, the name's minimum, dim). Look: the well, surface, label and row recipes. Swift: `MetalRegion`.
