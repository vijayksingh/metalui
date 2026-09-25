# Composition: the six layers

Everything in MetalUI sits in one of six layers. A layer may use itself and the layers above it in this list, never a later one, and tooling enforces that. All of it is Soft Hardware, so "it looks physical" never decides the layer; what the thing is to the person does.

```
Foundations → Parts → Components → Objects → Instruments → Places
values          pieces   controls      things     your hand      where things live
```

| Layer | What it is | The test |
|---|---|---|
| **Foundations** | Values and rules: colour, type, spacing, radius, elevation, materials, springs, transitions | A value, not a shape |
| **Parts** | The pieces cut from the materials: a well, a plate, a label, a glyph, an LED, a keycap | Has a look but no job; never used alone |
| **Components** | Controls with one job, the same in any app: a button, a select, tabs, a menu | You operate it to change something else |
| **Objects** | Things with a body that stand for a person's stuff: a folder, a card, a connector | You could hold it; it stays on the canvas |
| **Instruments** | What your hand uses and what the canvas draws while you work: the selection frame, the lasso, a cursor | Shows up only while you act; gone when you stop |
| **Places** | Where things live: a region, a lens, the past | Has area; holds objects; you go in or look through |

Two lines people cross:

- **Component or Object.** A control changes something else; an object is the thing. You don't put a button in a folder, and you don't press a card to change a setting.
- **Object or Instrument.** An object stays when you let go. A selection frame or a snap guide does not.

## 1. Foundations (data, not UI)

`tokens/tokens.json` holds everything that is a value:
- colorways;
- type roles;
- radii, space and heights;
- spring classes (`k`, `c`);
- recipes: layered fills, gradients, inset and outer shadow stacks, lips and per-state deltas.

The generators emit CSS custom properties and classes, and Swift `MetalTokens` / `MetalRecipes`. No UI code contains a value that doesn't come from here.

## 2. Where every part lives

| Layer | Members |
|---|---|
| **Parts** | Surface, Well, Glass face, Label, Glyph, Rule, LED, Keycap, Swatch, Chip, Mark, Row, Sparkline |
| **Components** | Status badge, Button, Icon button, Checkbox, Switch, Switcher, Tabs, Select, Slider, Field, Menu, Tooltip, Dialog, Toast, Toolbar, Command palette, Tool strip, Draw tools, Draw picks, Settings |
| **Objects** | Folder, Link card, Code card, Connector, Block silhouette (an object seen from far away) |
| **Instruments** | Selection frame, Snap guides, Lasso, Brush cursor, Line handles, Perfect preview, Size readout, Hover engraving, Provenance tooltip, Suggestion chip, the cue family |
| **Places** | Region, Lens (the lens bar), the past (Past banner, Time scrubber) |

A part can be **composed** (every visible piece is a member of an earlier layer, arranged) or **custom** (it needs drawing nothing earlier expresses, such as the selection frame's band and edge light). Custom parts still take every value from foundations, and their `meta.json` says why they are custom and what they still use.

## 3. Adding something new

1. Find its layer with the tests above. If two tests fit, the later layer wins only when the earlier one clearly fails.
2. If it needs a look no Part has, the look becomes a Part first.
3. Its `meta.json` names its `layer`; the docs nav and the layer check read it from there.

## 4. Rules

1. **Direction.** A layer imports itself and earlier layers only: Parts import foundations; Components import Parts; Objects import Components and Parts; Instruments and Places may use anything earlier. Foundations import nothing.
2. **Composable by slots.** Components and composed parts expose compound parts: React `Region.Root / Region.Header / Region.Rows`, and Swift `MetalRegion { header: … rows: … }` with `@ViewBuilder` slots. Apps rearrange parts; they don't fork files.
3. **One recipe per look.** When two things look alike, they share a recipe or a component. If something needs a look no Part has, the new look becomes a Part first. It stays inside only when it's genuinely one-off, and then it's marked `custom` with a reason in `meta.json`.
4. **Same shape on both platforms.** Everything exists in React and Swift with the same name (Swift adds the `Metal` prefix), the same slots, the same states and the same recipe. The recipe parity check and the pixel gate cover every layer.
5. **Neutral names.** No product words. Things are named for what they are, not for the app that first used them.
6. **Behaviour lives with the part.** Keys, focus, dismissal and accessibility labels are specified in each component's `<name>.agent.md`. A composed part's contract lists only what it adds.

## 5. Layout on disk

Today the code has two folders, `components/` and `blocks/`, and `meta.json` says `component` or `block`. The move to the six layers goes in steps, one at a time:

1. **This document** names the layers and places every part.
2. **`meta.json` `layer`** becomes one of `part`, `component`, `object`, `instrument`, `place` for every part, and the docs nav is generated from it instead of a hand-written list.
3. **`check:layers`** enforces rule 1 from `layer`, not from the folder.
4. **Folders** follow the layers, last:

```
packages/metalui/src/<layer>s/<name>/   <name>.tsx, .agent.md, meta.json { layer, kind: "composed" | "custom", uses: [...] }
swift/Sources/MetalUI/<Layer>s/         Metal<Name>.swift
apps/docs/src/pages/<layer>s/           one docs page per part
```

`@unlocalhosted/metalui` re-exports every layer; import paths do not change for apps.

## 6. Enforcement

- `check:layers`: the import graph obeys rule 1 (TS imports and Swift type references). A composed part's `meta.json` `uses` list must equal what it actually imports.
- `check:composition`: a composed part may not declare its own visual recipe or styles; everything it draws comes from earlier layers. A custom part must have `kind: "custom"` and a `reason`.
- `check:slots`: the React compound parts and the Swift slots match the names in `meta.json`.
- `lint:literals`, `check:recipes`, `lint:names` and the pixel gate run over every layer.
