# Documentation architecture: metalui.dev

This is the information architecture of the docs site (`apps/docs`). It settles who the site is for, how it is laid out, what every page template contains in what order, where each show-don't-tell device is allowed, how the learning path threads through the reference, and what the same data feeds (page, `AI.md`, `llms.txt`, `r/<name>.md`, `check:docs`). `docs/SHOW.md` is the writing standard for one page; this document is the site around it. Where they overlap, this document wins.

Two owner requirements shape everything here, and they are held together rather than traded off:

1. **Show, don't tell.** The reader sees the detail live and plays with it. Reading the docs teaches how a design system is built and how to think about building one.
2. **The reference is not compromised.** Fast lookup, complete API, slots, tokens, states, keyboard and accessibility contract, copy-paste code for React and SwiftUI, and machine readability are as good as the best reference docs (Base UI, Radix, shadcn, Apple HIG). Teaching never buries any of that.

The resolution is structural, not tonal: **reference is generated data with fixed anchors; teaching is authored beats in fixed slots.** Neither can crowd the other out because they don't share a slot.

---

## 1. Readers and their jobs

| Reader | Arrives from | Needs in the first 10 seconds | Leaves with |
|---|---|---|---|
| **Builder in a hurry** | search, `⌘K`, a link from an agent, `llms.txt` | the import line, a working snippet in their platform, the props table one jump away | code pasted, one rule remembered |
| **Designer learning the system** | the home page, the learning path, a foundation page | the real object in front of them and the one thing to notice | the *why* behind a decision, and the vocabulary (recipe, spring class, layer) |
| **Contributor** | `AGENTS.md`, `COMPOSITION.md`, a failing check | the layer a thing lives in, the files it ships as, the gates it must pass | how to add a component without breaking parity |
| **AI agent** | `/AI.md`, `/llms.txt`, `/r/<name>.md`, `/components.json` | a deterministic document: same headings, same tables, exact names, no hover-only facts | a correct import, correct props, the rules |

How one structure serves all four without compromise:

- **Every page has the same skeleton with fixed anchors** (`#usage`, `#api`, `#states`, `#keyboard`, `#tokens`). The builder jumps; the designer scrolls; the agent parses; the contributor diffs.
- **Above the fold is the answer, not the story.** A component page opens with the live object beside its snippet, and a one-line spec strip with jump links. The story starts after the fold.
- **Reference is generated from data**, so it is complete by construction and identical on the page, in `AI.md`, and in `r/<name>.md`. Teaching is authored and gated for quality, but it cannot delete a generated section.
- **Everything hover-shown is also plainly stated.** An inline live word reads as a word; a decision toggle has a caption; a state grid has labels. The agent and the screen reader lose nothing.

---

## 2. Site map

### Sections and URLs

```
/                         Start: what this is, the hero bench, install, three doors (Build with it · Learn from it · Reference)
/start/react              install, styles.css, first component, colorway attribute, Tailwind @theme
/start/swiftui            SwiftPM, import MetalUI, first view, .metalColorway
/start/agents             how to point a coding agent at AI.md / llms.txt / r/<name>.md; what they contain
/learn                    Build a system: the eight chapters, as a numbered path
/learn/<chapter>          one chapter each (§5)
/foundations              Principles (the numbered rules)
/foundations/<slug>       color · typography · radius · spacing · sizing · elevation · materials · motion · transitions (existing)
/components               index: every primitive as a card (live, at rest), grouped by job
/components/<slug>        one primitive
/blocks                   index: compositions and custom objects, each showing its parts
/blocks/<slug>            one block (moves out of /components/*; old URLs redirect)
/icons                    product glyphs, gallery, motion, copy SVG
/icons/life               life glyphs and the feelings composer
/icons/<name>             one glyph: pose, press, sizes, SVG, SF Symbol name
/patterns                 index
/patterns/<slug>          cross-component recipes: dialog-footer · confirm-destructive · undo-toast · empty-state · selection · forms · keyboard-first
/reference                the flat reference index
/reference/tokens         every token: name, both colorways, used by
/reference/springs        the spring classes: k, c, ζ, half, near, reduced policy, CSS and Swift names
/reference/type           roles with metrics
/reference/recipes        every material recipe with its layers
/reference/css            CSS custom properties and classes, Tailwind @theme names
/reference/swift          Metal* symbols by file
/reference/registry       shadcn registry items and what each installs
/changelog                by version; each entry links the pages it changed
/AI.md  /llms.txt  /components.json  /icons.json  /r/<name>.json  /r/<name>.md   machine surface (unchanged paths)
```

Rules for URLs: lower-case slugs, singular component names (`/components/button`), plural sections. Slugs equal `meta.json` `name`. A page never moves without a redirect entry in `apps/docs/src/app/redirects.ts`.

### Navigation

- **Sidebar** (left, sticky): the section groups above in this order: Start · Learn · Foundations · Components · Blocks · Icons · Patterns · Reference. Component and block groups show status readouts (`alpha`, a count). The sliding thumb stays.
- **Header**: Search (`⌘K`), Colorway switch (Bone/Graphite), Motion switch (Reduce Motion on/off; the OS setting is the default), `AI.md`, GitHub. The Motion switch is new and required: every replay demo must be checkable under reduced motion without leaving the page.
- **Right rail** (on pages taller than two screens): "On this page", with the reference anchors listed first (Usage · API · States · Keyboard · Tokens) and the teaching sections after. The rail is the builder's fast path.
- **Layer trail** (top of every foundation, component and block page): `Foundations › Components › Blocks` with the current layer lit, followed by the concrete trail for this page: the recipes and tokens it uses (down), and the blocks that use it (up). Each item is a link. This is the architecture made navigable, and it is generated from `meta.json` `uses` and the tokens list.
- **Bottom of page**: Previous/Next inside the section, and "Learn: chapter n" when a learning chapter covers this page.

### Search

`⌘K`, `Ctrl+K` or `/` opens the site's own `CommandPalette` (dogfooding, and the palette page links to it as its live example). It searches a build-time index (`apps/docs/public/search.json`) of pages, sections, props, slots, states, tokens, springs, type roles, icons, and patterns, with synonyms (`dark mode` → Graphite, `dropdown` → Menu, `switch` → Toggle, `shadow` → elevation and recipes). Results are grouped by kind and show the section anchor. Selecting a token result copies its CSS name; selecting a prop lands on the API row.

### Cross-links

- Every reference row links up to the beat that explains it, when one exists (`props.cap` → the "one signal cap" beat).
- Every beat links down to the reference row it demonstrates.
- Every token on a page links to `/reference/tokens#<name>`; every spring word to `/reference/springs#<class>`.
- Every component page lists the blocks that use it; every block page highlights its components in place.
- Every learning chapter lists the pages it walks through; those pages carry the chapter link back.

---

## 3. Page templates

### The decision: reference-first skeleton with teaching in fixed slots

Three layouts were considered:

- **Two-lane** (prose left, code right, Stripe-style). Rejected: demos need the full width, and the point of the site is the demo. Two lanes halve every bench.
- **Tabs** (Overview / API / Examples, Radix-2021-style). Rejected: tabs hide the API from `⌘F`, from the copy-page Markdown, from the agent, and from a reader who doesn't know the second tab exists. Radix and Base UI have both moved the API back onto the main page.
- **One column, fixed skeleton, reference-first above the fold, teaching beats in their own slots, generated reference sections with stable anchors.** Chosen.

What "reference-first" means here: the fold contains the object, the snippet and the spec strip. What it does not mean: the props table at the top. The full API sits after the teaching, at a fixed anchor, one click from the fold. This matches how Base UI, shadcn and the HIG order a page (see it, use it, then the full table), and it keeps the designer's first screen free of a table.

Progressive disclosure rules that keep reference scannable and teaching present:

- Code under a demo is collapsed by default. The **usage snippet** in the hero is not.
- A decision beat shows the naive and the chosen version as a toggle inside one bench, with a one-line cost. The prose stays under 60 words.
- Reference sections are never collapsed and never tabbed away. The React/SwiftUI **snippet tabs** are the one tab strip allowed, and both snippets are in the DOM (the inactive one is `hidden`, not unmounted) so `⌘F` and the copy-page Markdown find both.
- Every section has a fixed `id`. Section order is fixed per template; a page may omit an optional section but may not reorder.

### 3.1 Component page

| # | Section (`id`) | Content | Kind | Above fold |
|---|---|---|---|---|
| 1 | `head` | Title, one-line description, status chip, layer trail, spec strip: `import { Button } from '@unlocalhosted/metalui'` · `MetalButton` · Props 6 · States 5 · Keys ⏎ ␣ · Tokens 12, each a jump link | reference | yes |
| 2 | `hero` | The real component, interactive, in its most typical state, on a bench; beside it the usage snippet with React / SwiftUI tabs and copy. A DialKit panel may be attached to the hero (content, geometry, travel); the bench caption reads the current dial values. | reference + play | yes |
| 3 | `details` | Two to five **beats** (SHOW.md), each: one sentence · demo · verb-first caption · collapsed code. At least one is a **decision beat**; recipe-backed parts have an **anatomy** beat; motion has a **replay** beat with the Slow control. | teaching | no |
| 4 | `states` | Every state in a labelled grid: rest, hover, focus, pressed, disabled, loading, error, empty, selected, as applies. Rows per variant. Interactive where possible, forced (`data-state`) where not. Slow toggle for the transitions between them. | reference (live) | no |
| 5 | `variants` | Optional. Sizes and caps that don't fit the state grid (compact; own-size caps). Each with a bench, plus the Swift capture beside the web render at the same size. | reference (live) | no |
| 6 | `colorways` | Bone and Graphite side by side; Reduce Motion, Increase Contrast, larger text switchable in place. | reference (live) | no |
| 7 | `composition` | The blocks that use this component, each shown small with the part highlighted. Generated from `uses`. | reference + trail | no |
| 8 | `keyboard` | The behaviour contract as a small pressable keyboard: the key lights, the component reacts. Beside it the plain table: key → effect, focus order, dismissal, ARIA role and names. The table is generated. | reference | no |
| 9 | `api` | Props (React), parameters (SwiftUI), values, defaults, one-line notes; slots (compound parts) with what each renders; render-prop and `className` notes. Generated from `meta.json` `contract`. | reference | no |
| 10 | `tokens` | Every token this component reads, with both colorway values and a link into `/reference/tokens`. The recipe(s) it uses, linked. Generated. | reference | no |
| 11 | `platforms` | Full source, tabbed: React · CSS · SwiftUI · Agent guide. Swift capture beside the web render at equal size (the parity proof). | reference | no |
| 12 | `rules` | Numbered rules with origin, each linked to the beat that shows the failure it prevents. From `agent.md`. | reference + teaching | no |
| 13 | `related` | Previous/Next, Learn chapter, patterns that use this, "Use X instead when…" from the agent guide's *Don't use it for*. | trail | no |

The builder's path is 1 → 2 → (9). The designer's path is 2 → 3 → 4 → 12. The agent reads `r/<name>.md`, which is sections 1, 9, 8, 10, 12 and the *Use it for / Don't* text, in that order, with no demos.

### 3.2 Block page

Same skeleton, with these differences:

- `head` adds the block kind: **composition** or **custom** (with its reason, from `meta.json`).
- `hero` shows the block in a realistic host (a canvas corner, a dialog footer), not on a bare bench.
- `anatomy` replaces `variants` as a required section: hover or focus a part and it lifts and names itself (*this is a `Chip`*), with a link to the component page. For a custom block, the custom drawing is outlined and the reason is one sentence beside it.
- `composition` points **down**: the parts list, from `uses`, with each component small and live. `check:layers` guarantees the list is true.
- `api` documents only what the block adds; inherited props link to the component page rather than being repeated.
- `states` are the block's own (over, dim, past, renaming); a part's states are on the part's page.

### 3.3 Foundation page

| # | `id` | Content |
|---|---|---|
| 1 | `head` | Title, one line, the numbered rules this page owns (as jump chips), layer trail (this foundation → components that consume it). |
| 2 | `hero` | The foundation as an instrument: the spring lab for motion, the radius nest calculator, the type-role specimen sheet, the material under one light. Always interactive, with a DialKit panel when there is a value to tune. |
| 3 | `details` | Beats. Foundations carry the most decision beats on the site (a palette vs a material; a timing table vs mass classes; sizes vs roles). |
| 4 | `rules` | The numbered rules (`R1`, `T3`, …) with origin, each with the failure it prevents shown live in a small bench. This is where "rules with their reasons" lives. |
| 5 | `table` | The reference table for this foundation: every value, both colorways, CSS name, Swift name, used-by. Generated from `tokens.json`. |
| 6 | `platforms` | How the value reaches each platform: the generated CSS excerpt and Swift excerpt, side by side. |
| 7 | `related` | Components that consume this foundation; Learn chapter. |

### 3.4 Learning-path chapter

| # | `id` | Content |
|---|---|---|
| 1 | `head` | `Chapter n of 8`, the title as a claim (*Motion has mass*), one line on what the reader will be able to do afterwards, ~reading time, Previous/Next chapter. |
| 2 | `hero` | The chapter's one demo (§5), already live. The chapter is built around it; every beat below reuses it in a different state. |
| 3 | `beats` | Three to six beats, in the order of the decision: the naive way live → what breaks → the decision → the cost. Prose stays under 60 words between beats. |
| 4 | `try` | One thing to do with the demo before moving on, written as an instruction (*Drag stiffness above 700 and click twice*), with a checkable outcome. |
| 5 | `trail` | Where this chapter's decisions live in the reference: the foundation page, the tokens, the components that depend on it. Each a link with one line. |
| 6 | `next` | The next chapter with its claim. |

A chapter has no API, no props, no tokens table. It links to them. A chapter may not introduce a value that the reference doesn't hold.

### 3.5 Pattern page

| # | `id` | Content |
|---|---|---|
| 1 | `head` | Title, the problem in one line, the components it composes (chips linking to each). |
| 2 | `hero` | The pattern working end to end (a destructive action: button → dialog → toast with Undo → undone). |
| 3 | `details` | Beats for the decisions inside the pattern (why the destructive cap sits left in this dialog; why the toast carries Undo instead of a confirm). |
| 4 | `code` | The whole pattern as copyable React and SwiftUI, not collapsed. This is the pattern's reference. |
| 5 | `checklist` | What must be true for the pattern to be right: one focus target, one signal cap, undo within n seconds, keyboard path. Each checkable against the demo. |
| 6 | `related` | The component pages, and the rules the pattern satisfies. |

---

## 4. Placement map: which device goes where

Refines the demo-kinds table in `SHOW.md`. "Body" means `details`, `rules`, chapter beats and pattern beats. "Reference" means `head`, `api`, `tokens`, `keyboard` tables, `states` grid, `platforms`, captions, nav, search, and every machine surface.

| Device | Use it in | Never in | Notes |
|---|---|---|---|
| **Side by side** (wrong vs right) | body; foundation rules | reference | The wrong way is labelled *naive* or *flat*, never *bad*. |
| **Toggle** (one property on/off) | body; hero (as a dial) | api/tokens tables | A toggle must have a caption naming the property. |
| **Scrub** (continuous value) | body; foundation hero | reference | The readout is tabular figures; the value is real, and the dial's unit is shown. |
| **Replay** (motion, interruption) | body; states grid transitions | reference | Every replay has Slow (0.25×) and respects the Motion switch. |
| **Slow** | wherever there is motion | – | Required, not optional. Enforced. |
| **Stress** (long labels, 9999, 200 % text, Increase Contrast) | body; states grid; colorways | – | At least one stress beat per component with text. |
| **Anatomy** (explode a recipe or a block) | body (components with recipes); blocks (required) | reference | Layers are named with their token names; each name links. |
| **Decision beat** (naive → breaks → decision → cost) | body; foundations; chapters | hero, reference | At least one per component page; the cost line is mandatory. |
| **Layer trail** | head of every page | – | Generated; hand-written trails drift. |
| **Rules with reasons** | `rules` section; foundation rules | api table notes | The rule is stated in plain text first; the demo is beside it, never instead of it. |
| **Inline expressive words** | ledes, beat setup sentences, chapter prose, pattern prose | api, tokens, keyboard, states labels, captions, code, nav, search, `AI.md`, `r/<name>.md`, error text | See rules below. |
| **DialKit panel** | hero/playground; foundation instruments | reference sections | One panel per page. Its values appear in the bench caption so the copy-page Markdown carries them. |
| **Swift capture beside web** | `variants`, `platforms`, block hero | body beats | Always at equal size; it is a parity proof, not decoration. |
| **Pressable keyboard** | `keyboard` | – | Sits beside the plain table, never replaces it. |

### Rules for inline expressive parts

An inline part is a word or phrase in running prose that is a live MetalUI object: an **engraved** label with its lip, a spring word that **settles** on hover, a count that ticks, a colour name with its swatch dot, a **⌘K** that is a real `Kbd`, a component name rendered at text size.

1. **It reads as a word first.** With CSS off, motion off, hover unavailable, or in the copy-page Markdown, the sentence is complete and correct. The reveal adds; it never carries information alone.
2. **Metric-neutral.** The part's box at rest equals a plain span's box. Reveals (a peeled lip, a drawn curve, an expanded swatch) are positioned outside flow. Nothing on the line moves. Checked by measuring the paragraph's line boxes before and during hover.
3. **Density.** At most three per paragraph and one per sentence. A paragraph with three is a short paragraph.
4. **Keyboard.** Every part is focusable (`tabindex=0`), has a role and an accessible name (`engraved: label with lip; press to toggle the lip`), and does on focus/Enter/Space exactly what it does on hover. Escape restores rest. Focus is the standard 2 pt ring.
5. **Motion off.** Under Reduce Motion the reveal becomes a static comparison (the lip shown off beside on; the spring curve drawn without the bounce). Nothing loops. Nothing autoplays.
6. **One kind per word.** A word is either a live part or a link, never both. Component names link; the rendered miniature is the link's content.
7. **The value is copyable.** A token or colour part copies its CSS name on click/Enter (absorbed from the reference-design site's recognition cues), and says so in its accessible name.
8. **Never in reference.** The api, tokens, keyboard and states tables use plain code spans. An agent reading `r/<name>.md` and a builder scanning the table need the literal name, not a demo.

---

## 5. The learning path: Build a system

Eight chapters at `/learn/<slug>`. Each is built around one live demo, teaches one decision, and threads into the reference and back. The order follows dependency: nothing in chapter n needs chapter n+1.

| # | Slug | Claim | Built around (the demo) | Teaches | Links out to | Linked back from |
|---|---|---|---|---|---|---|
| 1 | `material` | Start from a material, not a palette | One surface under one light: a plate whose fill, rim, highlight and contact shadow all derive from a light angle you can drag | Why every value follows from a material decision; why a hex palette produces stickers | `/foundations/materials`, `/foundations/elevation`, `/reference/recipes` | Materials, Elevation, Surface |
| 2 | `tokens` | Name values once | The tokens table as a live object: change a bone value and watch four components update; switch to Graphite and see that it is not an inverted Bone | Colorways as separate resolved sets; one source per fact; what a token is *not* (a variable for convenience) | `/foundations/color`, `/reference/tokens`, `/reference/css` | Color, every `tokens` section |
| 3 | `recipes` | Looks are layers, and layers are data | The swatch or card anatomy: explode into fill, sheen, top highlight, rim, glow, contact shadow; edit one layer and see CSS and Swift update together | One recipe per look; how a layer stack renders on both platforms; why parity is a generator, not a review | `/foundations/materials`, `/reference/recipes`, Surface, Well, Swatch | Materials, every Anatomy beat |
| 4 | `motion` | Motion has mass | The spring lab: pick a mass class, watch the puck and the curve, click twice mid-flight, toggle Reduce Motion | Springs from stiffness and damping, not durations; interruption; the reduced policy per class; the 1 pt press that stays | `/foundations/motion`, `/foundations/transitions`, `/reference/springs`, Button, Switcher | Motion, Transitions, every Replay beat |
| 5 | `type` | Type is roles, not sizes | The role sheet: readout, label, ui, title; a timer in proportional vs tabular figures; the lip on an engraved label on and off | Roles as contracts; tabular figures where numbers change; the lip as material, not decoration | `/foundations/typography`, `/reference/type`, Label, Kbd, SizeReadout | Typography, Label |
| 6 | `composition` | Primitives and blocks | A block (Tool strip) being assembled from its components in front of you, then rearranged by slots without forking | Direction of imports; slots over props; when custom is honest | `docs/COMPOSITION.md` rendered as `/foundations#layers`, `/blocks`, Tool strip, Region | every `composition` section, every block `anatomy` |
| 7 | `contracts` | Behaviour is written once, implemented twice | The pressable keyboard driving Switcher in React and the Swift capture side by side | Keys, focus, dismissal and names as a contract in `agent.md`; what Base UI gives; what Swift must match | every `keyboard` section, `/start/agents` | Switcher, Menu, Dialog |
| 8 | `keeping-true` | Drift is a tooling problem | A pasted hex literal, the lint firing, the fix; a recipe edited on one platform, the parity check failing; a product word in a prop name, the names lint | Lints, recipe parity, pixel gates, neutral names, `check:docs` itself | `docs/PARITY.md`, `docs/NEUTRAL_NAMES.md` rendered, `/reference/registry` | the contributor path |

How chapters and reference pages link:

- A chapter's `trail` lists its reference pages with one line each. A reference page's `related` shows *Learn: 4 · Motion has mass* when a chapter covers it. Both come from the same `learn.ts` map, so they can't disagree.
- A chapter never holds a value the reference doesn't. If a chapter wants to show `stiffness 500`, that number comes from `tokens.json` through the same import the page uses.
- The home page shows the path as eight numbered rows with the chapter's demo in miniature (static under Reduce Motion). Progress is remembered per viewer in browser storage (a convenience only).

---

## 6. Machine-readable layer

### Sources of truth

| Fact | Lives in | Feeds |
|---|---|---|
| Identity, layer, kind, `uses`, slots, status, files, base, symbols | `packages/metalui/src/<layer>/<name>/meta.json` | nav, layer trail, `components.json`, registry, `check:layers`, `check:slots` |
| **Contract**: props, params, slots (with what each renders), states, keyboard, a11y, tokens, recipes | `meta.json` → `contract` (new) | `api`, `keyboard`, `tokens`, `states` sections; generated tables in `agent.md`; `AI.md`; `r/<name>.md`; search index; `check:docs` |
| Use it for / Don't / Rules / prose | `<name>.agent.md` (hand-written sections; tables generated between markers) | page `rules` and `related`; `AI.md`; `r/<name>.md` |
| Beats and page composition | `apps/docs/src/pages/<layer>/<name>.doc.ts` (new; the page renders from it) | the page; `check:docs`; search index (captions) |
| Learning path map | `apps/docs/src/app/learn.ts` | chapter `trail`, page `related`, home |
| Values | `tokens/tokens.json` | everything; no page holds a literal |

### `contract` in `meta.json`

```jsonc
{
  "name": "button",
  "layer": "component",
  "contract": {
    "props": [
      { "name": "cap", "swift": "cap:", "type": "'standard' | 'primary' | 'destructive' | 'link' | 'graphite' | 'strip' | 'strip-danger'", "default": "'standard'", "note": "At most one primary or destructive cap per group.", "beat": "one-signal-cap" },
      { "name": "size", "swift": "size:", "type": "'default' | 'compact'", "default": "'default'", "note": "Ignored by link, graphite and strip caps." },
      { "name": "disabled", "swift": ".disabled(_:)", "type": "boolean", "default": "false" },
      { "name": "focusableWhenDisabled", "type": "boolean", "default": "false", "from": "base-ui" },
      { "name": "render", "type": "Base UI render prop", "from": "base-ui", "note": "Set nativeButton={false} for a non-button element." }
    ],
    "slots": [],
    "states": [
      { "name": "rest" }, { "name": "hover", "motion": "settle" }, { "name": "focus" },
      { "name": "pressed", "motion": "release", "beat": "press-physics" }, { "name": "disabled" }
    ],
    "keyboard": [
      { "key": "Enter", "effect": "activates" }, { "key": "Space", "effect": "activates on release" }
    ],
    "a11y": { "role": "button", "name": "the label; aria-label when icon-only", "notes": ["Disabled renders at 40 % and skips icon motion.", "Press travel stays under reduced motion; it is feedback."] },
    "tokens": ["button-h", "button-px", "btn-bg", "btn-sh", "pressed-bg", "pressed-sh", "primary-bg", "destructive-bg", "spring-release", "focus"],
    "recipes": ["cap", "cap-pressed"],
    "swift": { "symbol": "MetalButton", "style": "MetalButtonStyle(cap:)" },
    "snippets": { "react": "snippets/button.tsx", "swift": "snippets/button.swift" }
  }
}
```

Rules: token names must exist in `tokens.json`; recipe names must exist in `componentRecipes`; a `beat` reference must exist in the page's `.doc.ts`; every state that names a `motion` must name a spring class. Slots for a compound part list `{ name, renders, required }`.

### `<name>.doc.ts`

```ts
import { definePage } from '../../lib/doc';

export default definePage({
  name: 'button',
  hero: { demo: 'ButtonHero', dials: true },
  beats: [
    { id: 'material', kind: 'decision', caption: 'Toggle between the flat fill and the recipe', anatomy: true, refs: ['recipes.cap', 'tokens.btn-sh'] },
    { id: 'press-physics', kind: 'replay', caption: 'Click rapidly and watch the release retarget', slow: true, refs: ['states.pressed', 'tokens.spring-release'] },
    { id: 'label-drum', kind: 'replay', caption: 'Press Copy and watch the width settle', slow: true, refs: ['rules.B4'] },
    { id: 'one-signal-cap', kind: 'side-by-side', caption: 'Count the primaries in each footer', refs: ['props.cap', 'rules.B1'] },
    { id: 'long-label', kind: 'stress', caption: 'Drag the width until the label wraps', refs: ['props.size'] },
  ],
  sections: ['states', 'variants', 'colorways', 'composition', 'keyboard', 'api', 'tokens', 'platforms', 'rules', 'related'],
  inline: ['settles', 'engraved', 'kbd', 'color'],   // which inline part kinds this page uses, for the density check
});
```

The page component imports this and renders sections from it in the fixed order, so the data and the page cannot diverge. Every `refs` entry resolves to a contract row or a rule id; the row gets the "why" link back to the beat.

### What each output takes

| Output | Sections, in order |
|---|---|
| Page | the template order (§3) |
| `r/<name>.md` (agent guide) | title + one line; Use it for; Don't; Anatomy (from `agent.md`); States table (generated); API table (generated); Keyboard and a11y (generated); Rules; Tokens (generated); snippets |
| `AI.md` | intro + global rules + every `r/<name>.md` + icons |
| `llms.txt` | index: one line per page (components, blocks, foundations, patterns, chapters), with the `r/<name>.md` link where one exists |
| `components.json` | identity + contract summary (props names, slots, states, keys) |
| `search.json` | page, section, prop, slot, state, token, spring, role, icon, pattern entries with synonyms |
| Copy-page Markdown | the live DOM, as today; inline parts render as their plain word (with the value in parentheses for tokens) |

`build-agent-docs` regenerates the marked table blocks inside `agent.md` (`<!-- mu:api -->…<!-- /mu:api -->`, `mu:states`, `mu:keyboard`, `mu:tokens`) from `contract`, and `--check` fails on a stale block, the same as every other generated file.

### `check:docs`

Two halves, both under `npm run check` (static) and `npm run test:e2e` (rendered). Both fail the build.

**Static (data), for every component, block, foundation and chapter:**

Reference completeness
- `contract.props` equals the exported prop names from the TS type (via the TypeScript compiler API on `<name>.tsx`), minus Base UI passthroughs listed with `from: "base-ui"`. A prop in code without a row fails; a row without a prop fails.
- `contract.slots` equals the compound parts exported (`Region.Root`…) and the Swift `@ViewBuilder` slot names (`check:slots` already does this; `check:docs` requires the `renders` text).
- Every interactive component has a non-empty `keyboard` and an `a11y.role`.
- `tokens` ⊆ `tokens.json`; `recipes` ⊆ `componentRecipes`; every recipe on the page has an anatomy beat.
- Both snippets exist, compile (`tsc --noEmit` on the React snippet; `swift build` on the Swift snippet file in a `Snippets` target), and import only names in `components.json` / `icons.json`.
- A Swift capture exists in `docs/captures/` for every `variants`/`platforms` section that declares one.
- `agent.md` generated blocks are fresh; its hand-written sections (Use it for, Don't, Anatomy, Rules) are present and non-empty.
- Every page has `head`, `hero`, `api`, `keyboard` (interactive), `tokens`, `platforms`, `related`. Blocks additionally `anatomy` and `composition`. Foundations `rules` and `table`. Chapters `try` and `trail`.

Teaching standards
- Two to five beats on a component or block page; three to six on a chapter; at least one `decision` beat per component/block/foundation.
- Every beat `kind` is in the list; every caption starts with a verb from the allowed list (`Watch, Drag, Click, Press, Switch, Toggle, Hover, Count, Compare, Type, Resize, Tab`).
- Every `replay` beat has `slow: true`. Every state with `motion` has a replay beat or the states grid's Slow.
- Every `refs` entry resolves; every rule id in `agent.md` is referenced by at least one beat or is marked `{ demo: false, reason }`.
- Components with numeric readouts (`contract.states` or props mention count/value/time) have a `tabular` beat or reference the type chapter.

**Rendered (Playwright, against the built site), a feature slice per template:**
- Prose between beats ≤ 60 words (measured on the DOM between `[data-beat]` boundaries).
- Inline parts: ≤ 3 per paragraph, ≤ 1 per sentence; each focusable with a name; Enter does what hover does; Escape restores; hover changes no line box (measured); with `data-mu-motion="reduce"` nothing animates and the sentence text is unchanged.
- No hover-only information: for every element with a title/tooltip/reveal in a reference section, the same text exists in the DOM without hover.
- Every replay has a working Slow control and stops under the Motion switch.
- `⌘K` finds every prop and token name on the page.
- The copy-page Markdown for a component page contains the API table, the keyboard table, both snippets and every caption.
- Both colorways render every section without overflow at 390 px and 1440 px.

---

## 7. First three pages, in order

1. **`/components/button`** proves the component template, the beat machinery, `contract`, `.doc.ts`, the generated tables, the inline parts, and `check:docs`. Everything after reuses it.
2. **`/foundations/motion`** proves the foundation template and the spring lab (absorbed from the reference-design site: mass-class buttons, puck on a track with stops, curve plot, k/c/ζ/half/near readouts, Reduce Motion toggle, SwiftUI excerpt). Button's press-physics beat links into it, and chapter 4 is built on it, so it is the first foundation to be right.
3. **`/blocks/tool-strip`** proves the block template: a small composition (Surface(graphite-strip) › Button(strip) × n + Rule + Button(strip-danger)) whose parts highlight and name themselves, whose `composition` list is generated from `uses`, and whose layer trail runs down to Button and up to the pattern page for destructive actions. It also proves the `/blocks/*` URL move with a redirect.

Then chapter 4 (`/learn/motion`), because its demo already exists at that point, and it proves the chapter template and the two-way links.

### Page 1: Button, beat by beat

The proposed outline (hero "press it", material decision + anatomy, press-physics replay, label drum, one-primary rule, states, colorways, keyboard, platforms, layer trail) is right in substance and wrong in shape. Its problems: eleven items of which five (states, colorways, keyboard, platforms, layer trail) are template sections, not beats, so calling them beats invites prose where a table belongs; it has no usage snippet above the fold, so the builder scrolls; it omits `size="compact"` and the own-size caps, which are half the API; it has no stress beat, so long labels and 200 % text go unshown; and "material decision + anatomy" is two beats fused, which would make the one bench do two jobs.

The page:

**head.** *Button.* "A press-in pill. Held, it sinks 1 pt and its shadow collapses into a well; released, it springs back." Status `alpha`. Layer trail: Foundations (materials › cap recipe; motion › release) › **Components › Button** › Blocks (Tool strip, Past banner, Suggestion chip, Toast). Spec strip: `import { Button } from '@unlocalhosted/metalui'` · `MetalButton` · Props 5 · States 5 · Keys ⏎ ␣ · Tokens 10 · Recipes 2.

**hero.** Left: a `primary` "New Canvas" on the bench, live. The caption reads the dials: `h32 · pad 15 · icon 14 · travel 1`. DialKit: label, cap, icon, disabled; height with derived padding (h/2 − 1); travel. Right: the usage snippet, React/SwiftUI tabs, both in the DOM, copy button. The builder is done here.

**details.**

1. *The cap is an object.* (decision) "A button drawn as a flat fill reads as a sticker on the page." Bench: the same label on a flat fill (`background: bone-2`) beside the cap recipe; a toggle **Flat / Recipe**. Caption: *Toggle between the flat fill and the recipe; watch the bottom edge.* Cost line: two more shadow layers to keep in parity. Code collapsed: the `cap` recipe from `tokens.json`. Refs: `recipes.cap`.
2. *Anatomy.* (anatomy) "Five layers make the cap." Bench: the cap explodes on hover/focus into fill, top highlight, rim, contact shadow, coloured shadow; each layer labelled with its token name (a link). Caption: *Hover the cap to peel its layers apart.* Refs: `tokens.btn-bg`, `tokens.btn-sh`.
3. *The press is physics.* (replay + slow) "Held, it travels 1 pt in 50 ms and its shadow collapses into a well. Released, it rides the `release` spring." Bench: the button and a second one with `transition: 200ms ease`; Replay, Slow 0.25×, and a live trace of the release curve with `k 500 · c 40 · half 71 ms · near 178 ms` in tabular figures. Caption: *Click rapidly: the spring retargets mid-flight; the transition restarts.* Cost line: a spring is a curve you sample, not a duration you write. Refs: `states.pressed`, `tokens.spring-release`, `/foundations/motion`.
4. *A changing label turns, it doesn't snap.* (replay + slow) "Copy → Copied is one step on a drum." Bench: a real copy button using `SwapText` and `MorphIcon`, beside the same button that replaces its text. Caption: *Press Copy and watch the width settle; the naive one blinks.* Refs: `rules.B4`, `/foundations/transitions`.
5. *One signal cap per group.* (side by side) "A footer with two primaries has none." Bench: three dialog footers: three primaries, none, one. Caption: *Count the primaries in each footer.* Refs: `props.cap`, `rules.B1`, `/patterns/dialog-footer`.
6. *Labels wrap late, and never twice.* (stress) Bench: a width scrubber on a standard button with "Export all canvases as PDF"; 200 % text size and Increase Contrast toggles. Caption: *Drag the width until the label wraps.* Refs: `props.size`.

That is six beats; the page may ship with four (1, 3, 4, 5) and add 2 and 6 in the same week. Beat 2 is required before the page is declared done because the cap is recipe-backed.

**states.** Grid: rows `standard · primary · destructive`, columns `rest · hover · focus · pressed · disabled`. Real elements with forced state attributes where a state can't be held (pressed, hover), a Slow toggle for the transitions. Labels in the `label` role.

**variants.** Compact (26, `raise-sm`, ink2 until hover) with the icon and the `Kbd` example; the own-size caps `link`, `graphite`, `strip`, `strip-danger` each on the surface they belong to. The Swift capture beside the web render at the same width.

**colorways.** Bone and Graphite side by side, all three caps; Reduce Motion, Increase Contrast and larger text as in-place toggles.

**composition.** Generated: Tool strip (Button(strip)), Past banner (Button(graphite)), Suggestion chip, Toast (Undo). Each small, live, the Button highlighted.

**keyboard.** The pressable keyboard (Tab, Enter, Space) beside the generated table: `Enter` activates · `Space` activates on release · `Tab` focus ring 2 pt at 2 pt offset, `:focus-visible` only · role `button` · name is the label; icon-only needs `aria-label` · form submission when `type="submit"`.

**api.** The generated table (five props, Swift parameters, values, defaults, notes); the `from: base-ui` rows marked; the `render`/`nativeButton` note; no slots (stated).

**tokens.** The ten tokens with both colorway values and the two recipes, linked.

**platforms.** React · CSS · SwiftUI · Agent guide, full source.

**rules.** B1 one signal cap (→ beat 5) · B2 icons lead at the control's icon size · B3 the press is feedback, not a result · B4 changing labels morph (→ beat 4) · B5 the label is a verb.

**related.** Switcher (latched choice instead of an action), IconButton (icon-only), Toggle (on/off); Patterns: dialog-footer, confirm-destructive; Learn: 4 Motion has mass, 3 Recipes.

---

## 8. Anti-patterns

- **Storytelling that hides the API.** Any page whose props table is more than one jump from the fold, or where a prop is documented only inside a beat's prose. The table is generated; the beat links to it.
- **Demos without a point.** A bench with no caption naming the one thing to notice, or a "playground" whose dials change nothing the reader was told to watch.
- **Hover-only information.** A value, a name or a rule that exists only in a tooltip, a reveal or a title attribute. Everything shown on hover is also in the DOM as text.
- **Motion that doesn't stop.** A replay with no Slow, a loop with no end, anything that ignores the Motion switch or `prefers-reduced-motion`.
- **Inline parts that move the line.** A word that grows, a swatch that pushes its neighbours, a curve that opens a gap. Metric-neutral or not at all.
- **Inline parts that decorate.** A live word that doesn't teach its own property. If hovering **settles** doesn't show the settle spring, it's a plain word.
- **Prose that explains what the demo already shows.** More than 60 words between beats means the demo is wrong.
- **Two sources for one fact.** A number typed into a page, a prop table maintained by hand beside the type, a Swift snippet that isn't compiled. Every value comes from `tokens.json`, every table from `contract`, every snippet from a built file.
- **Tabs that hide reference.** Anything but the React/SwiftUI snippet strip, and even that keeps both in the DOM.
- **Screenshots of components.** The only images on a component page are the Swift captures, and they sit beside the live web render at equal size as a parity proof.
- **Evaluative adjectives.** "Delightful", "beautiful", "seamless", "quickly". The demo decides; the number is real.
- **Product words.** No app names, feature names or mascots in prose, props, slugs or captions (`docs/NEUTRAL_NAMES.md`). Realistic sample text is fine ("New Canvas"); a product vocabulary is not.
- **A teaching device in a reference slot.** A decision toggle in the props table; an expressive word in a caption; a dial on the tokens table.
- **A chapter that holds truth.** A learning chapter that states a value, a rule or a name the reference doesn't hold, or that becomes the only place something is documented.
- **The page as proof.** A section that says "Swift matches" without the capture, "keyboard works" without the pressable keyboard and the table, or "accessible" without the contract.

---

## Open questions for the owner

1. **URL move for blocks.** `/components/<block>` → `/blocks/<block>` with redirects: confirm before page 3.
2. **Pending renames** (`docs/NEUTRAL_NAMES.md`): `LensBar` → `FilterBar`/`QueryBar`, `MemoryScrubber` → `TimeScrubber`. The site map above uses the current slugs; a rename changes slug, route and registry name together.
3. **Snippets as compiled files.** Snippets live in `snippets/` beside the component and are type-checked (React) and built (Swift, in a `Snippets` target). This adds a Swift target and a `tsc` pass to `check`. Agree?
4. **Motion switch in the header.** Required by the rendered gate. Confirm the control (a switch beside the colorway pill) and whether it also forces `data-mu-motion="reduce"` on the demos only or on the whole site.
5. **Icon detail pages** (`/icons/<name>`): one route per glyph, or a panel inside the gallery with a deep link (as the reference-design site does)? The site map assumes routes for the machine layer's sake.
6. **Changelog source.** Generated from conventional commits touching `packages/` and `swift/`, or hand-written per release?
7. **Progress memory** for the learning path: per-viewer browser storage only (proposed), or none.
