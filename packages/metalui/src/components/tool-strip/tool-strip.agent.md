# Tool strip

Verbs over a selection. React: `ToolStrip` from `@unlocalhosted/metalui` (Base UI Toolbar). SwiftUI: `MetalToolStrip`. Kamui brief: 04 §11, 03 §11.

## Use it for

- A click selection on the canvas: **Tasks** (adds `[ ]`), **Summarise** (counts, next dated task, totals, tags), **Gather** (a lens of the selection), **Region** (wraps it), **Export** (copies Markdown), **Send away** (with Undo).

## Don't use it for

- A selection made by finishing (⎋, ⌘↩): that selection is quiet.
- While dragging, resizing, in the past, or with the palette open.
- App-level tools (select, write, region, ink). Those are the toolbar.

## Anatomy

A graphite frosted strip (the graphite frost recipe), padding 4, radius 18 (`plate`), floating 12 above the selection's top centre; buttons 28 tall, radius 12 (`row`), padding 10, the `ui` role in `#D6D6D8`; an engraved separator (1 × 16, dark with a light lip) before the destructive verb in `#FF8A7E`.

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
