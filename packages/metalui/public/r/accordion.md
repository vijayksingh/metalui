# Accordion

Sections that open in place. React: `Accordion` from `@unlocalhosted/metalui`, on Base UI Accordion. SwiftUI: `MetalAccordion` (work in progress). Headers use the `row` recipe's panel hover and sections are parted by the `rule` recipe; the `accordion` recipe adds the sizes and the motion.

## Use it for

- Secondary detail that most people skip: advanced settings, a FAQ, a long inspector split into sections.

## Don't use it for

- Content everyone needs (show it), switching between peers (use tabs), or a single show/hide (one item is fine, but keep it short).

## Anatomy

- Item: one section; engraved rules between items, inset to the text.
- Trigger: a row 40 tall, padding 12, radius 12, ui type; the chevron (12, ink2) at the end.
- Panel: the content, body type, ink2, padding 12 at the sides and 14 below.

## States and motion

| State | Look | Motion |
|---|---|---|
| closed | the header row, shared chevron pointing right | – |
| hover | the row lifts (row panel hover) | the row's own fade |
| opening | the panel grows to its content; content fades in | settle spring, no overshoot |
| open | shared chevron points down | quarter-turn morph on the settle spring |
| closing | height and content leave | release spring; shared chevron morphs back on settle |
| focus | the green ring on the header | – |
| disabled | 40 % | – |

Reduce Motion: the height snaps, the content crossfades, the shared glyph changes in place. React uses `MorphIcon`; SwiftUI uses `MetalMorphIcon(.chevron, turn:)` on the same shared planner and settle class. No separate SVG or CSS rotation. SwiftUI panel/header material remains work in progress.

## API

| React | SwiftUI |
|---|---|
| `Accordion.Root` `value`, `defaultValue`, `onValueChange`, `multiple` | `expanded:` |
| `Accordion.Item` `value`, `disabled` | `section:` |
| `Accordion.Trigger` (children: the title) | `title:` |
| `Accordion.Panel` (children: the content) | `content:` |

## Keyboard and accessibility

- Each header is a button in a heading; Enter or Space opens and closes it; Tab moves between headers (arrow keys between headers are optional in the pattern and not provided).
- The button has `aria-expanded` and controls its panel.

## Rules

- Title each section with what is inside ("Export options"), not "More".
- `multiple` when sections are independent; one at a time when they are alternatives.
