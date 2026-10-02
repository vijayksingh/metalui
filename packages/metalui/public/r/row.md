# Row

A row in a list. React: `Row` with parts `Row.Root`, `Row.Lead`, `Row.Text`, `Row.Trail`. SwiftUI: `MetalRow { lead: … text: … trail: … }`.

## Variants

- `list`: a compact row of a pinned query: 5 / 8 padding, radius 12, 13 pt; hover and focus raise it.
- `panel`: a row of a gathered panel: 8 / 12 padding, radius 14, 14 pt; hover and focus raise it.
- `option`: a palette row, 36 tall, radius 12; the active row (`active`, or Base UI's `data-highlighted`) raises with a 2.5 green rail at its left edge.

## States

- `selected`: persistent shared selected plate in every variant; independent of focus/highlight and task completion. `opened`: leading rail for the row whose detail is open; either state can coexist.
- `checked`: `Row.Text` is struck through in ink3. `maybe`: a weak match at 55 %.

## Keyboard and accessibility

- With `role="row"`, `option`, `treeitem` or `tab`, `selected` supplies `aria-selected`; an explicit host attribute wins. Other roles receive appearance only. Hosts own the open-detail relationship (`aria-controls`, `aria-expanded` where appropriate). Swift marks selection and exposes an opened hint.
- The host gives the row its role (`listitem`, `option`, `row`) and makes it focusable when it acts; focus shows the same raise as hover.
