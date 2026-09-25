# MetalUI: agent integration guide

MetalUI is a set of Soft Hardware components: bone and graphite soft-touch plastic, smoked glass, knurled metal, LEDs, and press-in mechanics. Each component exists as React on Base UI (`@unlocalhosted/metalui`) and as SwiftUI (the `MetalUI` Swift package), and the two render the same material recipes.

## Setup

React:

```sh
npm install @unlocalhosted/metalui
```

```tsx
import '@unlocalhosted/metalui/styles.css'; // once, at the app root
import '@unlocalhosted/metalui/icons.css';  // once, if you use icons
```

Or copy the source into your project with the shadcn CLI: `npx shadcn@latest add https://metalui.dev/r/<name>.json`.

SwiftUI: add the package `https://github.com/vijayksingh/metalui` and `import MetalUI`. It needs macOS 14 or iOS 17.

## Global rules

- **Colorway:** set `data-mu-colorway="bone" | "graphite"` on any ancestor, or use `.metalColorway(.bone)` in SwiftUI. Without it, the system color scheme decides. Don't restyle materials with custom backgrounds, borders or shadows.
- **Signal color:** one per object, at most. Phosphor green marks intent (focus, selection, live state), never a call to action. Red is destructive only. `--mu-success` always sits beside a check glyph and `--mu-warning` beside a label or glyph, never hue alone. `--mu-photon` is for its listed places only. Status LEDs: green on, amber waiting, red failed, blue capture or link kind, off idle.
- **Feelings tints** (`.mu-tint-ember | blush | tide | spark | graphite | dusk | iris`, SwiftUI `.metalTint(.blush)`): only on glyphs that carry a feeling, or a moment with an unmistakable one (a date is affection, a party is joy). The tint names the kind of feeling (joy, affection, calm, wonder, neutral, low, tension), never its strength, which the glyph's shape shows. The tint colors the glyph's stroke, so the line itself evokes the feeling; a tinted glyph's vessel is not filled. Never red or green, never on words, never for status or intent. Off under Increase Contrast and inside `data-mu-untinted` (`.metalUntinted()`), so the glyph must read without it.
- **Motion:** it comes from the component, and reduced motion is built in. Don't add your own transitions on top. Under Reduce Motion each spring class resolves one way (`tokens.json` `springs.*.reduced`): part, object, hinge and refusal apply at once; surface and settle lose travel and fade in place; release (the press) plays as authored. Lift is two motions (T5): a hover lift rides `settle` (one step, no overshoot, still by the time the pointer leaves); a land (a drop into place) rides `object`, a stop, and rare. Web: ride `--mu-spring-<class>-d` and multiply enter or exit offsets by `--mu-travel-<class>`; `data-mu-motion="reduce"` on any ancestor forces the policy. SwiftUI: `.metalAnimation(.settle, value:)` or `MetalMotion.resolve(_:reduceMotion:)`, never `accessibilityReduceMotion` directly.
- **Choose by component name.** Only use exports listed in `components.json` and `icons.json`. Never invent names.
- **Show real outcomes.** An animation never stands in for a real result such as a save, delete or sync.

## Components

# Block silhouette

A block seen from far away. React: `BlockSilhouette` from `@unlocalhosted/metalui`. SwiftUI: `MetalBlockSilhouette`. Its look is the `silhouette` recipe.

## Use it for

- Every block on the canvas when the zoom is below the far-zoom threshold (the core's `lod_policy`, 0.35). The canvas swaps blocks for silhouettes on the camera commit, never in the middle of a gesture.

## Don't use it for

- Loading placeholders or skeletons. A silhouette is a real block, seen from far.

## Anatomy, per kind

| Kind | Silhouette |
|---|---|
| text | bars where its lines are (8 tall every 22), no plate; `lines` ends them after the last line |
| code | the dark code card with light bars (7 every 20) inside, 12 padding |
| link | the dark glass with the site's tint (`color`) glowing from the top right |
| swatch | its colour (`color`) |
| image | its average colour (`color`), lit a little from the top |
| file | a light plate |
| region | its tray and its name (`label`) at 56 pt, so it reads at 35 % |

No text other than a region's name, no shadows beyond a hairline: it must stay cheap for thousands of blocks.

## States and motion

| State | Look |
|---|---|
| enter | fades in over 160 ms on settle as the zoom crosses the threshold; Reduce Motion: at once |

## API

| React | SwiftUI |
|---|---|
| `kind` | `kind:` |
| `color` | `color:` |
| `label` | `label:` |
| `lines` | `lines:` |

## Rules

- The silhouette sits exactly where its block is and is exactly its size.
- Swap at the camera commit, never during a pinch or a pan.
- Both clients use the same threshold from the core, so a shared canvas looks the same to everyone.

---

# Brush cursor

The pointer while drawing (P) or erasing (E) on the canvas. React: `BrushCursor` from `@unlocalhosted/metalui`. SwiftUI: `MetalBrushCursor` (on the Mac, an `NSCursor` image drawn from the same values). Its look is the `brush` recipe.

## Use it for

- The draw and erase tools, over the canvas only. Hide the system cursor there (`cursor: none`) and pass the pointer position.

## Anatomy

- Pen: a disc in the ink colour, diameter = stroke width × zoom (× pressure while drawing), never under `brush.min` (6); a 0.5 light ring and a 0.5 dark edge so it reads on any ink and on both colorways.
- Eraser: a dashed ring (1 pt, 3 / 2) of the eraser's diameter; dark on Bone, light on Graphite.

## States and motion

| State | Look |
|---|---|
| hover | follows the pointer in the same frame |
| drawing | the disc's size follows pressure at once |
| off the canvas | hidden (`at = null`); the system cursor returns |

No easing: the brush shows the stroke you are about to make.

## API

| React | SwiftUI |
|---|---|
| `mode` (`pen`, `eraser`) | `mode:` |
| `at` | the cursor's position |
| `size` | `size:` |
| `color` | `color:` |

## Rules

- The brush is the stroke's true size on screen, always.
- The eraser ring is the area it removes.

---

# Button

A press-in pill button. React: `Button` from `@unlocalhosted/metalui`, built on Base UI `Button`. SwiftUI: `MetalButton`, or `.buttonStyle(MetalButtonStyle(cap:))`.

## Use it for

- An action that happens right away when the user activates it: Save, New Canvas, Cancel, Delete, Export.
- A dialog footer, form submit, or row action that needs a visible, labelled control.

## Don't use it for

- Navigation to another page. Use a link.
- On/off or latched tool state. Use `Toggle` / `ToolButton`, which carry the pressed state and LED.
- Icon-only toolbar controls. Use `ToolButton` inside `Toolbar`.

## Anatomy

- The **cap** is a 32px-tall pill: 15px horizontal padding, Geist 12.5 medium (the `ui` type role), tracking −0.005em.
- The **label** is text, optionally with a leading MetalUI icon at 16px and a 6px gap.
- **Compact** (`size="compact"`): 26 tall, 11 padding, 12 pt, a 14 glyph 7 before the label, the button fill on `raise-sm`, ink2 until hover. The canvas pills: "seed a sample day", "lenses ⌘K", a lens row's "Open".
- The **press** moves the cap down 1px (50 ms, linear), and its shadow collapses into an inner well. The release rides the `release` spring (stiffness 500, damping 40; half 71ms, near-settled 178ms). Shadows and fills cross-fade over 180ms.

## Caps that set their own size

- `link`: a mono word in green, 9 pt, tracked 0.1em, no cap and no press (READ ALL beside a readout).
- `graphite`: a 24 tall quiet light cap on graphite chrome (a banner's Back to now).
- `strip` / `strip-danger`: a 28 tall flat cap (radius 11) in a graphite tool strip; lights on hover, sinks into a dark well on press; focus is a 1.5 green ring. `strip-danger` is red.

## API

| React prop | SwiftUI | Values | Default |
|---|---|---|---|
| `cap` | `cap:` | `standard`, `primary`, `destructive`, `link`, `graphite`, `strip`, `strip-danger` | `standard` |
| `size` | `size:` | `default` (32), `compact` (26); ignored by the link, graphite and strip caps | `default` |
| `disabled` | `.disabled(_:)` | boolean | `false` |
| `focusableWhenDisabled` | – | boolean | `false` |
| `render` | – | Base UI render prop, for `<a>` or custom elements (set `nativeButton={false}`) | – |
| any `<button>` attribute | – | `type`, `onClick`, `aria-*` | – |

```tsx
import { Button } from '@unlocalhosted/metalui';
import { SendAwayIcon } from '@unlocalhosted/metalui/icons';
import '@unlocalhosted/metalui/styles.css';

<Button cap="primary" onClick={create}>New Canvas</Button>
<Button onClick={close}>Cancel</Button>
<Button size="compact" onClick={seed}>seed a sample day</Button>
<Button cap="destructive" onClick={remove}><SendAwayIcon size={16} />Delete</Button>
```

```swift
import MetalUI

MetalButton("New Canvas", cap: .primary) { create() }
MetalButton("Cancel") { close() }
MetalButton("seed a sample day", size: .compact) { seed() }
MetalButton("Delete", cap: .destructive) { remove() }
```

## Rules

- Use at most **one** `primary` or `destructive` cap per group. Everything else is `standard`.
- `destructive` is only for actions that remove or discard data. Pair it with confirmation when the action can't be undone.
- The label is a verb, or a verb + object, in title case. The button text itself says what happens.
- Put icons **before** the label, at `size={16}`. An icon inside a Button plays its hover pose and press motion from the whole button (the button is the icon's trigger), so don't wire up animation yourself.
- Don't restyle the cap with custom backgrounds, borders, or shadows. Colorway comes from `data-mu-colorway` (`bone` | `graphite`) on any ancestor. When no ancestor sets it, `prefers-color-scheme` decides.
- Don't signal success with the press motion. Show the real result: a toast, a state change, or an error.
- **A label that changes in place must morph, never snap** (Transitions T1–T3). Wrap it in `SwapText` and the icon in `SwapIcon` (both from `@unlocalhosted/metalui`): the button's face turns one step on a drum: old and new labels and icons overlap with a small defocus (no blank frame), and the width settles to the new label. If the icon changes too, use `MorphIcon` from `@unlocalhosted/metalui/icons` with the next icon's name: any icon in the set morphs into any other instead of swapping. Example: `<Button><MorphIcon name={copied ? 'check' : 'paste'} size={14} /><SwapText value={copied ? 'Copied' : 'Copy'} /></Button>`.

## Accessibility

- It renders a native `<button>`. Enter and Space activate it, and it takes part in form submission. Base UI handles the disabled state and `focusableWhenDisabled`.
- The focus ring is a 2px `--mu-focus` outline at a 2px offset, shown only for keyboard focus (`:focus-visible`).
- An icon-only Button needs `aria-label`. Icons inside labelled buttons are decorative (`aria-hidden`).
- Disabled buttons render at 40% opacity and don't play their icon motion.
- Under reduced motion, transitions are instant. The 1px press travel stays, because it is feedback, not decoration.

## Tokens

`--mu-button-*` (sizes, press, fade, focus), `--mu-raise-sm` (compact), `--mu-btn-bg`, `--mu-btn-sh`, `--mu-pressed-bg`, `--mu-pressed-sh`, `--mu-primary-*`, `--mu-destructive-*`, `--mu-spring-release`, `--mu-focus`. Swift: `MetalButtonMetrics`, `MetalTokens.<colorway>.btnBg/btnSh/pressedBg/pressedSh`, `MetalCaps.primary/destructive`, `MetalSprings.release`.

---

# Checkbox

The dimple checkbox. React: `Checkbox` (earlier `Dimple`) from `@unlocalhosted/metalui`, on Base UI Checkbox. SwiftUI: `MetalCheckbox` (earlier `MetalDimple`).

## Use it for

- A task's checkbox in the margin of a line of text; a row's checkbox in a list of tasks.
- `ghost`: a task that was inferred, not written (a hollow ring hanging in the margin).
- `doing`: in progress (a half-filled green square, announced as mixed).

## States and motion

| State | Look | Motion |
|---|---|---|
| rest | a recessed well, 16, radius 6 | – |
| hover | the well darkens a step | 160 ms |
| checked | a dark pressed key; the white tick draws on | the tick: 220 ms ease-out after a 40 ms beat (not sprung); instant under Reduce Motion |
| doing | a half-filled green square inside the well | – |
| ghost | a hollow 14 ring, radius 5; hover: a green ring | 160 ms |
| row (`size="row"`) | 14, radius 5, a smaller tick; in flow at the start of a list row | as above |
| disabled | 40 % | – |

## Keyboard and accessibility

- Space toggles; the focus ring is the 2 pt green ring at offset 2.
- Give it an accessible name (`aria-label`: the task's text). `doing` announces as mixed.
- Ticking is a person's action: the host writes the change and offers Undo.

---

# Chip

A small pill. React: `Chip` with parts `Chip.Root`, `Chip.Lead`, `Chip.Text`, `Chip.Actions`. SwiftUI: `MetalChip { lead: … text: … actions: … }`.

## Variants

- `suggestion`: 20 tall, frosted, a green hairline and a small raise; a question in `Chip.Text`, a confidence `Label`, and `IconButton variant="mini"` actions (✓ accept, × dismiss).
- `glass`: an 18 tall dark tag on a glass screen, backdrop-blurred; `Chip.Lead led="link" | "code"` for its LED.
- `glass-action`: an 18 tall light cap on glass (`as="a"` for a link out), brighter on hover.
- `tag`: a 15 tall engraved mono tag in a hairline pill (a derived #tag); no fill.

## Behaviour

- The chip itself is not a control; its actions are. A `glass-action` rendered `as="a"` is a link: give it `href`, `target="_blank"` and `rel="noopener noreferrer"`.

---

# Code card

Code as a glass object. A custom block: `GlassFace` with a dark screen of numbered, tinted lines and a `Chip` tag. React: `CodeCard` (and `tintCode`) from `@unlocalhosted/metalui`. SwiftUI: `MetalCodeCard`.

## Use it for

- A fenced block of code placed on a canvas: `● CODE · SWIFT · 6 LINES` over the lines.

## Don't use it for

- Inline code in prose, or an editor. It shows code; it does not edit it.

## Anatomy

260 to 460 wide: `GlassFace` (bezel 6, radius 22; screen radius 16 with its glare). The screen pads 30 / 14 / 12 over a radial of `#26282C` into `#0F1011`. `Chip variant="glass"` with a code `Led` at 10 / 10. The code is 11 mono at 1.62, tracked -.01em, `#D7D8DB`; numbers 18 wide in `#48494E`; keywords `#E7A6D9`, types `#E7C98A`, strings `#9FE3BF`, comments `#6D6E73`, numbers `#9EC2FF`. At most 18 lines show; the tag counts all.

## Why custom

The tinted code is drawn by no component. The bezel, glare and tag are `GlassFace` and `Chip`.

## API

| React | SwiftUI | Notes |
|---|---|---|
| `code` | `code:` | |
| `lang` | `lang:` | in the tag, uppercase |
| `maxLines` | `maxLines:` | default 18 |
| `tag` | `tag:` | the host's words; default CODE · LANG · N LINES |

`tintCode(code, maxLines)` returns the escaped, tinted HTML the card renders.

## Tokens

The code-card recipe (screen, code, tint, chip inset), the glass-face and chip recipes.

## Diff fences

A fence tagged `diff` tints whole lines: added lines a faint green band with a green `+`, removed lines a faint red band with a red `-`, context lines plain; `+++` and `---` headers are context. Pass the core's classes (`diff`, one per line, from the fence's `classes`) so both clients tint the same lines; without them the card classes the lines the core's way.

---

# Command palette

⌘K: lenses and actions in one field. React: `CommandPalette` from `@unlocalhosted/metalui` (Base UI Dialog around an inline Base UI Combobox). SwiftUI: `MetalCommandPalette` with `MetalCommandPaletteItem`. Sheet reference: the object sheet; 

## Use it for

- Asking the canvas a question (a lens: "open tasks", "#poster", "this week"), jumping to a block, and running any command by name.
- The one place every action with a key is discoverable: show its key on the row.

## Don't use it for

- Picking a value in a form (use a select or combobox field).
- Confirming a destructive action: the palette runs it; the result carries Undo in a toast.

## Anatomy

- **Scrim**: the page at .25 behind; a click on it closes.
- **Plate**: 560 wide (to 32 short of the window), the plate frost (`.mu-frost-plate`, raise), radius 24, padding 6, 16 % down the window.
- **Field**: a 44 well, radius 17, a 15 search glyph in ink3, the query in the content role (15) with a green-deep caret, a `⎋` keycap at the right.
- **Section**: a label engraving and its count: LENS, LENSES, BLOCKS, ACTIONS.
- **Row**: 36 tall at the row radius (12), the ui role, a 14 glyph in ink2, the label (matches weight 650 with a 1.5 green underline), a keycap or a readout engraving at the right. Destructive rows are red.
- **Selected row**: a raised cap (`--mu-row-on-bg`, `raise-sm`) with a 2.5 green-deep bar at the left.
- **Footer**: `↑ ↓ MOVE · ↩ OPEN · ⇧↩ PIN` in keycaps and engravings over an engraved rule; where answers come from at the right ("NATURAL LANGUAGE VIA SYNC" or "SYNC OFFLINE · KEYWORDS ONLY").

## States and motion

| State | Look | Motion |
|---|---|---|
| opens | plate over the scrim, focus in the field | rises one nest (y −6, .985) on surface; Reduce Motion: fades |
| typing | rows refilter; the first row is selected | instant |
| ↑ ↓ / hover | the selection moves (hover moves it too) | instant |
| ↩ | runs the selected row, closes | closes on release |
| ⇧↩ | runs it pinned (a lens kept as a region) | – |
| ⎋ / scrim | closes, nothing runs | release |
| empty | "Nothing matches" in ink3 | – |

## API

```tsx
const [open, setOpen] = useState(false);
const [q, setQ] = useState('');
const rows: CommandPaletteItem[] = [
  ...(q ? [{ id: 'lens:' + q, section: 'LENS', label: `See “${q}”`, icon: <SearchIcon size={14} />, hint: 'RULES' }] : []),
  { id: 'open-tasks', section: 'LENSES', label: 'open tasks', icon: <TaskIcon size={14} /> },
  { id: 'undo', section: 'ACTIONS', label: 'Undo', icon: <UndoIcon size={14} />, hint: <Kbd size="small">⌘Z</Kbd> },
  { id: 'clear', section: 'ACTIONS', label: 'Clear Canvas', icon: <TrashIcon size={14} />, danger: true },
];
<CommandPalette open={open} onOpenChange={setOpen} query={q} onQueryChange={setQ} items={rows}
  icon={<SearchIcon size={15} />} status="NATURAL LANGUAGE VIA SYNC"
  onRun={(item, { pin }) => run(item.id, pin)} />
```

Rows of one section must be adjacent. The palette filters by every query word against `label` and `keywords`; pass `filter={false}` when the host ranks rows itself.

## Rules

- A row that has a key shows it; a destructive row is red and its result has Undo.
- Say where answers come from in the footer; never hide that Recognizer is offline.
- The selection is instant: rows are scanned, not watched.

## Accessibility

- Dialog with a label; the field is a combobox and the list a listbox (Base UI): arrows move `aria-activedescendant`, ↩ runs, ⎋ closes and focus returns to the trigger.
- Sections are groups labelled by their engraving. Keycaps speak their names (`⎋` "Escape").

## Tokens

`--mu-palette-*`, `--mu-row-on-bg`, `--mu-scrim`, `.mu-frost-plate`, `--mu-well*`, `--mu-raise-sm`, `--mu-engrave`, `--mu-green-deep`, `--mu-red`, `--mu-spring-surface`, `--mu-travel-surface`. Swift: `MetalPaletteMetrics`, `MetalFrost.plate`.

---

# Connector

A line between two blocks, and everything around it. React: `Connector` from `@unlocalhosted/metalui`. SwiftUI: `MetalConnector` (not yet).

## Use it for

- A line or arrow whose ends land on two blocks (the core's `ink_endpoints`), per DRAWING.md DR-07.
- `look="current"` or `"stardust"` to show that something flows between two blocks.

## Don't use it for

- Plain strokes that touch no block.
- Current or stardust on every line: they animate all the time. Elastic is the default.

## Looks

| Look | What it is |
|---|---|
| elastic (default) | a taut band; its middle rides a spring (k 170, damping 13), so the line bends behind a moving block and whips back with one overshoot. Arrowheads show the flow. Still when settled. |
| current | a quiet line (28 %) with comets of light: each leaves the source slowly, speeds up, slows into the target, which glows as it lands. Quickens while a block moves. |
| stardust | 34 drifting, twinkling motes along the line; a shimmer runs in the flow's direction. Hover or select: the motes pull into a line. |

`flow`: `forward` (from → to), `backward`, `both`.

## Chrome

| State | Look | Motion |
|---|---|---|
| rest | the line and label | – |
| hover | green halo; end dot 4.5, solid (attached) or hollow (free) | part spring fade |
| selected | halo; end handles 5 | – |

The line is world ink (scales with zoom); halo, dots, handles, hit band (18) and label keep their screen size. Reduce Motion: elastic's straight line, no spring, no flow.

## API

`Connector from={x,y,attached} to={…} look flow ink width state label scale onHoverChange onPress onEndPointerDown`

---

# Dialog

A modal layer. React: `Dialog` with parts `Dialog.Root` (open, onOpenChange) and `Dialog.Popup` (a `Surface`, material `plate` by default). SwiftUI: `MetalDialog(isPresented:) { popup: … }`.

## Behaviour

- Focus moves in and stays in; Escape and a click on the scrim close it; focus returns to the opener.
- The popup rises a step (−6, from .985) on the surface spring and closes on release; under Reduce Motion it fades in place.
- Name it: `aria-label` on the popup.

---

# Draw picks

The ink and width choices beside the drawing tools. React: `InkPicks`, `WidthPicks` from `@unlocalhosted/metalui`. SwiftUI: `MetalInkPicks`, `MetalWidthPicks` with `Binding<MetalInk>` and `Binding<MetalInkWidth>`.

## Use it for

- Choosing the ink (ink, red, blue, green, amber) and width (fine, regular, bold) of the pen, pencil, marker, line, arrow, rectangle and ellipse.

## Don't use it for

- A free colour picker. The set is fixed on purpose.
- Anything outside a `Toolbar`: the picks are toolbar buttons.

## Anatomy

A 28 round cap. Ink: a 14 bead in its colour with a gloss. Width: a dot of 3, 6 or 10 in the current ink. Picks sit 2 apart.

## States and motion

| State | Look | Motion |
|---|---|---|
| hover | bead or dot at 1.14 | part spring |
| press | .88 | 80 ms |
| chosen | sunk well (the latched tool's) | at once |
| focus | 1.5 ring, no offset | – |
| disabled | 40 % (eraser latched) | – |

## API

| React | Notes |
|---|---|
| `InkPicks value onValueChange disabled` | `Ink`: `'ink' \| 'red' \| 'blue' \| 'green' \| 'amber'` |
| `WidthPicks value onValueChange ink disabled` | `InkWidth`: `'fine' \| 'regular' \| 'bold'` |
| `inkColor(ink)` | the CSS colour to draw with |

---

# Draw tools

The drawing group of the toolbar. A composition block. React: `DrawTools` from `@unlocalhosted/metalui`. SwiftUI: `MetalDrawTools` with bindings for tool, ink and width.

## Use it for

- Picking a drawing tool, its ink and its width on the canvas.

## Don't use it for

- Select, text or region tools: those are the main toolbar.

## Anatomy

`Toolbar` › `ToolButton` × 8 › `ToolbarSeparator` › `InkPicks` › `ToolbarSeparator` › `WidthPicks`.

Keys: P pen, N pencil, M marker, L line, A arrow, R rectangle, O ellipse, E eraser. V or ⎋ goes back to select (the host handles it).

## States

- One tool latched with its LED, or none.
- Eraser latched: inks and widths at 40 %.
- The host remembers the last ink and width per tool.

## API

`DrawTools tool onToolChange ink onInkChange width onWidthChange variant`

---

# Field and search field

React: `Field` with parts `Field.Root`, `Field.Icon`, `Field.Input`, `Field.Trail`; `SearchField`. SwiftUI: `MetalField { icon: … input: … trail: … }`, `MetalSearchField`.

## Field

- A 44 tall well (radius 17), a 15 glyph, the input in 15 pt, a hint in ink3, a green caret; trailing keycaps in `Field.Trail`.
- `Field.Input` is a plain input; pass it as a Base UI combobox input's `render` to join a listbox.

## Search field

- A button, not an input: it opens search (a palette). 38 tall (radius 15) with a 14 glyph, the placeholder and a keycap (`⌘K`); graphite in a dark strip, light elsewhere.

## Keyboard and accessibility

- Field: the input takes focus; its caret is the focus (no ring). Search field: a button with `aria-keyshortcuts`, the green ring on focus.

---

# Filter bar

Names the question a filter asks and switches how the answer is shown. A composition block on Base UI Toolbar. React: `FilterBar` (earlier `LensBar`) from `@unlocalhosted/metalui`. SwiftUI: `MetalFilterBar` (earlier `MetalLensBar`).

## Use it for

- While a filter is open: `open tasks about the poster · 6 MATCHES · VIA MODEL`, with its views (In Place, List, Table, Timeline, Gallery), pin and close.

## Don't use it for

- Search fields or command entry. The palette asks; the filter bar names what was asked.
- Filtering that moves or hides content permanently. A filter never moves anything.

## Anatomy

`Surface material="frost" radius="pill"`, 38 tall, padding 0 6 0 14, gap 8, at the top centre: a `Glyph` (14, ink2); the query in `Label variant="query"`, ellipsised at 340; `N MATCHES` in `Label variant="engraved"`; the note (`ASKING…` after a waiting `Led`, `VIA MODEL`, `LOCAL`); a compact `Segmented`; two `IconButton variant="ghost"`, pin and close.

## States and motion

| State | Look | Motion |
|---|---|---|
| open | the bar | drops in 8 from above, from .98, on surface; Reduce Motion: fades in place |
| pending | amber LED + the note | – |
| view change | the thumb glides | part |
| icon hover | the ghost button's well, ink | settle |
| close | removed | the host fades it out on release |

## API

| React | SwiftUI | Notes |
|---|---|---|
| `query`, `count`, `note` | same | `note: { text, pending }` |
| `view`, `onViewChange`, `views` | `view:` (Binding), `views:` | pass `[]` for no switcher |
| `onPin` | `onPin:` | omit when it cannot be kept |
| `onClose` | `onClose:` | also ⎋ in the host |
| `glyphs` | (MetalIcon built in) | `{ filter, pin, close }` at 14 |

`LensBar` remains: `source` (`asking`, `local`, or a source's name) becomes the note, `mode` / `onModeChange` / `modes` the views, `glyphs.lens` the filter glyph.

## Rules

- A filter never moves anything. In place dims non-matches; the other views gather matches in a panel without moving them.
- Hidden confidence is a bug: when words were judged beyond the rules, the note says where.

## Accessibility

- A Base UI toolbar named "Filter: …": one tab stop with arrow navigation; the view switcher is a radio group; pin and close have labels and titles.
- The match count is announced politely when it changes.

## Tokens

Layout: `--mu-lensbar-*`. Look: the surface, glyph, label, status, segmented and icon-button recipes. Motion: `--mu-spring-surface`, `--mu-travel-surface`.

---

# Folder

A folder on the canvas: the closed state of a container. React: `Folder` from `@unlocalhosted/metalui`. SwiftUI: `MetalFolder` (not yet).

## Use it for

- Blocks put together by dropping one onto another, by ⌘G, or by the evening sort.
- Anything that should be kept together but not take space (one container, two states).

## Don't use it for

- A place you are working in: unfold it into its region (`Region` with the same `hue`).

## Anatomy

From the Soft Hardware sheet's stack folder, 220 × 204: a translucent paper back panel (150 tall, radius 26, tapering 10 per side toward the bottom) with a tab rising 16; up to three cards (114 × 148, radius 16) with a 62-tall picture and three lines; a frosted glass flap (106 tall, tapering 12 per side: a clipped blur layer under a see-through fill) with the name (title), `Folder · N blocks` (engraved) and the count chip.

## States and motion

Up to six cards peek, each posed by its place in the pile (t: 0 back → 1 front); the fan widens a little with the count. At three cards the poses are the sheet's exactly.

| State | Cards (y, lean, back → front) | Flap | Order |
|---|---|---|---|
| rest | -10: 10° → -5° | -15° | leaving hover: the front settles first |
| hover / focus | -30 → -44: 14° → -9° | -45° | the back lifts first, 45 ms apart (object spring) |
| open (dragged over, or unfolding) | -86 → -106: 18° → -14° | -55° | same |
| joining | the new card is added at the front, the others re-spread; its slot waits (`waiting`) until the block lands | open | – |
| landing | the fan settles together | shuts past rest to -4°, settles (hinge spring) | – |
| empty | none | -15° | – |

Past six, the oldest slides down into the pocket. Colour: `hue` = neutral (the sheet), red, amber, green, blue, violet; soft paper on the back, tinting the glass flap. Reduce Motion: poses at once.

## API

`Folder name count peeks={[{thumb, link}]} hue open landed onUnfold`

- `landed`: change it each time a block drops in (a counter).
- `onUnfold`: double-click or Enter.

---

# Glass face

A dark glass object. React: `GlassFace` with parts `GlassFace.Root` (the bezel) and `GlassFace.Screen`. SwiftUI: `MetalGlassFace { screen: … }`.

## Use it for

- An object that shows a screen: a link's preview, a block of code, an image behind glass.

## Anatomy

- The bezel: radius 22, padding 6, a dark gradient with a bright top edge, an inner glow and a deep drop shadow.
- The screen: radius 16, near black; the glare is a 115° sheen, a darkening toward the bottom, a bright top rim, a dark inner ring and an inner shadow. The screen's own fill (a hue, a gradient) is the caller's, under the glare.

## Behaviour

- No role; the content and its actions carry their own.

---

# Glyph

A static icon at a size in an ink. React: `Glyph` wrapping any MetalUI icon. SwiftUI: `MetalGlyph(.search, size: .small, tone: .ink2)`.

## Use it for

- A mark beside words that is not a control: the lens beside a query, a field's leading search mark, a menu row's icon.

## Don't use it for

- Anything pressable: use `IconButton`. A glyph that carries meaning alone: give its host an accessible name instead.

## Props

- `size`: `tiny` (10), `small` (14, default) or `regular` (16). `tone`: `ink`, `ink2` (default), `ink3`, or `inherit` (the ink of the words it sits in, as a glyph inside an engraving).
- It is `aria-hidden`; the icon inside inherits the ink.

---

# Hover engraving

A block's identity, shown on a dwell, never on a pass. A composition block. React: `HoverEngraving` from `@unlocalhosted/metalui`. SwiftUI: `.metalHoverEngraving(...)` or `MetalHoverEngraving`.

## Use it for

- Telling what a block is and where it came from, without a card: `LOG · 07:40 · SLEEP 6 H · ALSO TIRED`, `TASK · TOMORROW 16:00 · #POSTER · RECOGNIZER ✓`, `LUNCH? 0.71`, `NOT SENT · LOOKS LIKE A SECRET`.

## Don't use it for

- Anything a person must read to act. The engraving repeats or names what the block already shows (the label role never carries information alone).
- Controls. It is not interactive and ignores the pointer.
- Tooltips on chrome. Those are tooltips; the provenance of a single cue is the provenance tooltip.

## Anatomy

`Surface material="tip" radius="pill"` (frosted, blur 12, a small raise), 22 tall with 10 padding and 8 gaps: `Label variant="engraved"` with the kind as its `<b>` emphasis; derived tags as `Chip variant="tag"`; the recognizer's status in a `Label` after a `Led` (green live, amber waiting, red failed, off). Beside the first line of a text block (4 to the right, 9 down); below a material block (8 under). It never covers the next line of a stacked list.

## States and motion

| State | Look | Motion |
|---|---|---|
| pass | hidden | – |
| dwell 420 ms | shown | settle fade, sliding 3 in (beside) or 2 down (below) |
| leave | hidden at once | settle, no delay |
| selected, writing | hidden (`open={false}`) | – |
| Reduce Transparency | the surface turns opaque, no blur | – |

Reduce Motion: settle is a crossfade, so it fades in place.

## API

| React | SwiftUI | Notes |
|---|---|---|
| `kind` | `kind:` | emphasised first |
| `details` | `details:` | joined with ` · ` |
| `tags` | `tags:` | derived tags only |
| `status` | `status:` | `{ led, text }`; `MetalEngravingStatus` |
| `placement` | `placement:` | `beside`, `below` |
| `open`, `immediate` | `isPresented:` | controlled; the dwell still applies unless `immediate` |

```tsx
<div className="mu-icon-trigger block" aria-describedby="eng-1">
  slept badly, up at 5
  <HoverEngraving id="eng-1" kind="LOG" details={['07:40', 'SLEEP 6 H', 'ALSO TIRED']} status={{ led: 'live', text: 'RECOGNIZER ✓' }} open={selected || editing ? false : undefined} />
</div>
```

## Rules

- A dwell, never a pass: 420 ms before it shows, nothing on the way out.
- Beside the first line, never under a text block (it would cover the next line of a list).
- Hidden while selected or writing.
- Status carries its LED and its words; never colour alone.

## Accessibility

- It is a `note`; point the block's `aria-describedby` at its `id` so assistive tech reads the identity with the block.
- It never takes the pointer or focus.

## Tokens

`--mu-engraving-*`, per colorway `--mu-engraving-bg`, `--mu-engraving-emphasis`, `--mu-engraving-tag-ring`; `--mu-engrave`, `--mu-lip`, `--mu-raise-sm`, `--mu-led-*`, `--mu-type-label`. Swift: `MetalEngraving`.

---

# Icon button

A pressable cap with only a glyph. React: `IconButton`. SwiftUI: `MetalIconButton`.

## Variants

- `tool`: a 38 graphite cap (radius 15). Pressed sinks 1 into a dark well (50 ms linear, back on release). `pressed={true}` latches it down with a 4 pt green LED 5 in from the top right.
- `ghost`: a 28 flat round button; hover fills it faintly and darkens the glyph.
- `mini`: an 18 × 16 flat pill inside a chip; `accept` turns its glyph green on hover.

## Keyboard and accessibility

- A `<button>`; Space and Enter activate. `label` is its accessible name; `pressed` sets `aria-pressed`.
- Focus: the green ring (2 pt, no offset: the cap is the target).
- Inside a toolbar, render it through the toolbar's button part so arrow keys move between tools.

---

# Keycap

A key's glyph on a small raised cap. React: `Kbd` from `@unlocalhosted/metalui`. SwiftUI: `MetalKbd`.

## Use it for

- Showing the key for an action: a search well's `⌘K`, a palette footer (`↑↓ move · ↩ open`), a toast's Undo `⌘Z`, a tooltip's `Select · V`.

## Don't use it for

- Buttons. A keycap is shown, never pressed.
- Words or long shortcuts. Glyphs only: ⌘ ⌥ ⇧ ⌃ ⎋ ↩ ⌫ ↑ ↓ and single letters; one cap per key.

## Anatomy

20 tall (16 `small` in a dense footer), min width 19, padding 0 5, radius 6 (`key`), the cap material (`cap-bg`, `cap-sh`), the `readout` role in ink2. On a graphite strip (`surface="strip"`): `#303033 → #262628` with a light top lip, ink `#A6A6A9`. Sunk in a toast's Undo (`surface="sunk"`): a dark inset pill, ink `#9A9A9E`.

## API

| React | SwiftUI |
|---|---|
| children | first argument |
| `size` | `size:` (`.default`, `.small`) |
| `surface` | `surface:` (`.default`, `.strip`, `.sunk`) |
| `label` | `label:` |

## Accessibility

- A `kbd` element; modifier glyphs are named for assistive tech ("Command K").

## Tokens

`--mu-kbd-*`, `--mu-cap-bg`, `--mu-cap-sh`, `--mu-radius-key`, `--mu-type-readout`. Swift: `MetalKbdMetrics`.

---

# Label

Text in a set role. React: `Label`. SwiftUI: `MetalLabel`.

## Use it for

- Engravings (`engraved`, `small`): counts, rules, sections, units, provenance; uppercase mono with a lip.
- Names (`title`), page titles (`heading`), a pinned query's words (`query`).
- Numbers: `count` (a mono count), `cell` (a mono table cell), `value` and `value-small` (a measured value, 22 and 12).
- `display` and `display-quiet`: a large line and its quieter continuation (an empty state's words).
- On graphite: `readout` with its `readout-dim` part, `on-graphite` for sans text, `dark` for an engraving.

## Emphasis

- A `<b>` inside an `engraved` or `small` label is its emphasis: weight 500 in a darker engraving ink (`TASK · 07:40`, the kind before the details).

## Tone and placeholder

- `tone="accent"`: green with no lip, cross-fading on settle (a region's rule while a block is over it: "drop to mark tasks done").
- `placeholder`: shown in ink3 at 500 while the label is empty ("name this region"); on `as="input"` it is the input's placeholder.

## Behaviour

- Plain text: no role. An engraving that is the only name of a control is not an accessible name; give the control an `aria-label`.
- `as="input"`: an editable label (a region's name) that keeps the look, with the green caret and no field, sized to its content; give it an `aria-label`.

---

# Lasso

The box a drag on empty canvas draws, with a count of what it will select. React: `Lasso` from `@unlocalhosted/metalui`. SwiftUI: `MetalLasso`. It uses the Size readout for its count.

## Use it for

- A drag that starts on empty canvas (the Select tool, or no tool). Every object the box touches is selected when the drag ends.

## Don't use it for

- Showing a selection that already exists (that is the Selection frame), or a region (a region is an object you made).

## Anatomy

- A rectangle in world coordinates from where the drag began to the pointer; a drag up or left works the same.
- Its edge is `presence.lasso-width` (1 pt) in `presence.guide`; its fill is `presence.lasso-fill` (intent green at 6 %). Graphite: `guide-dark` and `lasso-fill-dark`.
- Under it, centred, `presence.readout-gap` / 2 (8 pt) below: `SizeReadout` reading `● 3 blocks` (the count, then the unit dimmed). No readout while the count is 0.
- The line and the readout keep their screen size at every zoom: pass the canvas `scale`.

## States and motion

| State | Look |
|---|---|
| rest | nothing |
| drawing | the box and the count, updated in the same frame as the pointer |
| release | the box fades on the release spring; the Selection frame takes over |

No marching ants, no glow. Reduce Motion: it clears at once.

## API

| React | SwiftUI |
|---|---|
| `rect` (`x`, `y`, `width`, `height`, or `null`) | `rect:` |
| `count` | `count:` |
| `scale` | `scale:` |
| `unit` | `unit:` |

## Rules

- The count is what the box touches now, never a guess.
- The box never moves objects; it only chooses them.

---

# Line handles

The presence of a drawn line or arrow. React: `LineHandles` from `@unlocalhosted/metalui`. SwiftUI: `MetalLineHandles` (not yet).

## Use it for

- A line or arrow drawn with the Line or Arrow tool that is not a connector.

## Don't use it for

- Rectangles, ellipses and strokes: use `SelectionFrame` (eight handles).
- Connectors: `Connector` has the same chrome built in.

## States

| State | Look |
|---|---|
| rest | nothing |
| hover | green halo along the line, hollow dot at each end (part spring fade) |
| selected | halo, a handle at each end; dragging one moves that end |

Uses the connector recipe's halo, dot and handle, so every selection on the canvas looks alike. Sizes keep their screen size (`scale`).

## API

`LineHandles from to state scale onHandlePointerDown`

---

# Link card

A link as a glass object. A custom block: `GlassFace` with a screen tinted by the host, a `Chip` tag and a `Chip` action. React: `LinkCard` (and `linkHueDegrees`) from `@unlocalhosted/metalui`. SwiftUI: `MetalLinkCard`.

## Use it for

- A lone URL placed on a canvas: `figma.com` over `/FILE/POSTER-V3`, with `● LINK` and `OPEN ↗`.

## Don't use it for

- A link inside text: that is a `MarkUrl` host pill. A navigation control: a link or a button.

## Anatomy

250 wide: `GlassFace` (bezel 6, radius 22; screen radius 16 with its glare). The screen is 92 tall, padding 12 / 14, the host and path set at its foot; its tint is a radial of the host's hue into `#121316`. `Chip variant="glass"` with a link `Led` and LINK at 10 / 10; `Chip variant="glass-action"` OPEN ↗ at 10 from the top right. The host is 620 15 / 1.2 in `#EDEDEF`; the path 9.5 mono uppercase at .5 white, ellipsised.

## Why custom

The tinted screen and its type are drawn by no component. Everything else is `GlassFace` and `Chip`.

## Behaviour

- The card is not a click target. Only OPEN is: a real link, `target="_blank"`, `rel="noopener noreferrer"`.
- The host lifts it on hover (2, on part); the card itself does not move.

## API

| React | SwiftUI | Notes |
|---|---|---|
| `href` | `url:` | |
| `host`, `path` | `host:`, `path:` | default from the URL |
| `hue` | `hue:` | any colour; default the recipe's tint. The reference tints by host: `hsl(linkHueDegrees(host), 38%, 32%)` (the recipe's tint-saturation and tint-lightness) |
| `tag`, `openLabel` | `tag:`, `openLabel:` | the host's words (LINK, OPEN ↗) |

## Tokens

The link-card recipe (screen, host, path, chip inset), the glass-face and chip recipes.

## Preview

Pass `preview` (the backend's `GET /preview` result: `title`, `description`, `image`, `icon`) once it arrives. With a title, the title becomes the big line (2 lines at most); the host and path move into a small line with the site icon; the image sits behind the tinted glow, shaded to the bottom; the card grows from 92 to 128 on settle and the preview fades in. Never request or pass a preview for a secret block or while looking at the past. Without a title the card stays as it was: the preview is decoration, the URL is the text.

---

# Mark

Recognition made visible on the text. React: `Mark`, `MarkUrl`, `MarkInferred`, `MarkUrgency`, `MarkLife` from `@unlocalhosted/metalui` (earlier `Cue`, `CueUrl`, `MarkInferred`, `CueUrgency`, `CueLife`); the checkbox is `Checkbox`. SwiftUI: `Text.metalMark(_:colorway:)`, `MetalMarkTag`, `MetalMarkURLPill`, `MetalMarkInferred`, `MetalMarkUrgency`, `MetalMarkLife`.

## Use it for

- Marking what a recognizer understood in a person's own writing: a date, a duration, an amount, a measurement, a tag, a colour, a link.
- A task's checkbox in the margin (`Checkbox`), a task the model inferred (`Checkbox ghost`), and urgency (`MarkUrgency`).
- The one life glyph trailing a block (`MarkLife` around a `Life*Icon` at 16).

## Don't use it for

- Changing the text. A cue never rewrites, reflows or recolours the words (tags are ink2, derived tags ink3, never a hue).
- Anything the person did not write: a value the model read that is not in the text is a `MarkInferred` pill after the words, never an underline.
- Status, errors or calls to action. Cues are quiet and have no toast, badge or sound.

## Anatomy

| Cue | Rest | While writing |
|---|---|---|
| date | dotted underline green .7, 1.5 thick, offset 3.5; hover chip with the resolved date | same |
| duration · amount | solid quiet underline 1, offset 3.5 (the text's own figures: tabular digits would change the advance) | same |
| measurement | solid green .42 underline 1.5, offset 4 | same |
| tag | soft pill: padding 1/4 paid back by margin 0/−4, ink2 | same |
| derived tag | hollow pill (.5 ring), ink3 | same |
| hex | 3 pt underline in the colour at 78 %, skip-ink off; the 11 pt swatch before it at rest | underline only |
| match | a search's matched words in a result row: weight 650, a green .55 underline 1.5 thick, offset 2.5 (heavier, so result rows only, never writing) | never |
| URL | a 20 tall host pill with the link glyph at 11 | the raw URL, plain |
| inferred | a 17 tall hollow pill in the label role after the last word | hidden |
| dimple | 16 pt well, radius 6, hanging at −25 in the gutter; checked: dark with a white tick | the raw `[ ] ` sits in the gutter |
| ghost dimple | 14 pt hollow, radius 5; the band grows left by 36 instead of indenting the words | hidden |
| urgency | 5 pt amber LED at −35 | hidden |
| life glyph | after a middle dot, 16 tuned cut, ink3 → ink2 on the host's hover, tint for feelings | hidden |

## Motion

The resolved-value chip rises 3 pt on the part spring (instant under Reduce Motion). The dimple's tick draws on in 220 ms after a 40 ms beat on an ease-out, not sprung (DS-21); instant under Reduce Motion. The life glyph fades in 120 ms when recognised; its hover is the glyph's own. Nothing else moves.

## API

```tsx
import { Cue, CueUrl, CueInferred, CueLife, Dimple, CueUrgency } from '@unlocalhosted/metalui';
import { LinkIcon } from '@unlocalhosted/metalui/icons';
import { LifeCoffeeIcon } from '@unlocalhosted/metalui/icons/life';

<Dimple checked={done} onCheckedChange={tick} aria-label="Poster task" />
Send the poster <Cue kind="date" resolved="TUE 30 SEP · 16:00">tomorrow 4pm</Cue> for <Cue kind="tag">#poster</Cue>
<CueUrl host="figma.com" href={url} glyph={<LinkIcon size={11} />} />
<CueInferred resolved="FRI 3 OCT · RECOGNIZER 0.82">fri</CueInferred>
<CueLife><LifeCoffeeIcon size={16} /></CueLife>
```

| Component | Props |
|---|---|
| `Cue` | `kind` (`date`, `duration`, `amount`, `measurement`, `tag`, `derived-tag`, `hex`), `resolved` (hover chip), `color` and `swatch` (hex) |
| `CueUrl` | `host`, `glyph`, any anchor attribute |
| `MarkInferred` | `resolved` |
| `Dimple` | Base UI Checkbox props (`checked`, `onCheckedChange`, `disabled`), `doing`, `ghost` |
| `CueUrgency` | – |
| `CueLife` | the glyph as children |

## Rules

- Metric-neutral: every in-flow cue has the same advance as the plain text it marks (measured width delta 0.00 pt). Never add padding without paying it back.
- One life glyph per block, trailing; never a chip for a glyph; never while writing.
- Ticking a dimple is a person's action: the host writes `[x]` into the text and offers Undo. Applying a cue never rewrites text.
- Hidden confidence is a bug: an inferred value shows where it came from (`RECOGNIZER 0.82`) in its chip.

## Accessibility

- The dimple is a real checkbox (Base UI): Space toggles it, it has a focus ring, and `doing` is announced as mixed. Give it a label that names the task.
- The resolved-value chip also shows on keyboard focus. The hover chip repeats what the text already says, so it is not the only carrier.
- The URL pill is a link with its host as its name; the urgency LED has the label "Due soon".
- Colour is never the only cue: underline patterns differ (dotted date, solid values), and tags are shapes.

## Tokens

`--mu-cue-*`; per colorway `--mu-cue-quiet`, `--mu-cue-tag-bg`, `--mu-cue-tag-sh`, `--mu-cue-derived-sh`, `--mu-cue-ghost-sh`, `--mu-cue-url-ink`; `--mu-well*`, `--mu-led-amber`, `--mu-led-ring`, `--mu-frost-graphite-*`, `--mu-type-label`. Swift: `MetalCue`, `MetalTokens.<colorway>.cue*`.

---

# Menu and correction popover

A frosted plate of rows. React: `Menu`, `ContextMenu`, `MenuItem`, `MenuSeparator` from `@unlocalhosted/metalui` (Base UI Menu and Context Menu). SwiftUI: `MetalMenuPanel`, `MetalMenuItem`, `.metalMenu(isPresented:at:heading:items:)`. 

## Use it for

- **The correction popover**: right-click a cue for what it is not ("Not a Task", "Not Coffee", "Ignore “4pm”"), Reset Corrections, Ask Recognizer Again, Gather Similar; the heading is the cue's provenance.
- A "more" button's actions; a block's right-click actions.

## Don't use it for

- Running anything by name: that is the command palette.
- Choosing a value in a form (a select) or switching views (segmented).
- Naming a control (a tooltip).

## Anatomy

- **Plate**: `--mu-menu-bg` (frost-strong at .92), `raise`, radius plate (18), padding 6, at least 200 wide; 6 from its trigger, or at the pointer and kept 8 inside the window.
- **Heading** (optional): the label role, engraved: what the menu acts on.
- **Row**: 30 tall at the row radius (12, the plate nests 6), the ui role, a 14 glyph in ink2, the key on a small cap at the right. Destructive: red.
- **Separator**: an engraved 1 rule, inset 5 × 8.

## States and motion

| State | Look | Motion |
|---|---|---|
| opens | plate at the trigger or pointer; focus on the plate (first row on ↓) | fades in on settle; no travel |
| highlighted (pointer or keyboard, one state) | `--mu-menu-row-hover` | instant |
| disabled row | 40 % | – |
| choose (click, ↩) | runs, closes | fades out on release |
| ⎋ / outside | closes, nothing runs; focus back to the trigger | release |
| Reduce Transparency | opaque plate | – |
| Increase Contrast | an edge on the plate and on the highlighted row | – |

## API

```tsx
<ContextMenu heading="NOTE · TASK BY SYNC 0.82" menu={<>
  <MenuItem onSelect={() => correct({ task: false })}>Not a Task</MenuItem>
  <MenuItem onSelect={resetCorrections}>Reset Corrections</MenuItem>
  <MenuSeparator />
  <MenuItem onSelect={gatherSimilar} icon={<SearchIcon size={14} />}>Gather Similar</MenuItem>
</>}>
  <span>{cue}</span>
</ContextMenu>

<Menu trigger={<button aria-label="More"><MoreIcon size={16} /></button>}>
  <MenuItem onSelect={duplicate} shortcut="⌘D">Duplicate</MenuItem>
  <MenuItem onSelect={remove} danger shortcut="⌫">Delete</MenuItem>
</Menu>
```

## Rules

- Corrections win and are remembered for that exact text; after one, show a toast with Undo ("Correction remembered · for this exact text").
- Title Case for rows (macOS menus); the heading in the label role.
- One destructive row, last, red; its result has Undo.

## Accessibility

- Base UI Menu: `role="menu"`, rows `menuitem`, ↑ ↓ Home End and type-ahead, ↩ and Space choose, ⎋ closes and returns focus. The heading labels the group of rows.
- The context menu also opens from the keyboard's context-menu key and ⇧F10 on the focused target (the browser's `contextmenu` event).

## Tokens

`--mu-menu-*` (section), `--mu-menu-bg`, `--mu-menu-row-hover` (colorway), `--mu-raise`, `--mu-radius-plate`, `--mu-radius-row`, `--mu-engrave`, `--mu-rule`, `--mu-red`, `--mu-spring-settle`, `--mu-spring-release`. Swift: `MetalMenuMetrics`.

---

# Past banner

Says the canvas is showing the past, and brings it back. A composition block. React: `PastBanner` from `@unlocalhosted/metalui`. SwiftUI: `MetalPastBanner`.

## Use it for

- While the time scrubber views a past moment: `MEMORY · viewing Tue 23 Sep · 14:10 · [Back to Now ⎋]`.

## Don't use it for

- Notifications, errors or any other status. It is the only chrome that changes in the past, and only then.

## Anatomy

`Surface material="graphite-plain" radius="pill"`, 34 tall at the top centre, padding 0 6 0 14, gap 10: `Label variant="dark"` MEMORY; `Label variant="on-graphite"` the moment; `Button cap="graphite"` Back to Now with a `Kbd` ⎋ 7 after it.

## States and motion

| State | Motion |
|---|---|
| scrubbed into the past | drops one nest from above on surface (a crossfade under Reduce Motion) |
| Back to Now pressed | the cap presses 1; the host returns and removes the banner (release) |

## API

| React | SwiftUI |
|---|---|
| `moment` | `moment:` |
| `onBack` | `onBack:` |

## Rules

- Shown only while in the past; ⎋ does the same as the cap.
- The moment reads like a sentence: "viewing Tue 23 Sep · 14:10".

## Accessibility

- A `status` region, so arriving in the past is announced. Back to Now is a real button with its shortcut (`aria-keyshortcuts="Escape"`).

## Tokens

Layout: `--mu-pastbanner-*`. Look: the surface, label, button and kbd recipes. Motion: `--mu-spring-surface`, `--mu-motion-nest`. Swift: `MetalPastBannerMetrics`.

---

# Perfect preview

Hold to perfect. React: `PerfectPreview` from `@unlocalhosted/metalui`. SwiftUI: `MetalPerfectPreview` (not yet).

## Use it for

- The pen or pencil held still at the end of a rough line, circle, rectangle or triangle (DRAWING.md DR-05). The core's `shape_recognize` gives the fitted shape.

## Don't use it for

- A large closed loop released without holding: that is still a region.

## Flow

1. Pointer still for a moment with a fitted shape: `phase="holding"`, `d` = fitted outline.
2. The outline traces round over 450 ms (`--mu-r-perfect-self-hold`). `onHeld` fires when it closes.
3. Host sets `phase="done"` and morphs the drawn points to the shape over 180 ms on the settle spring (`--mu-r-perfect-self-morph`, `--mu-spring-settle`); the outline fades over the same time. Then `idle`.
4. Still holding after the morph: `phase="tuning"` with `tune={centre, pointer, angle, scale}`. The host turns and resizes the shape around its centre from the pointer (angle catches at every 45° within 5°); this draws the centre dot, the dashed guide and the readout. Letting go places it.
5. Pointer moves or Escape during 1–2: `phase="idle"` at once; keep the hand-drawn stroke.

## Look

1.5 green line (screen width at any zoom), 70 %. Graphite uses the lighter green. Reduce Motion: shown whole, no trace.

## API

`PerfectPreview d phase tune scale onHeld`

Recognition (the core's `shape_recognize`) should judge closed strokes on the convex hull: biggest inner triangle ≥ .62 of it → triangle; fills ≥ .835 of its tightest box, or its biggest 4-gon ≥ .77 → rectangle (that box, level within 10°); else ellipse in that box. See the docs page's measured table.

---

# Provenance tooltip

One hover away from every cue: where it came from. A composition block: a wrapped `Tooltip` with the detail in `Tooltip.Dim`. React: `ProvenanceTooltip` (and `ProvenanceProvider` around a canvas) from `@unlocalhosted/metalui`. SwiftUI: `.metalProvenance(_:detail:)` or `MetalProvenanceTooltip`.

## Use it for

- Every cue the app applied: `Rule · date parser`, `Recognizer · 0.82`, `Region · Done`, `Cluster · poster`, `Formula`, `You` (a correction).

## Don't use it for

- Tooltips on chrome (a tool's name and key). Those are the toolbar's tooltips.
- Long explanations. The source, then the detail.
- Hiding confidence. If the app guessed, the number is shown.

## Anatomy

`Tooltip wrap` (the graphite fill with no backdrop, radius 11, padding 6 / 10, max 280 wide, 10 mono at 1.45, tracked .05em): the source in its ink, the detail after a middle dot in `Tooltip.Dim`. It waits 380 ms, sits 8 above the cue, or 34 above a cue that shows its own value chip on hover, and flips below near the top of the view.

## States and motion

| State | What shows | Motion |
|---|---|---|
| rest | nothing | – |
| hovered or focused 380 ms | the tooltip | fade on settle |
| next cue within the group | the next tooltip at once | – |
| leave, Escape | hidden | fade on settle |

## API

```tsx
<ProvenanceProvider>
  <ProvenanceTooltip source="Recognizer" detail={['0.82']} clearsChip>
    <Mark kind="date" resolved="TUE 30 SEP">tomorrow</Mark>
  </ProvenanceTooltip>
</ProvenanceProvider>
```

| Prop | Notes |
|---|---|
| `source` | first, in the tooltip's ink |
| `detail` | dimmed, after a middle dot |
| `clearsChip` | the cue has its own value chip: sit above it |
| `open` | controlled |

## Rules

- Every applied cue has provenance, and a guess shows its number.
- The source first.
- It never covers the cue's own value chip.

## Accessibility

- Base UI Tooltip: it opens on hover and on keyboard focus and closes on Escape. Tooltips are visual only, so the block also sets the cue's `aria-description` to the provenance ("Recognizer, 0.82"). The cue stays the focusable element.
- It never holds interactive content.

## Tokens

Timing and placement: `--mu-provenance-delay-ms`, `--mu-provenance-offset`, `--mu-provenance-chip-offset`. Look: the tooltip recipe. Swift: `MetalProvenance`.

---

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

---

# Row

A row in a list. React: `Row` with parts `Row.Root`, `Row.Lead`, `Row.Text`, `Row.Trail`. SwiftUI: `MetalRow { lead: … text: … trail: … }`.

## Variants

- `list`: a compact row of a pinned query: 5 / 8 padding, radius 12, 13 pt; hover and focus raise it.
- `panel`: a row of a gathered panel: 8 / 12 padding, radius 14, 14 pt; hover and focus raise it.
- `option`: a palette row, 36 tall, radius 12; the active row (`active`, or Base UI's `data-highlighted`) raises with a 2.5 green rail at its left edge.

## States

- `checked`: `Row.Text` is struck through in ink3. `maybe`: a weak match at 55 %.

## Keyboard and accessibility

- The host gives the row its role (`listitem`, `option`, `row`) and makes it focusable when it acts; focus shows the same raise as hover.

---

# Rule

An engraved groove between groups. React: `Rule`. SwiftUI: `MetalRule`.

## Use it for

- Separating groups of tools or footer keys; `tone="graphite"` on dark strips. The caller sets the length (height of a vertical rule) through layout.

## Behaviour

- `role="separator"` with its orientation.

---

# Segmented control

A pill of pills: one of a few options, always visible. React: `Segmented` from `@unlocalhosted/metalui` (Base UI RadioGroup + Radio). SwiftUI: `MetalSegmented`. Sheet reference: the object sheet.

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

---

# Select

One value from a list of named options. React: `Select` from `@unlocalhosted/metalui`. SwiftUI: `MetalSelect` (not yet).

## Use it for

- A value picked from a list: an icon, a folder colour, where to move a block, a preset, a setting with more than four choices.

## Don't use it for

- Two to four short options that fit side by side: `Segmented`.
- A long list someone will search: a combobox (to come).
- An action: `Menu`.
- On or off: `Switch` or `Checkbox`.

## Anatomy

A trigger that is a raised cap (the button cap, it is clicked): the value (with its lead, if any) and an up-down chevron. The list is the menu's frosted plate: rows 30 tall, an LED slot (14), an optional lead, the label; groups get an engraved heading and a separator.

## States and motion

| State | Look | Motion |
|---|---|---|
| rest | the raised cap; placeholder in ink3 | – |
| hover | the cap lightens; chevron ink2 | .16 s fade |
| press | the cap sinks | button press |
| open | the cap stays pressed in; chevron ink | button spring |
| focus | focus ring (keyboard) | – |
| disabled | 40 % | – |
| invalid | a thin red ring inside the cap | – |
| list opens | the chosen row over the trigger when there is room, else below | scale .97 → 1 and fade, surface spring |
| list closes | – | fade .12 s |
| highlight | one soft highlight shared by pointer and keys | glides row to row, settle spring, no bounce |
| chosen row | green LED before the label | – |

Keys: ↵, Space or ↓ opens; ↑ ↓, Home, End, type-ahead move; ↵ chooses; ⎋ closes. Reduce Motion: fade only.

## API

`Select options value onValueChange placeholder size ("regular" 32 | "compact" 28) disabled invalid aria-label name`

`options` is `[{ value, label, lead?, disabled? }]` or groups `[{ label, options }]`.

---

# Selection frame

the object sheet: the one selection for every kind of object. React: `SelectionFrame` from `@unlocalhosted/metalui`. SwiftUI: `.metalSelectionFrame(_:)` on the object, or `MetalSelectionFrame(size:)` for an overlay drawn apart from it. Sheet reference: the object sheet. There is no Base UI part: it is an object, and the host carries the selection semantics.

## Use it for

- Showing which object on a canvas or board is selected: a text block, an image, a card, a region, a file.
- The hover presence of a borderless object: faint corner dots so its invisible boundary is discoverable, and the edge light where the pointer enters its band.
- A multi-selection: `variant="lite"` on each member and one `SelectionFrame` around the bounding box with `count`.

## Don't use it for

- Selected rows, tabs, menu items or segments. They have their own selected state (a raised thumb, a pressed cap, a green bar).
- Keyboard focus. Focus is the 2 pt focus ring on `:focus-visible`; selection and focus can both show.
- A marquee while dragging. The marquee is a plain precision rectangle, drawn by the host.

## Anatomy

- **Ring**: 1.25 pt green-deep (green on graphite) at offset 6 from the object, so its radius is the object's plus 6 (a plate at 18 gets a ring at 24). A flat 3.5 pt collar `rgba(120,214,165,.16)` sits outside it: a band, never a blur.
- **Handles**: eight on the ring line. 10 pt round soft caps at the corners, 6 × 18 capsules at the edge midpoints. With `handles="text"` the n and s capsules are grips (grab cursor, move the object); the corners and e/w set the width. Each handle's hit area reaches 7 pt past its drawn shape.
- **Readout**: a graphite pill 24 tall, 16 under the object: a 4 pt green LED, then `W × H` in the readout role (Martian Mono 10.5, tabular), the `×` dimmed. It reads the measured frame, never a constant: `● 320 × 214`; `● 3 · 540 × 180` for a multi-selection; `● COPIED · PNG 130 × 215` for 900 ms after a copy.
- **Hover**: only the four corner dots, 5 pt, where the handles will be; the edge light (1.5 pt, fading at both ends) on the band edge under the pointer; a soft glow (twice the handle, the edge-light green at .55) behind the band corner under the pointer, also while selected, because a corner resizes.

## States and motion

| State | What shows | Motion |
|---|---|---|
| rest | nothing | – |
| hover | corner dots; edge light on one edge | fade on settle |
| selected | ring, collar, handles, readout | ring and handles enter from 1.02 on the part spring, once |
| selected · writing | the same; readout at .78 | re-measures in the same frame as each keystroke; never replays its entrance |
| selected · moving | readout at 1 | – |
| lite | a 1 pt quiet ring, no collar, no handles | none |

Reduce Motion: part resolves instant, so the ring appears without its entrance; the dots and readout still fade (settle crossfades).

## API

| React prop | SwiftUI | Values | Default |
|---|---|---|---|
| `state` | first argument | `rest`, `hover`, `selected` | `rest` |
| `variant` | `variant:` | `ring`, `lite` | `ring` |
| `mode` | `mode:` | `idle`, `writing`, `moving` | `idle` |
| `radius` | `radius:` | the object's corner radius | `0` |
| `handles` | `handles:` | `object`, `text`, `none` | `object` |
| `readout` | `readout:` | boolean | `true` |
| `count` | `count:` | blocks in a multi-selection | – |
| `size` | (the view's own frame) | `{ width, height }` to override the measured box | measured |
| `copied` | `copied:` | a format, e.g. `"PNG"` | – |
| `edge` | `edge:` | `n`, `e`, `s`, `w` | – |
| `onHandlePointerDown(handle, event)` | `onHandleDrag:` | the host resizes or moves the object | – |

```tsx
import { SelectionFrame } from '@unlocalhosted/metalui';

<div className="block" style={{ position: 'relative', borderRadius: 18 }} aria-selected={selected}>
  {text}
  <SelectionFrame state={selected ? 'selected' : hovered ? 'hover' : 'rest'} radius={18} handles="text" mode={editing ? 'writing' : 'idle'} />
</div>
```

```swift
import MetalUI

note
    .metalSelectionFrame(isSelected ? .selected : isHovered ? .hover : .rest, radius: MetalRadius.plate, handles: .text)
    .accessibilityAddTraits(isSelected ? .isSelected : [])
```

## Rules

- One selection for every kind: never restyle the ring per object type. For a borderless object the ring and dots are its boundary.
- The readout reads the measured frame (fractional layout size, rounded for display). Never type a size into it.
- A selection made by finishing (⎋, ⌘↩) is quiet: ring and readout, no tool strip. A click selection raises the tool strip.
- Handles sit on the ring line, not on the object's edge. Their hit area is larger than their drawing.
- Hover never changes layout: the dots and the edge light are overlays.

## Accessibility

- The frame is decoration (`aria-hidden`). The object carries the semantics: `aria-selected` (web) or `.isSelected` (SwiftUI) while selected, and its own label.
- Keyboard: arrows nudge the selection (1 pt, ⇧ 10 pt) and are the host's; the handles are pointer affordances with titles.
- Increase Contrast: the lite ring becomes the full-weight ring.
- Colour is never the only cue: the ring's shape and handles carry the state in both colorways.

## Tokens

`--mu-presence-*` (ring, collar, lite, handle, capsule, grip, readout, hover dot, edge light), `--mu-presence-dot` per colorway, `--mu-select-offset`, `--mu-led-green`, `--mu-led-ring`, `--mu-spring-part`, `--mu-spring-settle`. Swift: `MetalPresence`, `MetalRing.selectOffset`, `MetalTokens.<colorway>.presenceDot`.

---

# Settings

An app's settings as sections of rows. React: `Settings` with `Settings.Section`, `Settings.Row`, `Settings.Keys`. SwiftUI: `MetalSettings`. A block: `Surface` (raise-lite, card radius), `Label` (engraved heading, `name`, `detail`), `Rule`, `Kbd`, laid out by the `settings` group.

## Use it for

- The settings view: Sync, Storage, Backup, Shortcuts, Account, the opt-in rows.

## Don't use it for

- Forms that need Save (a dialog), or lists of things you act on (Row).

## Anatomy

- Section: the heading engraved 8 above a raised card; sections 28 apart.
- Row: at least 52 tall, 12 / 18 padding; the name (`Label name`, 13.5 at weight 500) and one short detail line (`Label detail`, 12) on the left; one control on the right, 16 away.
- Engraved rules between rows, inset 18 so they align with the text.
- Keys: a shortcut row: what it does, then one keycap per key.

## Controls

- On or off, at once: `Switch`, labelled by the row's name (`aria-labelledby` with the row's `id`).
- One of a few: `Segmented`, compact.
- An action: `Button` (Download backup, Restore, Upgrade).
- A value (Storage used): a `Label value-small` or a `SizeReadout`.

## Rules

- One control per row. A row never raises on hover; only its control acts.
- The name says what is on, in plain words: "Sync this canvas", not "Enable sync".
- The detail says what it does or what it is now, in one line.

---

# Size readout

A graphite pill that reads a measured value. React: `SizeReadout` from `@unlocalhosted/metalui`. SwiftUI: `MetalSizeReadout`. The Selection frame places one under its object; this is the same readout on its own. Built from `Surface`, `Led` and `Label`; a component rather than a block because the Selection frame block uses it.

## Use it for

- An object's measured size (`● 320 × 214`), a multi-selection (`● 3 · 540 × 180`), a copy (`● COPIED · PNG 130 × 215`, for 900 ms), a zoom level (`● 100 %`).

## Don't use it for

- Status with words (use the status pill), counts in a list (use the readout type role inline), or anything a person edits.

## Anatomy

`Surface material="graphite-deep" radius="pill"`, 22 tall, padding 0 10, gap 6: `Led kind="live"` (5 pt), then the value in `Label variant="readout"` (10.5 mono at 1, tracked .04em, `#EDEDEF`); the `×` and `·` in `Label variant="readout-dim"` (`#7C7D82`).

## States and motion

| State | Look |
|---|---|
| live | LED on |
| writing (inside the Selection frame) | .78 |
| moving | 1 |
| copied | `COPIED · PNG …` for 900 ms |

Opacity changes ride settle. The value changes in place without motion; the pill's width follows the figures, as the reference's does.

## API

| React | SwiftUI |
|---|---|
| `width`, `height` | `size:` |
| `count` | `count:` |
| `copied` | `copied:` |
| `value` | `value:` |
| `led` | `led:` |

## Rules

- It reads a measurement, never a constant.
- Short: one value, never a sentence.

## Accessibility

- It repeats what the object states (its size is the host's to expose). Where it is the only carrier (a zoom level), give it a label or make it a live status in the host.

## Tokens

`--mu-presence-readout-*`, `--mu-led-green`, `--mu-led-ring`, `--mu-type-readout`. Swift: `MetalPresence`.

---

# Slider

A value on a track. React: `Slider` with parts `Slider.Root` (value, min, max, step, largeStep, onValueChange), `Slider.Track`, `Slider.Marks` (fractions), `Slider.Ticks` (labelled), `Slider.Knob`. SwiftUI: `MetalSlider(value:in:) { marks: … ticks: … }`.

## Anatomy

- The track: a 10 tall track well; the fill: the green intent gradient at 55 % up to the knob.
- Marks: 2 × 4 ticks along the track; ticks: labels under it with a short tick line each.
- The knob: 22, a knurled conic finish with a bright inner ring and a small drop shadow.

## Keyboard and motion

- Arrows step (`step`), Shift + arrows step large (`largeStep`); Home / End go to the ends.
- A jump (a click on the track, a key) rides the part spring; a drag follows the pointer exactly. Under Reduce Motion a jump lands at once.
- Name the knob (`aria-label`) and give it a value text (`getAriaValueText`) a person reads ("THU 24 SEP · 14:10").

---

# Snap guides

The lines that explain a snap while a person moves or resizes an object on the canvas. React: `SnapGuides` from `@unlocalhosted/metalui`. SwiftUI: `MetalSnapGuides`.

## Use it for

- Moving or resizing objects on the canvas, when the core's snap lands an edge or a centre on a neighbour's. Pass the core's `guides` for this frame.

## Don't use it for

- Showing a grid, a ruler or a selection. Guides exist only while something is being moved, and only for the alignments that actually snapped.

## Anatomy

- One line per alignment, in world coordinates, drawn inside the transformed canvas world.
- `presence.guide-width` (1 pt) in `presence.guide` (`#3FB97A`; `presence.guide-dark` `#78D6A5` in Graphite).
- Edges solid; centres dashed `presence.guide-dash` on, the same off (3 / 3).
- Each line spans every aligned object plus `presence.guide-overshoot` (8 pt) at both ends.
- Width, dash and overshoot are screen points: pass the canvas `scale` and they stay the same at every zoom.

## States and motion

| State | Look |
|---|---|
| rest | nothing |
| snapping | the lines for this frame, updated in the same frame as the snap, never animated |
| release | the last lines fade on the release spring, then clear |

Reduce Motion: they clear at once.

## Haptics

`onEngage` fires once when a snap catches a line that was not caught in the previous frame. Staying on a line is silent; letting go is silent; catching a second line while on the first fires again.

- Mac: play `NSHapticFeedbackManager.defaultPerformer.perform(.alignment, performanceTime: .now)` in the same frame as the snap. `MetalSnapGuides` does this itself.
- Web: browsers on a Mac trackpad or an iPhone have no haptics. Where `navigator.vibrate` exists (Android), a host may call `navigator.vibrate(8)`. Never replace a haptic with a sound or a flash.

## API

| React | SwiftUI |
|---|---|
| `guides: SnapGuide[]` (`axis`, `position`, `start`, `end`, `kind`) | `guides:` |
| `scale` | `scale:` |
| `onEngage` | built in (the alignment haptic) |

## Rules

- A guide explains a snap that happened. Never draw one the snap did not use.
- Guides move with the snap in the same frame. A lagging guide would contradict the snap.
- ⌘ held turns snapping off, so there are no guides and no haptic.
- One haptic per new line caught, never one per frame.

---

# Sparkline

A small series plot. React: `Sparkline`. SwiftUI: `MetalSparkline`.

## Use it for

- A trend over a short window: one slot per day, `null` for a day with no value (the line breaks).

## Behaviour

- The last dot is in the intent green; the others ring ink2. A dot with `onSelect` is a button named by its `title` ("WED 24 SEP · 6.5"): selecting it focuses its source.
- The dashed baseline sits at the average. Values are plotted, never summarised with a face or a colour.

---

# LED and status badge

A lamp for a state, and a badge that names it. React: `Led`, `StatusBadge` from `@unlocalhosted/metalui`. SwiftUI: `MetalLED`, `MetalStatusBadge`. Sheet reference: KAMUI-16; Kamui brief: 04 §10.

## Use it for

- `Led`: beside words that name a state (a badge, a readout, an engraving, a glass tag). Green live or ok, amber waiting or urgent, red failed, blue a link kind, off idle.
- `StatusBadge`: a system state in the corner: `JEV LIVE`, `JEV OFFLINE · ADD KEY TO KEYCHAIN`, `JEV · NO CONNECTION`, with the command that fixes it as its hint.

## Don't use it for

- Buttons or toggles. A badge is not pressable; a latched tool has its own LED inside the tool button.
- Colour alone. An LED always sits beside words.
- Success or warning banners. Use a toast (success always carries a check) or a notice.

## Anatomy

- **LED**: 5 pt (4 small), a radial recipe centred at 40 % / 35 %, a .5 dark ring; green adds a ≤ 2 pt bloom at 55 %.
- **Badge**: 24 tall pill on the cap material (`btn-bg`, `btn-sh`), padding 0 10 0 9, gap 7: the LED, then the state in the `label` role, ink2.

## API

| React | SwiftUI |
|---|---|
| `Led kind size` | `MetalLED(_:size:)` |
| `StatusBadge led hint` + children | `MetalStatusBadge(_:led:hint:)` |

## Rules

- One LED per object. Its colour means what the list above says, nothing else.
- The badge text is the state, short, uppercase; the fix is the hint, never the label.

## Accessibility

- The badge is a `status` region (announced when it changes). With a hint it is focusable, and the hint is its description and a tooltip on hover and focus.
- LEDs are decorative (`aria-hidden`): the words carry the state.

## Tokens

`--mu-status-*`, `--mu-led-*`, `--mu-led-ring`, `--mu-btn-bg`, `--mu-btn-sh`, `--mu-type-label`. Swift: `MetalStatusMetrics`, `MetalShared.led*`.

---

# Suggestion chip

One question the recognizer asks at middle confidence, beside its block. A composition block: `Chip` (suggestion) › `Chip.Text` + `Label` (small) + `Chip.Actions` › `IconButton` (mini) × 2. React: `SuggestionChip` from `@unlocalhosted/metalui`. SwiftUI: `MetalSuggestionChip`.

## Use it for

- A cue that would change behaviour, found at middle confidence: `Task?`, `Date friday?`, `Track as sleep?`, `Move to Done?`.

## Don't use it for

- A kind, a life glyph or anything decorative. Chips exist only for cues that change behaviour.
- High confidence (the cue applies quietly, with provenance on hover) or low confidence (nothing happens).
- More than one per block. Ask the most valuable question first; the rest wait.

## Confidence routing (a docs table, not props)

| Confidence | Numbers (p) | Choices | Life glyph | Lens | The surface |
|---|---|---|---|---|---|
| Apply (quiet) | p ≥ .85 | ≥ .70 | Layer 1, or ≥ .85 | p ≥ .5 | the cue appears, provenance on hover |
| Suggest | .60 ≤ p < .85 | .40 ≤ c < .70 | named in the engraving only | .3–.5: "maybe" at .5 | one suggestion chip |
| Nothing | p < .60 | < .40 | < .40 | < .3 | no change |

## Anatomy

`Chip variant="suggestion"`: a 20 tall frosted pill with a .5 green ring at .4 over a small raise, the question in ink2. `Label variant="small"`: the confidence (`0.72`), 2 after the question and 3 before the actions. `IconButton variant="mini"`: ✓ (`accept`, green on hover) and ×, 18 × 16. It sits beside the first line of its block (`offset-x` −2, `offset-y` 10 from the block's right edge).

## States and motion

| State | Look | Motion |
|---|---|---|
| arriving | from 3 above and .96, transparent | settle (no overshoot); Reduce Motion: fades in place |
| rest | opacity .62 | – |
| block hovered, or focus inside | opacity 1 | settle |
| button hover | a soft well, ink (✓: green-deep) | settle |
| button pressed | down 1 | – |
| writing | hidden (the host unmounts it) | – |

## API

| React | SwiftUI | Notes |
|---|---|---|
| `label` | `label:` | the question |
| `confidence` | `confidence:` | 0–1, printed to two places |
| `onAccept` / `onDismiss` | `onAccept:` / `onDismiss:` | the host applies or stores the correction |
| `hostHovered` | `hostHovered:` | force full opacity |

```tsx
<div className="mu-icon-trigger block">
  {text}
  <SuggestionChip label="Task?" confidence={0.72} onAccept={makeTask} onDismiss={notATask} />
</div>
```

## Rules

- Accepting finishes the block first, then applies, with Undo. Dismissing stores a correction for the exact text; the chip is never asked again.
- Never while writing, never for kinds or glyphs, at most one per block.
- The confidence is always shown. Hidden confidence is a bug.

## Accessibility

- The chip is a group named "Suggestion: Task? Confidence 0.72"; ✓ is "Accept" and × is "Dismiss", real buttons in the tab order with a 1.5 pt focus ring (dense strip).
- Focus inside the chip brightens it like hover.

## Tokens

Layout: `--mu-suggestion-*` (rest opacity, arrival, the confidence's margins). Look: the chip, label and icon-button recipes. Motion: `--mu-spring-settle`, `--mu-travel-settle`.

---

# Surface

A raised plate or card from a material. React: `Surface` from `@unlocalhosted/metalui`. SwiftUI: `MetalSurface`.

## Use it for

- Anything that floats or is raised: pills, cards, panels, popovers, strips, banners, readouts.

## Don't use it for

- Sunk fields and tracks: use `Well`. Pressable caps: use `Button` or `IconButton`.

## Props

- `material`: `raise` (a card), `raise-lite` (a lighter card), `raise-sm` (a pill), `frost` (a floating bar), `plate` (a palette), `panel` (a gathered panel), `pop` (a menu), `tip` (a hover label), `lens` (a pinned query plate), `graphite` (dark chrome over a blurred, saturated backdrop), `graphite-plain` (the same with no backdrop: a banner, a tip), `graphite-strip` (the same over a plain blur: a tool strip), `graphite-deep` (a readout), `graphite-glass` (a notice).
- `radius`: `pill`, `hero` (30), `card` (24), `plate` (18), `strip` (16), `region` (26), `tip` (11), `row` (12).
- `as`: the element (default `div`).

## Behaviour

- No role, no focus: it is a surface. Give it the role its content needs (`role="dialog"`, `role="status"`).
- Reduce Transparency: frosted materials turn opaque and lose their backdrop blur.

---

# Switch

A setting that is on or off and takes effect at once. React: `Switch` from `@unlocalhosted/metalui` (Base UI Switch). SwiftUI: `MetalSwitch`. Its look is the `switch` recipe.

## Use it for

- Settings that apply immediately: "Sync this canvas", "Share usage data", "Show the grid".

## Don't use it for

- A choice that needs Save (use a checkbox in a form), one of several options (use a segmented control), or a task (use the checkbox in the margin).

## Anatomy

- Track: a sunk pill, 40 × 24 (small 32 × 20), padding 2, the track well; on, a soft green gradient with an inner shadow.
- Thumb: a raised round cap, 20 (small 16), the segmented thumb's material.

## States and motion

| State | Look |
|---|---|
| off | thumb left, plain well |
| on | thumb right (travel 16, small 12) on the part spring; track green, fading on settle |
| pressed | the thumb stretches 4 pt toward where it is going |
| focus | the green ring at offset 2, keyboard only |
| disabled | 40 % |

Reduce Motion: the thumb moves at once; the colour still fades.

## API

| React | SwiftUI |
|---|---|
| `checked`, `defaultChecked`, `onCheckedChange` | `isOn:` |
| `size` (`regular`, `small`) | `size:` |
| `disabled` | `.disabled()` |
| `aria-label` | `.accessibilityLabel` |

## Keyboard and accessibility

- A button with the switch role; Space toggles. Pair it with a visible label (the settings row does), or give it `aria-label`.

## Rules

- A switch acts at once. If the change needs confirming, it is not a switch.
- The label says what is on, not "Enable …": "Sync this canvas".

---

# Time scrubber

Time as a dimension of the surface: drag or step back through what was written. A composition block. React: `TimeScrubber` (earlier `MemoryScrubber`) from `@unlocalhosted/metalui`. SwiftUI: `MetalTimeScrubber` (earlier `MetalMemoryScrubber`).

## Use it for

- Viewing the canvas as it was: blocks that did not exist yet fade out, edited ones show their old text, the world takes a faint sepia (the host's), and the past banner appears.

## Don't use it for

- Undo. Scrubbing only looks; it changes nothing.
- Picking a date for data (a due date, a range). Use a date field.

## Anatomy

330 × 50, bottom left of the canvas:
- a **readout** above: `Label variant="engraved"` with a tiny `Glyph` (the clock at 10, in the engraving's ink), `MEMORY · NOW` or `MEMORY · TUE 23 SEP · 14:10`, and `Button cap="link"` NOW while in the past;
- a `Slider` filling the box: its **track** well (10 tall) with the intent fill up to the knob, **marks** (2 × 4) for moments, **ticks** beneath with the day names (`MON` … `TODAY`, at most seven) as engraved labels, and the knurled 22 pt **knob**.

## States and motion

| State | Look | Motion |
|---|---|---|
| now | knob at the right end, `MEMORY · NOW` | – |
| dragging | the knob under the pointer, grabbing cursor | follows exactly; within 1 % of now it snaps to now |
| a click on the track, ← →, ⇧ ← → | the knob jumps an hour, or a day | part spring (instant under Reduce Motion) |
| past | the readout names the moment; `NOW` shows | – |
| focus | the 2 pt focus ring around the knob | – |

The knob is the one place the scrubber's own arrows win over selection nudges: the host must not nudge while it has focus.

## API

| React | SwiftUI | Notes |
|---|---|---|
| `start`, `end` | `range:` | ms / `ClosedRange<Date>` |
| `value`, `onValueChange` | `selection:` (Binding<Date?>) | `null`/`nil` is now |
| `marks` | `marks:` | block and edit moments |
| `format` | `format:` | the readout for a past moment |
| `title` | `title:` | the word before the moment, default MEMORY |
| `glyph` | (MetalIcon built in) | the clock at 10 |

## Rules

- Scrubbing never changes anything. ⎋ or NOW returns to the present.
- The readout always names the moment; the aria value text says it too.
- Only chrome that changes while in the past is the past banner.

## Accessibility

- A Base UI slider labelled "Scrub through time": ← → step an hour, Shift a day, Home and End jump to the start and now; its value text reads the moment ("TUE 23 SEP · 14:10", or "Now").
- NOW is a real button.

## Tokens

Layout and timing: `--mu-scrubber-*` (box, readout gap, glyph spacing, steps, snap). Look: the slider, label, glyph and button recipes. Swift: `MetalScrubberMetrics`.

---

# Toast

The result of a person's own action, with Undo. React: `ToastProvider` + `useToast()` from `@unlocalhosted/metalui` (Base UI Toast). SwiftUI: `MetalToast` and `.metalToast(_:)`. Sheet reference: the object sheet; 

## Use it for

- What an action did, with Undo: "Moved 3 blocks", "Ticked · wrote [x] into the text", "Pinned as a live region · it updates as you write", "Correction remembered · for this exact text".
- An error that needs attention (it stays until resolved).

## Don't use it for

- Recognition. The surface never toasts, badges or sounds for what it recognised.
- Anything a person must read later, or several messages at once. One at a time.

## Anatomy

A 44 tall smoked pill (`rgba(30,30,33,.92)`, blur 22, its stack), padding 0 6 0 16, gap 12, the `ui` role in `#F2F2F0`; a detail after a middle dot in `#9A9AA0`; an Undo cap (28 tall, `#3A3A3E → #2C2C2F`, a light top lip) with a sunk `⌘Z` keycap. Bottom centre, 92 above the dock. Success carries its check; an error its red mark.

## States and motion

| State | Motion |
|---|---|
| arrive | one nest (8) from below, from .97, on settle; Reduce Motion: fades in place |
| replaced by the next | the old leaves on release, the new arrives |
| Undo pressed | the cap presses 1; the action is undone, the toast leaves |
| time out | undoable 5 s, plain 2.6 s, error never |
| leave | on release, the way it came |

## API

```tsx
// once, at the root
<ToastProvider><App /></ToastProvider>

// anywhere below
const toast = useToast();
toast.show({ title: 'Moved 3 blocks', undo: () => undo() });
toast.show({ title: 'Pinned as a live region', sub: 'it updates as you write', tone: 'success' });
```

```swift
canvas.metalToast($toast)   // toast: MetalToastModel? = .init("Moved 3 blocks", undo: { undo() })
```

## Rules

- The person's own actions only, and always Undo when the action can be undone.
- Say what happened, in the words of the action; a detail, if any, after the middle dot.
- Success carries its check; never colour alone.
- Errors stay until resolved; everything else goes by itself.

## Accessibility

- Base UI Toast: announced politely in a labelled region; F6 moves focus to the toast; the Undo cap is a real button, and ⌘Z does the same (the host's shortcut).

## Tokens

`--mu-toast-*`, `--mu-backdrop`, `--mu-kbd-sunk-*`, `--mu-spring-settle`, `--mu-spring-release`. Swift: `MetalToastMetrics`.

---

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

---

# Toolbar and tool button

A strip of tools. React: `Toolbar`, `ToolButton`, `ToolbarSeparator`, `ToolbarSearch` from `@unlocalhosted/metalui` (Base UI Toolbar, Toggle and Tooltip). SwiftUI: `MetalToolbar`, `MetalToolButton`, `MetalToolbarSeparator`. Sheet reference: the object sheet; 

## Use it for

- The canvas's tools (select, write, region, ink) as latched tools, and momentary actions (zoom, undo) beside them; a search well that opens the palette.

## Don't use it for

- Verbs over a selection (use the tool strip) or a form's actions (use buttons).
- Labelled actions: tools are icon-only with tooltips.

## Anatomy

- **Strip**: 48 tall (36 tools in a 6 nest), radius 24, so a true capsule; the strip frost in the colorway, or graphite (`variant="graphite"`) as the canvas uses in both colorways.
- **Tool**: a circular 36 cap (the button material), a 16 glyph in the icon ink; latched: pressed (`pressed-bg`, `pressed-sh`) with a 4 pt green LED 5 in from its top right.
- **Separator**: a 1 × 22 engraved rule.
- **Search well**: a 36 tall pill well with the placeholder in ink3 and a `⌘K` keycap.
- **Tooltip**: a graphite label chip with the key, 10 above, after 120 ms: `SELECT · V`.

## States and motion

| State | Look | Motion |
|---|---|---|
| strip enters | – | one nest from its edge on surface |
| hover | ink glyph; the glyph's hover pose (the tool is its trigger) | the icon's own |
| pressed | down 1 into a well | 50 ms, back on release |
| latched | pressed + LED | instant |
| focus | a 1.5 ring, no offset | – |
| disabled | 40 % | – |

## API

```tsx
<Toolbar aria-label="Tools" variant="graphite">
  <ToolButton label="Select" shortcut="V" icon={<SelectIcon size={16} />} pressed={tool === 'select'} onPressedChange={() => setTool('select')} />
  <ToolButton label="Write" shortcut="T" icon={<TextIcon size={16} />} pressed={tool === 'write'} onPressedChange={() => setTool('write')} />
  <ToolbarSeparator />
  <ToolbarSearch onOpen={openPalette} icon={<SearchIcon size={14} />} />
</Toolbar>
```

## Rules

- Icon-only tools always have a tooltip with the key, and an accessible name.
- One latched tool at a time in a group; switching is instant.
- Glyphs from the set at 16: they play their hover from the whole tool.

## Accessibility

- Base UI Toolbar: one tab stop, arrows between tools; latched tools are toggles (`aria-pressed`); keys in `aria-keyshortcuts`.

## Tokens

`--mu-toolbar-*`, `.mu-frost-strip`, `.mu-frost-graphite`, `--mu-btn-*`, `--mu-pressed-*`, `--mu-led-green`, `--mu-radius-card`. Swift: `MetalToolbarMetrics`.

---

# Tooltip

Names an icon-only control and its key, one hover away. React: `Tooltip`, `TooltipProvider` from `@unlocalhosted/metalui` (Base UI Tooltip). SwiftUI: `.metalTooltip(_:shortcut:edge:)`. Behaviour: the reference design's `#tip`.

## Use it for

- Every icon-only control: a tool, a lens bar pin, a close button. The name and its key.

## Don't use it for

- Where a cue came from: use the `ProvenanceTooltip` block (a wrapped note with its detail in `Tooltip.Dim`).
- Anything to click or read at length: use a popover or a menu. A tooltip holds no controls.
- A control that already shows its name in words.

## Anatomy

- **Chip**: the graphite fill and shadow with no backdrop, radius 11, padding 6 × 10, 10 mono at 1.45, tracked .05em, ink `#E9E9EB`.
- **Key**: after a middle dot, dimmed (`#8E8E93`): `SELECT · V`.
- **Dim** (`Tooltip.Dim`): the same dimmed ink for any detail in a `label` node.
- **Wrap** (`wrap`): a longer note wraps at 280 instead of one line.
- **Delay and offset** (`delay`, `offset`): a note waits longer than a name (380 against 120) and can sit clear of a chip its trigger shows.
- **Placement**: 10 from the trigger, above by default; flips near the edge.

## States and motion

| State | Look | Motion |
|---|---|---|
| rest | nothing | – |
| hover / focus, 120 ms | the chip | fades in on settle |
| next trigger in the group | the next chip at once | instant |
| leave / press | gone | fades out on settle |

## API

```tsx
<TooltipProvider>
  <Tooltip label="Undo" shortcut="⌘Z">
    <button aria-label="Undo"><UndoIcon size={16} /></button>
  </Tooltip>
</TooltipProvider>
```

```swift
Button(action: undo) { MetalIcon(.undo, size: 16) }
    .accessibilityLabel("Undo")
    .metalTooltip("Undo", shortcut: "⌘Z")
```

## Rules

- Every icon-only control has one, and its own accessible name; the tooltip is visual.
- One line. Name, then key. No sentences, no punctuation beyond the middle dot. Only a block's note (`wrap`) runs longer.

## Accessibility

- The trigger carries `aria-label` (and `aria-keyshortcuts` when it has a key). Keyboard focus shows the tooltip as hover does.

## Tokens

The tooltip recipe, `--mu-tooltip-delay-ms`, `--mu-tooltip-gap`, `--mu-spring-settle`. Swift: `MetalTooltipMetrics`.

---

# Well

A sunk field or track. React: `Well`. SwiftUI: `MetalWell`.

## Use it for

- The field behind an input, the track of a slider or segmented control, a drawn region on a canvas, a well in a dark strip.

## Props

- `variant`: `field`, `track`, `region`, `graphite`. `over` lights a region well green (a drop target).
- `radius`: `pill`, `field` (17), `region` (26), `strip` (15), `row` (12).

## Behaviour

- No role of its own; the control inside carries it. The over state changes on settle.

---

# Icons

`@unlocalhosted/metalui/icons` has 47 Soft Hardware glyphs: monoline + duotone on a 24×24 grid, with a 1.7 stroke. Each glyph has an authored **hover pose** (a reversible spring) and a **press one-shot**. Icons inherit `currentColor`. A static icon (`animate={false}`) at 16px or below uses a tuned small cut with a heavier stroke.

```tsx
import { SendAwayIcon, Icon } from '@unlocalhosted/metalui/icons';

<Button cap="destructive"><SendAwayIcon size={16} />Delete</Button>
<Icon name="synced" size={13} title="Synced" />
```

- **Triggering:** an icon inside any element with the class `mu-icon-trigger` plays from that element, and MetalUI Buttons already have it. Otherwise the icon plays from its own hover and press.
- **Accessibility:** icons without `title` are decorative (`aria-hidden`). Give icon-only controls an `aria-label`.
- **State glyphs morph:** `MorphIcon` (copy, check, plus, close, minus, menu, arrows, chevrons, play/pause, download/upload) transforms into another state glyph instead of being replaced: `<MorphIcon name={copied ? 'check' : 'copy'} size={14} />`.
- **Static:** `animate={false}` keeps a glyph static. Reduced motion does this automatically.
- **SwiftUI and SVG:** the same glyphs ship as SF Symbols (planned), plus static and animated SVGs at `https://metalui.dev/icons/svg/<name>.svg`.

| Component | Name | Category | Hover | Press |
|---|---|---|---|---|
| `SelectIcon` | `select` | Tools | The pointer draws back, clicks its tip down, and a ring opens where it lands. | plays the same act |
| `TextIcon` | `text` | Tools | The T is lifted, struck down onto its foot like a piece of type, and the caret appears after it. | plays the same act |
| `NoteIcon` | `note` | Tools | The corner peels open, the lines are written fresh, and the corner is pressed back down. | plays the same act |
| `ImageIcon` | `image` | Tools | The sun dips behind the ridge, climbs into the sky with a flare of rays, and sets again. | plays the same act |
| `LinkIcon` | `link` | Tools | The two links are pulled apart on their bar, then snap back into each other and a spark squeezes out at the join. | plays the same act |
| `DrawIcon` | `draw` | Tools | The pencil lifts back, comes down on its point and pulls a stroke across the page, then goes back to its place. | plays the same act |
| `PenIcon` | `pen` | Tools | The nib writes a wave of ink, presses at the end of the line, and a drop of ink blooms and soaks in. | plays the same act |
| `MarkerIcon` | `marker` | Tools | The marker plants its chisel flat and sweeps right, laying a see-through band as far as it goes. | plays the same act |
| `LineIcon` | `line` | Tools | The end handle is picked up and dragged back, the pen presses the start, and the line is drawn out to snap onto its end. | plays the same act |
| `ArrowIcon` | `arrow` | Tools | The arrow is drawn back from its held tail and thrust at its mark; the head strikes, compresses into its tip, and rebounds. | plays the same act |
| `RectangleIcon` | `rectangle` | Tools | A handle grabs the far corner and drags the box in toward its pinned corner, then out past its size; let go, it springs back. | plays the same act |
| `EllipseIcon` | `ellipse` | Tools | A pen comes down on the ellipse and draws it again all the way round; the loop closes where it began. | plays the same act |
| `EraserIcon` | `eraser` | Tools | The eraser is pressed onto a scribble and rubbed left, right and left; the scribble goes a pass at a time and crumbs flick away. | plays the same act |
| `LayoutIcon` | `layout` | Tools | The panes are drawn apart, snap back onto the grid, and the gutter rule flashes where they seat. | plays the same act |
| `TidyIcon` | `tidy` | Tools | The loose pills are knocked square against the guide, and registration ticks flash where they sit flush. | plays the same act |
| `SearchIcon` | `search` | Tools | The lens is swept across the field and stops; the focus closes in and a glint crosses the glass. | plays the same act |
| `ZoomInIcon` | `zoom-in` | Tools | The lens is pushed in along its handle and the plus under it is magnified. | plays the same act |
| `ZoomOutIcon` | `zoom-out` | Tools | The lens is drawn back along its handle; the minus recedes and the old view closes in. | plays the same act |
| `FitIcon` | `fit` | Tools | The content grows to the frame and the four corners clamp onto it; the open sides of the frame flash shut. | plays the same act |
| `DuplicateIcon` | `duplicate` | Actions | The copy slides back onto the original, presses to take its impression, and is peeled off into place. | plays the same act |
| `SendAwayIcon` | `send-away` | Actions | The well turns and draws the dot round and down into its centre; it goes under with a gulp and a new dot rises on the rim. | plays the same act |
| `TrashIcon` | `trash` | Actions | The lid swings up on its hinge, hangs open, then falls shut; the bin gives under it and air puffs from the edge. | plays the same act |
| `GroupIcon` | `group` | Actions | The two cards lift, square up into one stack and drop into the folder, splaying back into place as the flap takes the landing. | plays the same act |
| `UngroupIcon` | `ungroup` | Actions | The two cards are pressed together into the tray, then let go: they spring up and apart and a crack of light opens down the seam. | plays the same act |
| `PinIcon` | `pin` | Actions | The pin is drawn up rocking on its point, then driven straight down; its shadow spreads and a shock runs out along the board where it lands. | plays the same act |
| `BoardIcon` | `board` | Actions | The ribbon is lifted and let drop; its top edge catches it, the tail runs on and springs back. | plays the same act |
| `ShareIcon` | `share` | Actions | The arrow crouches into the tray, pushes off and leaves; the next one rises in its place. | plays the same act |
| `UndoIcon` | `undo` | Actions | The hook winds forward, whips back about its centre and reels its tail in; the head's echo carries on, a step back. | plays the same act |
| `RedoIcon` | `redo` | Actions | The hook winds back, whips forward about its centre and reels its tail in; the head's echo carries on, a step on. | plays the same act |
| `MoreIcon` | `more` | Actions | The first dot is struck into the row; the knock runs through and kicks the last one out: there is more. | plays the same act |
| `CloseIcon` | `close` | Actions | A pen crosses it out: the first stroke marks down, the second strikes through it, and the crossing takes the impact. | plays the same act |
| `CheckIcon` | `check` | Actions | A pen writes the tick: down the short leg, pressed into the corner, flicked up the long leg, and the tip rings. | plays the same act |
| `SyncedIcon` | `synced` | Status | The satellite winds back, laps the core once and clicks home into its slot. | plays the same act |
| `OfflineIcon` | `offline` | Status | The lost satellite swings back toward its slot, falls a unit short and is thrown back out. | plays the same act |
| `SyncErrorIcon` | `sync-error` | Status | The orbit heaves to turn, catches on a stop and rattles against it; the mark jolts. | plays the same act |
| `CaptureIcon` | `capture` | Status | The corners close in and hunt for focus, lock, and the shutter blinks over the aperture. | plays the same act |
| `PasteIcon` | `paste` | Status | The clip levers open, the content drops onto the board, and the clip clamps it down. | plays the same act |
| `KeeperIcon` | `keeper` | Status | The character looks up at it, perks up, and nods it in with a slow blink; its ring tips with the nod. | plays the same act |
| `PlusIcon` | `plus` | Actions | The upright is lifted and driven into the waiting crossbar; the knock runs out to the bar's ends. | plays the same act |
| `RegionIcon` | `region` | Tools | The frame is set down on the canvas, and its name writes into the head behind a caret. | plays the same act |
| `TaskIcon` | `task` | Tools | The box is pressed down; while it is held the tick is written, and released it springs back up with a click. | plays the same act |
| `TagIcon` | `tag` | Tools | The cord tugs the tag by its eyelet, and it swings there and comes to hang still. | plays the same act |
| `CalendarIcon` | `calendar` | Tools | Today's leaf curls up and flips over the binding, kicking the rings, and a fresh page is left. | plays the same act |
| `DocumentIcon` | `document` | Tools | A thumb folds the corner down, the page turns, and the next page's lines write in. | plays the same act |
| `ClockIcon` | `clock` | Status | An hour passes: the minute hand sweeps round as the hour hand steps one on, a tick marks the hour, and the hands are set back. | plays the same act |
| `MeIcon` | `me` | Tools | Today's point runs back along your days and climbs to today again, drawing the trend behind it. | plays the same act |
| `SeedIcon` | `seed` | Actions | The seed is dropped in and lands on its bottom; the sprout takes the blow, springs up, and its leaf swings. | plays the same act |
