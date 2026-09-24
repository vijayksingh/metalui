# Segmented control

A pill of pills: one of a few options, always visible. React: `Segmented` from `@unlocalhosted/metalui` (Base UI RadioGroup + Radio). SwiftUI: `MetalSegmented`. Sheet reference: KAMUI-04.

## Use it for

- Two to five mutually exclusive views or modes that are switched often: a lens's view (place · list · table · timeline · gallery), a colorway, a scale.

## Don't use it for

- More than five options, or options that need explaining. Use a select or a menu.
- Navigation between pages (use tabs or links) or on/off (use a switch).
- Actions. Each segment is a state, not a command.

## Anatomy

- **Track**: a pill well (`well-top → well-bot`, `well`), padding 3.
- **Segments**: 28 tall (regular) or 24 (compact, in a lens bar or strip), padded by the pill rule `h/2 − 1`, the `ui` role in ink2; an optional leading glyph at the control's icon size.
- **Thumb**: a raised cap (`thumb-hi → thumb-lo`, `raise-sm`) under the selected segment, which reads in ink.

## States and motion

| State | Look | Motion |
|---|---|---|
| rest | ink2 labels, the thumb under the selection | – |
| hover | the label turns ink | settle |
| selected | the thumb glides to it | part spring (a track with ends: may overshoot against the stop) |
| focus | a 1.5 ring with no offset | – |
| disabled | 40 % | – |

First paint and resizes place the thumb without motion. Reduce Motion: the thumb moves at once; labels still recolour.

## API

| React | SwiftUI | Notes |
|---|---|---|
| `options` | `options:` | `{ value, label, icon?, disabled? }` |
| `value` / `defaultValue` / `onValueChange` | `selection:` (Binding) | |
| `size` | `size:` | `compact` (24), `regular` (28) |
| `aria-label` | `label:` | required |

```tsx
<Segmented aria-label="View" size="compact" value={mode} onValueChange={setMode}
  options={[{ value: 'place', label: 'place' }, { value: 'list', label: 'list' }, { value: 'table', label: 'table' }]} />
```

## Rules

- Two to five options, short labels, one word each where possible.
- The selection is the thumb, never a colour.
- A segment switches a view instantly; if the change is slow, show progress in the view, not in the control.

## Accessibility

- Base UI RadioGroup: one tab stop, arrows move and select, Space selects; each segment is a radio with its label.
- Give the group an `aria-label` that names what it switches.

## Tokens

`--mu-segmented-*`, `--mu-well*`, `--mu-thumb-hi`, `--mu-thumb-lo`, `--mu-raise-sm`, `--mu-spring-part`, `--mu-spring-settle`. Swift: `MetalSegmentedMetrics`.
