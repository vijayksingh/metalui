# Chip

A small pill. React: `Chip` with parts `Chip.Root`, `Chip.Lead`, `Chip.Text`, `Chip.Actions`. SwiftUI: `MetalChip { lead: … text: … actions: … }`.

## Variants

- `suggestion`: 20 tall, frosted, a green hairline and a small raise; a question in `Chip.Text`, a confidence `Label`, and `IconButton variant="mini"` actions (✓ accept, × dismiss).
- `glass`: an 18 tall dark tag on a glass screen, backdrop-blurred; `Chip.Lead led="link" | "code"` for its LED.
- `glass-action`: an 18 tall light cap on glass (`as="a"` for a link out), brighter on hover.
- `tag`: a 15 tall engraved mono tag in a hairline pill (a derived #tag); no fill.

## Behaviour

- The chip itself is not a control; its actions are. A `glass-action` rendered `as="a"` is a link: give it `href`, `target="_blank"` and `rel="noopener noreferrer"`.
