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

The package is ESM only: use `import`, not `require()`. In a Tailwind v3 app import `@unlocalhosted/metalui/styles.unlayered.css` instead of `styles.css` (the same rules without cascade layers, which Tailwind v3's PostCSS rejects). Components are client components (they carry `"use client"`), so they work in Next.js App Router.

Or copy the source into your project with the shadcn CLI (Tailwind v4): `npx shadcn@latest add https://metalui.dev/r/<name>.json`. The first install also adds `@unlocalhosted/metalui` and imports its `tokens.css` and `theme.css` into your global CSS, which is what styles the copied component; files land under `components/metalui/` in the same layout as the package, so imports between components resolve. Whole screens (blocks) install the same way as `https://metalui.dev/r/block-<name>.json` into `components/metalui/screens/<name>/`. Both routes work in Vite and Next.js (`app/` and `src/app/`). Release notes: https://metalui.dev/changelog.

SwiftUI: add the package `https://github.com/vijayksingh/metalui` and `import MetalUI`. It needs macOS 14 or iOS 17.

## Global rules

- **Colorway:** set `data-mu-colorway="bone" | "graphite"` on any ancestor, or use `.metalColorway(.bone)` in SwiftUI. Without it, the system color scheme decides. Don't restyle materials with custom backgrounds, borders or shadows.
- **Signal color:** one per object, at most. Phosphor green marks intent (focus, selection, live state), never a call to action. Red is destructive only. `--mu-success` always sits beside a check glyph and `--mu-warning` beside a label or glyph, never hue alone. `--mu-photon` is for its listed places only. Status LEDs: green on, amber waiting, red failed, blue capture or link kind, off idle.
- **Feelings tints** (`.mu-tint-ember | blush | tide | spark | graphite | dusk | iris`, SwiftUI `.metalTint(.blush)`): only on glyphs that carry a feeling, or a moment with an unmistakable one (a date is affection, a party is joy). The tint names the kind of feeling (joy, affection, calm, wonder, neutral, low, tension), never its strength, which the glyph's shape shows. The tint colors the glyph's stroke, so the line itself evokes the feeling; a tinted glyph's vessel is not filled. Never red or green, never on words, never for status or intent. Off under Increase Contrast and inside `data-mu-untinted` (`.metalUntinted()`), so the glyph must read without it.
- **Motion:** it comes from the component, and reduced motion is built in. Don't add your own transitions on top. Under Reduce Motion each spring class resolves one way (`tokens.json` `springs.*.reduced`): part, object, hinge and refusal apply at once; surface and settle lose travel and fade in place; release (the press) plays as authored. Lift is two motions (T5): a hover lift rides `settle` (one step, no overshoot, still by the time the pointer leaves); a land (a drop into place) rides `object`, a stop, and rare. Web: ride `--mu-spring-<class>-d` and multiply enter or exit offsets by `--mu-travel-<class>`; `data-mu-motion="reduce"` on any ancestor forces the policy. SwiftUI: `.metalAnimation(.settle, value:)` or `MetalMotion.resolve(_:reduceMotion:)`, never `accessibilityReduceMotion` directly.
- **Read motion policy:** `motionReduced(element)` combines the OS preference with `data-mu-motion="reduce"` on an ancestor and the docs site motion switch. `useReducedMotion(element)` subscribes to live changes for rendering; both are SSR safe.
- **Remove a row:** `leaveRow(element, onLeft, { onStart })` uses the release spring and the row's own nest distance. Capture neighboring bounds in `onStart`, remove in `onLeft`, and cancel on unmount. OS or scoped Reduce Motion removes rows immediately; the release spring for a pressed cap remains unchanged.
- **Carry a colorway through a portal:** `usePortalColorway(anchorElement)` reads the nearest explicit ancestor colorway and follows changes. Copy its result to `data-mu-colorway` on the portalled positioner; keep the popup outside clipping containers. SwiftUI carries `.metalColorway()` through its environment.
- **Choose by component name.** Only use exports listed in `components.json` and `icons.json`. Never invent names.
- **Show real outcomes.** An animation never stands in for a real result such as a save, delete or sync.

---

# CSS system: tokens, layout, and Tailwind

MetalUI uses Tailwind v4. The shared CSS foundation adds named spacing and three layout utilities to that system. It keeps approved material, typography, and spacing values, and does not change a consumer's Tailwind scale or fonts.

Read this before adding layout rules, introducing a token, or changing a shared type role. Read [COMPOSITION.md](https://github.com/vijayksingh/metalui/blob/main/docs/COMPOSITION.md) to place UI in the six composition layers and [PERFORMANCE.md](https://github.com/vijayksingh/metalui/blob/main/docs/PERFORMANCE.md) for motion constraints. The running reference is `/foundations/spacing` in the docs site.

## Sources and generated output

| Fact | Edit here | Generated output |
|---|---|---|
| Shared spacing steps | `tokens/tokens.json`, `foundations.space` | CSS `--mu-space-N`, Tailwind `--spacing-mu-space-N`, Swift `MetalSpace` |
| Relationships between groups | `foundations.layout.gap` | CSS `--mu-layout-gap-*`, Tailwind `--spacing-mu-*`, Swift `MetalLayout.gapRelated`, `gapGroup`, `gapSection` |
| Adaptive grid minimum | `foundations.layout.column-min` | CSS `--mu-layout-column-min`, Swift `MetalLayout.columnMin` |
| Control typography | `foundations.type` | `--mu-type-*`, Tailwind `type-*`, Swift type values |
| Documentation typography | `editorial.type` | CSS `--mu-type-doc-*` and tracking properties, Tailwind `type-doc-*` |
| Component dimensions and material recipes | Existing component and recipe entries in `tokens/tokens.json` | Named component utilities and matching Swift recipes |

`scripts/build-tokens.mjs` defines how these facts become CSS and Swift. It also emits `packages/metalui/styles.layout.generated.css`, the explicit candidate list imported by the precompiled package build. Run `npm run generate` after changing the source. Never edit `tokens.css`, `theme.css`, `styles.layout.generated.css`, generated Swift, or `public/` outputs by hand.

Semantic gap entries reference approved spacing steps. A new numeric token must express a reusable design decision, not merely make one screenshot look right. Keep `foundations.space` as the shared ladder; do not create a second ladder inside a docs page.

## Choose the relationship, then the spacing

| Relationship | Utility | Current value | Use |
|---|---|---|---|
| Related | `gap-mu-related` | 12px | Items read as one group: actions, labels and supporting content |
| Group | `gap-mu-group` | 24px | Distinct peer groups or cards |
| Section | `gap-mu-section` | 48px | Separate sections in one composition |

These names describe layout relationships. They are defaults for arranging content, not replacements for every existing recipe dimension. A dense menu row, a button's icon gap, press travel, and hit area each belong to their own component contract. Keep those recipe-specific tokens when working inside that control.

Use a shared step when the relationship needs a specific approved amount, such as `gap-mu-space-8` or `p-mu-space-24`. Use a semantic gap when intent is the useful fact. Use `gap`, not child margins, for uniform sibling spacing; this avoids first/last-child exceptions and survives wrapping.

The approved ladder is `0, 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80` pixels. Those suffixes are token names, not multipliers of the host's `--spacing`. For example, `gap-mu-space-12` remains 12px when the host's `gap-12` means 3rem.

## Three layout utilities

These utilities arrange existing content. They do not create React components, behavior, material recipes, or new composition layers. Keep semantic HTML and Base UI controls inside them.

| Utility | Behavior | Default gap |
|---|---|---|
| `mu-stack` | Flex column, `min-width: 0` | Related |
| `mu-cluster` | Flex row that wraps, centered items, `min-width: 0` | Related |
| `mu-auto-grid` | Equal-width columns that fit available space, `min-width: 0` | Group |

```tsx
<section className="mu-stack gap-mu-section">
  <header className="mu-stack">
    <h2 className="type-doc-heading">Project settings</h2>
    <p className="type-doc-prose">Choose where your work belongs.</p>
  </header>
  <div className="mu-auto-grid">
    {projects.map((project) => <ProjectCard key={project.id} project={project} />)}
  </div>
  <div className="mu-cluster gap-mu-space-8">
    <Button>Cancel</Button>
    <Button cap="primary">Save</Button>
  </div>
</section>
```

`ProjectCard` above stands for the application's existing content. The layout utility does not impose a card look or interaction. Documentation uses `type-doc-*`; application controls use their existing component type roles.

Override a default gap with one explicit gap utility on that element. HTML class order is not CSS precedence; putting a conflicting class last does not guarantee it wins. Avoid combining layout utilities on one element or mixing `mu-stack` with an unconditional `flex-row`. Choose one structure, then add alignment, padding, or a deliberate responsive variant.

### Adaptive columns

The generated grid declaration is:

```css
grid-template-columns:
  repeat(auto-fit, minmax(min(var(--mu-layout-column-min), 100%), 1fr));
```

The default minimum is 240px. `auto-fit` collapses unused columns, so fewer items can use the available width. The inner `min(..., 100%)` lets a column shrink below that preferred minimum in a narrow parent. It prevents the grid track itself from forcing a 240px-wide overflow.

Children still need a content policy. Long unbroken text, fixed-width media, and controls can overflow even when the track fits. Use appropriate text wrapping, `min-w-0`, and responsive media sizing; do not hide overflow merely to conceal a broken layout.

Override `--mu-layout-column-min` locally for a documented content constraint. Inside MetalUI source, add that constraint to `tokens.json` and generate a named utility; arbitrary values and variable shorthand are rejected by `check:utilities`. Consumers may set the property in their own local CSS. Do not change the global minimum to repair one special composition.

## CSS imports and distribution lanes

### Tailwind v4 source or registry integration

Import the tokens and generated theme after Tailwind in the application's CSS entry:

```css
@import "tailwindcss";
@import "@unlocalhosted/metalui/tokens.css";
@import "@unlocalhosted/metalui/theme.css";
```

Tailwind scans the application's literal class names and emits the utilities and variants used there. Ensure copied source is included in that scan. Keep class names complete: `gap-mu-space-${size}` is not a discoverable candidate. Map choices to complete names or expose an intentional CSS property through local consumer CSS.

Tailwind variants apply normally, for example `@md:gap-mu-group`. A container variant needs a query container on an ancestor. There is no separate responsive property syntax or layout runtime.

### Precompiled npm CSS

Import `@unlocalhosted/metalui/styles.css` once for packaged components. Its build includes the three base layout classes, `gap-mu-related/group/section`, and the `gap-mu-space-N`, `p-mu-space-N`, `px-mu-space-N`, and `py-mu-space-N` families for approved steps. Basic compositions work without a consumer Tailwind build:

```tsx
import '@unlocalhosted/metalui/styles.css';

<div className="mu-stack gap-mu-group p-mu-space-24">
  <Button>Open project</Button>
  <Button>New project</Button>
</div>
```

The precompiled CSS is a finite set. Other spacing families such as margin or per-side padding, and responsive variants, require a consumer Tailwind build; a spacing theme key does not mean every associated class ships precompiled. Compile those choices through Tailwind v4, or write local CSS using the generated custom properties. `styles.unlayered.css` is the compatibility output for integrations that cannot consume cascade layers; its overrides follow ordinary cascade and specificity rules.

These additions describe the source and build in this repository. Publishing a new npm version and deploying docs are separate release steps; do not infer release status from a local build.

## Responsive layouts follow available space

Start with intrinsic behavior: wrapping clusters and adaptive grids often need no breakpoint. Choose a container query when the structure changes because its panel becomes wide enough. Choose a viewport query when the whole application shell changes, such as its navigation placement.

```tsx
<div className="@container">
  <div className="mu-stack @md:gap-mu-group">
    {/* Existing content responds to this parent, even in a narrow side panel. */}
  </div>
</div>
```

The outer element establishes the container; its descendant can respond to it. The utility does not add a container automatically. Use Tailwind's existing breakpoints and container sizes unless a content constraint justifies a new named token. Test the same composition in a narrow container on a wide viewport as well as a narrow viewport.

Preserve DOM reading order. Avoid CSS `order` or positional placement that makes visual order differ from keyboard or screen-reader order. A wrapping action row must retain useful labels, reachable focus, and sufficient hit areas.

## Typography and rhythm

Keep complete type roles together: family, weight, size, line height, and tracking form one decision. Prefer generated `type-ui`, `type-body`, and related control roles for UI; prefer `type-doc-heading`, `type-doc-prose`, and related editorial roles for docs. Do not add a second literal font declaration merely because its selector is docs-only.

Rhythm combines line boxes with external spacing. As a review aid, nominal half-leading is `(line height - font size) / 2`: a 30px/36px role has 3px per side; a 15px/24px role has 4.5px per side. This arithmetic uses font size, not measured glyph bounds. Actual perceived spacing depends on font metrics, content, and wrapping; inspect real text.

Do not derive all line heights from one multiplier. Headings and paragraphs have different reading needs. Do not apply a universal half-leading rule or trim line boxes globally: it would change host content, controls, and focus geometry. The existing approved roles remain authoritative. Use editorial title and lede roles for shared docs page headers. Legacy docs CSS still has some literal typography; reconcile one shared docs slice at a time rather than changing every page or the approved token values in a layout change.

## Cascade layers and override boundaries

The package declares CSS precedence as:

```css
@layer theme, base, components, utilities;
```

For normal declarations, later layers win over earlier layers before selector specificity is compared. The docs import their reference CSS in `base`; Tailwind utilities can then override it intentionally. Put new reusable docs recipes in `components`, keep global docs defaults in `base`, and leave single-purpose overrides in `utilities`. Avoid unlayered rules that accidentally beat the whole layered system. Unlayered normal CSS outranks layered normal CSS; `!important` reverses layer precedence and is not the default solution.

CSS cascade layers govern declaration precedence. [The six composition layers](https://github.com/vijayksingh/metalui/blob/main/docs/COMPOSITION.md) govern what UI represents and which dependencies it may use. A layout utility belongs to foundation rules; adding it does not create a Part, Component, Object, Instrument, or Place. A CSS rule in `components` is not automatically a Component in that domain model.

Override layout at the composition boundary. Override materials and state behavior through a component's documented API and recipe tokens. Keep focus rings, Base UI accessibility, reduced-motion handling, and shared CSS/Swift material stacks intact. Do not restyle internal selectors from a page to simulate a new component variant.

## Host safety

- New theme keys use a MetalUI name: `--spacing-mu-space-12`, not `--spacing-12`.
- Never redefine the host's `--spacing`, `--font-sans`, or `--font-mono` in the package.
- Package CSS has no universal reset. The docs may own their own base rules and 1px local scale; consumers retain theirs.
- Shared layout utilities are opt-in classes with no runtime work, animation, measurements, or observers.
- Keep recipe dimensions named. Numeric host spacing classes such as `gap-12` do not have a stable package meaning.
- Avoid global overrides of `--mu-space-*` and semantic gaps to introduce app density. Scope deliberate overrides to a composition and check nested content.

CSS references resolve where the custom property is declared. The semantic gaps are declared
on `:root`, so overriding `--mu-space-12` on a nested panel changes `gap-mu-space-12` there,
but does not recompute the inherited `--mu-layout-gap-related`. To change a panel's default
related gap, set `--mu-layout-gap-related` on that panel directly (or redeclare its reference
there). Prefer an explicit `gap-mu-space-8` utility for a single row. Never assume changing
one shared step locally also changes every semantic alias inherited from an ancestor.

## Extend and validate one slice

1. Choose an existing relationship, type role, and layout before introducing anything new.
2. If a new foundation decision is needed, put it in `tokens.json`, teach the generator, and document its meaning here. Keep CSS and Swift shared values aligned.
3. Build one composition with the existing components. Include its actual empty, long-content, and narrow-parent cases.
4. During iteration, run the relevant generator freshness and host/utility checks: `node scripts/build-tokens.mjs --check`, `npm run check:host-safe`, and `npm run check:utilities`. Run the targeted Playwright feature slice once the behavior is ready; write integration or e2e coverage only.
5. Inspect both colorways and reduced motion on the running docs page. For layout, verify wrapping, overflow, focus, gap overrides, and independence from a host's spacing scale. A successful compile alone does not prove these.
6. Before closing the coherent change, run the repository's required `npm run build` and `swift build`. Commit that slice; do not publish, tag, push, or deploy without the requested release action.

## Inspiration and adoption decisions

Lism CSS prompted this foundation work. We borrow concepts through Tailwind and MetalUI's existing token pipeline:

- [Cluster](https://lism-css.com/en/docs/primitives/l--cluster/) makes wrapping horizontal composition explicit. MetalUI provides `mu-cluster` with a named default gap.
- [AutoColumns](https://lism-css.com/en/docs/primitives/l--autoColumns/) expresses minimum useful column width and fits a narrow parent. MetalUI uses the same intrinsic grid idea, choosing `auto-fit` as its default.
- [Typography](https://lism-css.com/en/docs/tokens/typography/) and [half-leading](https://lism-css.com/en/docs/half-leading/) encourage reasoning about text rhythm. MetalUI keeps its approved type roles and uses half-leading as a review aid, without adopting Lism's universal line-height rule.
- [Responsive styling](https://lism-css.com/en/docs/responsive/) uses container queries by default. MetalUI documents intrinsic layout first, then ordinary Tailwind container variants when structure must change.
- [CSS methodology](https://lism-css.com/en/docs/css-methodology/) makes cascade roles explicit. MetalUI retains Tailwind's layer order and documents override boundaries.

We do not install Lism, adopt its class notation or React wrappers, replace Tailwind, substitute its numeric scale for the approved sheet, or perform a broad component migration. Future agents should build on the shared contracts above, one foundation or component slice at a time.

## Copied blocks and nested containers

Every copied block names its root `@container/block`. Breakpoints that describe the whole block must use that name (`@md/block:`, `@max-md/block:`, or `@min-[34rem]/block:`). Nested sublayouts use a distinct name when their own available width matters: Settings uses `@container/panel` and `@md/panel:` for its fields. An unnamed `@md:` asks the nearest container, so adding a ScrollArea or a contained panel can silently change a deeper layout. Keep viewport breakpoints only for viewport behavior, not block sizing. Each block instance resolves the closest ancestor named `block`, so nesting copied blocks remains local.

---

## Components

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

---

# Alert dialog

A question that must be answered before going on. React: `AlertDialog` from `@unlocalhosted/metalui`, on Base UI AlertDialog. SwiftUI: `MetalAlertDialog` (work in progress). The plate, scrim and layout are the `dialog` recipe's; the `alert-dialog` recipe adds the text gap, and the refusal is the system's refusal spring.

## Use it for

- Confirming something that loses work or can't easily be undone: "Delete 3 regions?", "Discard this draft?".

## Don't use it for

- Anything with Undo (just do it and offer Undo in a toast), information (use a toast), or a form (use a dialog).

## Anatomy

- Plate: the dialog's (360 wide, padding 20, near the top of the viewport) over its scrim.
- Title: the question. Description: what happens if you agree, 4 below it, body type, ink2.
- Actions: Cancel, then the confirm button last (destructive red for a loss).

## States and motion

| State | Look | Motion |
|---|---|---|
| opening | scrim and plate | the dialog's rise on the surface spring |
| open | focus on Cancel | – |
| click outside | it stays | the plate shakes once on the refusal spring, one nest (6) aside |
| Cancel or Esc | closes, nothing done | release spring |
| confirm | runs, then closes | release spring |

Reduce Motion: no shake; the rise is a crossfade.

## API

| React | SwiftUI |
|---|---|
| `AlertDialog.Root` `open`, `onOpenChange` | `isPresented:` |
| `AlertDialog.Popup` forwards typed Base UI `initialFocus` / `finalFocus`; `Title`, `Description`, `Actions` | `title:`, `message:` |
| `AlertDialog.Cancel` (children: its label) | `cancel:` |
| `AlertDialog.Confirm` `onClick`, `tone` (`destructive`, `primary`), `icon`, `hold` | `confirm:`, `role: .destructive` |

## Keyboard and accessibility

- An `alertdialog` named by its title and described by its description. Focus is trapped inside and starts on Cancel; Esc is Cancel; focus returns to what opened it.

## Rules

- The title is the question; the confirm button says the action ("Delete regions"), never "OK" or "Yes".
- Say what is lost in the description. If nothing is lost, it is not an alert dialog.
- A click outside is refused, not obeyed: the shake says an answer is needed.

For permanent loss, Confirm may pass `hold` and a `trash` icon. Button blocks short clicks before Base UI's Close handler runs, so early release leaves the question open. Space and Enter use the same hold; completion fires the action once, then closes. The cancel button remains initially focused. The host can pass `hold={false}` for an ordinary single-pointer confirm; the question still guards the action. Never require holding for an undoable delete.

The deletion launcher and confirm both lead with the authored `trash` glyph: `icon={<TrashIcon />}`. Cancel stays a plain choice. The native destructive confirm already chooses `.trash`; its launcher uses `MetalButton("Delete regions…", icon: .trash)` before `.metalAlertDialog(...)`. Opening the question is an ordinary press; only the irreversible confirm requests holding. The enclosing key is the sole accessible control, and the glyph's finite act stops at rest or under reduced motion.

---

# Attachment

A file someone attached. React: `Attachment` from `@unlocalhosted/metalui` (named so it never shadows the browser's `File`). SwiftUI: `MetalAttachment`. An object: the plate is the raised `surface`, the type sits in a `well`, the upload uses the progress fill; the `attachment` recipe adds the layout and the land and leave.

## Use it for

- Files attached to a note, a message or a form: before, during and after upload.

## Don't use it for

- Browsing files (use a table or a list of cards), or links (use a link card).

## Anatomy

- Plate: raised, at least 52 tall, filling its host's column without an intrinsic min/max width. The host chooses a narrow composer or a full-width list. Radius 14, padding 8; errors expand the plate with Try again below their own line.
- Type: a 36 sunk well with the extension engraved (PDF, PNG).
- Name: ui type; a long name keeps its extension and cuts the middle.
- Line: a canonical 14 glyph and meta type, ink3: the size, "Uploading · 40 %", "Uploaded · 2.5 MB", or the error in red. The extension well remains visible.
- Track (uploading): 3 tall, the progress fill. Try again (failed), Remove (a mini key).

## States and motion

| State | Look | Motion |
|---|---|---|
| added | the plate | lands from one nest above on the object spring (T5b) |
| uploading | upload glyph; the track fills; the line counts | settle spring; no idle glyph clock |
| complete | check and Uploaded with the size | the glyph morphs; the words turn on the shared drum |
| failed | sync-error and the reason in red; Try again with retry glyph | morph; announced once |
| removed | – | one nest down, fading, on the release spring (T9); then gone |

Reduce Motion: it appears and goes at once; the fill still conveys progress, and the glyph settles at its full contour. Completion persists until the host changes the receipt; the component runs no reset timer.

## API

| React | SwiftUI |
|---|---|
| `name`, `size` (bytes) | `name:`, `size:` |
| `progress` (0–100 while uploading) | `progress:` |
| `uploadState?: "idle" / "uploading" / "complete" / "error"` | `uploadState: MetalAttachmentUploadState?` |
| `error`, `onRetry` | `error:`, `retry:` |
| `onRemove` (called after it has left) | `remove:` |
| `onLeaveStart` (capture neighbors before leaving) | `onLeaveStart:` |

## Keyboard and accessibility

- A `group` named by the file name. The progress is a named `progressbar`; a failure is an `alert`. Remove is a button named "Remove report.pdf"; move focus to a neighbour after removing.
- `onLeaveStart` fires once before motion, including immediate removal under Reduce Motion. Capture neighboring bounds there, then close the list after `onRemove`. `leaveRow` handles interruption, repeated calls and cleanup; the remove and retry keys stay disabled while leaving.

## Rules

- The host controls completion. With `uploadState` omitted, existing `progress` / `error` infer uploading / error / idle. Clearing either prop can mean cancellation, so it never infers success. At 100 %, the glyph remains upload until the host explicitly supplies `"complete"` / `.complete`. Retry requests work; it does not claim delivery.
- Success uses a polite web status; error keeps its alert. Native posts an `AccessibilityNotification.Announcement` when a completion/error receipt changes, and exposes the same words as its accessibility value.
- Say why an upload failed in a few words ("Too large, 25 MB at most"), and offer to try again.
- Keep the extension visible; cut the middle of long names.

Native receipt words apply instantly under Reduce Motion and clear any retiring full-motion face when the scope changes mid-settle. Only the clipped words stack changes its policy identity; the file plate, result glyph and remove/retry controls stay mounted. `e2e/native/run-attachment-label-proof.py` verifies public error-to-complete receipts in both colorways and a live motion switch using own-window metadata pixels.

---

# Avatar

A person, as a small raised disc. React: `Avatar` and `AvatarGroup` from `@unlocalhosted/metalui`, on Base UI Avatar. SwiftUI: `MetalAvatar` (work in progress). An object: the disc is the raised `surface`, presence is the LED part; the `avatar` recipe adds sizes, the ring and the group's spread.

## Use it for

- Showing who: an author, who is here, who something is shared with.

## Don't use it for

- Things that are not people (use an icon or a glyph), or a person's details (link to them; a preview card can show more).

## Anatomy

- Disc: raised surface, round; small 24, regular 32, large 44.
- Initials: the first letters of the first and last names, ink2, in the size's type.
- Photo: covers the disc once it has loaded.
- Presence: the LED at the lower right on a 2 ring of the page's ground.
- Group: discs overlap by 8, each ringed in the ground; past `max` (4), a +N disc.

## States and motion

| State | Look | Motion |
|---|---|---|
| loading | the initials | – |
| loaded | the photo | fades in on the settle spring |
| broken photo | the initials stay | – |
| group, hover | the discs apart | one grid step each, on the object spring |
| group, leave | back together | release spring |

Reduce Motion: the photo appears at once; the group does not spread.

## API

| React | SwiftUI |
|---|---|
| `Avatar` `name`, `aria-label`, `src`, `size` (`small`, `regular`, `large`), `presence` (`live`, `waiting`, `off`) | `MetalAvatar(name:image:accessibilityLabel:)` |
| `AvatarGroup` `people`, `max` (4), `size`, `aria-label` | – |

## Keyboard and accessibility

- By default, an avatar is an image named by the person's name (and presence: "Ana Rocha, here"). React `aria-label` and SwiftUI `accessibilityLabel` name it independently from the initials source. React's explicit label replaces the complete default label, so include presence in it when relevant: `<Avatar name="A Rocha" aria-label="Ana Rocha, host, here" presence="live" />` displays AR and announces "Ana Rocha, host, here". Each `AvatarGroup.people` entry accepts the same `aria-label` override.
- An explicit empty label (`aria-label=""` or `accessibilityLabel: ""`) hides the disc from assistive technology. Use this when adjacent text or the containing control already conveys the person's identity and presence.
- A group is a named `group`; the +N disc says "3 more". Avatars take no focus; wrap one in a link or button when it goes somewhere.

## Rules

- Always give the name for initials. Omit the optional accessible label to use the name and presence by default.
- Colour never carries presence alone: include it in a custom label or adjacent text, too.

---

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

# Breadcrumbs

Where you are, as a path you can climb. React: `Breadcrumbs` from `@unlocalhosted/metalui`. SwiftUI: `MetalBreadcrumbs` (work in progress). The `breadcrumbs` recipe sets the gaps, the chevrons, the fold key and the arrival; the fold opens the `menu`.

## Use it for

- Deep, nested places: a folder in a folder, a region inside a canvas inside a space.

## Don't use it for

- A flat site (use the navigation menu), steps of a task (use a stepper), or history (use Back).

## Anatomy

- `nav` named "Breadcrumb", an ordered list.
- Levels above: links in ui type, ink2, ink on hover. The current level: ink, not a link.
- Separators: the shared `chevron` at 10, quarter-turned right and static in ink3, hidden from assistive tech.
- Fold: past `max` (4) levels, the first stays, then a quiet shared `more` glyph key (glyph 12) (22 tall, radius 6) that opens a menu of the hidden levels, then the last two.

## States and motion

| State | Look | Motion |
|---|---|---|
| first render | the path | still |
| deeper | a new last crumb | arrives one grid step from the right, fading in, on the settle spring |
| up | fewer crumbs | the path shortens |
| folded | shared `more` key | its menu opens on the menu's own motion |
| focus | the green ring on a link | – |

Reduce Motion: the new crumb fades in without travel.

## API

| React | SwiftUI |
|---|---|
| `items` (`id`, `label`, `href`) | `path:` |
| `max` (4) | – |
| `renderLink(item, props)` (a router's link) | – |
| `onNavigate(item)` (a folded level chosen) | `onSelect:` |

## Keyboard and accessibility

- A `nav` landmark ("Breadcrumb") with an ordered list; the current level says `aria-current="page"`. Tab moves through the links and the fold key; the fold opens with Enter or ↓.

## Rules

- The last crumb is where you are and is not a link.
- Name levels as they are named where they live.

The separators use `Icon` / `MetalIcon(.chevron)` from the set with animation disabled: they name a path, not an action. The fold key uses the shared `more` act and its accessible level count. Reduced motion keeps both glyphs complete and still.

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
- The **icon** (`icon` prop) leads the label: 16 in the 32 cap, 6 before the label; 14 and 7 in the compact cap. Link, graphite and strip caps use the compact 14 glyph. The cap sizes it, so pass the glyph without a size.
- The **label** is text: a verb, or a verb and its object.
- **Compact** (`size="compact"`, including primary and destructive): 26 tall, 11 padding, 12 pt, a 14 glyph 7 before the label, the button fill on `raise-sm`, ink2 until hover. The canvas pills: "seed a sample day", "lenses ⌘K", a lens row's "Open".
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
| `icon` | `icon:` (a `MetalIconName`), or the `icon:` view builder | a glyph element, such as `<ShareIcon />` or `<MorphIcon name=… />`; leads the label, sized by the cap (16, compact 14) | – |
| `hold` | `hold:` | boolean, or custom milliseconds (React); destructive or strip-danger cap | `false` |
| `disabled` | `.disabled(_:)` | boolean | `false` |
| `focusableWhenDisabled` | – | boolean | `false` |
| `render` | – | Base UI render prop, for `<a>` or custom elements (set `nativeButton={false}`) | – |
| any `<button>` attribute | – | `type`, `onClick`, `aria-*` | – |

```tsx
import { Button } from '@unlocalhosted/metalui';
import { ShareIcon, TrashIcon } from '@unlocalhosted/metalui/icons';
import '@unlocalhosted/metalui/styles.css';

<Button cap="primary" onClick={create}>New Canvas</Button>
<Button onClick={close}>Cancel</Button>
<Button size="compact" onClick={seed}>seed a sample day</Button>
<Button icon={<ShareIcon />} onClick={share}>Share</Button>
<Button cap="destructive" icon={<TrashIcon />} onClick={remove}>Delete</Button>
```

```swift
import MetalUI

MetalButton("New Canvas", cap: .primary) { create() }
MetalButton("Cancel") { close() }
MetalButton("seed a sample day", size: .compact) { seed() }
MetalButton("Share", icon: .share) { share() }
MetalButton("Delete", icon: .trash, cap: .destructive) { remove() }
```

## Rules

- Use at most **one** `primary` or `destructive` cap per group. Everything else is `standard`.
- `destructive` is only for actions that remove or discard data. Pair it with confirmation when the action can't be undone.
- The label is a verb, or a verb + object, in title case. The button text itself says what happens.
- **An action names itself with a glyph and a verb.** A button that does something (save, share, export, delete, send, attach, copy, new) passes its glyph as `icon`: `<Button icon={<ShareIcon />}>Share</Button>`. A plain choice (Cancel, Done, Close as a word, OK) stays words only. Use the glyph whose act is that verb (`share`, `trash` or `send-away`, `duplicate`, `plus`, `pen` for Rename); don't borrow one that means something else.
- Pass the glyph as `icon`, not as a child, and don't give it a size: the cap sets it (16, compact 14). Children still take a glyph for compatibility, but `icon` is the documented slot. The button is the icon's trigger: it plays its act when the button is hovered, focused from the keyboard or clicked, so don't wire up animation yourself.
- Don't restyle the cap with custom backgrounds, borders, or shadows. Colorway comes from `data-mu-colorway` (`bone` | `graphite`) on any ancestor. When no ancestor sets it, `prefers-color-scheme` decides.
- Don't signal success with the press motion. Show the real result: a toast, a state change, or an error.
- **A state change of the same control morphs, never swaps** (Transitions T1–T3, `docs/MORPH.md`). When one control's meaning changes (Copy → Copied, Pin → Unpin, Collapse → Expand), its glyph morphs with `MorphIcon` (from `@unlocalhosted/metalui/icons`) on the settle spring, and its label turns on the drum with `SwapText` (from `@unlocalhosted/metalui`), together: `<Button icon={<MorphIcon name={copied ? 'check' : 'copy'} />}><SwapText value={copied ? 'Copied' : 'Copy'} /></Button>`. The width settles to the new label. Only a glyph outside the morph family (a solid character glyph) turns on the drum with `SwapIcon` instead.

## Accessibility

- It renders a native `<button>`. Enter and Space activate it, and it takes part in form submission. Base UI handles the disabled state and `focusableWhenDisabled`.
- The focus ring is a 2px `--mu-focus` outline at a 2px offset, shown only for keyboard focus (`:focus-visible`).
- An icon-only Button needs `aria-label`. Icons inside labelled buttons are decorative (`aria-hidden`).
- Disabled buttons render at 40% opacity and don't play their icon motion.
- Under reduced motion, transitions are instant. The 1px press travel stays, because it is feedback, not decoration.

## Tokens

`--mu-button-*` (sizes, press, fade, focus), `--mu-raise-sm` (compact), `--mu-btn-bg`, `--mu-btn-sh`, `--mu-pressed-bg`, `--mu-pressed-sh`, `--mu-primary-*`, `--mu-destructive-*`, `--mu-spring-release`, `--mu-focus`. Swift: `MetalButtonMetrics`, `MetalTokens.<colorway>.btnBg/btnSh/pressedBg/pressedSh`, `MetalCaps.primary/destructive`, `MetalSprings.release`.

## Irreversible confirmation

`<Button cap="destructive" hold icon={<TrashIcon />} onClick={removeForever}>Delete forever</Button>` requires an 800ms hold. Pointer, Space and Enter share one clock. Release early, leave the cap, blur, Escape, a hidden tab or disabling the key cancels without invoking the action. A short tap reveals “Hold to confirm”; the button always has that accessible description. Repeated keydown does not restart the clock. Completion invokes one click and gives one material-depth settle on the object spring.

The darker red fill scales from the leading edge with linear time; release drains it on the release spring. It remains informational under Reduce Motion, while the completion settle and trash lid motion stop. Trash's authored act pauses at its open-lid checkpoint: preparation stretches over the hold, cancellation reverses it, confirmation continues the same act through closure. No frame loop runs at rest.

Use hold only for permanent loss, inside a question naming the consequence. Undoable deletion stays a plain press. Hosts must offer `hold={false}` for pointers that cannot hold; the Alert dialog page demonstrates that setting. Swift offers the same timing and fill through `MetalButton(..., hold: true)`, long press and held Space/Return, plus an accessible Confirm action.

A custom rendered element must forward Button's ref and input events. Without loaded tokens an unspecified hold refuses activation rather than firing immediately. An async host owns completion/error reporting; holding is confirmation, not evidence of success.


## Async action

Use `state="idle" | "waiting" | "done" | "error"` for the host's request. Set waiting before starting the request and done only after committing its result; catch failures and set error. Waiting and done refuse repeat presses while preserving focus, and error accepts a retry. The host resets to idle when there is a new action. Pass a stable `MorphIcon` whose name becomes `check` or `sync-error`; Button owns the arc and label, the host owns the result's meaning. Do not import another spinner or hold the cap down by hand.

The key reserves its glyph slot and the widest of the initial text and configured labels, before any request. Use text children and `waitingLabel`, `doneLabel`, `errorLabel` for this face. With an explicit host width, the key stays that width. `showDelay` defaults to 400ms; `minVisible` defaults to 300ms once the wait appears. A quick result skips the arc. A newer request cancels a deferred old result. `aria-busy` follows the actual host request; a polite status announces start/result once. The visible wait's retained minimum also refuses another action. The arc inherits cap ink; only mounted waiting arcs run, hidden/offscreen arcs pause. Reduce Motion removes rotation, retaining the arc's opacity breath and semantic result.

Swift: `MetalButton("Save", state: state, waitingLabel: "Saving…", doneLabel: "Saved", errorLabel: "Try again") { save() } icon: { MetalMorphIcon(state == .done ? .check : state == .error ? .syncError : .save) }`. The glyph clock pauses when absent, when the scene is inactive and under Reduce Motion (a still arc). The same shared delay/minimum, width reservation, refusal and host-owned result apply.

Swift dense strips may use `cap: .strip` / `.stripDanger`; the danger strip accepts hold. `iconOnly: true` preserves the spoken title and makes the cap square at its recipe height, for use behind a tooltip in ToolStrip. Group styling and tooltip remain the host’s responsibility.

React `iconOnly` also makes the key square at its cap height and keeps the waiting/result glyph in that slot without a label footprint. Provide its verb as `aria-label` (or text children for an automatic spoken label), and use Tooltip for discovery. Button waiting labels still announce the request and result.

The start/result status is a visually hidden sibling outside the busy key, with polite atomic reading. Keep it outside any additional busy wrapper when composing a host; reserve busy for the action or item itself. This span never changes text or glyph-key geometry.


## Copy a result

Copy uses `copy`; Paste uses `paste`. Keep one `MorphIcon` mounted in the `icon` slot and turn the label with `SwapText`. Set Copied only after the clipboard write resolves; on refusal keep `copy`, announce “Copy failed”, and permit another attempt. Clear the acknowledgement after a short pause; a second successful copy starts a new pause. A page or code-tab change clears feedback belonging to the previous content. Clean up the timer and ignore stale promises on unmount. The docs’ page-copy, code-copy and Button example implement this pattern with real clipboard writes.

```tsx
<Button icon={<MorphIcon name={copied ? 'check' : 'copy'} />} onClick={copy}>
  <span aria-live="polite"><SwapText value={copied ? 'Copied' : 'Copy'} /></span>
</Button>
```

In SwiftUI, keep the native glyph mounted in the icon builder and use the Button result face for its drum. The host writes through `UIPasteboard.general.string` on iOS or checks the Boolean result of `NSPasteboard.general.setString(_:forType:)` on macOS, then updates `copied`. Reset that host state after the acknowledgement pause. `MetalMorphIcon` supplies the same shared geometry and settle motion; reduced motion lands the full result immediately.

```swift
MetalButton("Copy", state: copied ? .done : .idle, doneLabel: "Copied", action: copy) {
    MetalMorphIcon(copied ? .check : .copy)
}
```

---

# Button group and split button

Related operations cut from one raised cap. React: `ButtonGroup`, `ButtonGroupReadout`, `SplitButton`; Swift: `MetalButtonGroup`, `MetalButtonGroupReadout`, `MetalButtonGroupToggle`, `MetalSplitButton`.

## Use it for

Undo / Redo, steppers around a zoom window, and a primary operation with a menu of alternatives. Use `ToggleGroup joined` for choices that stay latched; it keeps Base UI's roving focus and each key's lamp. Do not group unrelated operations or more than four keys.

## Material and motion

One Button recipe draws the whole bar. Padding and gaps are zero; only the outer ends round. The Rule recipe cuts fixed hairline grooves with a light lip, inset by one nest. Each segment has square inner edges, lights itself on hover, and sinks one point into the shared Button pressed recipe. Its neighbours and the seams stay still. Focus is inset inside the segment; disabled keys remain visible at the Button opacity and refuse activation. Whole-group disabled forwards to the child keys. Compact uses the existing Button 26/14 dimensions.

`rocker` is an optional experiment for exactly two action keys: the bar tips one degree toward the operated end on the part spring, and returns on release, blur, pointer leave/cancel. No tilt under scoped, OS or document reduced motion. Keep it off for windows, latched sets and longer bars.

A `ButtonGroupReadout` is an output window in the field well recipe. Its figures turn with SwapText (Swift numericText), are tabular, and never become a keyboard stop. Reset requires a separately named action rather than an invisible click on the number.

SplitButton infers cap and size from its main Button. Both halves inherit one material and ink. Its chevron is behind a seam, width30/glyph12, and stays sunk while the Base UI menu is open. The shared chevron morphs down ↔ up on the glyph settle in React and Swift; no second CSS rotation runs. Reduced motion lands immediately. Escape/outside close returns focus; choosing an alternative closes the menu. Waiting/done/disabled on the main key also disables alternatives. Use a primary cap on the main Button when this is the group's signal operation.

## API

- `ButtonGroup`: required `aria-label`, `cap` standard/primary, `size` default/compact, `disabled`, optional `rocker`, Button children.
- `ButtonGroupReadout`: `value` string and required `aria-label`.
- `SplitButton`: one Button child, `menu` MenuItem/Separator children, `menuLabel`, optional `heading`, `disabled`.
- `ToggleGroup joined`: existing ToggleGroup API and Toggle children; Base UI arrows and latch semantics remain intact.

```tsx
<ButtonGroup aria-label="Zoom">
  <Button iconOnly icon={<Icon name="zoom-out" />} aria-label="Zoom out" onClick={out} />
  <ButtonGroupReadout aria-label="Zoom level" value={`${zoom} %`} />
  <Button iconOnly icon={<Icon name="zoom-in" />} aria-label="Zoom in" onClick={in} />
</ButtonGroup>
```

```swift
MetalButtonGroup("History", rocker: true) {
    MetalButton("Undo", icon: .undo) { undo() }
    MetalButton("Redo", icon: .redo) { redo() }
}
MetalSplitButton("More export options", cap: .primary,
    menu: [MetalMenuItem("PNG") { exportPNG() }, MetalMenuItem("SVG") { exportSVG() }]) {
    MetalButton("Export PDF", icon: .download) { exportPDF() }
}
```

Swift resolves actual key bounds once layout settles to place fixed seams. The shared MetalButtonStyle handles segment presses and group latches; disabled and focus remain native controls. Swift SplitButton uses the existing MetalMenuPanel in a native popover, tracks the presentation binding, holds its key until the menu closes and restores focus when the panel closes. The host owns the result and request state of its main action.

Every repeated action carries the same glyph in regular, compact, rocker and disabled groups: Undo `undo`, Redo `redo`, Export `download`, Copy link `copy`. Zoom uses separately named `zoom-out` and `zoom-in` glyph keys with `iconOnly`, and disables the appropriate end of its range rather than changing one key's meaning at the limit. Swift uses `MetalButton("Zoom out", icon: .zoomOut, iconOnly: true)` and the corresponding `.zoomIn` key. Format choices such as PNG/SVG remain plain words.

---

# Calendar and date picker

A calendar for one day, a range or independent days, and a segmented field that opens it. React: `Calendar` and `DatePicker` from `@unlocalhosted/metalui` (a table grid following the ARIA date-grid pattern; the picker opens in the library's `Popover`). SwiftUI: `MetalCalendar`. The chosen day takes the `switcher` thumb look and hovered days its track, the title turns on the swap drum; the `calendar` recipe adds the grid, today's lamp and the month's arrival.

## Use it for

- Choosing a day where the weekday or nearby dates matter: a due date, a trip, a booking.
- `DatePicker` in a form.

## Don't use it for

- A scheduling grid across people: use the availability picker composition. Calendar-only entry is slow for known far dates; use DatePicker’s native typed segments.

## Anatomy

- Head: previous and next keys (compact caps), the month and year (title type) between.
- Grid: weekday initials (meta type, ink3), then six rows of 32 days, 2 apart, radius 10.
- Today: a 4 green lamp under the number. Outside the month: ink3. Out of range: disabled, 40 %.
- Picker: the form field's regular well with a calendar glyph and the chosen day.

## States and motion

| State | Look | Motion |
|---|---|---|
| hover | the day sinks a touch (the switcher's track) | – |
| chosen | the switcher's raised thumb look | lands into it on the part spring (from 0.9) |
| later month | title turns up; the grid comes from the right | drum and settle spring, fading in |
| earlier month | title turns down; the grid comes from the left | the same, mirrored |
| focus | the green ring on the day | – |
| picker chosen | the popover closes; the field's text turns | the drum |

Reduce Motion: the grid arrives and the choice lands at once; the fades stay.

## API

| React | SwiftUI |
|---|---|
| `Calendar` `value`, `defaultValue`, `onValueChange`, `defaultMonth`, `month`, `onMonthChange`, `min`, `max`, `locale` | `selection:`, `in:` |
| `DatePicker` same selection and eligibility props, plus `name`, `required`, `readOnly`, `presets`, `showTime`, `timeZone`, `timeZones` | `MetalDatePicker` `selection:`, `range:`, `dates:`, `required:`, `readOnly:`, `showTime:`, `timeZone:` |

## Keyboard and accessibility

- A `grid` named by its month. One day is in the tab order; arrows move by day and week, Page Up / Down by month (with Shift, by year), Home / End to the week's ends, Enter or Space chooses. Days are named in full ("Wednesday, 30 September 2026"); today says `aria-current="date"`; the chosen day is `aria-selected`.
- The picker combines a Base UI Field control, native date segments, and a calendar key naming the field and selection. FormField labels, descriptions, errors and disabled state reach the segmented entry; time-zone Select owns its own nested Field context so it cannot steal the date label or ID. The calendar opens focused on the chosen day (or today); Escape and selection return focus to its key.

## Rules

- The week starts where the reader's locale starts it.
- Say the range: disable days that cannot be chosen rather than refusing them after.

## Displayed month and selection

- `month` controls the displayed month; `onMonthChange` requests a new month as its first day. Only navigation or choosing a day in another month emits this callback; receiving a new prop does not.
- Without `month`, a changed controlled `value` reveals its month. Recreating a Date for the same calendar day preserves the browsed month. `defaultMonth` takes precedence for the initial display; otherwise it starts at the chosen day or today.
- With `month`, the host decides whether to accept navigation. A value in another month never overrides that decision. The visible grid retains one enabled day in the Tab order.
- Pointer focus on a neighbouring month's day does not replace its button; choosing it turns the month and keeps keyboard focus on the chosen day.
- `DatePicker` forwards the same display and eligibility props, including `min` and `max`.
- SwiftUI draws the same six-row calendar using the generated switcher track and thumb, calendar dimensions, focus ring, green lamps, part spring and settle arrival. Single, range and multiple bindings share that grid; `month:` controls browsing independently.

## Selection and eligibility

- `mode="single"` (default) chooses one `Date`; `range` takes `{ start: Date | null, end: Date | null }`; `multiple` takes `Date[]`. Values and callbacks follow the mode. Multiple selection toggles individual dates and returns calendar order.
- Ranges are inclusive: `minDays` and `maxDays` count both endpoints, using calendar dates across DST. First click starts a range; a later click orders the endpoints and completes it. Hover and keyboard movement preview the band. An invalid length or an unavailable day anywhere in the range prevents completion; after a completed range the next click starts again.
- `min` and `max` are inclusive. Out-of-range buttons are disabled and navigation stops at the boundary. `isDateUnavailable` days remain keyboard reachable, carry `aria-disabled`, announce `unavailableLabel`, and never emit a selection. This differs from range limits and supports explanations such as “Weekend” or “No available times”.
- `weekStartsOn` accepts 0 (Sunday) through 6 (Saturday); omit it for the locale default. `weekNumbers` uses ISO weeks regardless of the displayed week start. `months={2}` shows consecutive grids that wrap in a narrow host; outside dates become blank so every real date has one button and the whole calendar retains one tab stop.
- The title opens a month and year picker; limits apply there too. `markedDays(date)` returns a description or true for “Has events”; the lamp and full date label carry this information. Marks do not change eligibility.
- `readOnly` preserves navigation and inspection but prevents selection changes.
- Swift: use `selection:`, `range:` (`Binding<MetalDateRange>`), or `dates:` (`Binding<Set<Date>>`). `.calendarMonths`, `.calendarLocale(..., weekStartsOn:, weekNumbers:)`, `.calendarUnavailable`, `.calendarMarks`, and `.calendarReadOnly` provide the same presentation and eligibility contracts.

## Typed dates and forms

- DatePicker’s date inputs are native `type="date"` segments. Their text order and editing keys follow the browser language; `lang={locale}` is provided where the browser supports it. Calendar month and day names follow `locale`. Native semantics own segment focus, keyboard editing and required/min/max validation; MetalUI adds unavailable-day and range validation through custom validity.
- Invalid typed dates remain visible for correction and never emit an accepted value. Range endpoints must be ordered, fit the inclusive `minDays`/`maxDays`, and contain no unavailable day. Keyboard focus and the inline alert explain a rejected value.
- `name` submits one hidden canonical value: `YYYY-MM-DD` for a single day, `start/end` for a range, and comma-separated ISO days for multiple selection. No visible input repeats the submitted name. Use `DatePicker name` even inside a named FormField. For canonical ranges and instants, read `new FormData(event.currentTarget)` in `Form onSubmit`; Base UI’s `onFormSubmit` reads its registered primary native date segment. `required` validates visible native date controls; `readOnly` keeps the value submitted and prevents editing, opening or clearing; disabled values are omitted from the form.
- Clear emits null for single mode, `{ start: null, end: null }` for range, and `[]` for multiple. Today respects eligibility; for a range longer than one day it starts a pending range. `presets` are `{ label, value }`, where value may be a function evaluated when the picker renders. A complete range closes the popup; multiple selection keeps it open until Done.
- Native localized segments are also used by Swift `MetalDatePicker`, surrounded by the generated field well; its calendar is the custom MetalUI grid. Optional selection, clear, Today, ranges, multiple dates, unavailable predicates, required naming, read-only state and presets use the same contracts. Swift `name` is an accessibility identifier; form serialization belongs to the app.

## Date, time and time zones

- `showTime` adds a time field and an IANA time-zone Select in single mode. `value` then denotes an instant, and `name` submits `Date.toISOString()` plus `name.timeZone`. Without `showTime`, values are calendar dates in the host’s local calendar and serialize without a time zone.
- `timeZone` controls the display zone; `defaultTimeZone` starts an uncontrolled zone; `onTimeZoneChange` reports its change. Zone changes preserve the chosen instant and only reinterpret its date/time display. `timeZones` specifies the selectable IANA identifiers; default choices are the current zone and UTC.
- Typing or selecting changes the wall-clock day/time in that zone. Nonexistent DST-gap values are refused with a visible and native validity error. Repeated times resolve to the first occurrence. Date limits and unavailable predicates apply to the displayed civil day; exact instant limits still apply to accepted date/time values. The Today action and current-day lamp also follow the displayed zone (`Calendar today` supplies the civil-day override). No background clock runs.
- Swift’s native date/time segments inherit the selected TimeZone. The shared calendar also receives it; calendar day selection preserves the existing wall-clock hour/minute with strict DST matching and the first overlap occurrence. A zone change changes the display, preserving its Date instant.

Navigation, picker and Clear use canonical Chevron (quarter turns), Calendar and Close glyphs on both platforms. Shared recipe dimensions remain unchanged.

---

# Card

A person's thing, held on a raised plate. React: `Card` from `@unlocalhosted/metalui`. SwiftUI: `MetalCard` (work in progress). An object: the plate is the raised `surface`; the `card` recipe adds the layout, the hover lift and the selected ring. For a link with its site's preview, use the link card; for code, the code card.

## Use it for

- One thing among several of its kind: a document, a project, a place, a person's saved item.

## Don't use it for

- Grouping controls (use a fieldset or a section), or a single block of page text (no plate needed).

## Anatomy

- Plate: raised surface, the card radius, padding 16, parts 6 apart.
- Media (optional): bleeds to the plate's edges at the top, 160 tall.
- Title (title type, an h3 by default); with `href`, its link stretches over the whole card.
- Description (body type, ink2); Footer: actions, 12 apart, above the stretched link.

## States and motion

| State | Look | Motion |
|---|---|---|
| rest | the raised plate | – |
| hover (with a link) | one grid step up, a larger shadow | settle spring (the hover lift) |
| pressed | back down | press time |
| focus | the green ring round the card | – |
| selected | the green ring, 3 out | – |
| without a link | still | – |

Reduce Motion: no lift; the shadow still grows.

## API

| React | SwiftUI |
|---|---|
| `Card` `selected`, `render` (another element) | `MetalCard { … }` |
| `Card.Media` (an image's attributes) | `media:` |
| `Card.Title` `href`, `render` (a router's link), `level` (3) | `title:` |
| `Card.Description`, `Card.Footer` | `description:`, `actions:` |

## Keyboard and accessibility

- An `article`. With `href`, the title is the card's one link (Tab reaches it; the whole card is its hit area); footer actions are separate buttons after it. The card shows the focus ring when its link has focus. Never nest a button inside the link.

## Rules

- One link per card; everything else is an explicit action in the footer.
- Only cards that go somewhere move.

Footer actions carry their canonical meaning glyph: Share uses `icon={<ShareIcon />}`, while Choose stays a plain choice. A host-supplied Card menu uses shared `trash`, `duplicate`, `pen` and `pin` as appropriate; Card does not manufacture a menu or own its effects. Swift's content slot accepts `MetalButton("Share", icon: .share, size: .compact, action: share)`. Keep those actions outside any title link. The native Card body itself remains WIP.

---

# Checkbox

The dimple checkbox. React: `Checkbox` (earlier `Dimple`) from `@unlocalhosted/metalui`, on Base UI Checkbox. SwiftUI: `MetalCheckbox` (earlier `MetalDimple`).

## Use it for

- A task's checkbox in the margin of a line of text; a row's checkbox in a list of tasks.
- `ghost`: a task that was inferred, not written (a hollow ring hanging in the margin).
- `doing`: in progress (a half-filled green square, announced as mixed).
- `mixed`: a parent with some children checked (the shared dash on a dark key). Use this for select-all; `checked` takes precedence. SwiftUI already exposes `mixed:`.

## States and motion

| State | Look | Motion |
|---|---|---|
| rest | a recessed well, 16, radius 6 | – |
| hover | the well darkens a step | 160 ms |
| checked | a dark pressed key; a pen draws the white tick on | the check glyph's tick, drawn along its route: a 40 ms beat (`tick.delay`), the short leg into the corner (`tick.down`, 90 ms, ease-press), a dwell at the corner (`tick.pace`, 30 ms), then the long leg on the part spring, overshooting a little at the tail and settling back to the tip |
| unticked (from checked) | the tick draws back from the tail to the corner and out, then the key goes light | `tick.withdraw` (140 ms, shared by the legs' lengths, ease-press) with the same dwell at the corner, then the 160 ms fade |
| doing | a half-filled green square inside the well | – |
| mixed (a group parent, some ticked) | the dark key with a white dash: the tick laid flat across its width | the dash draws left to right on the part spring (no dwell: the pen only pauses where it turns); mixed → checked bends the dash into the tick on the settle spring, and back; mixed → unticked withdraws it right to left |
| ghost | a hollow 14 ring, radius 5; hover: a green ring | 160 ms |
| row (`size="row"`) | 14, radius 5, the same tick at 14; in flow at the start of a list row | as above |
| pressed, unticked | the dark on look (the press points at the result) | 50 ms; the tick draws on release; dragging off cancels |
| pressed, ticked | the key stays dark | release draws the tick back, then the key goes light |
| disabled | 40 % | – |

Interrupted (ticked again mid-withdraw, say), the pen starts from the length on screen. Reduce Motion: the tick or dash is whole, or gone, at once; the key's colour still fades.

## The tick

The tick is the icon set's `check` tick (`icons/src/acts/check.mjs`, read into `icons/tick.generated.ts` and `MetalTickRoute`), drawn on the 24 grid across the whole well, so it is the same mark as the `check` icon at 16 or 14. Its pen is `tick.pen` (2.4 grid units: 1.6 pt at 16). `tick.rotate` turns it about its corner (0 by default). Durations and curves are tokens: `tick.delay`, `tick.down`, `tick.pace`, `tick.withdraw`, `--mu-ease-press` and the part and settle springs; in a group, the pen also waits for its key's cascade delay.

## Keyboard and accessibility

- Space toggles; the focus ring is the 2 pt green ring at offset 2.
- Give it an accessible name (`aria-label`: the task's text). `doing` announces as mixed.
- Ticking is a person's action: the host writes the change and offers Undo.

The pen is shared through internal `TickGlyph` / `MetalTickGlyph`; selected rows and menu checks use the same generated route and draw/withdraw/bend clock. The checkbox owns its dark key, while the pen reports when its ink has gone.

---

# Checkbox group

Several independent choices in a form. React: `CheckboxGroup` from `@unlocalhosted/metalui`, on Base UI CheckboxGroup, using the row-size `Checkbox`. SwiftUI: `MetalCheckboxGroup` (work in progress). The checkboxes are the `checkbox` recipe; the `checkbox-group` recipe adds the rows and the cascade.

## Use it for

- Choices that can each be on or off together: "Include notes · photos · links".
- A parent row ("All") when people often want everything or nothing.

## Don't use it for

- Tasks in text (use the margin checkbox), one choice of several (use a radio group), or settings that apply at once (use switches).

## Anatomy

- Row: the 14 checkbox and its label 8 apart, at least 28 tall; the whole row is the hit area.
- Parent (optional): the first row; items under it are indented 22.
- Rows 2 apart.

## States and motion

| State | Look | Motion |
|---|---|---|
| unticked / ticked | the checkbox's well / dark key with a tick | the checkbox's own: 160 ms fade; a pen draws the tick (a 40 ms beat, the short leg, a dwell at the corner, the long leg on the part spring) and draws it back before the key goes light |
| parent, some ticked | the dark key with a white dash (mixed) | the dash draws left to right on the part spring; mixed ↔ all bends the dash into the tick (and back) on the settle spring |
| parent ticked | every row ticks | a cascade from the top, one row every 30 ms; each tick draws a beat after its own key goes dark |
| parent cleared | every row clears | together: every tick withdraws at once, then the keys go light |
| disabled | the row at 40 % | – |

Reduce Motion: no cascade; ticks and the dash are whole, or gone, at once.

## API

| React | SwiftUI |
|---|---|
| `CheckboxGroup` `value`, `defaultValue`, `onValueChange`, `allValues` (needed for a parent; sets the cascade order) | `selection:` |
| `CheckboxGroup.Parent` (children: its label) | `all:` |
| `CheckboxGroup.Item` `value`, `disabled`, children (the label) | `options:` |

## Keyboard and accessibility

- Each checkbox is its own tab stop; Space ticks. The parent announces mixed when some are ticked. Wrap the group in a fieldset with a legend (or give it `aria-labelledby`) so the choices have a name together.

## Rules

- Labels say what is included, in the same form: "Notes", "Photos", "Links".
- A parent only when "all" is a real, common choice.

---

# Chip

A small pill. React: `Chip` with parts `Chip.Root`, `Chip.Lead`, `Chip.Text`, `Chip.Actions`. SwiftUI: `MetalChip { lead: … text: … actions: … }`.

## Variants

- `suggestion`: 20 tall, frosted, a green hairline and a small raise; a question in `Chip.Text`, a confidence `Label`, and `IconButton variant="mini"` actions (✓ accept, × dismiss).
- `glass`: an 18 tall tag on a glass screen in the colorway (light on Bone, dark on Graphite), backdrop-blurred; `Chip.Lead led="link" | "code"` for its LED.
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

# Colour cue

A **Component** you operate inline. Its Part is the existing hex Mark; the opened hue well composes Well, Popover and Slider. It creates no material, timing, physics or identity palette. Native `MetalColourCue` shares these donors; MetalPopover's native material remains documented WIP.

Use a controlled, opaque full `#RRGGBB` source. The seven mono characters reserve the footprint before interaction. Opening never normalizes source casing or mutates text. A hue edit retains the initial gesture's saturation and lightness; preview writes a full uppercase hex. Achromatic colours have no hue and stay unchanged when hue alone is moved.

The host supplies `onBegin`, `onSourceChange`, `onCommit`, `onCancel` and optionally `editing` from `useCueDocument`. Capture the current source range once, replace it during preview, commit once on release. Each accepted keyboard step is one edit. Return false from onBegin or the source callback to refuse a stale edit. An unrelated controlled source change invalidates the held pointer until release. Escape restores the exact original words and selection; outside closing commits. Unmount cancels a held edit.

Base UI owns button, popup focus/return and slider pointer/keyboard semantics. Enter/Space opens; arrows and Home/End operate hue, Shift uses the Slider large step; Escape cancels held travel and closes. The hue control has a named numeric value; hex words and the real swatch identify colour independently. The inline read-only button stays focusable and explains its state, while disabled controls are inert. Both modes send no source edits or haptics. Accepted steps use the shared detent helper once. OS/scoped Reduce Motion suppresses drum travel and the native transaction stops ongoing interpolation.

React: `ColourCue({value, label, onChange?, onSourceChange?, onBegin?, onCommit?, onCancel?, editing?, readOnly?, disabled?, raw?})`. Native: `MetalColourCue(label, value:, readOnly:, raw:, onBegin:, onSourceChange:, onCommit:, onCancel:)` with the native enabled environment. Native begin/source callbacks return Bool; cancellation reasons are escape/external/unmount. Callbacks own history and never steal editor focus. Apply retained selection only when that editor already has focus.

ColourCue forwards its actual Base UI trigger ref and common trigger props. Host events compose with the popup trigger; an enclosing ProvenanceTooltip reaches the operable colour word and its source description joins the keyboard instructions. The shared popup remains anchored to that same button and returns focus there. Native view modifiers likewise compose `.metalProvenance("You", detail: ["Authored colour words"])` on `MetalColourCue`; the host still owns accepted source writes, cancellation and history.

Native read-only state disables the inner Button action while its outer focus target remains available. Changing read-only on the same control refuses Return/default-action shortcuts and popup presentation; unlocking restores the same mutable control. The popup’s disabled contents never serve as the trigger’s guard.

---

# Combobox

Type to find one of many. React: `Combobox` from `@unlocalhosted/metalui`, on Base UI Combobox. SwiftUI: `MetalCombobox` (work in progress). The well is the field look; the plate and rows are the `menu` recipe (with its gliding highlight); the `combobox` recipe adds the size and the fit.

## Use it for

- One value from a long list people know by name: a city, a person, a font, a timezone.

## Don't use it for

- A short list (use a select), commands (use the command palette), or free text with no list (use a field).

## Anatomy

- Well: the form field's, `size` regular (32, the default) or compact (28), at least 220 wide; the text in ui type; a clear key (24, the shared `close` glyph at 10) at the end once a value is chosen.
- Plate: the menu's frosted plate, as wide as the well, 6 below it; at most 7 rows, then it scrolls.
- Rows: the menu's rows under one gliding highlight. Nothing found: one quiet row in ink3.

## States and motion

| State | Look | Motion |
|---|---|---|
| rest | the well and its placeholder | – |
| typing | the plate opens; rows filter | the plate fades in on settle; rows change at once; the plate's height settles to the new count |
| moving | one row highlighted | the highlight glides on settle |
| chosen | the field holds the value | the plate fades out on release |
| chosen, then clear | the mark shows; it takes the choice away | fades in on settle |
| nothing found | "No matches" | – |
| focus | the flush green ring on the well | – |
| invalid | the foundation's invalid ring; aria-invalid | – |
| disabled | 40 % | – |

Reduce Motion: the height snaps; the fades stay, and the glyph remains complete and static. The clear key uses `Icon` / `MetalIcon(.close)` from the set; no inline drawing. It keeps the input's chosen value and clear behavior on Base UI. SwiftUI exposes the same clear action while its field/plate material remains WIP.

## API

| React | SwiftUI |
|---|---|
| `items` (strings), `value`, `defaultValue`, `onValueChange` | `selection:`, `items:` |
| `placeholder`, `aria-label`, `emptyText` ("No matches") | `prompt:` |
| `size` (`regular`, `compact`), `invalid`, `disabled` | `.disabled()` |

## Keyboard and accessibility

- A combobox input with a listbox; ↑ ↓ move the highlight, ↩ chooses, Esc closes, typing filters. Name it with a visible label or `aria-label`.

## Rules

- Filter as people type; never make them press a button to search.
- The plate grows and shrinks with the matches; it never jumps.

Inline completion hosts may opt into `defaultOpen` and `autoFocus` for a newly captured source range. `renderItem(item)` supplies its existing semantic face; the complete string stays the Base UI value and accessible choice. Ordinary fields keep their defaults. Searching does not commit source; the host handles selection and dismissal.

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

# Date cue

Component: a civil calendar day operated inline. NumericCue owns day/week detents and focus/keyboard semantics; its held scale is an Instrument. Calendar selection belongs in the existing Popover anchored to the actual spinbutton. Existing materials and motion remain shared.

## API

Controlled `value`, explicit `today`, `min`, `max` are valid civil `YYYY-MM-DD` strings. `onValueChange(day)`, `label`, and explicit `footprint` are required. A civil date is not a UTC instant: UTC ordinals perform day arithmetic; local Calendar boundaries convert back to the same civil string. DST crossings therefore add a calendar day.

`format(day)` decorates the face; `source(day)` supplies lossless replacement words. The default source grammar is English yesterday/today/tomorrow, last/next weekday within seven days, ISO outside that window. Hosts with other language/recognition grammars override source. `relativeDateWords(day,today)` exposes that exact grammar. The today snapshot gives these words one meaning; hosts update it when their document context changes.

`hint={false}` suppresses visual inner help when a provenance host supplies it; resolved date and keyboard instructions remain accessible. `inputAria` forwards descriptions to the actual spinbutton, merging its own date instructions. `locale`, `raw`, `disabled`, `readOnly` follow shared policies. `onBegin`, `onSourceChange`, `onCommit`, `onCancel(reason)` match NumericCue source transactions. Begin is deferred until the first changed day; holding merely opens Calendar without a source/history transaction. Calendar acceptance is one transaction. Escape during scrub restores captured day/source; externally changed controlled values invalidate stale capture.

## Interaction

Vertical drag or Arrow Up/Down steps one day; Shift steps one week; Alt/Option still steps one day. Relative words turn on the shared drum, then real date labels appear farther away. The resolved full date remains available as title/help and in Calendar's description. Formatted date words remain while focused; numeric ordinal typing is blocked without marking the component read-only.

Long hold uses Button's existing hold duration; movement cancels the hold before scrubbing starts. Alt+Down, Enter or Space opens Calendar immediately. Base UI handles the portalled panel, collision avoidance, selected-day focus and final focus back to the actual spinbutton. No wrapper button or extra tab stop is introduced. Direct-anchor colorway inheritance follows the nearest scope and live changes.

Fixed footprint includes the widest raw, relative and formatted face over the allowed range; glyph clearance is reserved by the semantic line. OS/site/scoped reduction preserves values and removes drum travel. Haptics occur once per accepted day, never for inactive/disabled/read-only interactions. Source host owns UTF16 ranges, caret and one undo entry per gesture.

Swift uses the same civil-string API through MetalDateCue, MetalNumericCue and MetalCalendar. Its existing MetalPopover uses the native system panel (documented shared Popover material WIP), with no duplicate recipe invented here.

---

# Day

The day as an object. A custom block: a `Surface` (raise, card radius) with a tear-off page sunk into a `Well` (field). React: `Day`, `DayTile` from `@unlocalhosted/metalui`. SwiftUI: `MetalDay`, `MetalDayTile`.

## Use it for

- Today on a canvas or a home screen: the date big, the time, how much of the year is gone, and a line to carry.

## Don't use it for

- Picking a date: that is a date field. A schedule: that is a calendar.

## Anatomy

`Day.Root` (364 × 382) › `Day.Page` (196 tall, radius 18: 41 × 23 dots, a perforated top edge, the date at 3× from a 5 × 7 face; the month, the weekday and the clock in the pixel face at 24 down the right; sixty small dots of the minute along the foot) › `Day.Year` (the year one dot a day, 27 a row; the days left in the pixel face at 40; the day's number and the moon's phase) › `Day.Line` (one line and who said it).

`DayTile` (180) is the page alone at 2×, with the weekday and month engraved, the days left and a 7 × 7 moon.

## Behaviour

- Tapping the page tears it off: the date's dots fall away a row as they go and the next day's settle in (14 frames of 55 ms). `onTear` gets the new day. Reduced motion or `animate={false}` goes straight to the next day.
- The clock's colon, the current second and today's dot pulse on the first half of each second; with reduced motion they hold steady and the seconds still count.
- Saturday's date is blue and Sunday's amber (`weekendInk={false}` keeps them ink).
- The tear is one real button labelled with the day and the day it goes to.

## API

| React | SwiftUI | Notes |
|---|---|---|
| `date` | `date:` | default today; tearing moves forward from it |
| `lines` (Day, Day.Line) / `line` (Day.Line) | `lines:` | default `DAY_LINES`, one a day by the day of the year |
| `weekendInk` | `weekendInk:` | |
| `animate` | `animate:` | |
| `onTear` | `onTear:` | |
| `Day.Page clock seconds` | `clock:`, `seconds:` | hide the clock or the minute |

## Tokens

The day recipe: sizes, the tear timing, and the per-colorway inks (off, left, hole, date, saturday, sunday, moon). The surface and well recipes.

---

# Dialog

A modal layer. React: `Dialog` with parts `Dialog.Root` (open, onOpenChange) and `Dialog.Popup` (a `Surface`, material `plate` by default). SwiftUI: `MetalDialog(isPresented:) { popup: … }`.

## Behaviour

- Focus moves in and stays in; Escape and a click on the scrim close it; focus returns to the opener.
- The popup rises a step (−6, from .985) on the surface spring and closes on release; under Reduce Motion it fades in place.
- Name it: `aria-label` on the popup.

## Rename canvas

Compose RenameEditor inside Dialog.Popup, under Dialog.Title. RenameEditor owns its field and actions; do not add a second actions row. Control open and refuse dismissal while onPendingChange is true. onRename persists; onRenamed(name, original) updates the document and captures original for Toast Undo. onDone closes after the pen/check and label drum settle, then the shared result beat. Validation and storage errors stay open; Enter retries, Escape cancels only while idle/error.

Swift: compose MetalRenameEditor inside MetalDialog popup with an EmptyView actions closure (no empty footer is drawn). Pass dismissible: !pending and guard the isPresented Binding setter during pending work. interactiveDismissDisabled preserves the native sheet while the operation lands. MetalRenameEditor calls the same onRenamed/onPendingChange/onDone callbacks. A UIKit hardware Escape key follows the editor's cancellation policy.

---

# Dot display

Square dots on one pitch, printed into a well. React: `DotDisplay` and `useDotTick`. SwiftUI: `MetalDotDisplay` and `MetalDotClock`.

## Use it for

- A picture made of dots inside an object: a weather sky, a sticker, a small readout. Put it in a `Well`; the object around it carries the label.

## Props

- `cols`, `rows`: the grid. A tile's sky is 21 × 21, a wide sky 46 × 28.
- `dots`: one ink index per dot, row by row. An index with no ink is unlit.
- `inks`: index → a px colour (`off`, `hz`, `hill`, `sun`, `moon`, `star`, `cloud`, `cloud-dark`, `rain`, `snow`), or `[colour, alpha]` for a dimmer dot. Index 0 is always drawn unlit.

## Behaviour

- Pitch 8, dot 6 (recipe `dot-display`). The SVG draws cells; the `dot-display` utility masks them to squares.
- `useDotTick(ref)` gives a frame number that steps every 167 ms. It holds still under reduced motion, in a hidden tab and off screen. Draw the next picture from the tick; never tween between frames.
- Decorative (`aria-hidden`): describe the picture on the object ("Rain, 14°").

## Don't

- Don't round the dots, add glow or draw on black: the dots are printed into the colorway's well.
- Don't pick colours outside the px set; the set is what makes every display read as one family.

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

# Drop zone

A place that receives files, by drop or by picking. React: `DropZone` from `@unlocalhosted/metalui`. SwiftUI: `MetalDropZone` (`dropDestination(for:)` and `fileImporter` are the system's). A place: it receives files and holds none itself; the files it took are the caller's `Attachment`s, below it. The tray is a `well`; the `drop-zone` recipe adds the edge, the sink and the motion.

## Use it for

- Attaching files to a thing: a region, a message, a form.
- Compact, the attach row of a composer.

## Don't use it for

- A whole canvas or window that takes drops: handle the drop there; a drop zone is a bounded place.
- One image with a preview (an avatar picker): a button that opens the picker.

## Anatomy

- A sunk tray (well look), radius 20, at least 176 tall, padding 24.
- A 44 raised well with a 20 glyph; the title (ui type); what it takes (meta type, ink3); "or choose files" (meta, ink2, underlined).
- An edge drawn inside the tray (1.5), clear at rest.
- Compact: one 56 row: glyph, words, "or choose files" at the end. Words can shrink and truncate before the choose-files text; the input keeps the full title as its accessible name. The host owns the width, including a narrow composer.

## States and motion

| State | Look | Motion |
|---|---|---|
| rest | the tray; edge clear | – |
| armed (files dragged anywhere in the window) | edge green at 40% | settle spring |
| over | edge green; tray at 0.985; glyph up 4; "Let go to attach" | part spring; the line turns on the drum |
| refused (over, a type it won't take) | edge in the invalid ink; "This file isn't taken here" | the drum; dropping shakes it (refusal) |
| drop | back to rest | the tray comes up on the object spring, with its overshoot |
| focus (keyboard) | the focus ring | – |
| disabled | 50% | – |

Reduce Motion: edge and line change at once; nothing sinks, rises or shakes.

## API

| React | SwiftUI |
|---|---|
| `onFiles(files, refused)` (refused: `{ file, reason: 'type' \| 'size' \| 'count' }[]`) | `onFiles: ([URL]) -> Void` |
| `accept` (the input's accept: `"image/*,.pdf"`), `maxSize` (bytes), `multiple` (true) | `accept: [UTType]`, `maxSize:`, `multiple:` |
| `title`, `description`, `overTitle`, `refusedTitle`, `chooseLabel`, `glyph`, `icon` | `title`, `description`, `icon`, `systemImage` |
| `compact`, `disabled` | `compact:`, `.disabled()` |

While dragging, only the MIME type is known, so an extension pattern (`.pdf`) is checked on drop; size too.

## Keyboard and accessibility

- The tray is the label of a real file input: Tab reaches it, Space or Enter opens the picker, a click anywhere on it does too.
- The input is named by `title` and described by `description`.
- Dragging is not the only way in: the picker always works.
- Say what was refused and why near the zone (the `refused` list), not only with the shake.

## Rules

- Name what it takes and the largest size in `description`.
- Show what it took right away, as attachments that land below it.
- A drop that misses the zone is swallowed while it is on the page, so the browser never opens the file.

## Result glyph and acceptance

`glyph` selects canonical geometry (default `document`, or `image` for an image receiver). It stays mounted as one `MorphIcon`: successful receipt morphs to `check`; refusal morphs to `close`, with a live count of accepted and refused files. A new drag interrupts from the current shape; the result returns to the receiver glyph after `result.pause` (1.6s). Reduced motion lands the whole meaning immediately. Existing `icon` custom artwork remains an escape hatch; use `glyph` for the shared result morph.

Native `MetalDropZone` uses the same well/surface recipes and 20pt `MetalMorphIcon`, with `icon:`, `maxSize:`, `multiple:` and `onRefused:`. Type, size and count are checked before callbacks for both picker and URL drops. `onFiles` receives accepted URLs; `onRefused` receives `MetalDropRefusal` with `.type`, `.size` or `.count`. The caller starts security-scoped access when reading a returned URL. The system’s URL drop destination cannot inspect item types until delivery, so native refusal appears after dropping; target lighting starts when the tray is targeted. Custom `systemImage:` callers retain their artwork. Neither custom artwork escape hatch invents a cross-shape animation.

Native drag-over and refusal words settle within their reserved label window. Reduced Motion applies words instantly and cancels any retiring full-motion face when the scope changes. The rendered tray also cancels its sink, glyph lift and any in-flight refusal immediately; the receiving Button and its focus stay mounted. `e2e/native/run-drop-zone-label-proof.py` uses a real AppKit drag payload and own-window pixels to prove both colorways, a live drag-over policy switch and a live refusal policy switch.

---

# Empty state

A place with nothing in it yet. React: `EmptyState` from `@unlocalhosted/metalui`. SwiftUI: `MetalEmptyState` (work in progress; `ContentUnavailableView` is the system's). A place: the glyph sits in a `well`; the `empty-state` recipe adds the layout and the arrival.

## Use it for

- A list, board or panel with nothing in it: first use, a cleared filter, everything done.

## Don't use it for

- Errors (say what went wrong and how to fix it), or loading (use a skeleton).

## Anatomy

- A 56 sunk well (radius 18) with a 24 glyph in ink3.
- Title (title type): what would be here. Description (body type, ink2): how to start.
- One action, 16 below.
- Compact: one line in ink3 and the action, for small places.

## States and motion

| State | Look | Motion |
|---|---|---|
| empties | the empty state | rises one nest from below on the settle spring (T9) |
| content arrives | the content | the empty state goes; the content's own arrival |

Reduce Motion: it fades in without travel.

## API

| React | SwiftUI |
|---|---|
| `title`, `description`, `icon`, `action` | `ContentUnavailableView(title, systemImage:, description:)` |
| `compact` | – |

## Keyboard and accessibility

- A polite `status`: when a place empties, assistive tech hears what would be here. The action is an ordinary button or link.

## Rules

- Say what would be here and how to start, not only "Nothing here".
- One action; the one that starts it.

## Comment host

The compact No comments action opens a real editor. Enter adds a line; Command/Control + Enter or Comment commits one post. Escape/Cancel discard an unlocked draft; pending requests lock just the editor and refuse a second post. Failures retain text for retry. The note glyph settles into check and the label turns Posted before the editor closes; Undo restores the comments captured before that request. The docs' Comment request panel controls latency and first-request failure. The executable native host lives in `swift/Examples/MetalCommentExample.swift`; it composes existing native EmptyState and Textarea controls without introducing another renderer.

The starting action names its work with the authored set: Attach files uses `attach`, New note uses `note`, and Comment uses its editor's `send` only when posting. This action stays the one focusable key, outside the decorative empty-place glyph. Native hosts supply `MetalButton("Attach files", icon: .attach)` or `MetalButton("New note", icon: .note)` through the action builder; the ContentUnavailableView body keeps its platform behavior.

---

# Enum cue

A Component: a host-declared finite source state, distinct from a free tag. React `EnumCue` wraps Base UI Button; native `MetalEnumCue` wraps SwiftUI Button. The held adjacent-choice preview is an Instrument. The tab is the existing Mark Part.

## Source contract

`value` is the complete source word; `choices` contains unique source words and optional human labels, glyphs and explicit tints. State meaning remains in words. A neutral tint is the default; the identity hash palette never selects an enum state colour. Reserve every host choice before interaction, so the widest source word pays for the footprint in raw, cued, held and cancelled states.

Use `onBegin` to capture a source range, `onChange(words)` to preview it, `onCommit` to end one history entry and `onCancel` to restore the captured source and UTF16 selection. `useCueDocument`/`MetalCueDocument` supply this lifecycle. If `onBegin` returns false the operation is refused. Host typing or a changed finite vocabulary must end the old range before supplying new source. Pass the optional `editing` transaction flag so unrelated host typing immediately invalidates a held range. An `onChange` returning false refuses a stale preview without a haptic. No recognizer writes text. Cancellation without `onCancel` emits the original word.

## Gestures

- Click/Space cycle; Up/Down step and wrap through the host's declared order. A held keyboard repeat remains one gesture until key release.
- Hold and drag vertically; each named 24-space stop lands an option, not an interpolated enum. Adjacent choices appear only while held.
- Focus gives the control the wheel. Unfocused text never consumes scrolling. Wheel events share one snapshot and commit after the existing release pause.
- Escape, lost capture, blur or unmount cancel the active snapshot. Disabled/read-only or unknown source values never mutate or emit haptics. Read-only remains focusable for its accessible value.
- One shared detent haptic per changed landed state. The browser reports no fabricated feedback when native haptics are unavailable.

The existing drum presents a changed word; reduced motion keeps its crossfade and removes travel. The complete value is in the accessible button name. Native adds an adjustable accessibility action with the same finite choices. At rest, no instrument or timer runs.

## Enclosing provenance

EnumCue forwards its actual Base UI trigger ref and common trigger props, merging host events with its own gestures. An enclosing ProvenanceTooltip reaches the operable words, its source description joins gesture instructions, and Space still writes one source-history step. Set `hint={false}` to let that enclosing tooltip own the visual help. Native `hint: false` likewise suppresses the gesture help when `.metalProvenance(…)` supplies provenance. This changes no material, footprint or motion.

Native mutability disables the inner action button while preserving the outer read-only focus target and description. Dynamic read-only changes refuse default Return shortcuts as well as pointer, wheel and adjustable actions; returning to editable state re-enables the same control without changing its footprint.

Native reduced words resolve immediately, including a live scope change during a drum transition; only the words identity resets, so the operable trigger retains focus. React keeps the existing opacity-only reduced change. Meaning glyphs retain their separate reduced act policy.

---

# Fan

A canvas tool control that keeps its current tool and context in a compact graphite bar. Tools unfold from their cap; contextual actions open in a tray. Every choice stays visible.

## Contract

- `Fan aria-label`: one open cell; Escape and an outside press fold it and restore its cap's focus. No idle animation or polling.
- `Fan.Label label="Canvas"`: a context glyph, named by tooltip and accessibility label. Omit `label` to retain a text context.
- `Fan.Picker`: controlled `value`, `options`, `onValueChange`, `label`; three columns, ordered in related groups. Include select/text/region, drawing tools, shapes, eraser. The current option remains latched in the grid. `direction="up"` unfolds above the bar; `both` centres rows above and below. Arrows move in two dimensions without wrapping rows; Enter/Space chooses and restores cap focus.
- `Fan.Tray label icon`: context controls, with a close glyph at the end. It wraps on narrow hosts. Shared Base UI Toolbar handles arrow focus inside the tray.
- `Fan.Action label icon shortcut?`: a graphite glyph key with accessible name and shared tooltip. The glyph's act follows hover/press; native disabled semantics apply. `onClick` performs the real action.
- `Fan.Ink value onValueChange`: five inks in a named group. Accessible names and tooltips read `Ink: red`; the current ink latches.
- `Fan.Width value onValueChange ink`: three strokes of the chosen ink in a named group. Names read `Width: fine`; the current width latches. Keep the ink and width groups together while drawing.

## Motion and host layout

Tool caps use the existing icon-button.tool recipe, toolbar gap and part spring. Grid cells travel from behind the cap, staggered by distance. The tray changes natural width once and scales its material backing between widths; it never animates CSS width. Only transforms and opacity move. Reduced motion subscribes to the OS, site switch and scoped motion attribute; cells appear in their final positions with opacity alone. Provide enough canvas area above the cap for four rows; do not place a selection switcher over the choices. The docs include a stroke sample so ink and width have an observable consequence.

## Example

```tsx
<Fan aria-label="Canvas tools">
  <Fan.Label label="Ink"><DrawIcon /></Fan.Label>
  <Fan.Picker label="Tool" value={tool} options={TOOLS} onValueChange={setTool} />
  <Fan.Tray label="Ink" icon={<DrawIcon />}>
    <Fan.Ink value={ink} onValueChange={setInk} />
    <Fan.Width value={width} onValueChange={setWidth} ink={ink} />
  </Fan.Tray>
</Fan>
```

Swift uses `MetalFan`, `MetalFanLabel(icon:)`, `MetalFanPicker`, `MetalFanTray`, `MetalFanAction`, `MetalFanInk` and `MetalFanWidth`. It shares the same materials, grouped grid, current selection, part spring, named groups and widths. Host bindings own tool/ink/width and action consequences.

---

# Field and search field

React: `Field` with parts `Field.Root`, `Field.Icon`, `Field.Input`, `Field.Trail`; `SearchField`. SwiftUI: `MetalField { icon: … input: … trail: … }`, `MetalSearchField`.

## Field

- Three sizes (`size`): `large` (the default: 44 tall, radius 17, a 15 glyph, the input in 15 pt; the palette's field), and the form sizes `regular` (32, radius 11, 14 glyph, ui type) and `compact` (28, radius 9, 12 glyph), which line up with the select.
- A hint in ink3, a green caret; trailing keycaps in `Field.Trail`.
- `invalid`: the foundation's invalid ring on the well, and `aria-invalid` on the input. `disabled`: 40 %, and the input is disabled.
- `Field.Input` is a plain input; pass it as a Base UI combobox input's `render` to join a listbox.
- SwiftUI: `MetalField` has the large size; the form sizes and the invalid and disabled states are work in progress there.

## Search field

- A button, not an input: it opens search (a palette). 38 tall (radius 15) with a 14 glyph, the placeholder and a keycap (`⌘K`); graphite in a dark strip, light elsewhere.

## Keyboard and accessibility

- Field: the input takes focus. At the large size (a palette, where the field always has focus) the caret is the focus; the form sizes show the flush green ring. Name the input with a visible label or `aria-label`; say why a value is invalid in text near it. Search field: a button with `aria-keyshortcuts`, the green ring on focus.

## Tag attachment host

The docs' compact Tag field commits one attachment. It normalizes a leading hash, rejects an existing tag or a name over 32 characters, and keeps failures separate from value validation so retry submits the same draft. Enter submits; Escape or Cancel clears only an unlocked draft. Tag's authored glyph becomes check while the label turns Tagged, then the field clears after the shared result beat. Undo restores the tag list captured before that request. The native executable composition is `swift/Examples/MetalTagExample.swift`; it uses the shared compact well recipe rather than claiming the alpha `MetalField` renders compact fields.

---

# Filter bar

Names the question a filter asks and switches how the answer is shown. A composition block on Base UI Toolbar. React: `FilterBar` (earlier `LensBar`) from `@unlocalhosted/metalui`. SwiftUI: `MetalFilterBar` (earlier `MetalLensBar`).

## Use it for

- While a filter is open: `open tasks about the poster · 6 MATCHES · VIA MODEL`, with its views (In Place, List, Table, Timeline, Gallery), pin and close.

## Don't use it for

- Search fields or command entry. The palette asks; the filter bar names what was asked.
- Filtering that moves or hides content permanently. A filter never moves anything.

## Anatomy

`Surface material="frost" radius="pill"`, 38 tall, padding 0 6 0 14, gap 8, at the top centre: a `Glyph` (14, ink2); the query in `Label variant="query"`, ellipsised at 340; `N MATCHES` in `Label variant="engraved"`; the note (`ASKING…` after a waiting `Led`, `VIA MODEL`, `LOCAL`); a compact `Switcher`; two `IconButton variant="ghost"`, pin and close.

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

Layout: `--mu-lensbar-*`. Look: the surface, glyph, label, status, switcher and icon-button recipes. Motion: `--mu-spring-surface`, `--mu-travel-surface`.

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

The inline SVG draws the paper and flap edges, light and clipping. These are the object’s physical geometry, not action glyphs; preserve them when adopting the shared icon set.

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

# Form field and fieldset

A control with its words, and groups of them. React: `FormField` and `Fieldset` from `@unlocalhosted/metalui`, on Base UI Field and Fieldset. SwiftUI: `MetalFormField` (work in progress). The `form-field` recipe sets the gaps, the error ink and the error's motion; the invalid ring is the foundation's.

## Use it for

- Every control in a form that needs a visible label, a hint, or a reason it was not accepted: Field (at a form size), Textarea, Select, Combobox, Number field, Radio group, Checkbox group.
- `Form` around the fields: it validates them all on submit, focuses the first one not accepted, and shows a server's errors by field name.
- `Fieldset` with a `Legend` for a group: a radio or checkbox group, or several fields about one thing ("Shipping").

## Anatomy

- Label above the control (ui type, ink), 6 apart; clicking it focuses the control.
- Description below (meta type, ink3).
- Error below (meta type, red) while the field is invalid.
- Fieldset: the legend (the engraved label type), fields 16 apart.

## States and motion

| State | Look | Motion |
|---|---|---|
| valid | label, control, description | – |
| invalid | the control's invalid ring; the error below | the error's row grows open on the settle spring as it fades in |
| valid again | the error leaves | release spring |
| disabled | label and control at 40 % | – |

Reduce Motion: the error's row snaps; the fade stays.

## API

| React | SwiftUI |
|---|---|
| `FormField` `invalid`, `disabled`, `name`, `validate`, `validationMode` | `invalid:`, `.disabled()` |
| `FormField.Label`, `FormField.Description` | `label:`, `description:` |
| `FormField.Error` (children, or empty to say the validation message), `match` | `error:` |
| `Fieldset` `disabled`; `Fieldset.Legend` | `legend:` |
| `Form` `onFormSubmit` (values by name), `errors` (a server's, by name), `validationMode` | – |

## Keyboard and accessibility

- The label names the control; the description and the error are read with it (aria-describedby). An invalid control says aria-invalid.
- A fieldset's legend names its group; a disabled fieldset disables everything in it.

## Rules

- Every control has a visible label. Placeholder text is not a label.
- An error says what to do, not only what is wrong: "Give the region a name", not "Invalid".
- Show errors after the person has had a chance (on blur or on submit), not on the first keystroke.

## Save region host

The docs form saves the validated values from Base UI Form as one request. The host captures its previous document, locks its controls while pending, drives Button state waiting/done/error, and reserves the result beat before unlocking. Its authored save glyph becomes check on success or sync-error on failure; the drum says Saved / Try again. Failed storage retains the draft and remains retryable; it does not mark otherwise-valid field values invalid. Undo restores the captured document snapshot, never a later read of current storage. Existing form validation still owns focus placement.

The executable native composition is swift/Examples/MetalSaveRegionExample.swift in the non-product MetalUIExamples target; it uses the same storage callback, request lock, presentation timing and captured-original Undo. Component fidelity limits remain those of the individual alpha controls.

---

# Glass face

A glass object in the colorway: pale glass on Bone, dark glass on Graphite. React: `GlassFace` with parts `GlassFace.Root` (the bezel) and `GlassFace.Screen`. SwiftUI: `MetalGlassFace { screen: … }`.

## Use it for

- An object that shows a screen: a link's preview, a block of code, an image behind glass.

## Anatomy

- The bezel: radius 22, padding 6, a gradient in the colorway (white to bone on Bone, graphite to near black on Graphite) with a bright top edge, an inner glow and a deep drop shadow.
- The screen: radius 16, pale bone (`#E8E7E2`) on Bone, near black on Graphite; the glare is a 115° sheen, a darkening toward the bottom, a bright top rim, a dark inner ring and an inner shadow. The screen's own fill (a hue, a gradient) is the caller's, under the glare.

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

## Starting and ending the drag (the host's job)

`Lasso` only draws; the canvas host owns the pointer. These are the rules that make it reliable:

- **Empty space is anything that isn't an object.** Listen on the canvas element itself, not on the world or a layer inside it. A press on the guides layer, on a selection frame's gap, or on the canvas outside a zoomed-out world (at 50 % most of the canvas) is empty space. Only a press on an object is not: that one moves the object. Mark objects (e.g. `data-note`) and test `event.target.closest(...)`; never test `event.target === event.currentTarget`.
- **No native text selection.** Call `preventDefault()` on the lasso's `pointerdown` and put `user-select: none` (`select-none`) on the canvas, or the browser paints its own selection highlight over the objects' text while the box is drawn. Because `preventDefault` also stops the browser from clearing a selection made elsewhere on the page, call `getSelection().removeAllRanges()` on the press. Capture the pointer on the canvas so the drag survives leaving it.
- **Cursor.** A crosshair over empty space; a grab (grabbing while held) over an object that can be moved.
- **Threshold.** The box appears after 3 screen points of travel; a press without travel is a click on empty space and clears the selection.
- **Modifier keys.** Shift held at the press adds what the box touches to the current selection (a Shift-click keeps it). Escape clears the selection. ⌘ is left to the move (it turns snapping off).
- **After the release** the picked objects show the Selection frame only (`handles="none"`, `readout={false}` for a multi-selection); the size readouts belong to resizing one object, not to choosing several.
- Coordinates are world coordinates: `(clientX - worldRect.left) / scale`, which stays right outside the scaled world too.

## Rules

- The count is what the box touches now, never a guess.
- The box never moves objects; it only chooses them.
- A press on empty space always starts it, wherever on the canvas it lands.

---

# LED

A tiny lamp lit from the top left that says one state by colour. React: `Led` from `@unlocalhosted/metalui`. SwiftUI: `MetalLED`. A part: it has a look and no job of its own.

## Use it for

- One state, beside the words that name it: in a status badge, a size readout, a hover engraving, the lens bar.

## Don't use it for

- A state on its own, with no words: colour alone is not enough.
- Something pressable: the LED is decorative (`aria-hidden`).

## Kinds and sizes

| Kind | Colour | Means |
|---|---|---|
| live | green | on, working, latched |
| waiting | amber | in progress, asking |
| failed | red | stopped, needs you |
| link | blue | points somewhere else |
| off | grey | idle |

Lens sizes: 8 (default) and 6 (small). An opaque #242427 socket adds 1 on each side: total footprints 10 and 8. Every lit kind has the same soft halo; off is a dull, unlit socket. Shared inks are in `recipes.status.props.ink`; measured contrast and colour-vision limitations are in `docs/STATUS-COLORS.md`.

## Gestures

How the lamp behaves over time (tokens `status.gestures`). Only the inner lens and halo animate opacity, down to the shared dim level. The opaque socket never fades. Waiting breathes by default; failure double-blinks once; live and link hold steady; off stays dark.

| Gesture | Behaviour | Use it for |
|---|---|---|
| steady | holds | live or link: a state that simply is |
| flicker | one burst of activity (0.8 s), then on | something just happened: a sync finished, a value arrived |
| breathe | a slow loop (2.4 s) | something in progress: syncing, searching |
| blink2 | two sharp flashes, then on | a failure, once; never repeat it |
| rise | comes on slowly (1.2 s) | a first start, a machine waking |

Reduced motion (OS, html.rm or scoped data-mu-motion=reduce) holds every gesture at its final level. Words still identify the state. Offscreen and hidden web lamps pause; native lamps stop their frame clock while inactive or absent, and after a finite gesture completes. Changing the gesture, or the kind, plays it again.

## API

`Led kind size ("default" | "small") gesture ("steady" | "flicker" | "breathe" | "blink2" | "rise")`

SwiftUI: `MetalLED(.live, gesture: .flicker)`.

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

# Link

An inline destination. React wraps Base UI `useRender`; SwiftUI uses `MetalLink` with the same material, states and physical press. Use a Button for actions.

## States

- Rest keeps a hairline below the words; colour never marks a destination alone.
- Hover grows a thicker line from the side the pointer entered and reveals a faint menu-row tint. Press sinks by the button's existing travel and dims. Focus uses the shared green ring.
- `visited`: opt into the browser's quieter visited underline; off by default in apps. Use in documents. Browsers restrict querying visited styles for privacy. Native tracks following this view's destination.
- `aria-current="page"`: full ink, no underline, names the current destination. Native `current: true`.
- `disabled` / `aria-disabled`: ink3, no underline, focusable to discover `disabledReason`, no navigation by pointer, auxiliary click or keyboard. The reason appears in the shared tooltip and spoken name. Native guards the destination action and exposes its reason.
- `loading`: busy route underline sweeps on the existing Progress duration. Its observer pauses it off screen, removes it when the route arrives and stops travel under reduced motion. Native creates its timeline only while loading and appeared; the host owns the route lifecycle.
- `external`: shared external glyph, animated by hover/press, new tab and spoken announcement. Native opens through the system URL action.
- `download` with `fileSize`: shared download glyph followed by the size. Native `download: true` marks the file; use `action:` to provide the platform's download handling.
- `kind="quiet"`: a quieter persistent hairline for lists that already establish destinations. `standalone`: a link on its own line with a trailing arrow.

Every available destination keeps its underline, including quiet/visited/loading. Current and unavailable states are explicit exceptions. Both OS and live scoped/site reduced-motion settings preserve meaning while dropping travel.

## API

React accepts anchor attributes, `external`, `visited`, `disabled`, `disabledReason`, `loading`, `fileSize`, `kind`, and `render` for router anchors. A disabled anchor drops its href and guards activation, while preserving link semantics and focus. No pending work is inferred from click; the router sets and clears `loading`.

Swift accepts `destination:`, `external:`, `visited:`, `current:`, `disabled:`, `disabledReason:`, `loading:`, `download:`, `fileSize:`, `kind:` and optional `action:`. If no action is given, it follows through `openURL`.

```tsx
<Link href="/guides/export" visited>the export guide</Link>
<Link href="/tram.pdf" download fileSize="2.4 MB">Tram map.pdf</Link>
<Link render={<RouterLink to="/region" />} loading={pending}>Open the region</Link>
<Link href="/draft" disabled disabledReason="The guide is being revised">the draft guide</Link>
```

The docs show every state in both colorways and an editing card: handle the real underline to change its offset, or toggle its external glyph. Readouts snap at the shared default; DialKit tunes underline thickness.

---

# Link card

A link as a glass object. A custom block: `GlassFace` with a screen tinted by the host, a `Chip` tag and a `Chip` action. React: `LinkCard` (and `linkHueDegrees`) from `@unlocalhosted/metalui`. SwiftUI: `MetalLinkCard`.

## Use it for

- A lone URL placed on a canvas: `figma.com` over `/FILE/POSTER-V3`, with `● LINK` and `OPEN`.

## Don't use it for

- A link inside text: that is a `MarkUrl` host pill. A navigation control: a link or a button.

## Anatomy

250 wide: `GlassFace` (bezel 6, radius 22; screen radius 16 with its glare). The screen is 92 tall, padding 12 / 14, the host and path set at its foot; its tint is a radial of the host's hue into the screen (`#EEEDE9` on Bone, `#121316` on Graphite). `Chip variant="glass"` with a link `Led` and LINK at 10 / 10; `Chip variant="glass-action"` OPEN at 10 from the top right. The host is 620 15 / 1.2 in ink (`#1B1B1D` on Bone, `#EDEDEF` on Graphite); the path 9.5 mono uppercase at half ink, ellipsised.

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
| `hue` | `hue:` | any colour; default the recipe's tint. The reference tints by host: `hsl(linkHueDegrees(host), 38%, 84%)` on Bone and `hsl(linkHueDegrees(host), 38%, 32%)` on Graphite (the recipe's tint-saturation and the colorway's tint-lightness) |
| `tag`, `openLabel` | `tag:`, `openLabel:` | the host's words (LINK, OPEN) |

## Tokens

The link-card recipe (screen, host, path, chip inset), the glass-face and chip recipes.

## Preview

Pass `preview` (the backend's `GET /preview` result: `title`, `description`, `image`, `icon`) once it arrives. With a title, the title becomes the big line (2 lines at most); the host and path move into a small line with the site icon; the image sits behind the tinted glow, shaded to the bottom; the card grows from 92 to 128 on settle and the preview fades in. Never request or pass a preview for a secret block or while looking at the past. Without a title the card stays as it was: the preview is decoration, the URL is the text.

OPEN leads with the shared external glyph, sized from Button compact.glyph (14) inside the existing glass chip. It acts with the action’s hover/press and remains static under shared motion reduction. `openLabel` supplies words, independently of the decorative glyph. Swift’s callback Button and destination Link render the same label and glyph; the card itself remains inert.

---

# Link cue

A Component for operating the URL written in a document. The existing MarkUrl host-chip Part remains a real anchor; the separate canonical pen key opens an anchored field. The recognizer never changes the destination.

## Source contract

React `LinkCue` and native `MetalLinkCue` take controlled `value`, `label` and an explicit nonempty `footprint` of the widest permitted source words and resolved host display alternatives. Reserve it before editing, including raw mode. The footprint never grows from a draft. An oversized URL is refused in the field, so neighbouring words do not move. The complete current URL is accessible, even while the chip displays its host.

`onBegin` captures a source range; `onChange(words)` writes only confirmed exact source words and can return false for a stale range; `onCommit` ends one history entry; `onCancel` restores the captured source and UTF16 selection. A field draft is local input, never a second selected URL. Escape, outside dismissal, changed source/footprint, read-only/disabled, unmount or native backgrounding cancels the old transaction. Pass `editing` so external source typing invalidates it. A no-op confirmation makes no history entry.

Only absolute HTTP(S) destinations with a host and no literal whitespace are navigable. Validation parses for navigation/display, never serialises URL.href back into source: authored case, escaping, path, query and hash are retained. `validate(words)` can add a host constraint and return a message. Invalid or oversized drafts remain editable and do not mutate source.

## Interaction

Enter or a pointer on the real link follows its current URL. The separate named edit key opens the shared regular Field in a Popover; typing changes the draft, Enter/Apply confirms, and Escape/Cancel/outside dismisses without writing. Read-only retains navigation while refusing edit. Disabled refuses both. Canonical pen/check/close glyphs carry the operation; no local SVG is drawn. The edit key appears on hover/focus in the already reserved meaning clearance, with no extra wrapper Tab stop.

React forwards its ref and common anchor events/ARIA to the actual link for provenance help; `editProps` reaches the actual edit key and `inputAria` reaches the field. Intrinsic operation descriptions join authored source descriptions. Base UI Popover/Field own focus, keyboard and ARIA. Native uses a real SwiftUI Link, a focusable edit button and TextField, the same URL pill/menu/field/button recipes, and scoped motion policy. Reduced motion cancels travel; no clock runs at rest. Source-history proof belongs to the host; SwiftUI views do not claim TextKit IME/caret ownership.

## Feature receipt

`e2e/link-cue.spec.ts` operates the source-backed document in both colorways and reduced motion: actual anchor navigation, field draft isolation, exact case/path/query/hash confirmation, fixed footprint, one Undo with UTF16 selection, refusal, external invalidation, read-only/disabled, raw display and unmount cancellation. `e2e/native/run-link-cue-proof.py` launches a real macOS app and drives the public Link, edit key and native field; all thirteen source/navigation/history/keyboard states pass in both colorways. Captures live under `docs/captures/web/link-*` and `docs/captures/native/link-cue-*`. This verifies the public control and source host; it does not claim TextKit caret/IME ownership.

---

# Mark

Recognition made visible on the text. React: `Mark`, `MarkUrl`, `MarkInferred`, `MarkUrgency`, `MarkLife` from `@unlocalhosted/metalui` (earlier `Cue`, `CueUrl`, `MarkInferred`, `CueUrgency`, `CueLife`); the checkbox is `Checkbox`. SwiftUI: `Text.metalCue(_:colorway:)`, `MetalCueText`, `MetalCueTag`, `MetalCueURLPill`, `MetalCueInferred`, `MetalCueUrgency`, `MetalCueLife`.

## Use it for

- Marking what a recognizer understood in a person's own writing: a date, a duration, an amount, a measurement, a tag, a colour, a link.
- A task's checkbox in the margin (`Checkbox`), a task the model inferred (`Checkbox ghost`), and urgency (`MarkUrgency`).
- The one life glyph trailing a block (`MarkLife` around a `Life*Icon` at 16).

## Don't use it for

- Changing the text. A cue never rewrites the saved words; full text ink carries tags, whose quiet colour identifies the name.
- Anything the person did not write: a value the model read that is not in the text is a `MarkInferred` pill after the words, never an underline.
- Status, errors or calls to action. Cues are quiet and have no toast, badge or sound.

## Anatomy

| Cue | Rest | While writing |
|---|---|---|
| date | dotted underline green .7, 1.5 thick, offset 3.5; hover chip with the resolved date | same |
| duration · amount | solid quiet underline 1, offset 3.5 (the text's own figures: tabular digits would change the advance) | same |
| measurement | solid green .42 underline 1.5, offset 4 | same |
| tag | raised tab with punched hole; padding 1/4 paid back by margin 0/−4; stable NFC identity tint and full ink | same |
| derived tag | same tab, dashed suggestion until explicitly confirmed | same |
| hex | 3 pt underline in the colour at 78 %, skip-ink off; the 11 pt swatch before it at rest | underline only |
| match | a search's matched words in a result row: weight 650, a green .55 underline 1.5 thick, offset 2.5 (heavier, so result rows only, never writing) | never |
| URL | a 20 tall host pill with the link glyph at 11 | the raw URL, plain |
| inferred | a 17 tall hollow pill in the label role after the last word | hidden |
| dimple | 16 pt well, radius 6, hanging at −25 in the gutter; checked: dark with a white tick | the raw `[ ] ` sits in the gutter |
| ghost dimple | 14 pt hollow, radius 5; the band grows left by 36 instead of indenting the words | hidden |
| urgency | 5 pt amber LED at −35 | hidden |
| life glyph | after a middle dot, 16 tuned cut, ink3 → ink2 on the host's hover, tint for feelings | hidden |

## Motion

The resolved-value chip rises 3 pt on the part spring (instant under Reduce Motion). The dimple's tick is drawn by a pen along the check glyph's route (a 40 ms beat, the short leg, a dwell at the corner, the long leg on the part spring) and drawn back before the key goes light; whole at once under Reduce Motion. The life glyph fades in 120 ms when recognised; its hover is the glyph's own. Nothing else moves.

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

## Semantic display and recognition

Use `MarkLine` around opt-in semantic marks. It reserves the compact Button glyph plus space-2 above **every wrapped line**, including raw mode. `meaning` is time, money, sleep, steps, colour or person; `meaningLabel` names the hover glyph. A person Object comes from the host through `meaningGlyph` (native `personGlyph`); the Mark Part never constructs an Avatar. Glyphs are decorative, add no Tab stop and never consume text advance. Plain Mark callers retain their original leading. `MarkLife label` describes the whole line only.

The host supplies `recognition`, a stable identity **after** the caret leaves a candidate and IME composition commits. One identity reveals the underline on settle, the glyph on object, and one authored glyph act. Raw mode fades the same slots without remounting the source. `formatted` reserves the wider source/display face before the amount drum turns. Recognition never mutates the saved string. Editing controls own separate source-range callbacks.

Tag hue uses shared blue/orange/gold/green-deep at the existing Status tint; red stays destructive. `tagIdentity` and `MetalCue.tagIdentity` hash NFC Unicode scalars with UInt32 wraparound. Full ink and the copied/accessibility name retain the hash. A background-only tip and hole never clip text. `inferred` stays dashed; a host confirms explicitly by click or keyboard. The docs confirmation hosts accept Tab focus, press the chip and acknowledge once with the authored spark. No sound or repeating clock.

SwiftUI display surfaces use `MetalCueText` and `MetalCueTag`; `MetalCueInferred(confirmed:onConfirm:)` supports an explicitly controlled suggestion. Native `Text.metalCue` remains a rendering attribute, and TextKit hosts own caret/selection/history. The avatar renderer keeps its existing native WIP status; this does not claim a full native Avatar port.

`resolved` on native `MetalCueText` uses the same graphite chip and finite part-plus-settle recognition pause. Semantic chips clear the reserved glyph as well as the words; their overlays never take layout space. Confirmation uses the existing Button travel for its finite stamp and Spark for one acknowledgment. OS or scoped Reduce Motion ends current travel immediately. The Cue page DialKit controls recognition motion and display amount formatting without changing source.

---

# Menu and correction popover

A frosted plate of rows. React: `Menu`, `ContextMenu`, `MenuItem`, `MenuSeparator` from `@unlocalhosted/metalui` (Base UI Menu and Context Menu). SwiftUI: `MetalMenuPanel`, `MetalMenuItem`, `.metalMenu(isPresented:at:heading:items:)`. 

## Use it for

- **The correction popover**: right-click a cue for what it is not ("Not a Task", "Not Coffee", "Ignore “4pm”"), Reset Corrections, Ask Recognizer Again, Gather Similar; the heading is the cue's provenance.
- A "more" button's actions; a block's right-click actions.

## Don't use it for

- Running anything by name: that is the command palette.
- Choosing a value in a form (a select) or switching views (switcher).
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
  <MenuItem onSelect={gatherSimilar} icon={<LayoutIcon size={14} />}>Gather Similar</MenuItem>
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

## Scoped colorways

Both Menu and ContextMenu copy the target’s nearest `data-mu-colorway` to the portalled positioner and follow live ancestor changes. The popup remains outside clipped hosts. With no override it inherits the document; SwiftUI uses its native colorway environment.

## Checkbox rows

`MenuCheckboxItem` wraps Base UI’s checkbox menu item. It accepts `checked`/`onCheckedChange` or `defaultChecked`, `indeterminate`, `disabled`, `shortcut`, and `closeOnClick` (false by default). Keep settings open so a person can change several. Its reserved 14px slot draws the same `TickGlyph` route and pen phases as Checkbox and Select; mixed is the dash bending into the tick. Base UI owns keyboard movement and `menuitemcheckbox`; a mixed row announces `aria-checked="mixed"`. Clearing the parent’s indeterminate state is the host’s job when its children change.

```tsx
<Menu trigger={<Button>View</Button>}>
  <MenuCheckboxItem checked={guides} onCheckedChange={setGuides}>Show guides</MenuCheckboxItem>
  <MenuCheckboxItem checked={all} indeterminate={some && !all} onCheckedChange={selectAll}>Select all layers</MenuCheckboxItem>
</Menu>
```

SwiftUI uses the same 14pt `MetalTickGlyph`: `MetalMenuItem("Show Guides", checked: guides) { guides.toggle() }`. Supplying `checked` makes the row stay open; `indeterminate` draws the shared dash. Set `closeOnSelect: true` for a choice that should dismiss. The host supplies current state, and the native accessibility value announces On, Off or Mixed.

---

# Menubar

An app's commands under a few words across the top. React: `Menubar` from `@unlocalhosted/metalui`, on Base UI Menubar with the library's `Menu` inside. SwiftUI: `MetalMenubar` (work in progress; on macOS, use the system menu bar through `.commands`). The plates and rows are the `menu` recipe; the `menubar` recipe adds the keys.

## Use it for

- A desktop-style app in the browser with many commands grouped under a few words: File, Edit, View, Insert.

## Don't use it for

- A website's sections (use the navigation menu), or a few actions (use a toolbar or buttons).

## Anatomy

- Bar: keys 2 apart, padding 2.
- Key: a word in ui type, 26 tall, padding 10, radius 8; it lifts (the list row's look) on hover.
- Menu: the menu's frosted plate below its key, with rows, shortcuts and separators.

## States and motion

| State | Look | Motion |
|---|---|---|
| rest | quiet words | – |
| hover (nothing open) | that key lifts | – |
| open | the plate below the key; one highlight under the key | the plate fades in on settle |
| moving across while open | the highlight follows; the next menu opens | the highlight glides on the settle spring; the next menu opens at once as the last fades on release |
| close | Esc, a click outside, or a choice | the plate fades on release |

Reduce Motion: the highlight moves at once.

## API

| React | SwiftUI |
|---|---|
| `Menubar` `aria-label`, `loopFocus`, `modal`, `disabled` | `.commands { … }` |
| `Menubar.Menu` `label`, `heading`, `disabled`, children (MenuItem, MenuSeparator) | `CommandMenu(label)` |

## Keyboard and accessibility

- A `menubar`; ← → move between keys, ↓ or Enter opens a menu, ↑ ↓ move within it, ← → move to the next menu while open, Esc closes it and returns focus to its key.

## Rules

- Few words, most used first: File, Edit, View.
- Every command also has a shortcut or a place elsewhere; the bar is where people look them up.

The category words File/Edit/View stay words. Their commands use the set at14px: New canvas `board`, Open document `document`, Export `download`, Undo `undo`, Redo `redo`, Select all `select`, Show grid `layout`. Actual size stays its precise word: `fit` would promise a different operation. A menu command's glyph shares its row trigger and never becomes another focus stop. Native system Menu/Commands hosts use the same custom symbol, e.g. `Label { Text("Export…") } icon: { MetalIcon(.download, size: 14) }`; the MetalMenubar body remains WIP. Existing word keys contain no drawn chevron to replace or rotate.

---

# Meter

A level in a range. React: `Meter` from `@unlocalhosted/metalui`, on Base UI Meter. SwiftUI: `MetalMeter`. Every segment sits in the reviewed opaque socket and uses the same per-colorway state inks and lit halo (the `status` recipe); the `meter` recipe adds the segments and the sweep.

## Use it for

- A measurement that sits in a known range: storage used, battery, signal, a quota.

## Don't use it for

- A task's progress (use progress), or a value someone sets (use a slider).

## Anatomy

- Head (optional): label at the left (ui type), value at the right (meta type).
- Segments: 16 lamps in a row, 10 tall, 2 apart, radius 2.5; the socket bezel takes 1 inside that existing footprint. Lit up to the value; dark (the off lamp) above.
- Colour by position: green, amber from 75 % of the range, red from 90 % (`warn`, `danger`), measured toward the bad end: the top by default, the bottom with `bad="low"` (a battery).

## States and motion

| State | Look | Motion |
|---|---|---|
| level | lit up to the value | – |
| rising | more segments light | one segment every 16 ms upward from the old edge, each fading in 90 ms |
| falling | segments go dark | one every 16 ms downward from the old edge |

Reduce Motion: every segment changes at once (web scoped data-mu-motion/OS, native additive metalReduceMotion/OS). Only lamp opacity transitions; nothing runs at rest.

## API

| React | SwiftUI |
|---|---|
| `value`, `min` (0), `max` (100) | `value:`, `in:` |
| `label`, `showValue`, `format` | leading label, `showValue:`, optional `valueText:` |
| `segments` (16), `warn` (0.75), `danger` (0.9), `bad` (`high`, `low`) | `segments:`, `warn:`, `danger:`, `bad:` |

## Keyboard and accessibility

- A `meter` with aria-valuenow, min and max; the label names it. It takes no focus. The colours repeat what the value says; never use colour alone to warn (say it in text too).

## Rules

- A meter measures; it never counts down a task.
- Keep the zones meaningful: amber and red only where the level is a problem.

---

# Navigation menu

A site's sections across the top, with panels of links. React: `NavigationMenu` from `@unlocalhosted/metalui`, on Base UI Navigation Menu. SwiftUI: `MetalNavigationMenu` (work in progress). Keys are the `menubar` recipe's, the plate is the `menu` recipe's, links use the `row` recipe's lift; the `navigation-menu` recipe adds the panel's motion.

## Use it for

- A product or docs site's top navigation where some sections hold several pages worth describing.

## Don't use it for

- App commands (use the menubar), a path (use breadcrumbs), or views of one page (use tabs).

## Anatomy

- Keys: the menubar's words; a key with a panel has the shared `chevron`, sized by `navigation-menu.chevron.size`; `NavigationMenu.Link top` is a plain key that goes somewhere.
- Panel: the menu's frosted plate, 8 below the key, padding 8.
- Links in a panel: rows (padding 10 × 12, radius 12) with a title (ui type) and a line (body type, ink2).

## States and motion

| State | Look | Motion |
|---|---|---|
| hover / open key | the key lifts | – |
| open | the plate under the key; chevron turned over | rises one nest on the surface spring; shared glyph morphs to turn 180 on the settle spring |
| to the next key | the plate under it at the new panel's size | slides and resizes on the settle spring; content moves two grid steps the way you went and crossfades |
| close | – | fades on the release spring |
| current page | its link lifted (`active`) | – |

Reduce Motion: size and place snap; content crossfades without travel; the shared chevron reaches its whole new direction at once. The glyph follows Base UI's live `open` state, including hover, keyboard, Escape and dismissal. There is no separate CSS rotation. Swift's WIP container draws no internal glyph; section content owns its shared chevron.

## API

| React | SwiftUI |
|---|---|
| `NavigationMenu` `aria-label`, `value`, `onValueChange`, `delay`, `closeDelay` | – |
| `NavigationMenu.Item` `label`, children (the panel) | – |
| `NavigationMenu.Link` `href`, `description`, `active`, `top`, `render` (a router's link) | `NavigationLink` |

## Keyboard and accessibility

- A `nav` with a list of keys; Tab moves between keys, Enter or ↓ opens a panel and moves into it, Esc closes it and returns to the key. The current page's link says `aria-current="page"` (`active`).

## Rules

- A panel's links say what is there in a line, not just a name.
- Keep panels small: a few links a column, at most three columns.

---

# Number field

A number you step, scrub or type. React: `NumberField` from `@unlocalhosted/metalui`, on Base UI NumberField. SwiftUI: `MetalNumberField` (work in progress). The well is the `well` recipe's field look and the keycaps are compact buttons; the `number-field` recipe adds the size, and the motion is the system's swap drum and refusal.

## Use it for

- A count or amount with small steps and a sensible range: copies, columns, a font size, minutes.

## Don't use it for

- A value where the rough position matters more than the digits (use a slider), phone numbers or codes (use a field), or large free amounts (use a field with a unit).

## Anatomy

- Label (optional): ui type, ink (the form field's label), above; drag it sideways to scrub.
- Group: a pill in the field well, 132 × 32, padding 3.
- Keycaps: compact caps, 26 square, − at the start and + at the end.
- Window: the value, centred, lead type with tabular figures.

## States and motion

| State | Look | Motion |
|---|---|---|
| step (+ / ↑) | the new value | the cap sinks; the value turns one drum step up on the settle spring |
| step (− / ↓) | the new value | the drum turns down |
| hold | repeats | each step turns the drum |
| scrub | the label drags | the drum turns the way the value went |
| at a limit | that keycap disabled | – |
| past a limit (arrow key) | unchanged | only the digits shake on the refusal spring |
| typing | plain text | no drum; commits and formats on blur |
| focus | the flush green ring on the group | – |
| invalid | the foundation's invalid ring; aria-invalid | – |
| disabled | 40 % | – |

Reduce Motion: the drum crossfades; nothing shakes.

## API

| React | SwiftUI |
|---|---|
| `value`, `defaultValue`, `onValueChange` | `value:` |
| `min`, `max`, `step`, `largeStep` (Shift) | `in:`, `step:` |
| `format` (Intl.NumberFormat options) | `format:` |
| `label`, `decrementLabel`, `incrementLabel` | `label:` |
| `invalid`, `disabled`, `readOnly`, `required`, `name` | `.disabled()` |

## Keyboard and accessibility

- The input is a numeric text input described as "Number field" (Base UI): ↑ ↓ step, Shift+↑ ↓ by the large step, Home and End go to the limits. The keycaps are named "Decrease" and "Increase" and are skipped by Tab.
- `label` names the input (aria-labelledby); without it, pass `aria-label`.

## Rules

- Give it a range. A number field without limits is a text field.
- The drum turns the way the number went: up for more, down for less.
- A refusal moves only the digits.

The step keys use the icon set's shared `minus` and `plus` at `key.glyph`, with accessible decrease/increase names. React retains Base UI repeat, range and keyboard behavior. Native keys preserve the value/range/step API, repeat while held, disable at bounds and expose an adjustable value with separate, named step buttons; native well/drum material remains WIP. Reduced motion keeps the glyphs static.

---

# Numeric cue

Component: an inline canonical quantity you operate. Its scale exists only while dragging and is an Instrument. Mark supplies display grammar; Base UI NumberField supplies the spinbutton, locale parsing, focus, bounds, numeric keyboard steps and vertical scrub.

## Contract

`value: { value, unit }`, `onValueChange`, `units`, `min`, `max`, `label`, and `footprint` are required. Bounds use canonical quantity. Each unit supplies positive `factor` (canonical quantity per displayed unit), display `format(number)` and lossless `source(number)`. Minutes factor 1, hours factor 60; display is canonical / factor. A unit conversion changes its spelling, preserving the canonical quantity. Hosts supply explicit money factors; no exchange lookup occurs.

Use `kind` (date/duration/amount/measurement), `meaning`, `raw`, `locale`, `numberFormat`, `disabled`, `readOnly`, `name` as needed. `footprint` must include the widest raw and formatted faces across every allowed unit and value. It reserves real inherited font width; no per-frame measurement occurs. The semantic line reserves above-text glyph clearance independently.

## Source history

Wire `onBegin` to `useCueDocument.begin(range)`, `onSourceChange(words)` to `.replace(words)`, `onCommit` to `.commit()` and `onCancel` to `.cancel()`. One drag is one undo entry. `onCancel('external')` invalidates an obsolete capture: retain the externally supplied document; do not restore old source. Escape and pointer cancellation restore the captured canonical value, unit and spelling. Hosts own source ranges and UTF16 selection. Native supplies the same callbacks through `MetalNumericCue` and can use `MetalCueDocument`.

## Interaction

Vertical drag steps the amount; horizontal drag converts units after each existing spacing stop. Axis locks for that gesture. Shift selects the unit's `largeStep`; Alt/Option its `smallStep`. Arrow Up/Down step through Base UI. Alt/Option Left/Right converts units; plain Left/Right remains a typing caret. Tab focuses the input; Enter commits; double-click types. Each accepted stop calls shared detent haptic once. No callback/haptic occurs for a disabled or read-only interaction or a rejected endpoint step. Escape cancels without a later blur commit. Source changes always follow a deliberate action, never recognition.

## Materials and motion

Use existing Mark underline/glyph, shared SwapText drum and tooltip chip recipes. No new fill, color, spacing, font, elevation or spring. Rest runs no gesture listener or animation. Scale appears only while held. Shared OS, site and scoped motion policy makes value changes settle without travel. Haptics remain independent of visual motion.

Swift `MetalNumericCueValue`, `MetalNumericCueUnit` and `MetalNumericCue` match canonical and source semantics. The native inline face uses `MetalCueText`, a plain editing TextField, real keyboard/VoiceOver adjustments and a fixed hidden-text maximum footprint. macOS and iOS hosts control source/history; a preview alone is not TextKit caret proof.

`allowTyping={false}` retains formatted words and Base UI numeric arrows/scrub, blocks text insertion/paste and leaves Root mutable. Use for civil date/time controls whose typed numeric ordinal would be meaningless. `inputAria` is limited to popup/help relations on the actual spinbutton. Escape restores the exact source spelling captured on begin, even if a host formatter changes. Swift supplies the same `allowTyping` policy.

`resolved` forwards a semantic full value to the existing Mark chip and spoken input value. `hint={false}` suppresses inner visual help/chip when a provenance host supplies it, retaining keyboard instructions and the held scale. Native `resolved`/`hint` share that contract; optional `onOpenPicker` handles Return, Space or Option+Down before numeric detents only when `allowTyping=false`.

---

# Pagination

Moving through pages of results. React: `Pagination` from `@unlocalhosted/metalui`. SwiftUI: `MetalPagination` (work in progress). The track, thumb and keys are the `switcher` recipe; the `pagination` recipe adds the page window.

## Use it for

- Results people move through by page and may return to by number: search results, an archive, a table.

## Don't use it for

- A feed people scroll (load more as they reach the end), or steps of a task (use a stepper).

## Anatomy

- `nav` named "Pagination", holding the switcher's sunk track.
- Keys: previous (the shared `chevron`, turn 90), the page numbers (at least 28 wide, tabular figures), next (the same glyph, turn 270).
- The current page: the switcher's raised thumb.
- Long runs: the first and last pages, the current one and `siblings` (1) on each side, ellipses for the gaps.

## States and motion

| State | Look | Motion |
|---|---|---|
| current | the raised thumb under its number | – |
| choose a page | the thumb under the new number | glides on the part spring |
| first / last page | previous / next disabled (40 %) | – |
| focus | the switcher's focus ring | – |

Reduce Motion: the thumb moves at once and the chevron stays complete and still. Previous/next keys play one chevron act on hover, focus or press; disabled end keys play nothing. Glyph dimensions come from `pagination.arrow.size` on both platforms.

## API

| React | SwiftUI |
|---|---|
| `page` (from 1), `count`, `onPageChange` | `page:`, `count:` |
| `siblings` (1) | – |
| `aria-label` ("Pagination") | – |

## Keyboard and accessibility

- A `nav` landmark; every key is a button named "Page 3", "Previous page", "Next page"; the current page says `aria-current="page"`. Tab moves through the keys.

## Rules

- Keep the page in the address when you can, so a page can be shared.
- Show the page count somewhere near ("Page 3 of 12") when it matters.

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

- A `status` region, so arriving in the past is announced. Back to Now is a real button with the canonical `clock` action glyph in React and Swift, and its shortcut (`aria-keyshortcuts="Escape"`).

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

# Person cue

A Component for a known person's exact source name. The host supplies names and optional Avatar Objects; the Mark Part receives that object through its meaning slot. A shared person glyph is the fallback. It never infers an identity or constructs an Avatar.

## Source and history

React `PersonCue` and SwiftUI `MetalPersonCue` take a controlled `value`, unique nonempty `choices` and `label`. Each choice has exact source `value`, optional picker `label`, host `avatar`, and `disabled`. The visible inline name is always `value`, even when a picker label differs or the current source is unknown. All permitted full names and the current source reserve the same content-font footprint before opening; changing names does not move neighbouring words.

`onBegin` captures the host's source range. `onChange(words)` confirms one exact chosen name; returning false rejects a stale range. `onCommit` ends one history entry; `onCancel` restores the captured source and UTF16 selection. `useCueDocument`/`MetalCueDocument` supply this lifecycle. Arrow/typeahead highlight is only an instrument and never previews source. Choosing the current name is a no-op history entry. Pass `editing` so unrelated source typing invalidates an open transaction. Changed vocabulary, disabled/read-only, backgrounding (native), dismissal or unmount cancel it. No local selected-name copy can outlive source.

## Interaction and appearance

Click, Enter or Space opens the shared names plate. Arrows, Home/End and typeahead highlight; Return or pointer chooses; Escape/outside closes without changing the name. Disabled choices are skipped. React Base UI Select owns ARIA, focus return and keyboard navigation. Native uses actual SwiftUI buttons and a focused names list with selected accessibility traits. Read-only exposes the current value and refuses edits; disabled never opens. Common top-level trigger events/ARIA, optional `triggerProps`, and the forwarded ref reach React's actual trigger for provenance help, without another Tab stop. Set `hint={false}` / native `hint: false` when provenance owns visual help; intrinsic keyboard instructions remain.

At rest the Mark quiet underline and small host avatar identify the name. `raw` fades decoration, retaining the same source and footprint. The existing SwapText drum changes confirmed words; reduced motion uses its crossfade and the plate's donor fade. Native uses the same content type, Mark, menu plate/rows, highlight, pen and settle transition. No material, dimensions, recurring timer or rest animation are introduced. This is a SwiftUI source surface; a TextKit host still owns caret/IME and attributes, rather than pretending these views are an editor.

Live native motion reduction rebuilds only the selected word face and disables its inherited animation transaction. The actual button, focus, picker and source snapshot keep their identities. The public macOS feature receipt switches scope during a confirmed name swap and compares rendered words with a fresh reduced-motion control, as well as checking source history and cancellation.

---

# Popover

A small panel that comes out of its trigger. React: `Popover` from `@unlocalhosted/metalui`, on Base UI Popover. SwiftUI: `MetalPopover` (work in progress). The plate is the `menu` recipe's frosted plate; the `popover` recipe adds padding, width, text and motion.

## Use it for

- A small task beside the thing it acts on: rename, pick a colour, share a link, confirm a detail. It holds real content: a title, a line, a few controls.

## Don't use it for

- A list of commands (use a menu), a hint on hover (use a tooltip), a choice from options (use a select), or anything that must stop the page until answered (use a dialog).

## Anatomy

- Plate: the menu's frost, radius 18, padding 14, 220 to 320 wide, 6 from its trigger.
- Title (title type), Description (body type, ink2) 4 below it, Body 12 below that.

## States and motion

| State | Look | Motion |
|---|---|---|
| closed | nothing | – |
| opening | the plate starts one nest (6) back toward its trigger, at 0.97, transparent, grown from the trigger's side | rises and fades in together on the surface spring (no overshoot) |
| open | at rest beside the trigger; focus inside | – |
| closing | fades out where it is | release spring; no travel back |
| flipped | if there is no room, it opens on the other side and rises from that side | same |

Reduce Motion: a crossfade.

## API

| React | SwiftUI |
|---|---|
| `Popover.Root` `open`, `defaultOpen`, `onOpenChange`, `modal` | `isPresented:` |
| `Popover.Trigger` (children: the control) | `trigger:` |
| `Popover.Content` `side`, `align` | `arrowEdge:` |
| `Popover.Title`, `Popover.Description`, `Popover.Body`, `Popover.Close` | slots |

## Keyboard and accessibility

- The trigger opens and closes it (Enter or Space). Focus moves into the plate; Tab stays within while open only if `modal`.
- Esc or a click outside closes it and returns focus to the trigger.
- Title and Description name and describe the popup (a dialog role with aria-labelledby and aria-describedby).

## Rules

- It comes from its trigger and goes back to nothing: open on the side with room, never centred on the page.
- Keep it small. If it needs scrolling or more than a few controls, it is a dialog.
- One popover at a time.

## Scoped colorways

The positioner copies the active trigger’s nearest `data-mu-colorway`, including live ancestor changes. Multiple triggers use Base UI’s active trigger; composed Trigger and Content refs still reach their DOM controls. Popups remain outside clipped hosts. No override retains document inheritance. SwiftUI popovers carry the native colorway environment.
## Rename operation

Compose RenameEditor inside Popover.Body. Capture the original when opening; the editor selects the meaningful name, validates, commits on Enter, and retains failures for retry. The host controls open, refuses outside/Escape dismissal while onPendingChange is true, and closes onDone after the glyph/drum settle and result beat. onRenamed receives the captured original for a toast Undo closure. Popover owns focus placement/restoration; the editor owns only the edit. See rename-editor.agent.md.

`Popover.Content anchor` accepts Base UI's Element, ref, virtual anchor or resolver. Use it when an existing input owns activation; no wrapper button or second tab stop is needed. The direct element (or a virtual anchor's contextElement) supplies live nearest colorway inheritance. `initialFocus` and `finalFocus` remain Base UI Popup props; return focus to the operated input explicitly.

---

# Preview card

What is behind a link, seen by resting on it. React: `PreviewCard` from `@unlocalhosted/metalui`, on Base UI Preview Card. SwiftUI: `MetalPreviewCard` (work in progress). The plate, rise and text are the `popover` recipe's; the `preview-card` recipe adds the width and timing.

## Use it for

- Links whose destination is worth a glance before going: a person, a document, another site.

## Don't use it for

- Anything people must see or act on (it only shows on hover), labels for icons (use a tooltip), or actions (use a popover).

## Anatomy

- The link, unchanged.
- Card: the popover's frosted plate, 300 wide, 6 below the link; an optional image (140 tall, radius 10), the title (title type), a line (body type, ink2), the host (meta type, ink3), 6 apart.

## States and motion

| State | Look | Motion |
|---|---|---|
| hover, under 600 ms | the link only | – |
| hover, 600 ms | the card | rises one nest out of the link on the surface spring |
| pointer on the card | the card stays | – |
| pointer away | the card stays 300 ms | then fades on the release spring |

Reduce Motion: a crossfade.

## API

| React | SwiftUI |
|---|---|
| children (the link) | – |
| `preview` (`title`, `description`, `host`, `image`) | – |
| `side` (`bottom`, `top`) | – |

## Keyboard and accessibility

- The card also opens when the link takes keyboard focus. It is a supplement: the link itself must say where it goes; nothing in the card is needed to use the page.

## Rules

- Only for links; never put controls in a preview card.
- Keep it to a glance: an image, a title and a line.

---

# Progress

Task amount and state. React `Progress` wraps Base UI Progress; Swift `MetalProgress` renders the same switch material and progress recipe. The host reports the amount and owns pause, resume, retry, cancellation and reset.

## Use

Use for an export, upload or sync with a known amount or honest unknown work (`value={null}`). Use Spinner for a short action wait, and a meter for a measurement unrelated to a task. Label what is happening. The control receives no focus; the host announces start/end state changes separately.

## Contract

React `value`, `min` (0), `max` (100) are clamped and normalized for every shape. Swift uses `value: Double?` and `total:`. State defaults to running, or complete at the maximum. Explicit states: `idle`, `running`, `paused`, `failed`, `cancelled`, `complete`.

- Running: known fill follows the amount on settle, with no predicted progress. Unknown work sweeps only while running and on screen.
- Paused: amount holds and fill dims. The host provides Resume.
- Failed: amount holds in invalid ink, with sync-error in the head. The host provides Try again.
- Cancelled or idle: when the host resets the amount to zero, the fill drains on release and the value turns back on the drum.
- Complete: finish the fill first, then show check and `completeLabel` (otherwise keep the supplied task label).

`shape="bar" | "slim" | "ring" | "segmented" | "buffered"`; `size="compact" | "regular"`. Slim has no head or detail: supply `aria-label`. Segmented is for known steps (`segments`, Swift `steps:`); unknown segmented work falls back to a single unknown bar. `buffer` uses the same units and is clamped ahead of the primary amount. Ring geometry changes only when the host reports an amount; it does not rotate for known work.

`detail` can show items done or time left; it uses tabular meta type. `showValue` turns the formatted amount on the drum. React `format` uses Base UI's Intl formatting. Give string details or custom `aria-valuetext` so the amount, state and detail remain available independently of the glyph.

## Composition

`Progress.Root`, `Progress.Label`, `Progress.Value`, `Progress.Track` expose Base UI's naming/value parts. Track obtains the same normalized shape/state contract. Swift `MetalProgress(label, value:, total:, state:, shape:, size:, steps:, buffer:, detail:, completeLabel:, showValue:)` exposes the same task states.

## Motion and lifecycle

Only transform and opacity animate for bar fills and unknown waits. Known ring geometry changes on reported amount. Reset uses release; arrival uses settle. Unknown web waits pause off screen, on inactive states, and under document removal; native waits exist only while mounted and running. Both system and scoped/site reduced motion remove travel: known amounts snap; unknown work breathes in place. A pause freezes the wait. No task clock lives inside Progress.

## Accessibility

React retains Base UI's `progressbar`, label association, clamped amount and missing numeric amount for unknown work. State and details appear in `aria-valuetext`; running and finishing set `aria-busy`. Swift supplies task label and amount/state/detail as one spoken value. A completion announcement belongs to the host, once, not every percentage update.

The export action uses the Button icon slot and `SwapText` together when Run export becomes Cancel, Resume or Try again. Native state labels use the same clipped settle transition as Status, including changes before completion; scoped Reduce Motion applies words instantly and discards any outgoing full-motion face when the policy changes. `e2e/native/run-progress-label-proof.py` verifies the live public host settles and becomes still in both colorways.

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
| `disabled` | suppresses the visual tooltip while an editing instrument is held; source metadata and trigger focus remain |

## Rules

- Every applied cue has provenance, and a guess shows its number.
- The source first.
- It never covers the cue's own value chip.

## Accessibility

- Base UI Tooltip: it opens on hover and on keyboard focus and closes on Escape. Tooltips are visual only, so the block also appends provenance to the cue's authored `aria-description` ("Recognizer, 0.82"). The cue stays the focusable element.
- It never holds interactive content. Native exposes Source as high-importance custom accessibility content, preserving the wrapped cue’s keyboard hint.
- Compose with the actual control trigger. Numeric and date inputs receive source through `inputAria.aria-describedby`; Person, Enum, Tag, Colour and Link forward it directly. Do not add a focusable wrapper.
- Use `disabled={document.editing}` or native `enabled: !document.editing` while scale/adjacent-state feedback is held. Suppression closes the visual overlay without disabling the control or erasing its origin.

## One source document

The docs source example uses `useCueDocument` and native `MetalCueDocument` with the exact sentence and an explicit 2 October 2026 date reference. Host-known tags and names, finite task states, canonical minutes, full hex and URLs remain authored source words. No recognizer confidence is invented. The source textarea/TextKit editor owns UTF16 selection; apply it only when that editor is already focused.

`onBegin` captures the operated range, source callbacks replace its words, `onCommit` records one gesture and `onCancel` restores it. Pointer previews create one Undo. Numeric keyboard detents commit one edit; Enum key repeats share a held gesture until release. Undo/Redo restores source and selection without stealing focus. Compare source by exact UTF16 units; NFC/NFD spellings remain distinct authored edits even when the caret does not move. Typing an unfinished hash opens `TagCue.Picker` against that captured range; search leaves it unchanged, choosing replaces it once, dismissal retains the typed hash. Known people use a named Select trigger and listbox; finite state/tag rotors remain named adjustable buttons. Numeric/date cues remain spinbuttons.

Examples live outside the published native library in `swift/Examples/MetalProvenanceDocumentExample.swift`; the same public controls back the actual macOS feature fixture. Browser and native receipts cover UTF16 emoji/caret shifts, history, cancellation, fixed footprints, read-only controls and both colorways/reduced motion. These receipts do not claim observed VoiceOver speech or physical trackpad feedback.

## Tokens

Timing and placement: `--mu-provenance-delay-ms`, `--mu-provenance-offset`, `--mu-provenance-chip-offset`. Look: the tooltip recipe. Swift: `MetalProvenance`.

---

# Radio group

One choice from a short list. React: `RadioGroup` and `Radio` from `@unlocalhosted/metalui`, on Base UI RadioGroup and Radio. SwiftUI: `MetalRadioGroup` (work in progress). The well's look is the `checkbox` recipe made round; the `radio` recipe adds the pip, the row and the motion.

## Use it for

- Two to about six options where every option should be visible at once, and exactly one holds: "Export as PNG · SVG · PDF".

## Don't use it for

- On or off (use a switch), several at once (use checkboxes), a long list (use a select), or switching views in place (use a switcher).

## Anatomy

- Group: the options stacked (gap 4) or in a line (`orientation="horizontal"`, gap 16).
- Row: a label, at least 24 tall; the well and the text 8 apart. The whole row is the hit area.
- Well: 16, round, the checkbox well; chosen, the checkbox's dark on look.
- Pip: 6, white, centred in the well.

## States and motion

| State | Look | Motion |
|---|---|---|
| rest | a recessed round well | – |
| hover | the well darkens a step (unchosen only) | 160 ms |
| pressed | the well already takes the dark on look | 50 ms: the key is going down |
| chosen | dark well, white pip | the pip scales in on the part spring (may overshoot against its stop) |
| the old choice | back to rest | its pip drops out on the release spring, in the same frame the new one latches |
| cancel (press, drag off) | back to rest | the well fades back; nothing latches |
| focus | the green ring on the well | keyboard only |
| invalid | a red hairline ring on unchosen wells | – |
| disabled | 40 %, no hover, no press | – |

Arrow keys choose without the press phase: the latch and release are the same. Reduce Motion: the pip is there or not at once; the well colour still fades.

## API

| React | SwiftUI |
|---|---|
| `RadioGroup` `value`, `defaultValue`, `onValueChange` | `selection:` |
| `RadioGroup` `orientation` (`vertical`, `horizontal`) | `axis:` |
| `RadioGroup` `name`, `disabled`, `readOnly`, `required` | `.disabled()` |
| `Radio` `value`, `disabled`, children (the label) | `MetalRadio(value:) { label }` |
| `RadioGroup.Root`, `RadioGroup.Item` | slots |

## Keyboard and accessibility

- The group is a `radiogroup`; each option is a `radio`. Tab enters on the chosen option (or the first); arrow keys move and choose; Space chooses the focused one.
- Name the group: `aria-labelledby` to a visible heading, or `aria-label`. Each option's label is its text.
- Inside a Base UI Field, `invalid` shows the red ring and the Field's error text explains it.
- A disabled checked option stays reachable by Tab, following Base UI's radio contract. This lets someone discover the held choice and hear why it is unavailable; it cannot change by Space, arrows or a label click. Unchecked disabled options are skipped. Attach the reason with `aria-describedby` on the group or option. Do not force `tabIndex`: it would break the group's managed focus.

## Rules

- Every option is visible; if the list does not fit, it is a select.
- Order options in a meaningful way (most common first, or natural order), and choose a default when one is safe.
- Labels are short nouns or phrases in the same form: "PNG", "SVG", "PDF".

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

# Rename editor

A Component: the name field and one confirm operation. `RenameEditor` / `MetalRenameEditor` composes the existing field well and primary key. It is not a popover or dialog; the host chooses either and owns dismissal, persistence and Undo.

## Lifecycle

Capture the name on opening; remount for another session. Focus selects it; a file selects only the basename before the final nonempty extension. `.env` selects all, `.env.local` selects `.env`, `report.final.txt` selects `report.final`. Empty and unchanged names disable Rename. The host supplies duplicate, length and domain validation; an error keeps the field open, draws its invalid ring and says why underneath.

Enter submits through Base UI Form; Escape cancellation and focus restoration belong to the Base UI Popover/Dialog host. The cancel key calls onCancel. While pending, the field locks, repeat confirmation is refused, and onPendingChange(true) lets the host refuse outside/Escape dismissal. Failure stays open with sync-error / Try again and editable field. Success turns the pen into a check and Rename into Renamed on the drum, then calls onDone after the settle has landed and the shared minimum result beat. Spinner arrival/minimum are the existing 400/300ms policy. Reduced motion preserves words/results with no glyph shape travel or drum offset.

onRenamed(name, original) runs after persistence succeeds. Capture that original in the host's toast Undo closure; never read the current name later. A new request captures its own original. Toast copy names the result: Renamed to Lisbon · Undo.

## API

React: value, file, label, validate(name), async onRename(name), onRenamed(name, original), onDone, onCancel, onPendingChange. The forwarded ref targets the input for Base UI initialFocus. Swift matches these names. validate returns the explanation or nil; onRename throws/rejects on failure. The editor adds no arbitrary name limits. Keep its status announcements outside an enclosing aria-busy region.

## Composition

Reuse the internal request lifecycle for actual small edits; do not turn this into a broad public form framework. A rename, Save region, Tag and Comment each retain their own labels, validation and Undo policy. The onDone beat closes a small popup; an in-page form can instead leave the result visible.

---

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

---

# Rule

An engraved groove between groups. React: `Rule`. SwiftUI: `MetalRule`.

## Use it for

- Separating groups of tools or footer keys; `tone="graphite"` on dark strips. The caller sets the length (height of a vertical rule) through layout.

## Behaviour

- `role="separator"` with its orientation.

---

# Scroll area

A region that scrolls, with the system's own scrollbar. React: `ScrollArea` from `@unlocalhosted/metalui`, on Base UI ScrollArea. SwiftUI: `MetalScrollArea` (work in progress). The `scroll-area` recipe draws the bar, the thumb and the edge fades.

## Use it for

- A list or text inside a fixed frame: a panel's rows, a long description in a popover, a sheet's content.

## Don't use it for

- The page itself (let the window scroll), or content that fits (it shows nothing then anyway).

## Anatomy

- Viewport: the content; give the area a height or max-height.
- Edge fades: 20 at the top and bottom, only where there is more beyond.
- Bar: 12 wide at the right, inset 2; thumb 4 wide (8 when reached for), ink at 28 %.

## States and motion

| State | Look | Motion |
|---|---|---|
| rest | no bar; fades where there is more | – |
| scrolling | the bar shows | fades in on the settle spring; edge fades grow and shrink with the distance |
| stopped | the bar leaves | 600 ms later, fades on the release spring |
| reaching for the bar | the thumb widens to 8 | part spring |

Reduce Motion: the thumb's width snaps; the fades stay.

## API

| React | SwiftUI |
|---|---|
| children (the content) | `content:` |
| `className` (give it a height or max-height) | `.frame(maxHeight:)` |
| `aria-label` (makes it a named region) | `.accessibilityLabel` |
| `ref` (the outer frame) | No DOM ref; compose the view with SwiftUI modifiers |
| `viewportRef` (`Ref<HTMLDivElement>`, object or callback; the scrollable element) | Wrap in `ScrollViewReader` and use its proxy to scroll to a content ID |
| `onScroll` (Base UI viewport handler; `event.currentTarget` is the viewport) | No offset callback at the current macOS 14 minimum; native `onScrollGeometryChange` requires macOS 15 |

```tsx
const viewport = useRef<HTMLDivElement>(null);

<ScrollArea
  viewportRef={viewport}
  onScroll={(event) => setOffset(event.currentTarget.scrollTop)}
  aria-label="Notes"
  className="h-[240px]"
>
  {notes}
</ScrollArea>

// Read dimensions on demand, outside the scroll handler.
viewport.current?.scrollTo({ top: viewport.current.scrollHeight });
```

`onScroll` observes wheel, keyboard, and imperative scrolling without replacing Base UI's thumb and edge handling. Keep scroll handlers light: read the existing offset, not layout dimensions. The root's other props and `ref` keep their existing destination; use `viewportRef` for scrolling or viewport focus. Callback refs receive `null` when detached. SwiftUI remains the documented system `ScrollView` placeholder; these DOM APIs do not imply native visual or offset-observation parity.

## Keyboard and accessibility

- The viewport takes focus (Tab) and scrolls with the arrow keys, Page Up and Down, Home and End. Name it with `aria-label` when it is a region of its own.

## Rules

- A scroll area inside a scroll area is a trap; give the inner one a clear frame or avoid it.
- Let the fades say "there is more"; do not add "scroll for more" text.

---

# Select

One value from a list of named options. React: `Select` from `@unlocalhosted/metalui`. SwiftUI: `MetalSelect`.

## Use it for

- A value picked from a list: an icon, a folder colour, where to move a block, a preset, a setting with more than four choices.

## Don't use it for

- Two to four short options that fit side by side: `Switcher`.
- A long list someone will search: a combobox (to come).
- An action: `Menu`.
- On or off: `Switch` or `Checkbox`.

## Anatomy

A trigger that is a raised cap (the button cap, it is clicked): the value (with its lead, if any) and the shared down chevron (up while open). The list is the menu's frosted plate: rows 30 tall, a selected-mark slot (14, shared tick at 12), an optional lead, the label; groups get an engraved heading and a separator.

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
| chosen row | shared tick before the label | same pen draw/withdraw as Checkbox |

Keys: ↵, Space or ↓ opens; ↑ ↓, Home, End, type-ahead move; ↵ chooses; ⎋ closes. Reduce Motion: fade only.

## API

`Select options value onValueChange placeholder size ("regular" 32 | "compact" 28) disabled invalid aria-label name`

`options` is `[{ value, label, lead?, disabled? }]` or groups `[{ label, options }]`.

## Scoped colorways

The list portals to the document body and copies the trigger’s nearest `data-mu-colorway` onto its positioner. Open lists follow ancestor colorway changes. No local override retains document inheritance; clipped hosts never clip the list. Native `MetalSelect` carries its colorway through the SwiftUI environment.

The state chevron uses `MorphIcon` on settle; SwiftUI uses `MetalIcon(.chevron)` on the same class. Selected marks use shared `TickGlyph` / `MetalTickGlyph`, keeping the checkbox corner dwell, sprung tail and withdrawal. Reduced motion changes direction and marks in place.

The native trigger uses `MetalMorphIcon(.chevron, turn: open ? .up : .down)`, sharing the exact planner with the React `MorphIcon` rather than rotating a static shape. A changed OS or scoped reduction settles its full orientation immediately.

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
- One of a few: `Switcher`, compact.
- An action: `Button` with its semantic `icon` (Download backup: `download`; Restore: `undo`). The host owns the backup transport; the row does not serialize or restore application data. Swift hosts use `MetalButton("Download", icon: .download)` / `MetalButton("Restore…", icon: .undo)` in the row’s control builder.
- A value (Storage used): a `Label value-small` or a `SizeReadout`.

## Rules

- One control per row. A row never raises on hover; only its control acts.
- The name says what is on, in plain words: "Sync this canvas", not "Enable sync".
- The detail says what it does or what it is now, in one line.

---

# Sheet

A panel that slides in from an edge of the window. React: `Sheet` from `@unlocalhosted/metalui`, on Base UI Drawer. SwiftUI: `MetalSheet` (work in progress). The plate and scrim are the dialog's; the `sheet` recipe adds the edge, the grip and the motion.

## Use it for

- An inspector or settings beside the work (`side="right"`), or a phone sheet of options (`side="bottom"`).

## Don't use it for

- A question that needs an answer (use an alert dialog), a small task by its trigger (use a popover), or navigation that should stay (use a sidebar place).

## Anatomy

- Right: full height, 380 wide (never wider than the window), padding 20, rounded 22 on its inner edge.
- Bottom: full width, at most 85 % of the window tall, rounded 22 on its top edge, a grip (36 × 4, the switch well) 10 from the top.
- Title (title type), Description (body type, ink2), then content, 14 apart.

## States and motion

| State | Look | Motion |
|---|---|---|
| opening | scrim and sheet | slides its whole size in on the surface spring; scrim fades |
| open | focus inside | – |
| dragging | follows the finger | one to one, no spring |
| let go, past the threshold | leaves | release spring, shorter for a harder flick |
| let go, short of it | goes home | settle spring |
| closing (Esc, scrim, Close) | leaves | release spring |

Reduce Motion: it fades in and out, with no slide.

## API

| React | SwiftUI |
|---|---|
| `Sheet.Root` `open`, `defaultOpen`, `onOpenChange`, `side` (`right`, `bottom`), `modal` | `isPresented:`, `edge:` |
| `Sheet.Trigger` (`render` your button) | `trigger:` |
| `Sheet.Popup`, `Sheet.Title`, `Sheet.Description`, `Sheet.Close` | `content:` |

## Keyboard and accessibility

- A modal dialog named by its title and described by its description. Focus is trapped inside while open; Esc closes it and focus returns to the trigger.
- Swiping is extra, never the only way out: keep a Close button.

## Rules

- Everything in it is about what is behind it; it is not a page.
- Keep a visible Close; swipe and Esc are shortcuts.

---

# Sidebar

An app's side place for moving between places. React: `Sidebar` from `@unlocalhosted/metalui`. SwiftUI: `MetalSidebar` (work in progress; `NavigationSplitView` is the system's). A place: the highlight is the `row` recipe's lift, section titles are the engraved `label`, the rail's names are `tooltip`s; the `sidebar` recipe adds the widths and the collapse.

## Use it for

- An app with several places people move between often: spaces, views, settings.

## Don't use it for

- A site's sections (use the navigation menu), or a panel of properties (use a sheet or a split pane).

## Anatomy

- Width 232 (a rail 56), padding 8; header and footer stay while the sections scroll.
- Section: an engraved title and its items, 2 apart; sections 16 apart.
- Item: a 16 glyph and a word, 32 tall, radius 10, ink2 (ink when current or hovered).
- Toggle: collapses to the rail and back.

## States and motion

| State | Look | Motion |
|---|---|---|
| current | the lifted highlight under it | – |
| choose another | the highlight under it | glides on the settle spring |
| collapse | the rail | words fade on the release spring, then the width settles |
| expand | the full width | width settles, then the words fade in |
| rail, hover or focus | the name in a tooltip | the tooltip's own |

Reduce Motion: width and words change at once; the highlight moves at once.

## API

| React | SwiftUI |
|---|---|
| `Sidebar` `collapsed`, `aria-label` | `NavigationSplitView` |
| `Sidebar.Header`, `Sidebar.Footer` | – |
| `Sidebar.Section` `title` | `Section(title)` |
| `Sidebar.Item` `icon`, `href`, `active`, `render` (a router's link), children (the word) | `NavigationLink` |
| `Sidebar.Toggle` `collapsed`, `onCollapsedChange`, optional `icon` | `MetalSidebarToggle(collapsed:)` |

## Keyboard and accessibility

- A `nav` named by `aria-label`; sections are named groups; the current item says `aria-current="page"`. In the rail, items are named by their word and show it as a tooltip on focus. The toggle says whether it is expanded.

## Rules

- Few sections, short words; the most used places first.
- Remember whether someone collapsed it.

- Glyph wrappers are inert: only the navigation link or collapse button enters the Tab order, including in Chrome. Icons still act through the enclosing control trigger.

The default toggle morphs the shared `sidebar` and `sidebar-collapsed` glyphs at16px as its label turns on the drum. The frame stays fixed, the navigation boundary moves, and rail word marks withdraw. Pass `icon` only for custom artwork; it stays host-owned. Swift's operable `MetalSidebarToggle(collapsed:)` uses the same pair and spoken collapse/expand verbs; `.disabled` prevents a change. `MetalSidebar` itself remains a system List placeholder: the native gliding highlight and word/width choreography are still WIP. Reduced motion lands the toggle's glyph and label immediately.

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

# Skeleton

Where content will be, before it arrives. React: `Skeleton` from `@unlocalhosted/metalui`. SwiftUI: `MetalSkeleton` (work in progress). A part: its shapes are the `well` recipe's field look; the `skeleton` recipe adds the sizes, the sheen and the timing.

## Use it for

- A list, a card or a panel whose shape you know while its data loads (over about 300 ms).

## Don't use it for

- Work in a control (use a spinner), a task with an end you can show (use progress), or content whose shape you cannot guess.

## Anatomy

- `Skeleton`: a block (`width`, `height`), radius 8.
- `Skeleton.Text`: `lines` pill lines 12 tall, 8 apart; the last is 62 % wide.
- `Skeleton.Circle`: `size`, for an avatar or a glyph.
- `Skeleton.Swap`: shows the shapes while `loading`, then the content in the same place.

## States and motion

| State | Look | Motion |
|---|---|---|
| mounted | nothing | waits 300 ms, so a fast load never flashes it |
| waiting | the shapes in the sunk well | fade in on the settle spring; a soft light passes across (1.6 s, linear) |
| arrived | the content | the content fades in on the settle spring, in the same place |

Reduce Motion: no sheen; the fades stay.

## API

| React | SwiftUI |
|---|---|
| `Skeleton` `width`, `height` | `MetalSkeleton(width:height:)` |
| `Skeleton.Text` `lines`, `width` | `.redacted(reason: .placeholder)` |
| `Skeleton.Circle` `size` | – |
| `Skeleton.Swap` `loading`, `fallback`, `label` | – |

## Keyboard and accessibility

- The shapes are hidden from assistive tech; `Skeleton.Swap` marks the region busy (a `status` named by `label`, "Loading" by default) until the content arrives.

## Rules

- Draw the shape of what is coming, not a generic grey box: the content should land where the shapes stood.
- One sheen for the whole screen's shapes; never pulse them.

---

# Slider

A value on a track. React: `Slider` from `@unlocalhosted/metalui`, on Base UI Slider. Give it props and it draws itself; or compose its parts `Slider.Track`, `Slider.Marks` (fractions), `Slider.Ticks` (labelled fractions) and `Slider.Knob` inside it for a host that draws its own scale (the time scrubber). SwiftUI: `MetalSlider`.

## Use it for

- A value in a known range that a person sets by feel: zoom, volume, brightness, a quality level, a position in time.

## Don't use it for

- An exact number someone types (use a number field), a level nobody sets (use a meter), or one of a few named options (use a switcher).

## Anatomy

- The track: a track well, 6 / 10 / 14 tall for `compact` / `regular` / `large`; the fill: the green intent gradient at full strength up to the knob, deeper on bone so it stands at least 2:1 from the pale groove, with an inset hairline edge.
- The knob: 16 / 22 / 28, a knurled conic finish with a bright inner ring and a small drop shadow. Size sets the groove and the knob together.
- The optional knob glyph uses the existing Bone ink on the silver cap in both colorways. The cap keeps that material scope independently of the surrounding page; end glyphs follow the page ink2.
- One travel: the groove is the full width; the knob's centre travels half a knob in from each end, so at the minimum and the maximum the knob sits flush inside the groove's rounded ends, never past them. The fill runs to the knob's centre, and marks and ticks sit on the same travel, so a tick, the fill's end and the knob line up at every value.
- Marks: notches cut across the groove (2 wide, the groove's full height), for steps, detents or moments. Only where there is a step or an event: never loose decoration.
- Ticks: a short line a gap under the groove and its label under that, in the meta type (11) at ink2, so labels read at 4.5:1 or better on the surface in both colorways. A host that engraves its own scale (the time scrubber) passes its own `Label` node, and in SwiftUI `tickStyle: .engraved`. With `ticks`, the slider reserves room for them below.
- Glyphs (optional): `startIcon` and `endIcon` at ink2, 14 / 16 / 18, a gap from the groove. Each plays its act when the value arrives at its end. They are decorative; the knob carries the name and value.
- Value (optional): `showValue` writes the value beside the groove in the figure type with `format`. It reserves every formatted step when there are 24 or fewer, otherwise the endpoints and midpoint; range readouts reserve the combined amount. Choose a formatter whose widest label occurs among these samples. The digits turn on the drum; native reserves the endpoints and midpoint too.
- Width: full width of its container by default; `width` sets it (a number is px, a string any CSS length). SwiftUI: frame it as any view; it fills the width it is given.
- Put the slider on a plain surface (a panel, a card) or give it clear space: a busy or dotted backdrop never runs through its labels.

## API

| React | SwiftUI |
|---|---|
| `value` / `defaultValue` (a number or array), `min`, `max`, `onValueChange` | `value:` or `values:` (a binding), `in:` |
| `minStepsBetweenValues`, `thumbs` (individual names/disabled stops) | `minStepsBetweenValues:`, `thumbLabels:`, `disabledThumbs:` |
| `step` (1), `largeStep` (10) | `step:`, `largeStep:` |
| `size` (`compact`, `regular`, `large`) | `size:` (`.compact`, `.regular`, `.large`) |
| `startIcon`, `endIcon` (a glyph node) | `startIcon:`, `endIcon:` (`MetalIconName`) |
| `showValue`, `format` | `showsValue:`, `valueText:` |
| `valueBubble`, `knobIcon` | `valueBubble:`, `knobIcon:` |
| `orientation`, `height` for a vertical host | `orientation:`, `.frame(height:)` |
| `centered`, `tone` (`green` / `neutral`), `detents` | `centered:`, `tone:`, `detents:` |
| `marks` (values), `ticks` (`{ value, label }[]`) | `marks:`, `ticks:` (fractions), `tickStyle:` |
| `width` (full by default) | `.frame(width:)` |
| `aria-label` | `label:` |
| `disabled` | `.disabled(true)` |
| parts: `Slider.Track`, `Slider.Marks`, `Slider.Ticks`, `Slider.Knob` | `onFocusChange:`, `onDragChange:`, `isExternallyDragging:` |

## States and motion

| State | Look | Motion |
|---|---|---|
| rest | the knurled face, a small drop shadow | – |
| hover (over the groove) | the knob lifts ×1.08, a longer shadow | settle spring |
| pressed, dragging | the knob presses ×0.94, a tight shadow; the fill follows the pointer 1:1 | settle spring; no spring on the value while dragging |
| focus (keyboard) | the green ring around the knob | – |
| disabled | the whole slider at 40 %; no pointer, no keys | – |
| refused (a key pushing past an end) | the groove and knob nudge one nest toward that end and ring back; the value stays | refusal spring |

- The knob's face grows away from the nearer end (its origin follows the value), so even lifted it never pokes past the groove; the refusal moves the groove with the knob, so the knob never leaves it.
- Reduce Motion: jumps land at once, the readout crossfades, the lift and press change at once, and nothing nudges.

## Keyboard and motion

- Arrows step (`step`), Shift + arrows and Page Up / Down step large (`largeStep`); Home / End go to each knob's allowed ends. RTL reverses physical horizontal arrows. Each range knob has independent keyboard focus, name, value and disabled state; Base UI keeps the configured number of steps between them.
- A jump rides the part spring; a drag follows the pointer exactly. Knobs translate and a full-sized fill translates/scales; width and position never animate. The Slider-only `part-clamped` curve clips the authored part spring's sampled progress to 0…1, preserving its duration and leaving the generic spring unchanged. Swift clamps interpolated fractions every frame. Both respect physical hard stops; reduced motion lands at once.
- An array draws a range between its first and last knobs. A centred single slider fills from the midpoint to the knob; `tone="neutral"` uses ink2 with the same fill shadow stack. Vertical travel puts the minimum below the maximum and requires an explicit host height.
- A value bubble uses the tooltip plate above a horizontal knob or beside a vertical knob, appearing only while dragging or using the keyboard. The adjacent and bubble readouts turn on the drum (Swift numeric text); reduced motion crossfades. `format` supplies the spoken value independently of decorative glyphs.
- `detents` requests one shared haptic catch per accepted stepped change, never on mount or a refused unchanged amount. Haptic feedback remains independent of reduced motion. Disabled knobs do not catch. Pushing past a stop gives one axis-correct refusal until the pointer re-enters; keys refuse toward the physical stop.
- SwiftUI `onDragChange` reports drag start before the first value change and drag end after release. `isExternallyDragging` lets an offscreen host or controlled gesture suppress the jump spring during a scrub.
- Name the knob (`aria-label`) and give it a value text a person reads: `format` does both ("40%"); with parts, `getAriaValueText` on `Slider.Knob` ("THU 24 SEP · 14:10").

## Rules

- A jump springs, a drag does not.
- Marks and ticks mean something: a step, an event, a labelled value.
- Keep labels plain and readable, on a plain surface.

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
- Web: call `haptic('alignment')` from `onEngage`. It plays what this platform has and returns the path it took:

  | Path | Where | What plays |
  |---|---|---|
  | `'bridge'` | a web view whose host called `setHapticBridge` | the host's native haptic |
  | `'vibrate'` | a touch device with `navigator.vibrate` (Android) | an 8 ms pulse |
  | `'ios-switch'` | iOS Safari 17.4+ (a touch device that knows `<input switch>`) | the system tick, by toggling a hidden switch |
  | `'none'` | everywhere else, including every Mac and PC browser | nothing |

  ```tsx
  import { haptic, SnapGuides } from '@unlocalhosted/metalui';
  <SnapGuides guides={guides} scale={scale} onEngage={() => haptic('alignment')} />
  ```

  Browsers expose no trackpad haptics, so on a Mac the web is silent: say so (the docs demo shows the path), and never replace a haptic with a sound or a flash. Whether the web should stand in for it at all is the owner's decision; until then, the guide's own catch (it lights in the frame of the snap) is the only feedback.

### A web view in a Mac app

MetalUI ships an optional Mac `MetalHapticWebViewBridge`. Retain one per trusted controller and call `detach()` when that host closes. Its weak script handler does not retain the bridge; messages from subframes and unknown kinds are ignored. Install it before loading the page:

```swift
import MetalUI
import WebKit

let configuration = WKWebViewConfiguration()
let haptics = MetalHapticWebViewBridge(configuration.userContentController)
let webView = WKWebView(frame: .zero, configuration: configuration)
// Retain haptics alongside webView. At teardown: haptics.detach().
```

The bundled page opts in explicitly; ordinary browsers and SSR return `null`:

```tsx
import { connectWebKitHaptics } from '@unlocalhosted/metalui';
useEffect(() => connectWebKitHaptics() ?? undefined, []);
```

`connectWebKitHaptics()` installs the `metaluiHaptic` message handler as the `haptic()` transport. Its cleanup clears only its own installation. A later `setHapticBridge()` stays installed if an older host disposes. A disconnected host returns to browser paths; nothing is auto-connected merely because a global exists.

Electron and Tauri use the same typed semantic hook. Electron's preload exposes a fixed `native.haptic(kind)` IPC function; its main process validates the three names and invokes the app's native addon. Tauri exposes a fixed native `haptic` command. Those app-specific native adapters are owned by the host; a Node process cannot call AppKit without an addon.

```ts
import { setHapticBridge } from '@unlocalhosted/metalui';
// Electron preload: haptic: kind => ipcRenderer.send('metalui:haptic', kind)
const disconnect = setHapticBridge(kind => window.native.haptic(kind));
// Tauri host: a registered native command performs the matching pattern.
const disconnectTauri = setHapticBridge(kind => { void invoke('haptic', { kind }); });
// At teardown, call the cleanup belonging to the installed host.
```

The shipped Swift bridge performs the request immediately (`performanceTime: .now`):

| kind | NSHapticFeedbackManager.FeedbackPattern |
|---|---|
| alignment | alignment |
| detent | levelChange |
| refusal | generic |

`MetalHapticWebViewBridge` optionally accepts a `perform` callback for another native device. Tests use it to record pattern delivery from a real WKWebView; transport delivery does not measure a physical trackpad's response. Native apps still depend on available hardware and system settings.

## API

| React | SwiftUI |
|---|---|
| `guides: SnapGuide[]` (`axis`, `position`, `start`, `end`, `kind`) | `guides:` |
| `scale` | `scale:` |
| `onEngage` (call `haptic('alignment')`) | built in (the alignment haptic) |

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

# Spatial field

A decorative Part composed once by a containing Place. The Place supplies its displayed object and Region rectangles in the field's local coordinate system. It chooses the current target, applies the drop and supplies the committed scene. The field never performs hit testing, selects a target or changes placement.

## React

Create one `SpatialFieldController` per surface, render `SpatialFieldCanvas` beneath objects, call `setScene` with bounded visible Regions and stationary object footprints when displayed geometry changes, `setProjection` with the carried footprint and host-selected target, then `endProjection` on drop or cancellation. The small `object` scene key is a one-object shorthand. Keep the controller stable and give the canvas the full surface area. It coalesces pointer samples into one paint per animation frame, caches the stationary occupancy mask, caps raster work, and stops at rest or when hidden. Use `setEnabled(false)` during Place travel. The canvas is inert and hidden from accessibility.

## SwiftUI

Render one `MetalSpatialFieldView(scene:)` beneath a SwiftUI Place, or one `MetalSpatialFieldNSView` beneath an AppKit canvas. Pass `MetalSpatialFieldScene` with displayed Region frames, bounded stationary object frames, optional carried frame and target ID, all in local viewport points. The SwiftUI Canvas redraws only when the host changes its scene; the AppKit view redraws when `setScene` changes its geometry or colorway. Neither has an idle timer or hit target. The host may publish animated presentation frames, but the field must not own a second gesture loop.

## Look and behavior

The field keeps a quiet visible grid at rest. Marks clear Region paper and object footprints. A carried object displaces nearby marks; only the host-selected Region tints nearby marks. Bone and Graphite use the same geometry and generated `spatial-field` recipe. Reduced motion removes field recovery on React; the target and written Region rule remain semantic on both platforms. Standalone Region paper keeps its own local dot material.

---

# Spinner and waiting hosts

React `Spinner`, `useWaiting`; Swift `MetalSpinner`, `MetalWaitingPresentation`, `MetalWaitingShape`. An unknown task's arc takes the host's ink and glyph diameter. No well and no fixed green. The shared waiting foundation defines 400ms arrival, 300ms minimum visibility and a useful explanation after 10s.

## Placement

- Action: Button `state`, with waiting/done/error labels and its retained glyph slot. It refuses another request while busy.
- Small item: a ring in its glyph/trailing slot; dim and disable only that item. Completion shows check and fades; failure offers Try again.
- Large item: matching skeletons in the item's actual image/text areas, operation words, real Progress when the count is known.
- Field: trailing ring replaces clear; typing remains possible. Abort or ignore stale searches before publishing results.
- Place: reserve the incoming structure with skeletons and a thin route Progress bar. No central spinner.
- Background: Led waiting/breathe plus words, leaving other actions enabled. Live is steady; error has words and retry.

## API

| React | Swift |
|---|---|
| `active` (default true), keep mounted | `active:` |
| `size`: regular16, small12, or host diameter | `size:`, `diameter:` |
| `label` | `label:` |
| `announce=false` inside a host with its own status | `announce: false` |
| `showDelay`, `minVisible` in ms | same names in seconds |
| `useWaiting(state, ref, timing)` returns `phase`, `long` | `MetalWaitingPresentation(state:…) { phase, long in … }` |

A host clock owns the whole displayed phase. Pass zero delay/minimum to a nested arc to avoid timing twice. The host owns actual requests, data, errors and progress; the clock never makes a request or invents a percentage.

## Motion, accessibility and lifecycle

`aria-busy` follows the real request immediately, even while the visual face stays unchanged. Announce start and outcome once in one polite host status. Do not live-announce percentages or every phase. A 10s explanation is optional and occurs once when useful. Preserve focus; don't disable a whole region to disable one row. Known work uses Progress as soon as the amount is available.

The arc turns linearly at 900ms/turn and inherits currentColor. Reduce Motion keeps it stationary and pulses opacity using the shared Progress breathing recipe. Offscreen/hidden tabs pause the arc; inactive hosts contain no arc animation. Native clocks cancel when the request changes or the view disappears; the arc pauses outside an active scene. Web shapes use the Skeleton recipe and stop their sheen under reduced motion. Native MetalWaitingShape uses the same field-well material and reserves the incoming geometry without a loop. Hosts must gate skeleton sheen with `--mu-waiting-play-state` while offscreen.

See `docs/WAITING.md` for research, each placement's storyboard and timing ownership. The docs page provides real host compositions, simulated network work, retry, counted batches, and DialKit latency/presentation controls.

---

# Split pane

Two places side by side, or stacked, with a divider you can move. React: `SplitPane` from `@unlocalhosted/metalui` (the ARIA window-splitter pattern). SwiftUI: `MetalSplitPane` (work in progress; `HSplitView` and `NavigationSplitView` are the system's). A place: the divider is the `rule`'s hairline with the `switch` thumb as its grip; the `split-pane` recipe adds the hit area, the detents and the steps.

## Use it for

- A list beside its details, a canvas beside an inspector, an editor over its preview: two places whose balance people change.

## Don't use it for

- A sidebar that only opens and closes (use the sidebar place), or content that should reflow instead (use a responsive layout).

## Anatomy

- Two panes; the first takes `size` percent (default 30), the second the rest.
- Divider: a 1 hairline in a 12 hit area, with a 28 × 6 raised grip at its middle.

## States and motion

| State | Look | Motion |
|---|---|---|
| hover | the grip lifts | settle spring |
| dragging | the grip pressed; panes follow the pointer | one to one, no spring |
| let go near the default (3 %) | the default size | snaps on the part spring (a detent) |
| let go past half the minimum (collapsible) | the first pane shut | snaps on the part spring |
| let go under the minimum | the minimum | snaps on the part spring |
| keys | a step of 8 | settle spring |

Reduce Motion: snaps and steps land at once.

## API

| React | SwiftUI |
|---|---|
| `orientation` (`horizontal`, `vertical`) | `HSplitView` / `VSplitView` |
| `size`, `defaultSize` (30), `onSizeChange` | – |
| `min` (15), `max` (85), `collapsible` | `.frame(minWidth:)` |
| `label` (names the divider), two children | – |

## Keyboard and accessibility

- The divider is a focusable `separator` named by `label`, with its value in percent. ← → (↑ ↓ when stacked) step by 8, Home goes to the minimum (or shut, when collapsible), End to the maximum, Enter restores the default. A double-click restores it too.

## Rules

- Give each pane a real minimum; never let content crush.
- Keep the default where most people want it: the detent is there to find it again.

---

# Status badge

`StatusBadge` / `MetalStatusBadge` names a system state beside a decorative lamp or an authored meaning glyph. A component: it tells you what is happening; it never executes the fixing action. A hint uses Base UI Tooltip on hover and focus. Use separate buttons for Retry or settings.

## Material and state

The shared status recipe gives the badge a 26-high cap plate, 11 horizontal pad, 7 gap and defined .5 edge. Words are 500 12px/16px sans, tracking .01em in ink2. The LED lens is 8 (6 small) inside a dark opaque 1px socket: 10/8 total. All lit states have the same 4px halo at .35; off is a dull socket. Colors live in `recipes.status.props.ink`; measured contrast and protan/deuter simulations are in `docs/STATUS-COLORS.md`. Color-vision simulations do not guarantee recognition; words are mandatory.

| State | Default gesture | Words |
|---|---|---|
| live | steady | Sync live |
| waiting | breathe while pending | Sync waiting |
| failed | double blink once, then steady | Sync failed |
| link | steady | Sync linked |
| off | dark | Sync off |

Only inner lens opacity animates; the socket never fades. OS, html.rm and scoped reduced motion hold lamps steady. Words retain every meaning. Hidden/offscreen lamps pause; finite gestures stop at completion.

## Tone and surface

- `tone="default"`: opaque plate by default; it holds its ground on frosted parents and imagery.
- `tone="quiet"`: LED and words with no plate or horizontal padding. Use only on a controlled ground; never directly over imagery.
- `tone="strong"`: opaque plate with 12% tint from the same state ink. Strong always stays opaque.
- `surface="transparent"`: explicit strong frost fill without blur. `surface="frosted"`: same fill plus shared 22px / 1.6 backdrop. Both use full shared ink for worst-case contrast; default opaque/quiet/strong use ink2.
- `solid`: forces an opaque plate, including quiet and translucent requests. Reduced transparency / low power also replaces transparent/frosted with the existing opaque twin and removes blur. Native respects Reduce Transparency.

React: `StatusBadge led hint tone surface solid gesture glyph` with words as children. Swift: `MetalStatusBadge("Sync live", led: .live, tone: .default, surface: .solid, solid: false)`; optional `hint`, `gesture` and `glyph` match React. The tone wins over surface; solid wins over tone. Scope policies use `data-mu-transparency="reduce"`, `data-mu-power="low"`, `data-mu-motion="reduce"` on the parent.

## Accessibility

The badge has role=status and atomic announcements when its words change; keep it outside another aria-busy host. With hint it is focusable, with a description and tooltip; otherwise it has no tab stop. LEDs and meaning glyphs are aria-hidden. Native combines the words as its accessibility label and exposes the hint as help. Never convey a failure only by red or blinking.

## One retained sync meaning

Pass `glyph="synced"`, `"offline"` or `"sync-error"` to replace the lamp in the shared 14pt compact glyph slot. `led` still identifies the plate tint: link, off or failed. One MorphIcon remains mounted as that name changes; string children turn on the shared SwapText drum in the same render. Swift `MetalStatusBadge("Offline · changes stay here", led: .off, glyph: .offline)` uses MetalMorphIcon and the existing settle label transition. Reduced motion holds the glyph at its new authored geometry. React words cross-fade; native words resolve immediately, including when reduction is enabled on a live badge, so SwiftUI cannot retain an outgoing vertical transition. No timer runs at rest.

Keep the badge outside the work item's busy subtree. Words describe the consequence (offline changes remain local), and a separate Retry action executes recovery. A glyph never replaces words or supplies a second announcement. Arbitrary React children remain supported; when composing rich changing labels, supply your own SwapText. Omit `glyph` for the established LED/lamp behavior.

`e2e/native/run-status-label-proof.py` exercises the actual quiet badge in both colorways, switches a live scope to reduced motion, and compares rendered label pixels during and after the change. The glyph result act stays separately scoped; the native words become still immediately. It does not assert spoken VoiceOver output.

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

`Chip variant="suggestion"`: a 20 tall frosted pill with a .5 green ring at .4 over a small raise, the question in ink2. `Label variant="small"`: the confidence (`0.72`), 2 after the question and 3 before the actions. `IconButton variant="mini"`: canonical `check` (`accept`, green on hover) and `close`, 18 × 16 with the shared 14 glyph. React `Icon` and native `MetalIconButton(icon:)` use the same authored set; full contours remain under reduction. It sits beside the first line of its block (`offset-x` −2, `offset-y` 10 from the block's right edge).

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

- A choice that needs Save (use a checkbox in a form), one of several options (use a switcher), or a task (use the checkbox in the margin).

## Anatomy

- Track: a sunk pill, 40 × 24 (small 32 × 20), padding 2, the track well; on, a soft green gradient with an inner shadow.
- Thumb: a raised round cap, 20 (small 16), the switcher thumb's material.

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

## Visible labels

`label` renders words beside the switch in a native associated label: clicking either toggles it, keyboard focus stays on the switch, and disabled words do not change the setting. Keep `aria-label` or `aria-labelledby` only when the accessible name should differ. The `ref`, `id` and `className` stay on the control. Swift `MetalSwitch` offers `showsLabel: true` for the same visible hit area.

---

# Switcher

A pill of pills: one of a few options, always visible. React: `Switcher` from `@unlocalhosted/metalui` (Base UI RadioGroup + Radio). SwiftUI: `MetalSwitcher`. Sheet reference: the object sheet.

## Use it for

- Two to five mutually exclusive views or modes that are switched often: a lens's view (place · list · table · timeline · gallery), a colorway, a scale.

## Don't use it for

- More than five options, or options that need explaining: `Select`.
- Options that each own a panel: `Tabs` (same look, tab behaviour). Pages of the app: links. On or off: `Switch`.
- Actions. Each option is a state, not a command.

## Anatomy

- **Track**: a pill well (`well-top → well-bot`, `well`), padding 3.
- **Options**: 28 tall (regular) or 24 (compact, in a lens bar or strip), padded by the pill rule `h/2 − 1`, the `ui` role in ink2; an optional leading glyph at the control's icon size.
- **Thumb**: a raised cap (`thumb-hi → thumb-lo`, `raise-sm`) under the selected option, which reads in ink.

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
<Switcher aria-label="View" size="compact" value={mode} onValueChange={setMode}
  options={[{ value: 'place', label: 'place' }, { value: 'list', label: 'list' }, { value: 'table', label: 'table' }]} />
```

## Rules

- Two to five options, short labels, one word each where possible.
- The selection is the thumb, never a colour.
- An option switches a value instantly; if the change is slow, show progress in the view, not in the control.

## Accessibility

- Base UI RadioGroup: one tab stop, arrows move and select, Space selects; each option is a radio with its label.
- Give the group an `aria-label` that names what it switches.

## Tokens

`--mu-switcher-*`, `--mu-well*`, `--mu-thumb-hi`, `--mu-thumb-lo`, `--mu-raise-sm`, `--mu-spring-part`, `--mu-spring-settle`. Swift: `MetalSwitcherMetrics`.

---

# Table

Rows of a person's things, read across and compared down. React: `Table` from `@unlocalhosted/metalui`. SwiftUI: `MetalTable` (work in progress; use SwiftUI `Table` on macOS). An object: engraved `label`s, `rule` hairlines and the row `checkbox`; the `table` recipe adds the sizes, the sort arrow and the travel.

## Use it for

- Many things with the same few properties that people compare or sort: files, trips, members, invoices.

## Don't use it for

- Layout (use a grid), one thing's details (use a list of rows), or a handful of things (use cards).

## Anatomy

- Caption: names the table (title type), or hidden for assistive tech only.
- Head: 32 tall, engraved labels; a sortable label is a button with an arrow.
- Rows: 40 tall, padding 12 at the sides, parted by hairlines; numbers align to the end with tabular figures.
- Selection (optional): a first column of row checkboxes; select-all in the head.

## States and motion

| State | Look | Motion |
|---|---|---|
| hover | the row sinks a touch | – |
| sort | the arrow points the way; rows reorder | shared arrow morph on the settle spring; each row travels from where it was on the settle spring |
| selected | a quiet green tint; head checkbox mixed or ticked | the checkbox's own |
| empty | one quiet line | – |

Reduce Motion: rows jump to their places; the arrow turns at once.

## API

| React | SwiftUI |
|---|---|
| `columns` (`key`, `header`, `cell`, `sortBy`, `align`), `rows`, `rowKey` | `Table(rows) { TableColumn(…) }` |
| `caption`, `captionHidden` | – |
| `sort`, `defaultSort`, `onSortChange` | `sortOrder:` |
| `selected`, `onSelectedChange`, `rowLabel` | `selection:` |
| `empty` | – |

## Keyboard and accessibility

- A real `table` with a caption and column headers; a sortable header says `aria-sort` and its button is in the tab order. Row checkboxes are named "Select Lisbon"; select-all announces mixed when some are chosen.

## Rules

- Right-align numbers and use tabular figures.
- Sort only columns where order means something.

The sort indicator is the icon set's `arrow`, aligned vertically once; state changes use `MorphIcon`, with no CSS direction transition. Select-all uses `mixed`, the shared checkbox dash, while individual rows use the same tick pen. Native `MetalTable` owns rows and cells only; a caller's custom sortable header uses `MetalIcon(.arrow)` at the sort glyph token.

---

# Tabs

Switches which panel is shown. React: `Tabs`, `TabList`, `TabPanel` from `@unlocalhosted/metalui`. SwiftUI: `MetalTabs`.

## Use it for

- Options that each own a panel: source views (React / Agent guide), the pages of a settings sheet, views of one object.

## Don't use it for

- Picking a value with no panel of its own (pen or marker, a connector look): `Switcher`.
- More than five or six options, or long labels: a `Select` or a side list.
- Moving between pages of the app: navigation links.

## Anatomy

`Tabs` holds the active tab. `TabList` is the switcher track: a well, tabs in ink2, the active tab a raised thumb in ink. One `TabPanel` per tab, anywhere inside `Tabs` (the list can sit in a head bar, the panel below).

## States and motion

| State | Look | Motion |
|---|---|---|
| rest | the track; active tab on the thumb | – |
| hover | label ink | .16 s |
| switch | thumb on the new tab | part spring glide, may overshoot against the end |
| new panel | – | 6 px drift from the side the thumb went, and a fade, settle spring |
| first panel | – | none |
| focus | 1.5 ring on the tab | – |
| disabled | 40 % | – |

Keys: ← → move and choose, Home / End jump, Tab goes into the panel. Reduce Motion: the thumb moves at once, the panel only fades.

## API

`<Tabs orientation ("horizontal" | "vertical") value onValueChange defaultValue>` · `<TabList items size ("regular" 28 | "compact" 24) aria-label />` · `<TabPanel value keepMounted>`

`items` is `[{ value, label, icon?, disabled? }]`.

Vertical tabs use Up/Down, Home/End and the same Base UI focus rules; Left/Right belong to horizontal tabs. The panel drifts along the selected axis. Track radius is derived from the row height plus its nest, with no new dimensions. Swift MetalTabs `orientation: .vertical` uses the same track material and native tab accessibility. Each item may describe a held or dirty state with `aria-describedby`.

Base UI keeps disabled tabs arrow-reachable while refusing activation; give them `aria-describedby` when a reason helps. Native tab controls follow platform keyboard behavior. Never reinterpret a disabled tab as a panel switch.

---

# Tag cue

A Component you operate in source text. `TagCue` composes EnumCue with the Mark tag's existing canonical identity colour. A tag remains the same raised tab with a punched hole everywhere; no new material or timing. Unlike enum state tint, its colour hashes its exact NFC identity through the generated palette.

Supply exact full `#tag` words as `recentTags`; invalid entries are ignored and exact duplicates removed. If the current tag is absent it joins the permitted words, without rewriting source. Letters, numbers, combining marks, underscores and hyphens are accepted. Case and accents stay authored; NFC palette identity never normalizes written source. The widest supplied tag reserves the footprint. Focus then scroll, drag vertically, click or Space to cycle; arrows step. One completed gesture is one source Undo. Escape cancels, and unrelated source changes invalidate the captured range. Read-only and disabled never edit or tick. EnumCue owns all gestures, haptics, help and reduced motion.

`TagCue.Picker({recentTags,label,onChoose,disabled?})` is the shared Base UI Combobox, opened on creation with its real input focused. Search does not write source. Arrows/Enter select; empty results say No recent tags. A host detects an unfinished hash at its retained caret, captures that exact UTF16 range, and opens Popover directly anchored to its existing source input. Begin a document edit only when choosing: replace that range once, commit, close and restore editor focus/selection. Escape dismisses without losing the typed hash. Never infer a tag or replace another hash elsewhere in the source.

Native `MetalTagCue` composes MetalEnumCue and the same generated tag palette. `MetalTagCuePicker` composes a shared field Well and tag-faced choice keys, with search, Up/Down highlight and Return selection; the current filtered option is named. It owns no popup material: a native host may use MetalPopover (whose material port remains WIP). Source history and caret belong to the host on both platforms. The iOS wheel path is not claimed as a hardware scroll gesture; all choices remain keyboard and pointer reachable.

Native reduced words resolve immediately, including a live scope change during a drum transition; only the words identity resets, so the operable trigger retains focus. React keeps the existing opacity-only reduced change. Meaning glyphs retain their separate reduced act policy.

---

# Textarea

Several lines of text. React: `Textarea` from `@unlocalhosted/metalui` (a native textarea; Base UI has no textarea part). SwiftUI: `MetalTextarea` (work in progress). Its well is the `well` recipe's field look; the `textarea` recipe adds the rows, the counter and the motion.

## Use it for

- A note, a description, a comment, a message: anything that may run past one line.

## Don't use it for

- One line (use a field), a number (use a number field), code (use a code card).

## Anatomy

- Well: the field well, radius 14, padding 11 × 14; text in the content type role (15 / 20).
- Counter (with `maxLength`): below the well at the right, meta type, `used/limit`.

## States and motion

| State | Look | Motion |
|---|---|---|
| rest | the field well, 3 rows (`minRows`) | – |
| focus | the flush green ring | – |
| grow / shrink | the well fits its text, between `minRows` and `maxRows` (8) | height on the settle spring, no overshoot; the text stays pinned to the top |
| full | at `maxRows` it stops growing and scrolls | – |
| near the limit | the counter shows at 80 % of `maxLength` | its row grows open on the settle spring as it fades in (the form error's motion) |
| at the limit | the counter turns red | – |
| refused | typing or pasting past the limit leaves the text alone | only the counter shakes on the refusal spring (reach: one nest, 6) |
| invalid | a red hairline ring | – |
| disabled | 40 % | – |

Reduce Motion: the height snaps and nothing shakes; the counter still turns red.

## API

| React | SwiftUI |
|---|---|
| `value`, `defaultValue`, `onChange` | `text:` |
| `size` (`large` content, `regular` / `compact` Field UI) | `size:` |
| `counterThreshold` (0...1, local recipe default) | `counterThreshold:` |
| `minRows`, `maxRows` | `minRows:`, `maxRows:` |
| `maxLength` | `limit:` |
| `invalid` | `invalid:` |
| `disabled`, `readOnly`, `placeholder`, and every textarea attribute | `.disabled()` |

`className` goes on the well; `style` and the rest go on the textarea.

## Keyboard and accessibility

- A native textarea: every editing key works as the platform expects. Tab leaves it.
- Give it a label: a visible `<label htmlFor>` or `aria-label`. The counter is linked by `aria-describedby`; reaching the limit is announced once ("Limit reached, N characters"), not on every keystroke.
- `invalid` sets `aria-invalid`; say what is wrong in text near it.

## Rules

- The well grows; the page never jumps. Growing is the settle spring, never a bounce.
- A refusal is local: only the counter moves, and the text is never trimmed or changed.
- Show the counter only when it helps (near the limit).

Regular and compact match Field’s 12.5px UI text. The default large size preserves 15px prose. Threshold 0 shows the counter from the start; 1 shows it at the limit. An omitted threshold reads the textarea’s scoped token, never the document root. The mirror uses exactly the input’s type so changing size also refits its rows. Swift carries size/count policy; its existing placeholder still lacks the full well/growth/refusal rendering.

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
| drag state | `onScrubChange:`, `isScrubbing:` | host can defer heavy analysis until release; an active drag has no jump spring |
| `format` | `format:` | the readout for a past moment |
| `title` | `title:` | the word before the moment, default MEMORY |
| `glyph` | (MetalIcon built in) | the clock at 10 |

## Rules

- Scrubbing never changes anything. ⎋ or NOW returns to the present.
- The readout always names the moment; the aria value text says it too.
- Only chrome that changes while in the past is the past banner.

## Accessibility

- A Base UI slider labelled "Scrub through time": ← → step an hour, Shift a day, Home and End jump to the start and now; its value text reads the moment ("TUE 23 SEP · 14:10", or "Now").
- NOW is a real button with the canonical `clock` action glyph. It returns to the present; it is distinct from the decorative 10px readout clock. Native uses the same glyph and keeps its plain engraved key.
- Whole 330 × 50 box starts a scrub; readout text passes pointer hits through to slider, while NOW keeps its own hit target.

## Tokens

Layout and timing: `--mu-scrubber-*` (box, readout gap, glyph spacing, steps, snap). Look: the slider, label, glyph and button recipes. Swift: `MetalScrubberMetrics`.

---

# Toast

The result of a person's own action, with Undo. React: `ToastProvider` + `useToast()` from `@unlocalhosted/metalui` (Base UI Toast). SwiftUI: `MetalToastDeck` and `.metalToastDeck(_:)` (the deck), `MetalToast` and `.metalToast(_:)` (one at a time). Sheet reference: the object sheet; 

## Use it for

- What an action did, with Undo: "Moved 3 blocks", "Ticked · wrote [x] into the text", "Pinned as a live region · it updates as you write", "Correction remembered · for this exact text".
- An error that needs attention (it stays until resolved).

## Don't use it for

- Recognition. The surface never toasts, badges or sounds for what it recognised.
- Anything a person must read later. Several results in a row stack as a deck; it isn't a log.

## Anatomy

A 44 tall glass pill in the colorway (blur 22, its stack), padding 0 6 0 16, gap 12, the `ui` role; a detail after a middle dot; a count after a repeat (`×3`); an Undo cap (28 tall, a light top lip) with a sunk `⌘Z` keycap; a quiet 28 close key (×) that shows its cap on hover. Bone: a bone pill (`rgba(251,250,248,.92)`), ink `#1B1B1D`, detail `#6E6E72`, a bone cap (`#FFFFFF → #F0EFEB`). Graphite: a smoked pill (`rgba(30,30,33,.92)`), ink `#F2F2F0`, detail `#9A9AA0`, a graphite cap (`#3A3A3E → #2C2C2F`). Bottom centre, 92 above the dock. Each kind owns one persistent glyph: default/loading info, success check, error sync-error. The glyph morphs as its words turn on the shared drum.

The deck: toasts stack in depth, newest in front. Folded cards share the front card’s measured width; expanded cards regain their own width. Each card behind is a step smaller (×.95), peeks 8 past the card in front on the side away from the screen edge (a bottom deck peeks upward) and is 20 % dimmer, its words hidden. Three are drawn; the rest are counted in the back card’s edge (`+2`) and come forward as the front ones go. Fanned out, the cards stand 8 apart in a readable column.

## States and motion

| State | Motion |
|---|---|
| arrive | rises 8 from below, from .97, into the front on the object spring; every card behind steps back one on the same spring, in the same frame |
| fan out | pointer on the deck, or focus into it (Tab, F6): the cards spread into a column on the surface spring; every timer pauses |
| fold | pointer or focus leaves: back into the deck on the surface spring; timers resume |
| swipe | follows the pointer (down or right); past 40 on release it leaves the way it was thrown on release; short of it, springs home |
| close | the close key, or Esc on the focused toast: leaves on release; the next card comes forward |
| repeat | the same title, detail and tone as the front card: no new card; it presses to .96 and springs back on the part spring, counts `×2`, and its timer starts over |
| Undo pressed | the cap presses 1; the action is undone, the toast leaves |
| time out | undoable 5 s, plain 2.6 s, error never |
| Reduce Motion | no travel or scale: cards cross-fade into place; the repeat shows only the count |

## API

```tsx
// once, at the root
<ToastProvider><App /></ToastProvider>

// anywhere below
const toast = useToast();
toast.show({ title: 'Moved 3 blocks', undo: () => undo() });
toast.show({ title: 'Pinned as a live region', sub: 'it updates as you write', tone: 'success' });
toast.show({ title: 'Moved 3 blocks', undo }); // again: the front card counts ×2
```

```swift
@State private var deck = MetalToastDeck()
canvas.metalToastDeck(deck)
deck.show(.init("Moved 3 blocks", undo: { undo() }))   // again: the front card counts ×2

canvas.metalToast($toast)   // one at a time: toast: MetalToastModel? = .init("Moved 3 blocks", undo: { undo() })
```

## Rules

- The person's own actions only, and always Undo when the action can be undone.
- Say what happened, in the words of the action; a detail, if any, after the middle dot.
- Success carries its check; never colour alone.
- Errors stay until resolved; everything else goes by itself.
- Show results as they happen; the deck keeps the newest in front. Don't build your own queue or clear the deck to show the next one.
- The same result again is a repeat: let it count; don't reword it to force a new card.

## Accessibility

- Base UI Toast: one labelled region (Notifications), announced politely; a new card is always the front one, so only it is read out, and a repeat reads its new count. F6 moves focus into the deck and fans it out; Esc dismisses the focused toast. The Undo cap and the close key (Dismiss) are real buttons; ⌘Z / Ctrl+Z undo the focused toast, otherwise the latest live undoable change, and dismiss it. Editable fields and prevented events keep their own Undo. Set `undoShortcut: false` when the host owns shortcuts; the toast then omits the keycap. Cards not drawn are inert. Swift folded cards hide and disable their actions; focusing a front action fans the deck out and pauses every timer. A separate native shortcut declaration targets the focused undoable card, otherwise the newest undoable card, even when that card is folded. `MetalToastModel(…, undoShortcut: false)` leaves the shortcut to the host.

## Tokens

`--mu-toast-*`, `--mu-r-toast-deck-*` (step-scale, peek, dim, visible, gap, swipe, press), `--mu-backdrop`, `--mu-kbd-sunk-*`, `--mu-spring-object` (arrive), `--mu-spring-surface` (fan out, fold), `--mu-spring-part` (repeat), `--mu-spring-settle`, `--mu-spring-release`. Swift: `MetalToastMetrics`, `MetalRecipes.toast` (deck.*).

## A retained promise result

`toast.update(id, options)` completely replaces one live card without changing its id, position or focused action. It resets that card's count and timeout only; it returns false for a missing/closing card and never resurrects it. Set `timeout: 0` for a result whose host will resolve it. An optional authored `glyph` overrides the kind shape, for example `synced` → `offline` → `sync-error`; explicit consequence words remain mandatory.

```tsx
await toast.promise(exportPoster(), {
  loading: { title: 'Exporting poster', sub: 'the draft stays editable' },
  success: name => ({ title: 'Poster exported', sub: name, undo: undoExport }),
  error: () => ({ title: 'Export failed', sub: 'the draft stays here for retry' }),
});
```

Base UI retains one non-expiring loading card and updates its type on resolution. Success uses the established plain/Undo timeout; error stays. The returned promise preserves its value or rejection; the host handles that error and keeps drafts usable. Closing a pending card wins over late completion. A single persistent polite front-word announcer owns new results, updates and promotion. The viewport and cards have aria-live=off, so background updates and outgoing drum layers add no extra announcement. Glyphs are decorative, words name the result, and reduced motion changes the glyph in place. React labels cross-fade; native labels resolve immediately and discard outgoing travel when a live scope becomes reduced. No new clock exists for a resting kind.

Swift `let id = deck.show(model)` returns its retained card id; `deck.update(id, newModel)` returns false after dismissal and refreshes only its card revision/timer. `try await deck.promise({ try await exportPoster() }, loading: .init("Exporting poster"), success: { .init("Poster exported", sub: $0, tone: .success) }, error: { _ in .init("Export failed", tone: .error) })` holds the loading card indefinitely. Native model `glyph` and `timeout` match React; timeout is milliseconds. A binding host can update one retained model with `.init(…, id: existing.id)`; a changed title/kind restarts that host's result clock. Background folded native cards remain hidden from accessibility; a front appearance/update/promotion requests one event-only platform announcement while VoiceOver runs. Outgoing native drum text is excluded from its current title label. Focus/expanded deck policy stays with the existing deck.

Native card `id` is its retained position, while each newly constructed `MetalToastModel` has an immutable content revision. Equality includes that revision and timeout, so replacing a same-id model refreshes words and callbacks, even when the new action has the same visible label. Compare `id` explicitly when asking whether two snapshots belong to one card. `e2e/native/run-toast-label-proof.py` exercises actual retained title updates, label settlement in both colorways, mid-transition reduction and a changed Undo callback invoked through the real keyboard shortcut.

---

# Toggle

A latching push button, alone or in a row. React: `Toggle`, `ToggleGroup` and `RadioKeys` from `@unlocalhosted/metalui`, on Base UI Toggle and ToggleGroup. SwiftUI: `MetalToggle` and `MetalRadioKeys`. The cap is the `button` recipe and the lamp is the LED part; the `toggle` recipe adds the depths and the motion.

## Use it for

- A mode or a tool that stays on until you turn it off, shown as a key: "Grid", "Snap", Bold / Italic / Underline.
- `RadioKeys` for one form value among latching caps (time slots, options). Repeating the chosen key keeps it chosen; there is no unlatched state after choosing.
- `ToggleGroup` for a set of such keys, several at once (`multiple`) or at most one.

## Don't use it for

- A setting in a list (use a switch), one of several views that is always chosen (use a switcher), or an action that happens once (use a button).

## Anatomy

- Key: the button cap (32 tall, pill, ui type).
- Lamp: the small LED at the start of the label; unlit off, green on. `lamp={false}` hides it for an icon key whose icon shows its state.
- Group: keys 4 apart in a row.

## States and motion

| State | Look | Motion |
|---|---|---|
| off | the raised cap, lamp dark | – |
| pressing | the pressed look, 2 down (past the catch) | 50 ms, linear |
| on | the pressed look, 1 down, lamp lit | rises to the latch on the part spring (may overshoot against the catch) |
| off again | raised, lamp dark | rises all the way on the release spring |
| focus | the green ring | – |
| disabled | 40 % | – |

Reduce Motion: the latch snaps to its depth; the lamp still lights.

## API

| React | SwiftUI |
|---|---|
| `Toggle` `pressed`, `defaultPressed`, `onPressedChange`, `value` (in a group), `lamp` | `isOn:` |
| `ToggleGroup` `value` (array), `defaultValue`, `onValueChange`, `multiple` | Compose `MetalToggle` bindings; no native group type |
| `RadioKeys` scalar `value`, `defaultValue`, `onValueChange`, `name`, `required`, `readOnly`; `RadioKeys.Key value`, `disabled`, `lamp` | `MetalRadioKeys` scalar `selection:`, `options:`, `readOnly:` |
| `disabled` | `.disabled()` |

## Keyboard and accessibility

- A button with `aria-pressed`. Space or Enter latch and unlatch. In a group, arrow keys move between keys and Tab leaves the group.
- `RadioKeys` wraps Base UI RadioGroup and Radio. It renders real button caps, announces `radio` / `aria-checked`, submits one hidden native input with `name`, skips disabled keys with arrows, and has one Tab stop. Supply an initial value when a choice is required immediately. `readOnly` keeps focus and blocks edits. Native keys announce selected state; arrows choose an enabled option, and platform button focus remains native.
- The label names it; an icon key needs `aria-label`.

## Rules

- The label names the mode, not the action: "Grid", not "Show grid".
- The lamp is the promise that it latches; keep it unless the icon itself shows the state.

`ToggleGroup joined` uses the machined ButtonGroup bar: one raised surface, fixed engraved seams, square interior faces, inset focus and each latched key’s lamp. Base UI still owns arrows and roving tab stops. See ButtonGroup for the material contract.


## Single-choice example

```tsx
<RadioKeys name="time" value={time} onValueChange={setTime} aria-label="Free times">
  <RadioKeys.Key value="10:00">10:00</RadioKeys.Key>
  <RadioKeys.Key value="12:00">12:00</RadioKeys.Key>
</RadioKeys>
```

The time picker block uses this family directly. Host grid utilities may arrange the group, but never copy cap recipes. Custom Base UI `render` overrides own their contents; retain a lamp or another visible checked-state cue.

---

# Tool strip

Selection actions on a graphite strip. React `ToolStrip` and `verbsFor` from `@unlocalhosted/metalui`; Swift `MetalToolStrip`, `metalVerbsFor`. Compose Surface, Button, Rule, Menu and Tooltip; Base UI owns the web toolbar's arrows, popup placement and menus.

## Use it for

A click selection on a canvas or list. The host owns the selected data, results and Undo. Finishing a gesture makes a quiet selection; do not show it while dragging, resizing, in the past or while the palette is open.

## Selection grammar

Give each selected object `{ id, kind }`, and each kind its verb set. `verbsFor(selection, sets)` intersects stable verb IDs across all selected kinds. Unknown kinds produce no actions. `singleOnly` keeps Rename only for one object. `order` supplies a catalog-wide ordering; otherwise kind-set insertion order determines it. Disabled reasons and busy state merge from the matching kind sets. Swift takes an explicit `order: [String]` so Dictionary iteration cannot change muscle memory.

```tsx
<ToolStrip label="2 blocks" selection={selection} verbSets={sets}
  anchor={viewportBounds} boundary={canvasElement} maxVisible={5} />
```

You can continue passing fixed `items`. Each item has `id?`, `label`, `icon?`, `onSelect?`, `menu?` (MenuItem children), `menuOpen?` / `onMenuOpenChange?`, `order?`, `singleOnly?`, `shortcut?`, `disabled?`, `disabledReason?`, `busy?`, `destructive?`, `irreversible?`. The leading count defaults to selection length; supply `count` for a fixed list. A glyph key has an accessible name and tooltip; worded legacy actions remain supported. Menu keys name themselves and expose their menu with the standard trigger semantics.

## Placement and overflow

`anchor` accepts an Element or viewport `{ x, y, width, height }`. The host updates selection bounds after each canvas pan or zoom. Base UI follows the element or the inert bounds marker, positions 12 above the selection, flips below when needed and shifts at edges. `boundary` confines the strip to a canvas Element or viewport rectangle. No position clock runs at rest. When used inline, placement belongs to the host.

`maxVisible` limits regular keys; available boundary width can reduce it further. More occupies the last regular slot. The destructive action remains visible after More and an engraved Rule. Keep one destructive action. Very small boundaries still need enough room for a count, More and that action.

Swift uses parent-space `anchor: CGRect` and `viewport: CGRect` inside a ZStack. Pass updated bounds after pan/zoom. Its `maxVisible` and viewport capacity reveal More before the destructive action. Native menu panels expose overflow actions. `entrance: false` supports a settled capture.

## States and motion

The strip rises 4 on the part spring. Selection changes resize the backing surface through scale, translate retained keys from their old positions on settle, fade arriving actions in and departing actions out. Only transform and opacity animate. With the OS preference, site switch or scoped motion reduction, geometry changes instantly. Swift matches key positions and scales its backing on settle.

A disabled reason appears in the tooltip and is announced; its key stays focusable and cannot run. `busy` delegates waiting feedback to Button: 400ms show delay, a 300ms minimum display, no repeat activation. Only an irreversible destructive action sets `irreversible`: pointer, Space or Enter must be held until Button confirms. Reversible Send away can run immediately with Undo.

## Accessibility and delivery

The web toolbar is named `Tools for ${label}`, has one tab stop and Base UI arrow navigation. Tooltips describe glyph actions; menus own menu-key focus. Disabled reasons are descriptions, never an excuse to remove the action's name. Swift has spoken labels, hints, tooltips, arrow navigation and the same held action.

React, Swift, docs and targeted integration captures ship together. Tokens are existing toolstrip layout, button strip/strip-danger caps, graphite-strip Surface, Rule, Menu and shared springs. No new material numbers.

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

- **Chip**: the colorway's fill and shadow with no backdrop, radius 11, padding 6 × 10, 10 mono at 1.45, tracked .05em. Bone: a bone chip, ink `#1B1B1D`. Graphite: a graphite chip, ink `#E9E9EB`.
- **Key**: after a middle dot, dimmed (`#6E6E72` on bone, `#8E8E93` on graphite): `SELECT · V`.
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

## Escape in a panel

The tooltip closes through Base UI and allows its Escape event to propagate. A surrounding panel can dismiss on the first Escape without a capture listener or synthetic event. Controlled tooltips can handle `onOpenChange(open, details)`; preserve the supplied propagation policy. Swift tooltip overlays take no focus or key events, so their host already owns Escape.

## Tokens

The tooltip recipe, `--mu-tooltip-delay-ms`, `--mu-tooltip-gap`, `--mu-spring-settle`. Swift: `MetalTooltipMetrics`.

---

# Weather

Weather as an object. A custom block: a `Surface` (raise, card radius) with a dot-matrix sky sunk into a `Well` (field). React: `Weather`, `WeatherTile`, `WeatherGlyph` from `@unlocalhosted/metalui`. SwiftUI: `MetalWeather`, `MetalWeatherTile`.

## Use it for

- A place's weather now and ahead on a canvas or a home screen: the large widget (400 × 560) or a tile (180).
- A row or grid of tiles, one sky each.

## Don't use it for

- A forecast table or a chart of many days: use a table or a `Sparkline`.
- An icon beside words: use `WeatherGlyph` (7 × 7 dots) or a life icon.

## Anatomy

`Weather.Root` › `Weather.Header` (place in display, a summary in meta, an `Led` with Live or Paused and the clock in readout) › `Weather.Sky` (224 tall, radius 18; 46 × 28 dots on an 8 pitch, horizon on row 21) › `Weather.Now` on the sky's ground (the temperature in the pixel face, the condition in content, one readout) › `Weather.Hours` (six slots: an engraved label, a `WeatherGlyph`, the temperature in the pixel face at 24) › `Rule` › `Weather.Week` (a header row with the scale, then one row a day: name, glyph, low, a line of dots one a degree, high).

`WeatherTile` is `Weather.Root size="tile"` › `Weather.Sky` (21 × 21 dots, horizon on row 13) › `Weather.Now` (the condition engraved).

## The sky is a description

`sky` takes a `WeatherKind` or a `WeatherSky`:

| Field | What it draws |
|---|---|
| `clouds` | `{ x, y, size, dark }` each; they drift with the wind and wrap around |
| `overcast` | hides the sun, the moon and the stars |
| `rain` | 0.3 drizzle (sparse), 0.6 rain, 1 a slanting downpour |
| `snow` | flakes drifting down, pushed by the wind |
| `thunder` | a bolt from the second cloud every few seconds |
| `mist` | up to four bands sliding opposite ways over the ground |
| `wind`, `windFrom` | faster drift and gust streaks from the left (1) or the right (-1) |
| `heat` | shimmer rising off the ground |
| `birds` | up to three birds crossing a daytime sky |
| `moonPhase` | the moon's age 0–1; default the phase on `date`, else full |

`WEATHER_SKIES` has one per kind (clear, partly, cloud, drizzle, rain, storm, snow, sleet, mist, windy, heat). Spread one to change it: `{ ...WEATHER_SKIES.snow, wind: 0.9 }` is a blizzard. `weatherScene()` returns the paths per layer for a sky of any size.

## Time

`hour` places the sun on its arc between sunrise (07:30) and sunset (19:30), lowest at the ends; the horizon warms at dawn and dusk. After dark the moon crosses in its phase and stars twinkle. A host that wants the day to pass moves `hour` itself.

## Behaviour

- Everything that moves steps one frame every 166 ms (the recipe's `dot.frame`). `animate={false}` or reduced motion holds a single frame.
- The large widget is a region labelled "Weather in {place}"; the sky is an image labelled with the condition and temperature; the hours and the week are lists whose items read their values.
- Temperatures are shown as given, with a degree sign: pass them in the unit you show.

## API

| React | SwiftUI | Notes |
|---|---|---|
| `place`, `summary` | `place:`, `summary:` | |
| `hour` | `hour:` | 0–24 |
| `sky` | `sky:` | a kind or a `WeatherSky` |
| `condition`, `temp`, `feels`, `rain`, `wind` | same | the ground readout |
| `live`, `clock` | `live:`, `clock:` | null hides the status |
| `hours`, `days`, `scale` | same | at most 6 hours and 7 days; the scale fits 21 degrees |
| `date` | `date:` | the moon's phase |
| `animate` | `animate:` | |

## Tokens

The weather recipe: sizes, the dot pitch and frame, and the per-colorway inks (off, hz, hill, sun, moon, star, cloud, cloud-dark, rain, snow). The surface, well, status and rule recipes.

---

# Well

A sunk field or track. React: `Well`. SwiftUI: `MetalWell`.

## Use it for

- The field behind an input, the track of a slider or switcher, a drawn region on a canvas, a well in a dark strip.

## Props

- `variant`: `field`, `track`, `region`, `graphite`. `over` lights a region well green (a drop target).
- `radius`: `pill`, `field` (17), `region` (26), `strip` (15), `row` (12).

## Behaviour

- No role of its own; the control inside carries it. The over state changes on settle.

---

# Icons

`@unlocalhosted/metalui/icons` has 79 Soft Hardware glyphs: monoline + duotone on a 24×24 grid, with a 1.7 stroke. Each glyph has an authored one-shot act on hover or press, then rests. Icons inherit `currentColor`. A static icon (`animate={false}`) at 16px or below uses a tuned small cut with a heavier stroke.

```tsx
import { SendAwayIcon, Icon } from '@unlocalhosted/metalui/icons';

<Button cap="destructive"><SendAwayIcon size={16} />Delete</Button>
<Icon name="synced" size={13} title="Synced" />
```

- **Signal levels:** `volume` names adjustable sound level; `brightness` names adjustable light level. Bell describes a notification event, while Sun/Moon describe daylight/night. Pair the level glyph with a real accessible control and its current value.
- **Actions and identity:** `stop` ends an operation; `retry` attempts it again (`redo` is an editor operation). `attach` catches a file; `person` names a profile or assignee; `bell` names a notification; `palette` chooses a paint or appearance family. These glyph acts describe a contact and rest; they never imply a successful operation.
- **Status and environment:** `info` names information; `warning` names a warning with its triangular enclosure. Morph `sun` ↔ `moon` when changing colorway. `sidebar` describes a rail in a fixed window; turn 180 for a rail on the right. Always retain a visible or accessible status label.
- **Adjustment and visibility:** `settings` adjusts values; `filter` narrows results; `sort` orders rows (turn for the reverse order). Morph `eye` ↔ `eye-off` when the same key changes visibility; `lock` describes access. The eye enclosure stays recognizable behind its shutter.
- **Transfer and record:** `save` retains a document; `download` receives into this device; `upload` transfers to the service; `send` dispatches a message. `copy` takes a paper copy to the clipboard (`paste` retrieves it, `duplicate` creates another object). `external` opens another context. Pair the glyph with the action verb.
- **Triggering:** an icon inside any element with the class `mu-icon-trigger` plays from that element, and MetalUI Buttons already have it. Otherwise the icon plays from its own hover and press.
- **Accessibility:** icons without `title` are decorative (`aria-hidden`). Give icon-only controls an `aria-label`.
- **State glyphs morph:** `MorphIcon` (copy, check, plus, close, minus, menu, arrows, chevrons, play/pause, download/upload) transforms into another state glyph instead of being replaced: `<MorphIcon name={copied ? 'check' : 'copy'} size={14} />`.
- **Disabled:** web disabled triggers and SwiftUI `.disabled(true)` ancestors prevent acts, holds and hover effects. Disabling a native host cancels its active clocks at rest; an enabled decorative glyph still responds to `act` requests.
- **Static:** `animate={false}` keeps a glyph static. Reduced motion does this automatically.
- **SwiftUI and SVG:** the same glyphs ship as custom SF Symbols, plus static and animated SVGs at `https://metalui.dev/icons/svg/<name>.svg`.

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
| `CopyIcon` | `copy` | Actions | The front sheet takes an impression from its fixed source and peels off as a paper copy. | plays the same act |
| `SaveIcon` | `save` | Actions | The write window seats into the storage case, records the document, then releases. | plays the same act |
| `DownloadIcon` | `download` | Actions | The arrow descends into the receiving tray; the tray takes its weight and releases. | plays the same act |
| `UploadIcon` | `upload` | Actions | The arrow rises to the upper boundary; the boundary receives it and releases. | plays the same act |
| `SendIcon` | `send` | Actions | The folded message draws back, leaves along its pointed tip, and the next message is ready. | plays the same act |
| `ExternalIcon` | `external` | Actions | The arrow reaches through the open window corner into the external context, then returns ready. | plays the same act |
| `SettingsIcon` | `settings` | Tools | Three adjustment knobs reach their rail stops in order and seat back into their settings. | plays the same act |
| `FilterIcon` | `filter` | Tools | The throat seats in the fixed funnel and narrows the result stream. | plays the same act |
| `SortIcon` | `sort` | Tools | The ordering shaft presses its terminal and returns; the ordered rows stay fixed. | plays the same act |
| `EyeIcon` | `eye` | Actions | The iris inspects through the fixed lens and returns to centre. | plays the same act |
| `EyeOffIcon` | `eye-off` | Actions | The visibility shutter seats across the fixed lens, then returns to its concealed position. | plays the same act |
| `LockIcon` | `lock` | Status | The closed shackle seats in its catches; the secure body stays fixed. | plays the same act |
| `StopIcon` | `stop` | Actions | The square stop pad contacts its seat once and releases inside the fixed case. | plays the same act |
| `AttachIcon` | `attach` | Actions | The inner paperclip jaw catches against its fixed outer loop and seats back. | plays the same act |
| `RetryIcon` | `retry` | Actions | The return arrow pulls toward its fixed route and seats for one more attempt. | plays the same act |
| `PersonIcon` | `person` | Tools | The portrait head seats above its fixed shoulders and returns to its place. | plays the same act |
| `BellIcon` | `bell` | Status | The striker swings once into the bell rim; the rim receives the contact and both seat. | plays the same act |
| `PaletteIcon` | `palette` | Tools | A paint well seats in the fixed palette while its thumb hole stays open. | plays the same act |
| `VolumeIcon` | `volume` | Tools | The outer sound front reaches outward from the fixed speaker and seats back. | plays the same act |
| `BrightnessIcon` | `brightness` | Tools | The level shade opens inside the fixed lamp and seats back at its half-lit position. | plays the same act |
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
| `PlayIcon` | `play` | Actions | The transport key advances one step and returns ready to resume. | plays the same act |
| `PauseIcon` | `pause` | Actions | The two transport stops catch together and release to their ready gap. | plays the same act |
| `CheckIcon` | `check` | Actions | A pen writes the tick: down the short leg, pressed into the corner, flicked up the long leg, and the tip rings. | plays the same act |
| `InfoIcon` | `info` | Status | The information stem seats in its fixed circular window and releases. | plays the same act |
| `WarningIcon` | `warning` | Status | The alert stem seats inside a fixed warning triangle; its dot remains visible. | plays the same act |
| `SunIcon` | `sun` | Status | One daylight beam opens from the fixed sun and seats back at its source. | plays the same act |
| `MoonIcon` | `moon` | Status | The inset night shade seats against a fixed crescent and returns to its quiet position. | plays the same act |
| `SidebarIcon` | `sidebar` | Tools | The sidebar rail slides toward its frame and seats back; the content enclosure stays fixed. | plays the same act |
| `SidebarCollapsedIcon` | `sidebar-collapsed` | Tools | The narrow sidebar rail seats once inside its fixed window and returns to its stop. | plays the same act |
| `SyncedIcon` | `synced` | Status | The satellite winds back, laps the core once and clicks home into its slot. | plays the same act |
| `OfflineIcon` | `offline` | Status | The lost satellite swings back toward its slot, falls a unit short and is thrown back out. | plays the same act |
| `SyncErrorIcon` | `sync-error` | Status | The orbit heaves to turn, catches on a stop and rattles against it; the mark jolts. | plays the same act |
| `CaptureIcon` | `capture` | Status | The corners close in and hunt for focus, lock, and the shutter blinks over the aperture. | plays the same act |
| `PasteIcon` | `paste` | Status | The clip levers open, the content drops onto the board, and the clip clamps it down. | plays the same act |
| `KeeperIcon` | `keeper` | Status | The character looks up at it, perks up, and nods it in with a slow blink; its ring tips with the nod. | plays the same act |
| `PlusIcon` | `plus` | Actions | The upright is lifted and driven into the waiting crossbar; the knock runs out to the bar's ends. | plays the same act |
| `MinusIcon` | `minus` | Actions | The bar is pried up off its tile, as if one were taken from it, and set back down; the tile takes its weight. | plays the same act |
| `ChevronIcon` | `chevron` | Actions | The chevron is drawn back and thrust the way it points; its arms fold in behind the point like a hinge, and an echo carries on. | plays the same act |
| `RegionIcon` | `region` | Tools | The frame is set down on the canvas, and its name writes into the head behind a caret. | plays the same act |
| `TaskIcon` | `task` | Tools | The box is pressed down; while it is held the tick is written, and released it springs back up with a click. | plays the same act |
| `TagIcon` | `tag` | Tools | The cord tugs the tag by its eyelet, and it swings there and comes to hang still. | plays the same act |
| `CalendarIcon` | `calendar` | Tools | Today's leaf curls up and flips over the binding, kicking the rings, and a fresh page is left. | plays the same act |
| `DocumentIcon` | `document` | Tools | A thumb folds the corner down, the page turns, and the next page's lines write in. | plays the same act |
| `SparkIcon` | `spark` | Status | The committed edit makes one contact, then its four-point receipt opens to rest. | plays the same act |
| `CoinIcon` | `coin` | Status | The minted coin tilts to its edge once and returns to its stamped face. | plays the same act |
| `ClockIcon` | `clock` | Status | An hour passes: the minute hand sweeps round as the hour hand steps one on, a tick marks the hour, and the hands are set back. | plays the same act |
| `MeIcon` | `me` | Tools | Today's point runs back along your days and climbs to today again, drawing the trend behind it. | plays the same act |
| `SeedIcon` | `seed` | Actions | The seed is dropped in and lands on its bottom; the sprout takes the blow, springs up, and its leaf swings. | plays the same act |
