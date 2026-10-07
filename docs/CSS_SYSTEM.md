# CSS system: tokens, layout, and Tailwind

MetalUI uses Tailwind v4. The shared CSS foundation adds named spacing and three layout utilities to that system. It keeps approved material, typography, and spacing values, and does not change a consumer's Tailwind scale or fonts.

Read this before adding layout rules, introducing a token, or changing a shared type role. Read [COMPOSITION.md](COMPOSITION.md) to place UI in the six composition layers, [PERFORMANCE.md](PERFORMANCE.md) for motion constraints, and [CSS_HABITS.md](CSS_HABITS.md) for the habits every component inherits (hover gating, focus outlines, motion tokens, logical sides), which `npm run lint:habits` enforces. The running reference is `/foundations/spacing` in the docs site.

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

CSS cascade layers govern declaration precedence. [The six composition layers](COMPOSITION.md) govern what UI represents and which dependencies it may use. A layout utility belongs to foundation rules; adding it does not create a Part, Component, Object, Instrument, or Place. A CSS rule in `components` is not automatically a Component in that domain model.

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
