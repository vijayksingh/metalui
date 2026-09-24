# Composition: foundations, components, blocks

MetalUI has four layers. Each layer may use only the layers below it, and tooling enforces that. The aim is that anything you can see is either a primitive or a composition of primitives. The only exception is a block that is honestly custom.

```
foundations  →  components  →  blocks  →  (apps)
tokens,          primitives      compositions
recipes,         one job each    and custom objects
springs, type    composable      built from components
```

## 1. Foundations (data, not UI)

`tokens/tokens.json` holds everything that is a value:
- colorways;
- type roles;
- radii, space and heights;
- spring classes (`k`, `c`);
- recipes: layered fills, gradients, inset and outer shadow stacks, lips and per-state deltas.

The generators emit CSS custom properties and classes, and Swift `MetalTokens` / `MetalRecipes`. No UI code contains a value that doesn't come from here.

## 2. Components: primitives

A component does one job, and it knows nothing about a product domain. It is styled only through foundations. Where a component has visual parts, it exposes them as **slots** (compound parts) rather than as a pile of props. Components compose freely with each other.

| Component | Job | Built on |
|---|---|---|
| `Surface` | A raised plate or card, from a material recipe (raise, raise-sm, frost, frost-strong, glass) | recipes |
| `Well` | A sunk field or track | recipes |
| `Button`, `IconButton` | Pressable caps: standard, primary, destructive; regular and compact | recipes, springs |
| `Toggle`, `Switch` | Latching caps and thumbs | Base UI |
| `Segmented` | A pill of pills with a sliding thumb | Base UI RadioGroup |
| `Slider` | A track, a knob and ticks (knurled or plain) | Base UI Slider |
| `Checkbox` | The dimple checkbox (open, done, doing, ghost) | Base UI Checkbox |
| `Field`, `SearchField` | Text input in a well, with leading glyph and trailing keycaps | Base UI Input |
| `Kbd` | A keycap | recipes |
| `Led`, `StatusBadge` | Light plus engraved label | recipes |
| `Label` | Engraved mono label (the `label` role, with a lip) | type |
| `Mark` | Inline, metric-neutral text marks: underline (dotted, solid), tag pill, hex dot, URL pill | type, recipes |
| `Chip` | A small pill with an optional leading LED or glyph and a trailing action | recipes |
| `Tooltip`, `Popover`, `Menu`, `Dialog` | Floating layers | Base UI |
| `Toast` | A transient notice with an optional action | recipes, springs |
| `Rule` | An engraved groove | recipes |
| `Icon`, `LifeIcon` | Glyphs | icon sets |
| `Sparkline` | A small series plot: line, dots, emphasised endpoint | tokens |

## 3. Blocks: compositions and custom objects

A block is what a person recognises as a thing: a palette, a region, a swatch card. Most blocks are **pure compositions**: every visible part is a component, arranged. A few are **custom**, meaning they need drawing no component expresses, such as the selection frame's band, handles and edge light. Custom blocks still take every value from foundations. They also document why they're custom and which components they still use.

| Block | Kind | Composition |
|---|---|---|
| `CommandPalette` | composition | Dialog › Surface(frost-strong) › SearchField + list rows (Label sections, Kbd hints) + footer of Kbd |
| `Toolbar` (dock) | composition | Surface(glass or graphite) › IconButton × n + Rule + SearchField |
| `FilterBar` (the lens bar) | composition | Surface(frost-strong) › Icon + Field + Segmented + IconButton × 2 |
| `TimeScrubber` | composition | Label readout + Slider(knurled, ticks) + Button("now") |
| `PastBanner` | composition | Surface(graphite pill) › Label + Button |
| `ToolStrip` | composition | Surface(graphite) › IconButton × n with Tooltip |
| `Region` | composition | Surface(well recipe) › header (Label name, Label rule, count) + rows (Checkbox + text + Mark) |
| `SuggestionChip` | composition | Chip + Button(accept) + IconButton(dismiss) |
| `HoverEngraving` | composition | Label parts + Led + Mark |
| `ProvenanceTooltip` | composition | Tooltip › Label + text |
| `SwatchCard` | custom (object face) | swatch recipe + Label(hex) + Led dimple |
| `LinkCard`, `CodeCard` | custom (glass face) | glass-face recipe + Label + Chip + (code: highlighted text) |
| `SelectionFrame` | custom (band, handles, edge light, readout) | uses Kbd-style readout, Label |
| `SizeReadout` | component (the selection frame block uses it, and blocks never import blocks) | Surface(graphite-deep) › Led + Label(readout) + Label(readout-dim) |
| `MePanel` | composition | Surface › Label rows + Sparkline × n |
| `EmptyState` | composition | Surface › Icon + text + Chip × 2 |

## 4. Rules

1. **Direction.** Blocks may import components and foundations. Components may import foundations and other components. Components never import blocks. Foundations import nothing.
2. **Composable by slots.** Components and composed blocks expose compound parts: React `Region.Root / Region.Header / Region.Rows`, and Swift `MetalRegion { header: … rows: … }` with `@ViewBuilder` slots. Apps rearrange parts; they don't fork files.
3. **One recipe per look.** When two things look alike, they share a recipe or a component. If a block needs a look no component has, the new look becomes a component first. It stays inside the block only when it's genuinely one-off, and then it's marked `custom` with a reason in `meta.json`.
4. **Same shape on both platforms.** Every component and block exists in React and Swift with the same name (Swift adds the `Metal` prefix), the same slots, the same states and the same recipe. The recipe parity check and the pixel gate cover blocks as well as components.
5. **Neutral names.** No product words. Blocks are named for what they are, not for the app that first used them.
6. **Behaviour lives with the part.** Keys, focus, dismissal and accessibility labels are specified in each component's `<name>.agent.md`. A block's contract lists only what it adds.

## 5. Layout on disk

```
packages/metalui/src/components/<name>/   primitives: <name>.tsx, .css, .agent.md, meta.json { layer: "component" }
packages/metalui/src/blocks/<name>/       blocks:     same files, meta.json { layer: "block", kind: "composition" | "custom", uses: [...] }
swift/Sources/MetalUI/Components/         Metal<Name>.swift for primitives
swift/Sources/MetalUI/Blocks/             Metal<Name>.swift for blocks
apps/docs/src/pages/components/, blocks/  docs, separated the same way
```

Exports: `@unlocalhosted/metalui` re-exports both. `@unlocalhosted/metalui/blocks` is available for tree-shaking.

## 6. Enforcement (to add to `npm run check`)

- `check:layers`: the import graph obeys rule 1 (TS imports and Swift type references by folder). A block's `meta.json` `uses` list must equal the components it actually imports.
- `check:composition`: a composition block may not declare its own visual recipe or styles. Everything it draws comes from components. A custom block must have `kind: "custom"` and a `reason`.
- `check:slots`: the React compound parts and the Swift slots match the names in `meta.json`.
- Existing checks: `lint:literals`, `check:recipes`, `lint:names` and the pixel gate all run over blocks too.
