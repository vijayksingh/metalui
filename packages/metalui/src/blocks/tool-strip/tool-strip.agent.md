# Tool strip

Verbs over a selection. A composition block on Base UI Toolbar. React: `ToolStrip` from `@unlocalhosted/metalui`. SwiftUI: `MetalToolStrip`.

## Use it for

- A click selection on the canvas: **Tasks** (adds `[ ]`), **Summarise** (counts, next dated task, totals, tags), **Gather** (a lens of the selection), **Region** (wraps it), **Export** (copies Markdown), **Send away** (with Undo).

## Don't use it for

- A selection made by finishing (⎋, ⌘↩): that selection is quiet.
- While dragging, resizing, in the past, or with the palette open.
- App-level tools (select, write, region, ink). Those are the toolbar.

## Anatomy

`Surface material="graphite-strip" radius="strip"` (16), padding 4, gap 2, floating 12 above the selection's top centre; `Button cap="strip"` verbs (28 tall, radius 11, padding 10, 12 pt in `#D6D6D8`); a `Rule tone="graphite"` 16 tall before the destructive verb, `Button cap="strip-danger"` in `#FF8A7E`.

## States and motion

| State | Look | Motion |
|---|---|---|
| appears (click selection) | the strip | rises 4 on part (instant under Reduce Motion) |
| button hover | `rgba(255,255,255,.08)`, white | settle |
| button pressed | down 1 on `rgba(0,0,0,.35)` | 50 ms, back on release |
| disabled | 40 % | – |

## API

| React | SwiftUI |
|---|---|
| `items: { label, onSelect, destructive?, disabled?, shortcut? }[]` | `items: [MetalToolStripItem]` |
| `label` (what they act on) | `label:` |

## Rules

- Verbs compose, and never own the data before or after.
- Every verb confirms with a toast that says what happened and offers Undo ("Made 3 tasks", "Sent away 3 blocks").
- One destructive verb, last, after the separator. Canvas delete is send away (DS-33).

## Accessibility

- A Base UI toolbar named "Tools for 3 blocks": one tab stop, arrows between verbs; destructive is named, not only coloured.

## Tokens

`--mu-toolstrip-*`, `.mu-frost-graphite`, `--mu-radius-plate`, `--mu-radius-row`, `--mu-spring-part`, `--mu-travel-part`. Swift: `MetalToolStripMetrics`.
