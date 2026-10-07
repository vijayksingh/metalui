# good-css recommendation inventory

Source: [good-css](https://good-css.com/), read on 2026-10-08. This records the site's advice rather than adopting it as MetalUI policy. Each row paraphrases a recommendation from the introduction, example, explanation, or explicit rules of its recipe; browser-support claims are source context, not independently verified compatibility promises.

## Reading the detection column

Detection methods are proposed, not implemented. Use a CSS AST, selector parser, and value parser; normalize nesting and shorthands, inspect enclosing at-rules, and connect matching state rules and referenced custom properties/keyframes. Regex is suitable only for initial candidates, after stripping comments and strings. Missing declarations in one component file can be supplied by imported foundations, browser defaults, or host CSS, so absence-based checks are warnings unless the checker has that context. Class-name guesses such as “avatar” or “card” require an explicit component-role configuration. A stylesheet alone cannot establish DOM ancestry, semantics, browser output, JavaScript behavior, or design intent; those limitations are identified below. “Not statically checkable” means not checkable from a component CSS file alone.

## Section anchors

| Site section | Anchor | Recipes |
| --- | --- | ---: |
| Foundations | [#foundations](https://good-css.com/#foundations) | 6 |
| Layout | [#layout](https://good-css.com/#layout) | 8 |
| Spacing and shape | [#spacing-and-shape](https://good-css.com/#spacing-and-shape) | 4 |
| Text and media | [#text-and-media](https://good-css.com/#text-and-media) | 5 |
| Interaction | [#interaction](https://good-css.com/#interaction) | 8 |
| Motion | [#motion](https://good-css.com/#motion) | 6 |
| Show and hide | [#show-and-hide](https://good-css.com/#show-and-hide) | 4 |
| Scroll and viewport | [#scroll-and-viewport](https://good-css.com/#scroll-and-viewport) | 6 |

Every recipe anchor appears in its linked heading below. Installation and footer UI also have `#install`, `#tagline`, `#categories-title`, and `#footer-install-title`; `#category-menu` identifies navigation. Template IDs `#card`, `#category`, `#entry`, `#specimen`, and `#no-specimen` are implementation hooks, not additional advice sections.

## Foundations

### [Reset](https://good-css.com/#the-reset) — `#the-reset` · [specimen](https://good-css.com/specimen/the-reset)

| Short rule | Rule in own words | CSS involved | Static violation detection |
| --- | --- | --- | --- |
| Introduce reset carefully | Begin new projects with the reset, but introduce it incrementally into existing designs and inspect the result. | Universal selectors, `:root`, reset declarations below | Not statically checkable: project history and visual effects are unavailable. |
| Inclusive box sizing | Include padding and borders in declared sizes for elements and their generated boxes. | `*, *::before, *::after`, `box-sizing: border-box` | Warn on `content-box` in ordinary layout roles or a reset selector omitting pseudo-elements; permit intentional exceptions such as measured textarea wrappers. |
| Shrinkable items | Let flex and grid items become narrower than their content. | `min-width: 0`, `min-inline-size: 0` | For known flex/grid item selectors, warn when neither zero minimum nor an inherited reset contract is available; CSS alone cannot identify all items. |
| Intrinsic-size transitions | Enable interpolation with intrinsic size keywords at the page foundation. | `:root`, `interpolate-size: allow-keywords` | If a transition connects a length to `auto`, warn when no applicable `allow-keywords` declaration exists. |
| Stable document gutter | Reserve the document scrollbar's space to avoid lateral shifts when overflow changes. | `:root`, `scrollbar-gutter: stable` | Warn on a known document scroll-lock rule without a root gutter declaration in the resolved stylesheet set. |
| Better body wrapping | Apply improved line breaking to ordinary text through an inherited root declaration. | `:root`, `text-wrap: pretty` | Foundation check: warn if the root lacks `pretty`; component-only absence is inconclusive. |
| Balanced headings | Balance short heading lines instead of leaving strongly uneven line lengths. | `h1`–`h4`, `text-wrap: balance` | Warn when configured heading selectors have no applicable `balance` rule. |
| Long-word protection | Allow an otherwise unbreakable word to wrap when it cannot fit. | `:root`, `overflow-wrap: break-word` | Warn on text layouts lacking a known root or local wrapping policy; check alongside item minimum-size rules. |
| Real font styles | Disable synthetic font weights and italics and load every font face the design actually requests. | `font-synthesis: none`, `@font-face`, `font-weight`, `font-style` | Flag explicit synthesis enablement; compare local `@font-face` ranges with requested styles when faces are present, otherwise font loading is not statically checkable. |
| macOS smoothing | Use the paired macOS smoothing declarations when matching the site's thinner grayscale rendering. | `-webkit-font-smoothing: antialiased`, `-moz-osx-font-smoothing: grayscale` | Warn when a foundation enables only one of the pair; actual perceived weight is not statically checkable. |
| Toolbar-safe documents | Remove the body's default margin and give documents a minimum height based on the small viewport. | `body`, `margin: 0`, `min-height: 100svh` | On a configured document root, flag nonzero body margin or `100vh`/`100dvh` minimum height instead of the intended `svh` policy. |
| Dynamic app height | Size an app shell with bottom-pinned UI to the dynamic viewport so it follows mobile toolbar changes. | `height: 100dvh`, `block-size: 100dvh` | For configured app-shell roles, flag `100vh`/`100svh` fixed height; identifying an app shell is not statically checkable. |
| Responsive media reset | Make ordinary media block-level, width-constrained, and automatically proportioned. | `img, svg, video`, `display: block`, `max-width: 100%`, `height: auto` | Flag known unbounded media rules or fixed height without an explicit ratio/cropping policy; foundation absence requires imported-CSS context. |
| Fixed media must not shrink | Prevent intentionally sized images, icons, and avatars from being compressed by neighboring flex text. | `flex: none`, `flex-shrink: 0` | Warn on configured fixed media selectors with a size but no nonshrinking declaration when their flex-item role is known. |
| No mobile text inflation | Preserve the authored text size when iOS changes orientation. | `-webkit-text-size-adjust: 100%` | Foundation check: flag other inflation values or a missing root declaration under this policy. |
| Replace tap highlight | Removing the native tap highlight requires an explicit pressed appearance on every pressable control. | `-webkit-tap-highlight-color: transparent`, `:active` | When highlight suppression exists, warn for configured pressable selectors lacking a visual `:active` rule. |
| Input zoom floor | Keep text-entry controls at least 16 CSS pixels high in font size without restricting page zoom. | `input, textarea, select`, `font-size: max(16px, 1rem)`; viewport meta outside CSS | Flag literal font sizes below `16px` and unbounded relative values on input roles; viewport zoom restrictions are not statically checkable from CSS. |
| Immediate taps | Allow ordinary panning and pinch zoom while removing double-tap delay on pressable elements. | `button, a, [role="button"]`, `touch-action: manipulation` | Warn on configured pressable rules without `manipulation`; flag `touch-action: none` as a candidate conflicting with this intent. |
| Selectable reading text | Disable selection only on controls whose labels should not be selected. | `user-select: none`, `-webkit-user-select: none` | Flag either declaration on `body`, `a`, universal selectors, or configured prose roles; check both declarations on button roles for the source's Safari pairing. |
| Stable editable lines | Override inherited pretty wrapping with stable wrapping when editable text jumps during typing. | `textarea`, `[contenteditable]`, `text-wrap: stable` | Not statically checkable: CSS can locate editable selectors, but cannot establish whether their lines jump. |
| Accept gutter tradeoff | Retain scrollbar reservation even though a short centered document can appear slightly off-center. | `scrollbar-gutter: stable` | Not statically checkable: acceptable visual tradeoffs require review. |

### [Logical directions](https://good-css.com/#logical-properties) — `#logical-properties` · [specimen](https://good-css.com/specimen/logical-properties)

| Short rule | Rule in own words | CSS involved | Static violation detection |
| --- | --- | --- | --- |
| Writing-aware geometry | Express spacing, borders, offsets, sizes, and alignment in the text's inline and block directions. | `padding-inline`, `margin-block-end`, `border-inline-start`, `inset-block-start`, `inset-inline-end`, `text-align: start/end`, `direction`, `writing-mode` | Flag physical side properties with regex `^(margin\|padding\|border)-(left\|right\|top\|bottom)` or `^(left\|right\|top\|bottom)$`, plus physical alignment values; intentional physical geometry needs exemptions. |
| Avoid physical shorthands | Use inline/block shorthands rather than four-sided physical spacing shorthands. | `margin`, `padding`, `inset`; `*-inline`, `*-block` | Value AST: flag four-value `margin`, `padding`, or `inset` declarations, even when their values happen to be symmetric. |

### [OKLCH families](https://good-css.com/#oklch-color) — `#oklch-color` · [specimen](https://good-css.com/specimen/oklch-color)

| Short rule | Rule in own words | CSS involved | Static violation detection |
| --- | --- | --- | --- |
| Perceptual base colors | Express authored base colors with OKLCH so lightness remains comparable across hues. | `oklch()`, color-valued properties and custom properties | Flag hex, `rgb()`/`rgba()`, and `hsl()`/`hsla()` literals in configured palette declarations; exempt technical masks and intentional keywords. |
| Derive color relatives | Compute hover, tint, and translucent variants from a shared base instead of entering unrelated literals. | `color-mix(in oklch, …)`, `var()`, `transparent` | On configured variant tokens/state color rules, flag new color literals or `color-mix()` using another interpolation space; infer relationships only from configured token names. |
| Hue-free neutrals | Give achromatic OKLCH colors a missing hue so mixing does not introduce an unintended hue rotation. | `oklch(L 0 none)`, keywords `white`, `black` | Value parser: when chroma is literal zero, flag any numeric hue instead of `none`; unresolved chroma variables are inconclusive. |

### [Shared light/dark tokens](https://good-css.com/#one-set-of-color-tokens-for-light-and-dark) — `#one-set-of-color-tokens-for-light-and-dark` · [specimen](https://good-css.com/specimen/one-set-of-color-tokens-for-light-and-dark)

| Short rule | Rule in own words | CSS involved | Static violation detection |
| --- | --- | --- | --- |
| Paired color tokens | Store both theme colors in a single token and let the browser choose the active value. | `light-dark()`, custom properties, `color-scheme: light dark` | Flag duplicated configured color-token definitions under dark/light selectors or `prefers-color-scheme` instead of paired values; warn if `light-dark()` lacks a known scheme declaration. |
| Scheme-only overrides | Change `color-scheme` for manual themes and fixed-theme subtrees rather than replacing the token set. | `[data-theme="light"]`, `[data-theme="dark"]`, `color-scheme: light/dark` | Flag color-token redeclarations in theme override blocks; inspect scheme overrides on configured fixed-theme roots. |
| Preserve neutral hue | Keep neutral values inside theme pairs hue-free so later mixing remains predictable. | `light-dark(oklch(… 0 none), …)` | Apply the zero-chroma hue check recursively to both arguments. |
| Colors only | Give non-color theme differences their own rules instead of putting them into a color-pair function. | `light-dark()`, `background-image`, theme selectors | Value AST: flag arguments that are URLs, gradients, lengths, or other non-colors. |
| Pre-CSS scheme hint | Declare supported color schemes in document metadata so the initial browser paint matches the theme. | CSS `color-scheme`; HTML `meta[name="color-scheme"]` | Not statically checkable: requires the document head. |

### [Bounded fluid sizes](https://good-css.com/#fluid-sizes-with-clamp) — `#fluid-sizes-with-clamp` · [specimen](https://good-css.com/specimen/fluid-sizes-with-clamp)

| Short rule | Rule in own words | CSS involved | Static violation detection |
| --- | --- | --- | --- |
| Continuous sizing | Use bounded continuous sizing for typography and spacing that should grow with available viewport width. | `clamp()`, `font-size`, spacing properties, `vw` | Warn when repeated media-query overrides of the same configured fluid size form a breakpoint ladder; intent needs configuration. |
| Mixed preferred size | Combine a font-relative term with a viewport term in the preferred value. | `clamp(min, rem + vw, max)` | Parse the middle argument of configured fluid font-size and spacing clamps; flag a viewport-only value with no nonzero `rem` term. |
| Solve from endpoints | Calculate the preferred expression from the desired values at narrow and wide widths. | `clamp()`, `calc()`, `rem`, `vw` | Not statically checkable without declared design endpoints; with them, evaluate the expression at both widths and compare the intended bounds. |
| Relative bounds | Express the lower and upper fluid-size bounds in rem so reader font preferences affect them. | `clamp()` first and third arguments | Flag literal bounds in `px`, viewport units, or other non-rem units; follow resolvable tokens before deciding. |
| Fluid text ratio | Keep the maximum fluid font size no greater than 2.5 times its minimum under the site's sizing guideline. | `font-size: clamp()`, font-size tokens | Resolve comparable literal bounds and flag `max/min > 2.5`; this heuristic does not itself prove zoom accessibility. |
| Centralize fluid math | Define fluid expressions in tokens and consume those tokens from components. | Custom properties, `var()`, `clamp()` | Flag direct fluid arithmetic in component `font-size` or spacing declarations rather than a foundation token reference. |
| Scale beyond a few sizes | Derive a shared scale when more than a few fluid sizes are needed. | Scale custom properties, `calc()`, `pow()` | Warn when a component family declares more than three independent fluid size formulas; scale design is not provable from one file. |

### [Unified type/space scale](https://good-css.com/#one-fluid-scale-for-type-and-space) — `#one-fluid-scale-for-type-and-space` · [specimen](https://good-css.com/specimen/one-fluid-scale-for-type-and-space)

| Short rule | Rule in own words | CSS involved | Static violation detection |
| --- | --- | --- | --- |
| Six-input scale | Derive scale steps from two widths, two base sizes, and two ratios using one bounded interpolation factor. | Custom properties, `clamp()`, `calc()`, `pow()` | On a configured scale, flag independently hardcoded step tables or repeated clamps instead of references to the shared inputs. |
| Unitless scale inputs | Store scale inputs as numbers and attach rem units inside the arithmetic. | Number-valued custom properties, multiplication by `1rem` | Inspect configured input values and flag dimensions such as `20rem`; flag length/length division in the interpolation formula. |
| Declare overrides with steps | Redeclare scale inputs together with the derived steps because resolved custom-property dependencies do not recalculate in descendants. | Custom-property cascade, `var()`, `calc()` | Warn when a descendant rule changes a configured input without redeclaring dependent scale tokens there; ancestry remains heuristic. |
| Stable small steps | Derive steps below the base from the base and narrow ratio so smaller text does not shrink as the viewport grows. | Negative-step tokens, division in `calc()` | For configured negative steps, flag formulas combining both ratios instead of dividing the base by the narrow ratio. |
| Check largest step | Verify the largest step's endpoint ratio using both size and ratio changes. | `pow()`, scale input tokens | When inputs are literal, compute `(size-wide / size-narrow) * (ratio-wide / ratio-narrow)^n` and flag results above `2.5`. |
| Space follows body | Build ordinary spacing tokens as multiples of the base text step. | Spacing custom properties, `calc(multiplier * var(--step-0))` | Flag configured space tokens with independent fluid formulas rather than a base-step dependency. |
| Pairs only for layout | Define steep small-to-large space pairs only where needed and never use them for font sizes. | Pair spacing tokens, `font-size`, `var()` | Flag `font-size` references to configured pair tokens; unused or unnecessary pairs need usage analysis beyond one component. |
| Container-driven scale | Substitute container-inline units when the scale should follow a component slot. | `100cqi` instead of `100vw`, container declarations | For configured container-scoped scales, flag viewport units; also apply the container-token registration rule below. |
| Token-only consumption | Reuse scale tokens in components rather than duplicating their calculations. | `var()`, `calc()`, `pow()` | Flag scale arithmetic in ordinary component declarations or duplicated token formulas outside the configured foundation. |

### [Additional foundation constraints](https://good-css.com/skills/good-css/references/foundations.md) — linked reference only

These additional recommendations occur in the same-site foundation reference and agent guidance rather than a separate main-page recipe.

| Short rule | Rule in own words | CSS involved | Static violation detection |
| --- | --- | --- | --- |
| No universal overlap | Do not put every element into one shared grid cell through the reset. | `* { grid-area: 1 / 1 / 1 / 1 }` and equivalent row/column declarations | Flag universal/global selectors assigning a shared grid area; the scoped grid-layer recipe remains valid. |
| No body layout reset | Do not make a twelve-column body grid part of the global reset. | `body`, `display: grid`, `grid-template-columns: repeat(12, …)` | Flag the combination on a configured reset/body rule. |
| Preserve container boxes | Do not globally remove the boxes of divs and sectioning elements. | `display: contents`, `div`, `section`, `article`, `aside`, `nav` | Flag broad element selectors assigning contents; intentional local contents usage needs review. |
| No universal trimming | Keep text-box trimming scoped to labels instead of shrinking every text block. | `*`, `text-box: trim-both cap alphabetic` | Flag trimming on universal selectors and equivalent global text rules. |
| Automatic body rendering | Leave body text rendering automatic rather than forcing optimizeLegibility. | `text-rendering: auto/optimizeLegibility` | Flag optimizeLegibility, particularly on root/body/prose selectors. |
| Preserve technique across syntax | Translate the same declarations into the project's existing authoring system instead of replacing them with breakpoint overrides. | Logical properties, container/grid functions, arbitrary utilities, normal CSS escape hatches | Not statically checkable: requires authoring-source and migration context; emitted breakpoint ladders can be candidates. |
| Technique before script | Prefer self-adapting CSS and use scripts to improve a baseline that already functions without them. | Intrinsic layout, native scroll/disclosure/popover features | Not statically checkable: requires behavior with scripts disabled. |
| Read complete conditions | Consult the applicable recipe and its prerequisites before applying its technique. | Recipe-specific selectors, properties, at-rules | Not statically checkable: reading and complete design intent cannot be inferred from CSS. |
| Project browser floor | Compare each feature's documented support with the project's actual target browsers and report any gap. | Feature-specific properties/at-rules, `@supports` | Not statically checkable from CSS alone: requires target-browser configuration and current support data. |

## Layout

### [Content breakouts](https://good-css.com/#content-grid-with-breakouts) — `#content-grid-with-breakouts` · [specimen](https://good-css.com/specimen/content-grid-with-breakouts)

| Short rule | Rule in own words | CSS involved | Static violation detection |
| --- | --- | --- | --- |
| Named width bands | Use one named-line grid for normal, wider, and full-width content instead of repeated container wrappers. | `display: grid`, `grid-template-columns`, named `*-start/end` lines, `grid-column` | On configured content grids, warn about independently duplicated max-width container recipes; eliminating wrappers is not statically checkable. |
| Bounded content track | Make the content track shrink with available width while preserving side gutters. | `min(100% - gutter * 2, content-max)`, `minmax(gutter, 1fr)` | Parse configured content templates and flag an unconditional fixed content width without a shrinking bound. |
| Collapsible breakout tracks | Let extra breakout tracks collapse to zero when the viewport is too narrow. | `minmax(0, calc(…))` | Flag positive fixed minima on configured breakout-side tracks. |
| Inherited full-width grid | Give full-width bands the same track layout so their descendants remain aligned. | `grid-column: full-width`, `display: grid`, `grid-template-columns: inherit` | Warn when configured full-width bands have no inherited/shared template or subgrid equivalent. |
| Place all children | Provide a default content-column placement for every direct grid child. | `> *`, `grid-column: content`, explicit width-role selectors | Warn when a configured breakout grid lacks a universal direct-child default or an explicit per-child placement contract; DOM coverage is not statically checkable. |
| Wrap inline runs | Group a run of inline content into one child before placing it in the content grid. | Grid direct-child behavior | Not statically checkable: requires markup. |
| Override width token | Adjust content width through the width token instead of replacing the entire grid template. | `--content`, `grid-template-columns` | Flag scoped redeclarations of the configured content template where a width-token override would suffice; intent needs review. |
| Explicit placement alternative | In systems without child selectors, set each child's named grid column explicitly. | `grid-column: content/breakout/full-width` | Not statically checkable: requires authoring-system and markup context. |

### [Intrinsic card grid](https://good-css.com/#intrinsic-grid) — `#intrinsic-grid` · [specimen](https://good-css.com/specimen/intrinsic-grid)

| Short rule | Rule in own words | CSS involved | Static violation detection |
| --- | --- | --- | --- |
| Container-fit columns | Let equal card columns fit themselves to the container instead of specifying counts per breakpoint. | `display: grid`, `grid-template-columns: repeat(auto-fit, minmax(…, 1fr))`, `gap` | Warn on repeated integer-column overrides for configured equal-card grids. |
| Shrinkable column minimum | Cap a column's preferred minimum at the container width to avoid narrow-container overflow. | `minmax(min(100%, preferred-min), 1fr)` | Flag `auto-fit`/`auto-fill` repeats with a fixed minimum lacking `min(100%, …)` or an equivalent bound. |
| Fill changing lists | Use auto-fill for changing or filtered item counts when cards must retain their width rather than stretch. | `auto-fill` versus `auto-fit` | Warn on `auto-fit` only for configured dynamic-list roles; changing item counts are not statically checkable from CSS. |

### [Shared card rows](https://good-css.com/#subgrid-rows-shared-across-cards) — `#subgrid-rows-shared-across-cards` · [specimen](https://good-css.com/specimen/subgrid-rows-shared-across-cards)

| Short rule | Rule in own words | CSS involved | Static violation detection |
| --- | --- | --- | --- |
| Align card parts | Share parent row tracks across cards so corresponding content parts align despite differing text lengths. | `display: grid`, `grid-template-rows: subgrid` | On configured aligned-card roles, warn about fixed heights used to align titles/bodies instead of shared tracks. |
| Match part span | Span as many parent rows as the card has independently aligned parts. | `grid-row: span N` | Flag row subgrids with no explicit span; compare `N` to configured part count, since CSS cannot count actual children. |
| Local part gap | Set the card's row gap deliberately instead of accidentally inheriting the outer card-grid gap. | `row-gap`, `gap`, `subgrid` | Warn on row-subgrid rules without a local gap declaration. |

### [Wrapping sidebar](https://good-css.com/#sidebar-that-wraps-on-its-own) — `#sidebar-that-wraps-on-its-own` · [specimen](https://good-css.com/specimen/sidebar-that-wraps-on-its-own)

| Short rule | Rule in own words | CSS involved | Static violation detection |
| --- | --- | --- | --- |
| Intrinsic sidebar wrap | Use wrapping flex items with a dominant main-side growth factor so the pair stacks when the main side loses sufficient width. | `display: flex`, `flex-wrap: wrap`, `flex-basis`, `flex-grow`, `min-inline-size` | Check configured sidebar recipes for missing wrap, main minimum, or growth asymmetry; flag breakpoint-only stacking as a review candidate. |
| Proportional wrap point | Express the main-side minimum as a container share to control the wrapping threshold. | `min-inline-size: 50%` or another percentage | Flag fixed-length minima on the configured intrinsic main side. |
| Content-sized aside | Omit the sidebar basis when the sidebar should take its width from its content. | `flex-basis` | Not statically checkable: desired sidebar sizing is design intent. |
| Unstretch sticky aside | Start-align a sticky sidebar so it has space to move inside its taller row. | `position: sticky`, logical inset, `align-self: start` | Flag sticky configured flex-side selectors without a start alignment, allowing an equivalent parent alignment. |
| Preserve bare media | Start-align a flex pair containing bare media so stretching does not distort the image or video. | `align-items: start`, `img`, `video` | Warn on known bare-media sidebar pairs lacking start alignment or another ratio-preserving constraint; markup is otherwise required. |

### [Container responsiveness](https://good-css.com/#container-queries-with-container-units) — `#container-queries-with-container-units` · [specimen](https://good-css.com/specimen/container-queries-with-container-units)

| Short rule | Rule in own words | CSS involved | Static violation detection |
| --- | --- | --- | --- |
| Slot-based adaptation | Adapt reusable components with container queries and bounded container-unit type rather than viewport-only rules. | `container-type: inline-size`, `@container`, `cqi`, `clamp()` | Warn on viewport breakpoints for configured slot-responsive components with no container query; design intent needs configuration. |
| Ancestor container | Place the size container on an ancestor of the component being queried. | `container-type`, `@container` | Warn when the same selector is both declared as the sole container and targeted inside its query; actual ancestry is not statically checkable. |
| Externally sized container | Do not apply size containment to a shrink-to-fit box whose width depends on its content. | `container-type`, `inline-size: fit-content`, `width: fit-content`, `display: inline-block/inline-flex`, `float` | Flag combinations with explicit content sizing or shrink-to-fit display modes; layout context can change the result. |
| Supply query context | Ensure a matching ancestor container exists, possibly through page-level header, main, and footer containers. | `container-type`, `container-name`, `@container` | Warn on named queries with no known matching name in resolved CSS; the DOM relationship is not statically checkable. |
| Separate subgrid and container | Put row-sharing and size containment on different elements. | `container-type`, `grid-template-rows/columns: subgrid` | Flag selectors that combine size containment and a subgrid declaration. |
| Understand unit fallback | Account for container units using viewport dimensions when no eligible ancestor container exists. | `cqi`, `@container` | Not statically checkable: CSS alone cannot establish the ancestor layout and resulting unit basis. |
| Unregistered fluid tokens | Leave cqi-based fluid length tokens unregistered so they resolve in the consuming slot. | `@property`, `syntax: "<length>"`, custom properties containing `cqi` | Follow token dependencies and flag typed registrations whose values depend on `cqi`, especially declarations at `:root`. |

### [Grid layers](https://good-css.com/#stack-layers-with-grid) — `#stack-layers-with-grid` · [specimen](https://good-css.com/specimen/stack-layers-with-grid)

| Short rule | Rule in own words | CSS involved | Static violation detection |
| --- | --- | --- | --- |
| In-flow overlap | Stack size-contributing layers in one grid cell so the container retains the largest layer's dimensions. | `display: grid`, `grid-area: 1 / 1`, `place-self` | Warn on absolute-positioned overlays for configured size-contributing layers; whether a layer should contribute is not statically checkable. |
| Default paint order | Rely on document order for stacked layers unless their visual order needs to differ. | `z-index`, shared `grid-area` | Flag redundant identical z-index values or increasing explicit z-index ladders on configured layers as review candidates; markup order is unavailable. |
| Non-sizing absolute layers | Keep absolute positioning for overlays that must not contribute to container size. | `position: absolute` | Not statically checkable: sizing intent requires design and markup context. |

### [Safe alignment](https://good-css.com/#safe-alignment) — `#safe-alignment` · [specimen](https://good-css.com/specimen/safe-alignment)

| Short rule | Rule in own words | CSS involved | Static violation detection |
| --- | --- | --- | --- |
| Reachable aligned overflow | Use safe alignment when centered or end-aligned content may overflow its container. | `justify-*`, `align-*`, `place-*`, `safe center/end`, overflow properties | Flag unsafe center/end values on configured bounded or scrolling layouts unless auto margins supply equivalent safe alignment. |
| Auto-margin alternative | Use opposing auto margins when safe centering must work with older flex implementations. | Flexbox, `margin-inline: auto`, `margin-block: auto` | Not statically checkable: required browser targets are external; AST can identify whether the alternative is present. |

### [Clip without scrolling](https://good-css.com/#overflow-clip-over-hidden) — `#overflow-clip-over-hidden` · [specimen](https://good-css.com/specimen/overflow-clip-over-hidden)

| Short rule | Rule in own words | CSS involved | Static violation detection |
| --- | --- | --- | --- |
| Clip decorative excess | Prefer clip over hidden when the only requirement is cutting off overflow without creating a scroller. | `overflow: clip`, `overflow-x/y: clip`, `position: sticky` | Flag `hidden` on configured decorative clipping roles, especially selectors known to contain sticky content; intent and ancestry need configuration. |
| Clip the offender | Apply clipping to the element that creates the excess rather than globally masking the page. | `html`, `body`, `overflow-x/y: clip` | Flag clip declarations on `html` or `body`. |
| Keep script scrolling | Preserve hidden or auto overflow when JavaScript must be able to scroll the element. | `overflow: hidden/auto` versus `clip` | Not statically checkable: requires script usage; a configured programmatic-scroller role can flag `clip`. |
| Keep resize support | Do not clip a resizable box because it needs scrollable overflow for its resize handle. | `resize`, `overflow: hidden/auto/clip` | Flag non-`none` `resize` combined with `overflow: clip`, including axis-specific overflow. |

## Spacing and shape

### [Neighbor-aware sections](https://good-css.com/#section-spacing-that-depends-on-its-neighbors) — `#section-spacing-that-depends-on-its-neighbors` · [specimen](https://good-css.com/specimen/section-spacing-that-depends-on-its-neighbors)

| Short rule | Rule in own words | CSS involved | Static violation detection |
| --- | --- | --- | --- |
| Section-owned defaults | Give each section its own default padding and add adjacency exceptions only for combinations that need them. | `padding-block`, `padding-block-start/end`, `A + B`, `A:has(+ B)` | Warn when a configured section has only adjacency padding and no default; whether a meeting looks wrong is not statically checkable. |
| Change the owning edge | Select the earlier section to change its ending edge and the later section to change its starting edge. | `A:has(+ B)` with `padding-block-end`; `A + B` with `padding-block-start` | Flag look-ahead selectors changing start padding or next-sibling selectors changing end padding as likely ownership errors. |
| Low-weight defaults | Use zero-specificity relational conditions for easily overridden neighbor-dependent defaults, including boundary styling. | `.logos:where(.hero + *)`, `:where()`, `border-block-start`, sibling combinators | Warn on configured default adjacency padding/border rules with high selector specificity and no `:where()` condition. |
| No spacing artifacts | Express section relationships in CSS instead of spacer elements, page-specific patches, or template-computed modifier classes. | Adjacency selectors, padding; spacer/page/modifier selectors | Flag configured spacer selectors with only dimensions and page-specific spacing overrides as candidates; template logic is not statically checkable. |
| Semantic section names | Name sections by their content role so the same adjacency rules work on different pages. | Class selectors such as `.hero`, `.faq` | Flag configured page-name prefixes in section selectors; semantics cannot be inferred reliably from arbitrary names. |
| Shared reasons | Keep adjacency exceptions few and combine pairs that share one underlying reason. | `:is()`, `:where()`, `:has()`, attribute/class selectors | Warn on large sets of identical adjacency declaration blocks; judging their shared reason is not statically checkable. |
| Plain relational escape hatch | Retain a small ordinary stylesheet for pair rules when the authoring system cannot express sibling selectors. | `+`, `:has(+ …)` | Not statically checkable: requires authoring-system constraints. |

### [Parent-owned spacing](https://good-css.com/#space-between-siblings-set-by-the-parent) — `#space-between-siblings-set-by-the-parent` · [specimen](https://good-css.com/specimen/space-between-siblings-set-by-the-parent)

| Short rule | Rule in own words | CSS involved | Static violation detection |
| --- | --- | --- | --- |
| Gap for known children | Put spacing between known component children on their flex-column parent rather than on every child. | `display: flex`, `flex-direction: column`, `gap` | Flag configured component-child block margins used alongside a parent gap or without a parent spacing contract. |
| Flow for unknown content | Use adjacent-child flow margins for CMS or Markdown content rather than turning all its children into flex items. | `> * + *`, `margin-block-start: var(--flow-space, 1em)` | Warn on flex-column display for configured uncontrolled-prose roles. |
| Reset flow margins | Clear children's block margins before adding the parent-controlled adjacent-child spacing. | `> * { margin-block: 0 }`, `> * + *` | For flow selectors, require a matching direct-child reset or known foundation equivalent. |
| Direct-child scope | Keep parent flow rules confined to direct children so nested lists and content are not restyled accidentally. | `>` with `* + *` | Selector AST: flag flow selectors using descendant combinators where the direct-child combinator is absent. |
| Type-relative rhythm | Use em-based fallback spacing and child overrides to give headings more room above and following text less room. | `var(--flow-space, 1em)`, `--flow-space`, heading sibling selectors | Warn on fixed-pixel flow fallback or unrelated hardcoded heading margins bypassing the configured flow token. |
| Nonstretched controls | Start-align buttons and links that should stay content-sized inside a flex column. | `align-self: start`, `align-items: start` | For known direct control children, flag absence of local or parent nonstretch alignment; ancestry otherwise requires markup. |
| Hidden-child distinction | Prefer gap when hidden children must not leave unwanted leading spacing. | `gap`, adjacent sibling selectors, `display: none`, `[hidden]` | Warn when configured hideable child roles use margin flow; actual sibling visibility and order are not statically checkable. |

### [Auto-margin separation](https://good-css.com/#push-one-item-away-with-an-auto-margin) — `#push-one-item-away-with-an-auto-margin` · [specimen](https://good-css.com/specimen/push-one-item-away-with-an-auto-margin)

| Short rule | Rule in own words | CSS involved | Static violation detection |
| --- | --- | --- | --- |
| Push with auto | Use an item's logical auto margin to separate it and subsequent siblings from the rest of a flex group. | `margin-block-start: auto`, `margin-inline-start: auto`, flex layout | Flag configured spacer elements or multi-item `justify-content: space-between` used for a single intended split; grouping intent is not statically checkable. |
| Center between neighbors | Give the middle item opposite auto margins to center it in the free space between surrounding items. | `margin-block: auto`, flex column | Not statically checkable: desired centering and neighbor geometry require markup and layout. |
| Supply spare space | Ensure the flex container has available space before relying on auto margins to move an item. | Stretching grid rows, `block-size: 100%`, `min-block-size` | Warn if a configured standalone cover has no size/stretch contract; real free space cannot be computed from one file. |
| Minimum cover height | Use minimum height for covers so long content can expand rather than be cut off. | `min-block-size: 100svh` versus `block-size` | Flag fixed `block-size`/`height` on configured cover roles; the source permits `100%` for an inner column filling an already taller box. |
| Preserve minimum gaps | Keep a gap as the minimum spacing when an auto margin has no spare room to absorb. | `gap`, logical auto margins | Warn on configured split stacks with auto margins but no gap. |
| Flex-only split | Use this technique in flex layouts rather than assuming grid auto margins absorb the grid's unused height. | `display: flex/grid`, auto margins | Warn when configured split/cover recipes combine grid display and auto margins expecting flex-like separation. |
| Remaining-space center | Review asymmetric neighbors because auto margins center within remaining space rather than at the whole container's midpoint. | Flex layout, opposite auto margins | Not statically checkable: requires rendered neighbor sizes. |

### [Nested curves](https://good-css.com/#concentric-nested-radius) — `#concentric-nested-radius` · [specimen](https://good-css.com/specimen/concentric-nested-radius)

| Short rule | Rule in own words | CSS involved | Static violation detection |
| --- | --- | --- | --- |
| Add the gap outward | Calculate the outer radius by adding the intervening gap to the inner radius so the corners stay concentric. | `border-radius: calc(var(--radius) + var(--pad))`, padding tokens | On configured nested rounded roles, flag identical inner/outer radii or an inner radius calculated by subtracting padding from the outer radius; geometry needs known parent-child roles. |

## Text and media

### [Long-content policy](https://good-css.com/#long-text-that-wraps-truncates-or-clamps) — `#long-text-that-wraps-truncates-or-clamps` · [specimen](https://good-css.com/specimen/long-text-that-wraps-truncates-or-clamps)

| Short rule | Rule in own words | CSS involved | Static violation detection |
| --- | --- | --- | --- |
| Deliberate overflow policy | Choose wrapping, one-line truncation, or multiline clamping for each user-controlled text role. | `overflow-wrap`, `white-space`, `text-overflow`, line-clamp declarations | Warn on configured user-content roles lacking an identifiable overflow policy; role classification needs external context. |
| Wrap and shrink together | Combine long-word wrapping with shrinkable flex/grid item minimums. | `overflow-wrap: break-word`, `min-inline-size: 0`, `min-width: 0` | Warn when a known constrained text item has only one side of the pair and no foundation contract. |
| Complete ellipsis recipe | Apply no-wrap, clipping, and ellipsis directly to the element containing the text. | `white-space: nowrap`, `overflow: clip/hidden`, `text-overflow: ellipsis` | Flag ellipsis missing nowrap or clipping, and ellipsis on flex/grid containers; whether the element directly holds text requires markup. |
| Shrink every intermediary | Allow every intervening flex item to shrink between the row and its truncated text. | `min-inline-size: 0`, `min-width: 0` | Not statically checkable: requires DOM ancestry; configured intermediary selectors can be checked for a zero minimum. |
| Complete multiline clamp | Use all four legacy clamping declarations instead of relying on the unprefixed property alone. | `display: -webkit-box`, `-webkit-box-orient: vertical`, `-webkit-line-clamp`, `overflow: clip/hidden`, `line-clamp` | Flag a prefixed clamp missing any companion declaration or unprefixed-only clamping under the source's compatibility policy. |
| Unpadded clamped text | Put padding on a wrapper so an extra clipped line cannot show through the clamped element's padding. | Padding properties, `-webkit-line-clamp` | Flag nonzero padding on the same configured selector as the clamp. |
| Conservative root wrapping | Use break-word globally and reserve anywhere for contexts needing different intrinsic sizing. | `:root { overflow-wrap: break-word }`, `overflow-wrap: anywhere` | Flag `anywhere` on root/global selectors. |
| Table exception | Use anywhere wrapping on automatic-layout table cells when break-word cannot keep long content within the cell. | `td`, `th`, `table-layout: auto`, `overflow-wrap: anywhere` | Warn on configured long-content table-cell selectors without anywhere; actual table sizing and content require context. |
| Full-text access | Truncate only when the reader can retrieve the complete text elsewhere and never truncate essential reading content. | Ellipsis and clamp declarations | Not statically checkable: requires content purpose and an alternate full-text presentation. |
| Tested clipping fallback | Use hidden overflow if clip-based ellipsis or clamping is unreliable in required browsers. | `overflow: hidden/clip` | Not statically checkable: requires browser-target policy and rendering verification. |

### [Uncontrolled media](https://good-css.com/#image-box-that-holds-any-upload) — `#image-box-that-holds-any-upload` · [specimen](https://good-css.com/specimen/image-box-that-holds-any-upload)

| Short rule | Rule in own words | CSS involved | Static violation detection |
| --- | --- | --- | --- |
| Reserve media geometry | Give uncontrolled media a predictable ratio or explicit avatar dimensions before its file loads. | `aspect-ratio`, `inline-size`, `block-size` | Warn on configured upload media with neither ratio nor a two-axis size contract. |
| Free ratio axis | Leave one dimension automatic when aspect ratio should calculate the other. | `aspect-ratio`, `block-size: auto`, `height: auto` | Flag ratio declarations with both axes fixed; HTML dimension attributes are not statically checkable. |
| Fit rather than distort | Use object fitting once the media box has defined geometry instead of stretching the file. | `object-fit: cover/contain`, dimensions, `aspect-ratio` | Warn on configured bounded uploaded images/videos without object-fit, or object-fit with no identifiable box geometry; `object-fit` does not size an iframe's embedded content. |
| Keep whole artwork | Choose contain for logos or product imagery that must remain fully visible and move intentional crops with object-position. | `object-fit: contain/cover`, `object-position` | Flag cover on configured no-crop roles; the desired crop position is not statically checkable. |
| Loading background | Give opaque uploaded media a muted background for loading and failure states. | `background-color`, surface token | Warn on configured opaque-upload roles lacking a background; transparency cannot be identified from CSS. |
| Transparent exception | Omit the loading background when it would show through intentional transparent image regions. | `background-color` | Not statically checkable: requires asset transparency and visual intent. |
| Stable avatars | Set both dimensions and prevent shrinking for a fixed-size image beside flex text. | `flex: none`, `inline-size`, `block-size`, `object-fit` | For configured avatar roles, require nonshrink behavior and both sizes; reject width-only sizing. |
| Inner media edge | Draw a subtle radius-following outline inward so pale avatars remain distinguishable without changing layout. | `outline`, `outline-offset: -1px`, `border-radius`, `light-dark()` | Warn on configured avatar-edge recipes lacking negative outline offset or using an external border instead of the intended inner outline. |
| Scheme-aware edge | Establish a color scheme before expecting a light-dark outline to change on dark surfaces. | `color-scheme`, `light-dark()` | Warn if the outline uses light-dark with no known applicable color-scheme contract. |
| Failure-proof wrapper | Put the ratio on a wrapper and make the image fill it when Safari image failures must not alter layout. | Wrapper `aspect-ratio`, child `inline-size: 100%`, `block-size: 100%` | Warn on configured failure-stable media with ratio only on `img`; wrapper ancestry and actual failure behavior need markup/runtime checks. |

### [Steady numeric figures](https://good-css.com/#tabular-numbers) — `#tabular-numbers` · [specimen](https://good-css.com/specimen/tabular-numbers)

| Short rule | Rule in own words | CSS involved | Static violation detection |
| --- | --- | --- | --- |
| Tabular changing numbers | Use equal-width figures for changing values and numeric columns. | `font-variant-numeric: tabular-nums`, price/table/time selectors | Warn on configured numeric roles without tabular-nums. |
| Proportional prose | Keep tabular figures off global reading-text rules. | `font-variant-numeric`, `:root`, `body`, `*` | Flag global tabular-nums declarations. |
| Font capability | Select a font that actually contains tabular figures. | `font-family`, `@font-face`, `font-variant-numeric` | Not statically checkable: requires inspection of font assets. |

### [Letter-centered labels](https://good-css.com/#label-centered-on-its-letters-with-text-box) — `#label-centered-on-its-letters-with-text-box` · [specimen](https://good-css.com/specimen/label-centered-on-its-letters-with-text-box)

| Short rule | Rule in own words | CSS involved | Static violation detection |
| --- | --- | --- | --- |
| Trim label metrics | Trim a single-line label's box to the capitals and baseline before applying equal surrounding padding. | `text-box: trim-both cap alphabetic`, padding | For configured opt-in labels, warn on missing trimming; desired optical centering is not statically checkable. |
| Trim text wrapper | Apply text-box to the text wrapper rather than the flex/grid container holding an icon and label. | `display: inline-flex/flex/grid`, `> span`, `text-box` | Flag text-box on flex/grid selectors; a wrapper's presence requires markup. |
| Preserve target height | Increase padding if trimming reduces the control below its intended size. | `padding-block`, `text-box`, height/minimum-height | Warn when literal trimming metrics and padding imply a configured target minimum might be missed; true font metrics need rendering. |
| One-line scope | Restrict trimming to single-line labels and allow their descenders to extend into the bottom padding. | `text-box`, label selectors, `white-space` | Flag trimming on configured multiline/prose roles or universal selectors; actual line count is not statically checkable. |
| Natural unsupported state | Let browsers without text-box retain the normal line box instead of adding a fallback centering hack. | `text-box`, `@supports`, positional offsets | Warn on configured text-box fallback blocks applying arbitrary transforms/offsets; fallback intent needs review. |

### [Text-relative icons](https://good-css.com/#icon-sized-by-the-text-beside-it) — `#icon-sized-by-the-text-beside-it` · [specimen](https://good-css.com/specimen/icon-sized-by-the-text-beside-it)

| Short rule | Rule in own words | CSS involved | Static violation detection |
| --- | --- | --- | --- |
| Font-relative icon size | Size icons beside labels in font-relative units rather than pixels or a separate size for every variant. | `cap`, `em`, `lh`, `block-size`, `inline-size` | Flag pixel dimensions on configured label-icon selectors and repeated per-variant icon-size overrides. |
| Capital baseline | Align a single-line icon's bottom with the text baseline and give it approximately a capital's height. | `align-items: baseline`, `block-size: 1cap`, `inline-size: auto` | Warn on configured single-line recipes missing baseline alignment or cap-based height, permitting the trimmed-label exception below. |
| No squeezed icons | Keep label icons from shrinking under long text. | `flex: none`, `flex-shrink: 0` | Require nonshrink behavior on configured flex icons. |
| Drawing ratio | Supply an SVG viewBox so an automatic dimension follows the drawing's aspect ratio. | `inline-size: auto`; SVG `viewBox` outside CSS | Not statically checkable: requires SVG markup. |
| Compensate internal padding | Increase the cap multiplier when the icon artwork has internal padding instead of switching to a fixed unit. | Values such as `block-size: 1.2cap` | Not statically checkable: requires inspection of icon geometry. |
| First-line wrapped icon | Start-align icons beside wrapping labels and make their box one line high. | `align-items: start`, `inline-size: 1em`, `block-size: 1lh` | Flag center alignment on configured wrapping-label containers and icon height unrelated to the line; wrapping intent needs configuration. |
| Proportional gap | Express the label-to-icon gap in em so spacing follows font size. | `gap: …em` | Flag fixed pixel gaps in configured label-icon recipes. |
| Trimmed center exception | Center alignment is appropriate when both a trimmed label and its icon occupy the same cap-height box. | `text-box`, `align-items: center`, cap dimensions | Suppress center-alignment warnings only when the configured label has trimming and the icon uses matching cap geometry. |

## Interaction

### [Visible focus](https://good-css.com/#one-focus-ring-with-focus-visible) — `#one-focus-ring-with-focus-visible` · [specimen](https://good-css.com/specimen/one-focus-ring-with-focus-visible)

| Short rule | Rule in own words | CSS involved | Static violation detection |
| --- | --- | --- | --- |
| Browser-chosen focus | Give interactive elements a shared focus-visible outline that grows with their text size. | `:focus-visible`, `outline: max(2px, 0.08em) solid currentColor`, `outline-offset: 0.25em` | Warn when configured controls have no applicable focus-visible style; flag literal outline thickness below 2px under this policy. |
| Never erase outline | Keep an outline even when a custom ring uses box-shadow so forced-color rendering can restore it. | `outline`, `outline-style`, `outline-width`, `outline-color: transparent`, `box-shadow`, `@media (forced-colors: active)` | Flag `outline: none/0`, `outline-style: none`, or zero width on focus/control rules; warn on shadow-only focus without a preserved outline. |
| Filled-button contrast | Override currentColor with the button's background color when the ordinary ring lacks contrast. | `outline-color`, `background-color`, `currentColor` | Not statically checkable in general: rendered adjacent colors determine contrast; literal color/token resolution can produce a review candidate. |

### [Capable hover](https://good-css.com/#hover-styles-only-where-hover-exists) — `#hover-styles-only-where-hover-exists` · [specimen](https://good-css.com/specimen/hover-styles-only-where-hover-exists)

| Short rule | Rule in own words | CSS involved | Static violation detection |
| --- | --- | --- | --- |
| Dual hover gate | Restrict hover styling to primary inputs that can hover and have fine precision. | `:hover`, `@media (hover: hover) and (pointer: fine)` | For each hover selector, inspect media ancestors and flag any satisfiable branch lacking either condition; OR branches must each satisfy the gate. |
| Framework gate awareness | Account for Tailwind v4 supplying only the hover capability gate rather than the site's full pointer gate. | Generated hover selectors, hover media query, pointer media query | On emitted CSS, flag hover branches lacking pointer:fine; source utility class usage is not visible in a component CSS file. |
| Universal press feedback | Provide a pressed state even when hover styling is unavailable. | `:active` | For configured controls with hover styles, warn when no corresponding active-state visual change exists. |

### [Immediate press](https://good-css.com/#press-feedback) — `#press-feedback` · [specimen](https://good-css.com/specimen/press-feedback)

| Short rule | Rule in own words | CSS involved | Static violation detection |
| --- | --- | --- | --- |
| Respond on contact | Use active-state feedback as soon as a control is pressed rather than waiting for release. | `:active`, `transform: scale()` | Require a visual active rule for configured pressable roles; timing of script-driven state is not statically checkable. |
| Subtle whole-control scale | Keep pressed scaling between 0.95 and 0.98 and apply it to the whole control. | `transform: scale(0.95…0.98)`, `scale` | Parse literal scale factors on active selectors and flag values outside the range; descendant-only scaling is a candidate for review. |
| Optional return easing | Animate the pressed transform only when motion is allowed while preserving an immediate state change for everyone. | Transform transition, `@media (prefers-reduced-motion: no-preference)`, `:active` | Flag transform transitions outside the motion gate or the only active feedback being inside that gate; source example uses 160ms. |
| Pointer script timing | When scripting is required, trigger press feedback from pointerdown rather than click. | CSS active/pressed state; pointer event listeners outside CSS | Not statically checkable: requires JavaScript. |

### [Expanded targets](https://good-css.com/#hit-area-larger-than-the-visual) — `#hit-area-larger-than-the-visual` · [specimen](https://good-css.com/specimen/hit-area-larger-than-the-visual)

| Short rule | Rule in own words | CSS involved | Static violation detection |
| --- | --- | --- | --- |
| Minimum hit area | Enlarge visually small controls to a 44px target using a generated absolute box without growing their appearance. | `position: relative`, `::after`, `content: ""`, `position: absolute`, `inset: min(0px, (100% - 44px) / 2)` | For configured small controls, compare resolvable dimensions with 44px and require a hit-extension contract; flag missing positioning/content on the pseudo-element. |
| No unnecessary growth | Bound the expansion at zero so already-large controls do not receive extra hit area. | `min(0px, …)` in `inset` | Flag unconditional negative target insets on configured expanded-target recipes. |
| Unclipped targets | Keep overflow clipping off a control whose pseudo-element extends its hit region. | `overflow: hidden/clip`, negative pseudo-element inset | Flag hidden/clip on the base selector of an expanding hit pseudo-element; clipping ancestors require DOM context. |
| Input label target | Expand an input's label rather than relying on unsupported input pseudo-elements. | `input::before/after`, label positioning | Flag expanding pseudo-element recipes on `input`; label association is not statically checkable. |

### [Stretched card link](https://good-css.com/#whole-card-clickable-from-one-link) — `#whole-card-clickable-from-one-link` · [specimen](https://good-css.com/specimen/whole-card-clickable-from-one-link)

| Short rule | Rule in own words | CSS involved | Static violation detection |
| --- | --- | --- | --- |
| One semantic link | Stretch a short real link across the card instead of wrapping all card content in a link or attaching navigation to a div. | Link `::after`, `content`, absolute positioning, `inset: 0`, relative card | Check configured overlay completeness; actual link semantics and accessible name are not statically checkable. |
| Card containing block | Avoid positioned ancestors between the link and card so the stretched overlay uses the card's dimensions. | `position: relative/absolute/sticky/fixed`, pseudo-element containing block | Not statically checkable: requires markup; configured intermediary selectors with nonstatic position can be flagged. |
| Card-wide focus | Move the visible ring to the card when its primary link has keyboard-visible focus. | `.card:has(.card-link:focus-visible)`, `outline`, `outline-offset` | Warn when a stretched-link role has no ancestor focus-visible ring rule. |
| Explicit transparent link ring | Preserve the link's own outline with a complete transparent outline declaration for Safari. | `.card-link:focus-visible { outline: 2px solid transparent }` | Flag outline removal or transparent outline-color alone on configured stretched links. |
| Independent secondary controls | Position secondary controls above the stretched link so they keep their own click behavior. | `:is(button, a:not(.card-link))`, `position: relative`, `z-index: 1` | Warn when known secondary-control selectors lack a positioned higher stacking level; actual overlap needs rendering. |
| Accept overlay selection cost | Use this overlay only where losing selection of the covered text is acceptable. | Absolute link pseudo-element | Not statically checkable: requires product intent. |
| Hover the card | Put hover feedback on the card itself inside the full hover/pointer capability gate. | `.card:hover`, dual media gate | Flag stretched-link hover feedback scoped only to the link text or missing either media condition. |

### [Relational state](https://good-css.com/#has-for-parent-and-page-state) — `#has-for-parent-and-page-state` · [specimen](https://good-css.com/specimen/has-for-parent-and-page-state)

| Short rule | Rule in own words | CSS involved | Static violation detection |
| --- | --- | --- | --- |
| Derive parent state | Use relational selectors for ancestor or adjacent styles that follow descendant content or state. | `:has(img)`, `:has(+ p)`, `:has(:focus-visible)` | Not statically checkable: CSS cannot reveal scripts maintaining redundant parent classes; configured mirrored-state selectors can be review candidates. |
| Modal-only scroll lock | Lock document scrolling for a modal dialog rather than for every open dialog. | `html:has(dialog:modal) { overflow: hidden }`, `:modal` | Flag root scroll-lock selectors using `dialog[open]` or generic dialog presence instead of `:modal`. |
| Lock without shift | Preserve a stable root gutter while applying modal scroll lock. | `html`, `scrollbar-gutter: stable`, `overflow: hidden` | Warn when the lock exists without a known stable gutter declaration. |
| No nested has | Keep relational pseudo-classes unnested. | `:has()` | Selector AST: flag a `:has()` node whose descendants contain another `:has()` node. |

### [User-triggered validation](https://good-css.com/#form-feedback-with-user-invalid) — `#form-feedback-with-user-invalid` · [specimen](https://good-css.com/specimen/form-feedback-with-user-invalid)

| Short rule | Rule in own words | CSS involved | Static violation detection |
| --- | --- | --- | --- |
| Defer validation appearance | Use user-validity states so untouched required fields are not marked invalid on initial load. | `:user-invalid`, `:user-valid` versus `:invalid`, `:valid` | Flag direct invalid/valid styling on configured inline-feedback controls; exceptions such as submit-level validation need context. |
| HTML constraints | Let native validity derive from the field's declared constraints instead of a mirrored touched-state class. | User-validity selectors; HTML `required`, `minlength`, `type`, `pattern` | Not statically checkable: requires HTML and any validation script. |
| More than color | Pair validation colors with explanatory text or an icon. | `border-color`, `color`, `:user-invalid`; companion text/icon markup, optionally styled with `.error` and `display` | Warn when validity rules change only colors and no known feedback selector exists; rendered noncolor feedback requires markup, and no particular companion selector is mandated by the recipe. |
| Validate at server | Repeat validation on the server regardless of browser feedback. | No CSS mechanism | Not statically checkable: requires server implementation. |

### [Content-sized textarea](https://good-css.com/#textarea-that-grows-with-its-content) — `#textarea-that-grows-with-its-content` · [specimen](https://good-css.com/specimen/textarea-that-grows-with-its-content)

| Short rule | Rule in own words | CSS involved | Static violation detection |
| --- | --- | --- | --- |
| Native text measurement | Let the browser size multiline input content instead of maintaining an autosize script or hidden mirror. | `field-sizing: content`, textarea selectors | Warn on configured growing textareas without field-sizing; redundant mirrors/scripts are not statically checkable. |
| Bounded line count | Set minimum and maximum heights in line units without a fixed height, allowing scrolling after the upper bound. | `min-height: 3lh`, `max-height: 12lh`, `resize: none`, `height` | Flag field-sizing controls with fixed height or no minimum/maximum; warn on non-line-relative bounds under this recipe. |
| Animate measured wrapper | If growth should ease, let the textarea resize immediately and transition a wrapper updated by ResizeObserver. | Wrapper `transition: height`, `overflow: clip`, motion media query | Flag height transition on the content-sized textarea itself or wrapper height transition outside the motion gate; observer wiring is not statically checkable. |
| Wrapper owns skin | Put border and background on the animated wrapper and leave the textarea visually bare. | `border`, `background`, textarea/wrapper selectors | On configured animated-field roles, flag visible border/background on the textarea instead of the wrapper. |
| Content-box measurement | Keep the measured wrapper content-box so its border does not reduce the copied textarea height. | `box-sizing: content-box` | Require content-box on configured observer-sized wrappers, overriding the normal reset intentionally. |
| Plain unsupported input | Accept a fixed scrolling textarea when field-sizing is unavailable rather than adding a fallback autosizer. | `field-sizing`, `@supports` | Warn on configured fallback sizing rules; fallback JavaScript is not statically checkable. |

## Motion

### [Motion by permission](https://good-css.com/#opt-in-motion) — `#opt-in-motion` · [specimen](https://good-css.com/specimen/opt-in-motion)

| Short rule | Rule in own words | CSS involved | Static violation detection |
| --- | --- | --- | --- |
| State before motion | Make the state change work without animation and add moving or scaling transitions only for users allowing motion. | `@media (prefers-reduced-motion: no-preference)`, `transition`, `animation`, transform/position/size properties | Classify transition properties and referenced keyframes, then flag motion outside a guaranteed no-preference media branch or state changes available only within that branch. |
| No blanket cancellation | Do not implement reduced motion by globally shortening every animation and transition to a near-zero duration. | Universal selectors, `animation-duration`, `transition-duration`, `0.01ms` | Flag global duration overrides at or below 1ms, especially inside a reduce media query. |
| Fades may remain | Opacity and color fades may continue without the movement permission gate. | `opacity`, color properties, `transition` | Do not flag fade-only transitions as motion; determine indirect effects when registered custom properties drive both opacity and transforms. |
| Script checks preference | Gate script-driven movement with the same user preference as CSS movement. | Motion media query; JavaScript `matchMedia()` outside CSS | Not statically checkable: requires JavaScript. |

### [Motion vocabulary](https://good-css.com/#motion-tokens) — `#motion-tokens` · [specimen](https://good-css.com/specimen/motion-tokens)

| Short rule | Rule in own words | CSS involved | Static violation detection |
| --- | --- | --- | --- |
| Shared strong curves | Define reusable strong ease-out and ease-in-out curves rather than repeating weaker built-in easing throughout the UI. | `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`, `--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)`, `var()` | Flag literal repeated timing curves in components or plain keywords where the project's configured motion tokens should be used. |
| Entry and exit easing | Use ease-out for appearances and disappearances so feedback starts promptly. | Transition/animation timing, ease-out token | Warn on other timing functions for configured entering/exiting roles; semantic classification needs configuration. |
| Existing-object easing | Use ease-in-out when an already-visible object moves to a new position. | Ease-in-out token, movement transitions | Warn on other curves for configured repositioning roles. |
| No slow-start UI | Avoid ease-in because it delays the visible response to a user's action. | `transition-timing-function`, `animation-timing-function`, shorthands | Flag the `ease-in` keyword; matching custom curves to intent is only heuristic. |
| Duration budget | Keep ordinary UI transitions within 300ms and choose durations appropriate to the control's size and purpose. | Transition/animation durations | Parse time values and flag above 300ms unless configured as modal/drawer; validate press 100–160ms, tooltip/small popover 125–200ms, dropdown 150–250ms, modal/drawer 200–500ms when the role is known. |
| Explicit properties | List the properties that should transition instead of animating every property change. | `transition`, `transition-property` | Flag `all`, including shorthands omitting a property because their default is all. |
| Standalone token fallback | Keep a built-in easing fallback in reusable snippets that may be used before the shared tokens exist. | `var(--ease-out, ease-out)` | In configured standalone snippets, warn on an unresolved easing variable with no fallback; a known project token makes a fallback unnecessary. |
| Motion design review | Decide whether motion is appropriate through interaction design rather than assuming a CSS technique makes it desirable. | No decisive CSS property | Not statically checkable: requires design review. |

### [Typed animated variables](https://good-css.com/#transition-a-custom-property-with-property) — `#transition-a-custom-property-with-property` · [specimen](https://good-css.com/specimen/transition-a-custom-property-with-property)

| Short rule | Rule in own words | CSS involved | Static violation detection |
| --- | --- | --- | --- |
| Register interpolated state | Register a custom property's type before transitioning it and derive coordinated child effects from that one value. | `@property`, `syntax`, custom-property transition, `calc()`, `rotate`, `scale`, `opacity` | Flag custom properties named in a transition without a known typed registration; warn on duplicated independent transitions for configured coordinated effects. |
| Match typed values | Choose a number, length-percentage, or angle registration that fits the effect's interpolated value. | `syntax: "<number>"/"<length-percentage>"/"<angle>"` | Compare resolvable assigned values and initial values to the registered grammar. |
| Required initial state | Supply an initial value for every registration whose syntax is not the unrestricted wildcard. | `@property`, `syntax`, `initial-value` | Flag typed registrations missing initial-value; wildcard syntax is exempt. |
| Inherit coordinated state | Enable inheritance when child elements must consume their parent's animated variable. | `inherits: true`, descendant `var()` usage | Warn on inherits:false when configured descendant effects consume the property; selector ancestry is heuristic. |
| Transformable box | Give inline content a transformable box before applying individual transform properties. | `rotate`, `scale`, `translate`, `display: inline-block` | Flag these properties alongside explicit `display: inline`; default inline display requires markup. |
| One global registration | Register each specifically named property once because registrations are global. | `@property --name` | Flag duplicate registrations and configured generic names likely to collide; detecting cross-file collisions requires the resolved stylesheet set. |
| Script supplies state only | Let scripts write the CSS variable while CSS owns easing and duration. | `var()`, transition declarations; `style.setProperty()` outside CSS | Not statically checkable: requires JavaScript. |

### [Composited shadow change](https://good-css.com/#shadow-change-that-fades-and-does-not-repaint) — `#shadow-change-that-fades-and-does-not-repaint` · [specimen](https://good-css.com/specimen/shadow-change-that-fades-and-does-not-repaint)

| Short rule | Rule in own words | CSS involved | Static violation detection |
| --- | --- | --- | --- |
| Fade painted shadows | For large or numerous cards, crossfade fixed shadow layers instead of interpolating box-shadow on every frame. | `::before`, `::after`, fixed `box-shadow`, `opacity`, opacity transition | Flag box-shadow transitions on configured large-shadow/card-grid roles; the actual paint saving needs profiling. |
| Replace both states | Fade the resting shadow out while fading the raised shadow in so the final state is not their sum. | Hover pseudo-element opacity values | Check configured two-layer recipes for complementary zero/one state values rather than leaving the resting layer fully visible. |
| Isolated shadow stack | Isolate the card's stacking context and place noninteractive shadow layers behind its contents. | `position: relative`, `isolation: isolate`, `z-index: -1`, `pointer-events: none`, `border-radius: inherit`, `inset: 0` | Require these companion declarations for configured negative-z shadow pseudo-elements; warn about missing radius inheritance. |
| Card-owned background | Put the visible background on the card while the shadow pseudo-elements remain unfilled. | Card `background`, pseudo-element background declarations | Warn if the configured card has no known background or its shadow pseudo-elements introduce a fill. |
| Pseudo-element budget | Do not reuse the same pseudo-elements for shadow layers and expanded hit/link overlays on one element. | `::before`, `::after`, shadow, hit-area/link recipes | Group pseudo-element declarations by base selector and flag conflicting shadow, content, inset, z-index, or pointer-event roles. |
| Small-shadow exception | Use a direct box-shadow transition for a single small element when the extra layers are not worthwhile. | `transition: box-shadow` | Not statically checkable: rendered size, instance count, and measured cost determine the tradeoff. |

### [Document crossfades](https://good-css.com/#cross-document-view-transitions) — `#cross-document-view-transitions` · [specimen](https://good-css.com/specimen/cross-document-view-transitions)

| Short rule | Rule in own words | CSS involved | Static violation detection |
| --- | --- | --- | --- |
| Native page transition | Opt same-origin multipage navigation into browser view transitions instead of adding a transition router or script. | `@view-transition { navigation: auto }` | Warn on missing opt-in only for configured multipage styles; navigation origin and router usage are not statically checkable. |
| Both documents opt in | Include the navigation opt-in in both the departing and arriving document's styles. | `@view-transition`, `navigation` | Not statically checkable from one component file: requires both documents' stylesheet sets. |
| Fade versus movement | Leave the default crossfade unguarded but gate custom sliding page transitions by motion preference. | View-transition pseudo-elements, transform/translate animations, motion media query | Inspect referenced keyframes and flag moving view-transition effects or their opt-in rule outside the no-preference gate; fade-only effects are exempt. |

### [Anchor-following indicator](https://good-css.com/#indicator-that-slides-to-the-active-item) — `#indicator-that-slides-to-the-active-item` · [specimen](https://good-css.com/specimen/indicator-that-slides-to-the-active-item)

| Short rule | Rule in own words | CSS involved | Static violation detection |
| --- | --- | --- | --- |
| Semantic current anchor | Name the current item's anchor through its semantic current-state attribute rather than maintaining a separate active class. | `[aria-current="page"]`, `anchor-name` | Flag configured active-anchor rules tied only to an `.active` class; actual attribute synchronization needs markup/script review. |
| Per-component anchor scope | Scope the active anchor to each navigation component so separate instances cannot select each other's item. | Component-root `anchor-scope: --active`, `anchor-name`, `position-anchor` | Warn when a configured indicator's named anchor lacks a matching scope contract. |
| Positioned list | Position the indicator relative to the box containing the navigation items. | List `position: relative`, indicator `position: absolute` | Require the configured list's relative positioning; true containing-block ancestry needs markup. |
| Anchor-derived geometry | Size and place one indicator from the active anchor instead of measuring each item in JavaScript. | `inset-inline-start: anchor(start)`, `inline-size: anchor-size(inline)`, `position-anchor` | Warn on fixed configured indicator widths/offsets instead of anchor functions; measurement scripts are not statically checkable. |
| Vertical axis swap | Change both anchored geometry and transitioned properties to the block axis for a vertical list. | `inset-block-start: anchor(top)`, `block-size: anchor-size(height)` | For configured vertical indicators, flag inline-axis geometry or transition lists naming only the horizontal properties. |
| Redundant current cue | Give the active item a weight or color cue so it remains identifiable without anchor positioning. | `[aria-current]`, `font-weight`, `color` | Warn on configured current-item selectors without a non-indicator visual cue. |
| Optional indicator travel | Gate the indicator's position and size transition behind permission for motion. | Transitions on inset/size, motion media query | Flag these transitions outside a guaranteed no-preference branch. |

### [Linked motion process guidance](https://good-css.com/skills/good-css/SKILL.md)

| Short rule | Rule in own words | CSS involved | Static violation detection |
| --- | --- | --- | --- |
| Specialist motion review | Use the named motion-design guidance for animation purpose, springs, gestures, drag behavior, and physical-phone verification when available. | No decisive CSS property; motion timing/state declarations are the reviewed output | Not statically checkable: requires workflow and device evidence. |
| Motion guidance precedence | Prefer those specialist motion values when they conflict with the site's example values. | Easing, durations, spring curves | Not statically checkable: requires the applicable external guidance. |
| No unrequested motion | When specialist guidance is unavailable, keep motion limited to what the recipe or task explicitly calls for. | `animation`, `transition`, keyframes | Not statically checkable: requires task scope and design intent. |

## Show and hide

### [Discrete entry and exit](https://good-css.com/#enter-and-exit-transitions-from-display-none) — `#enter-and-exit-transitions-from-display-none` · [specimen](https://good-css.com/specimen/enter-and-exit-transitions-from-display-none)

| Short rule | Rule in own words | CSS involved | Static violation detection |
| --- | --- | --- | --- |
| Native display lifecycle | Transition entry from starting-style and defer removal with discrete display and overlay transitions. | `@starting-style`, `display … allow-discrete`, `overlay … allow-discrete`, `transition-behavior` | For configured entering/exiting top-layer roles, flag missing start state or missing discrete display/overlay transition entries. |
| Start state after open | Place the starting-style block after the ordinary open-state rule so equal-specificity cascade order preserves the intended starting value. | `@starting-style`, `dialog[open]`, `:popover-open` | Compare source order for matching selectors/properties and flag an earlier starting-style overridden by later open-state values. |
| Modest scale entry | If scaling entry, begin near full size with opacity zero rather than scaling from nothing. | `scale(0.95)`, `opacity: 0`, starting styles | Flag zero scale in starting/closed states; warn on much smaller-than-0.95 initial scale under this recipe. |
| Backdrop lifecycle | Give the dialog backdrop its own closed, open, and starting states and discrete fade transition. | `dialog::backdrop`, `dialog[open]::backdrop`, `@starting-style`, opacity/display/overlay transitions | Check all three backdrop states and companion transitions when the configured dialog animates. |
| Fade for everyone | Keep fades available while placing displacement values inside the motion-preference gate. | `opacity`, `translate`, motion media query | Flag translate/scale state changes outside the gate in this entry recipe; do not demand a gate for opacity alone. |
| Separate uncertain selectors | Keep popover-open out of the ordinary selector list that makes an open dialog visible. | `dialog[open]`, `[popover]:popover-open`, selector lists | Flag a non-starting-style selector list containing both dialog-open and popover-open; the shared list inside starting-style is the source's permitted exception. |
| No lifecycle fallback | Let unsupported entry or exit transitions change state immediately instead of scripting a replacement lifecycle. | Starting/discrete transition features | Not statically checkable: CSS can find fallback blocks, but scripts and target support determine their purpose. |

### [Trigger-anchored popover](https://good-css.com/#popover-anchored-to-its-trigger) — `#popover-anchored-to-its-trigger` · [specimen](https://good-css.com/specimen/popover-anchored-to-its-trigger)

| Short rule | Rule in own words | CSS involved | Static violation detection |
| --- | --- | --- | --- |
| Native trigger anchor | Use the popover trigger relationship as the implicit anchor rather than measuring its rectangle. | `position-area`, HTML `popover`/`popovertarget` | Not statically checkable: requires trigger markup or script source. |
| Guard positioning support | Put anchor positioning overrides inside a feature query so unsupported browsers retain the native centered popover. | `@supports (position-area: block-end)`, `margin: 0`, `position-area`, `position-try-fallbacks` | Flag configured native popover positioning/margin overrides outside the feature query; warn on custom unsupported-browser positioning fallbacks. |
| Flippable span area | Use spanning position areas and block/inline flip fallbacks rather than center placement that can prevent collision flips. | `position-area: block-end span-inline-end`, `position-try-fallbacks: flip-block, flip-inline, flip-block flip-inline` | Flag center placement in configured flip-dependent recipes or missing configured fallback directions. |
| Trigger-side gap | Express the popover gap as a logical margin so collision flips mirror it onto the trigger's side. | `margin-block-start`, position flips | Flag transform/physical-offset gap hacks in configured anchored popover recipes. |
| Script supplies source | Pass the invoking button as the source when opening the popover through script. | CSS implicit anchor; `showPopover({ source: button })` outside CSS | Not statically checkable: requires JavaScript. |

### [Native disclosure animation](https://good-css.com/#accordion-that-animates-its-height) — `#accordion-that-animates-its-height` · [specimen](https://good-css.com/specimen/accordion-that-animates-its-height)

| Short rule | Rule in own words | CSS involved | Static violation detection |
| --- | --- | --- | --- |
| Native disclosure behavior | Use details and summary for disclosure toggling, keyboard operation, and find-in-page support. | `details`, `summary`, `::details-content` | Not statically checkable: requires HTML semantics. |
| Intrinsic disclosure height | Animate the details-content box between zero and auto with keyword interpolation enabled. | `interpolate-size: allow-keywords`, `details::details-content`, `height: 0/auto`, `overflow: clip` | Check configured details animation for interpolation support declaration, both heights, and clipping. |
| Keep closing content rendered | Transition content-visibility discretely with height so closing text remains rendered until the collapse completes. | `content-visibility … allow-discrete`, height transition, motion media query | Flag details-content height transitions missing the discrete content-visibility entry or lacking the motion gate. |
| Inner padding only | Put disclosure padding on a child inside the animated box so no padding remains visible after closure. | `::details-content`, padding properties | Flag nonzero padding on details-content. |
| Exclusive disclosure group | Give sibling details the same name when only one should remain open at a time. | No CSS mechanism; HTML `details[name]` | Not statically checkable: requires markup and intended exclusivity. |
| Both marker rules | Remove the summary marker with both list-style and Safari's marker selector when using a custom marker. | `summary { list-style: none }`, `summary::-webkit-details-marker { display: none }` | If either removal rule exists, warn when the paired rule is missing. |
| Instant unsupported disclosure | Allow unsupported browsers to open and close immediately rather than adding a replacement animation. | `interpolate-size`, `::details-content` | Not statically checkable: requires runtime/fallback code review; suspicious CSS fallback blocks can be reported. |

### [Clipped panel reveal](https://good-css.com/#reveal-with-clip-path) — `#reveal-with-clip-path` · [specimen](https://good-css.com/specimen/reveal-with-clip-path)

| Short rule | Rule in own words | CSS involved | Static violation detection |
| --- | --- | --- | --- |
| Full-size overlay reveal | Reveal an overlapping unknown-height panel by changing its clip rather than changing its layout height. | `clip-path: inset(0 -3rem 100%)` and `inset(0 -3rem -3rem)`, clip transition | Flag height transitions on configured overlay-reveal roles; clip reveal on an in-flow collapsing role is also a candidate. |
| Hide keyboard access | Combine the closed clip with hidden visibility and transition visibility so links remain unavailable after closure. | `visibility: hidden/visible`, `transition: visibility`, clip-path | Flag closed clips without hidden visibility, or animated closing recipes with no visibility transition. |
| Shadow clip budget | Extend the clip beyond the sides and bottom by more than the shadow blur plus offset while keeping the attached top edge clipped. | Negative `inset()` lengths, `box-shadow` blur/offset | Resolve compatible literal units and compare negative inset magnitudes against shadow blur plus outward offset; unresolved tokens or spread require review. |
| Overlay-only technique | Use clip reveal for panels outside normal flow because clipping does not remove their reserved layout space. | `clip-path`, `position: absolute/fixed`, overlay layout | Warn on configured collapsing-flow roles using clip-only closure; CSS alone cannot establish flow participation in every case. |
| Intentional clip corners | Add inset round corners only when the clip itself needs rounding because the element's border radius still applies. | `inset(… round radius)`, `border-radius` | Not statically checkable: desired clip geometry is a visual decision. |
| Optional reveal travel | Gate the clip-path reveal animation by motion preference while preserving open/closed states outside it. | Clip/visibility transition, no-preference media query | Flag clip-path transitions outside the motion gate or visibility state definitions only inside it. |

## Scroll and viewport

### [Native carousel](https://good-css.com/#carousel-on-native-scroll) — `#carousel-on-native-scroll` · [specimen](https://good-css.com/specimen/carousel-on-native-scroll)

| Short rule | Rule in own words | CSS involved | Static violation detection |
| --- | --- | --- | --- |
| Browser-owned carousel | Use a real horizontal scroller and snapping rather than translating slides or intercepting wheel and touch input. | `display: flex`, `overflow-x: auto`, `scroll-snap-type: x mandatory`, child `flex: none`, `scroll-snap-align: start` | Flag transform/translate-driven track movement on configured carousel roles or missing native scroll/snap declarations; event interception is not statically checkable. |
| Matched snap gutter | Keep scroll padding equal to visual inline padding so snapped cards align with surrounding content. | `scroll-padding-inline`, `padding-inline` | Compare normalized values or shared token references and flag unequal literal/resolved values. |
| Hidden carousel scrollbar | Hide the native scrollbar in the demonstrated carousel while retaining real scroll behavior. | `scrollbar-width: none`, `overflow-x: auto` | For a configured scrollbar-free carousel, flag a missing scrollbar-width declaration or overflow hidden/clip used as a substitute. |
| Local boundary gesture | Contain horizontal overscroll so swiping at the carousel's end does not trigger page navigation. | `overscroll-behavior-x: contain` | Warn on configured carousels lacking horizontal containment. |
| Preference-aware smooth scroll | Put smooth scrolling behind permission for motion. | `scroll-behavior: smooth`, no-preference media query | Flag smooth scrolling outside a guaranteed no-preference branch. |
| Local scripted arrows | Move arrow-triggered scrolling with scrollBy so only the carousel scrolls and snapping chooses the landing position. | CSS scrolling/snap; JavaScript `scrollBy()` outside CSS | Not statically checkable: requires JavaScript. |
| Boundary-aware arrows | Give arrows accessible names and disable each one when there is no further content in its direction. | `:disabled`, HTML accessible names, JavaScript scroll bounds | Not statically checkable: requires markup and scroll-state logic. |
| Cross-browser controls | Retain scripted arrows where required browsers lack CSS-generated scroll buttons and markers. | `::scroll-button()`, `::scroll-marker` | Not statically checkable: requires browser targets and script/markup fallback; CSS-only controls can be flagged for review. |

### [Bounded middle scroller](https://good-css.com/#scroll-area-between-a-fixed-header-and-footer) — `#scroll-area-between-a-fixed-header-and-footer` · [specimen](https://good-css.com/specimen/scroll-area-between-a-fixed-header-and-footer)

| Short rule | Rule in own words | CSS involved | Static violation detection |
| --- | --- | --- | --- |
| Bounded column panel | Limit a flex-column panel's height so its middle region can actually overflow while the ends stay visible. | `display: flex`, `flex-direction: column`, `max-block-size: 80dvh` or height limit | Warn on configured panels lacking a block-axis height limit. |
| Demand-driven body scroll | Let the middle flex item consume remaining space and show a scrollbar only when needed. | `flex: 1`, `overflow-y: auto` | Flag `overflow-y: scroll` or missing body flex growth under this recipe. |
| Local gutter and containment | Reserve each inner scroller's own scrollbar space and stop scroll chaining to the page. | `scrollbar-gutter: stable`, `overscroll-behavior: contain` | Require both on configured panel-body selectors because a root gutter does not inherit. |
| Shrink intermediary wrappers | Give non-scrolling flex wrappers between the panel and body a zero block minimum so they do not push out the footer. | Wrapper `flex: 1`, `min-block-size: 0`, flex-column display | On configured intermediary roles, warn on missing zero minimum; do not require an unnecessary wrapper for direct body children. |
| Preserve fixed ends | Prevent fixed-height headers and footers from shrinking or size them through padding instead. | `flex: none`, `flex-shrink: 0`, height/block-size, padding | Flag configured fixed-size panel ends lacking nonshrink behavior. |
| No global zero block minimum | Keep zero minimum height scoped to necessary intermediaries instead of applying it to every element. | `* { min-height: 0 }`, `min-block-size: 0` | Flag universal/global zero block-axis minimum declarations. |
| Accept reserved width | Accept that a stable gutter consumes scrollbar width even when the list is short. | `scrollbar-gutter: stable` | Not statically checkable: tradeoff acceptance requires visual review. |

### [Overflow-conditioned styling](https://good-css.com/#styles-that-apply-only-when-a-scroller-overflows) — `#styles-that-apply-only-when-a-scroller-overflows` · [specimen](https://good-css.com/specimen/styles-that-apply-only-when-a-scroller-overflows)

| Short rule | Rule in own words | CSS involved | Static violation detection |
| --- | --- | --- | --- |
| Timeline as overflow switch | Use an otherwise inactive self-scroll timeline to apply an overflow-only state without a measurement observer. | `@keyframes`, `animation`, `animation-timeline: scroll(self inline)`, custom properties | Warn on configured overflow-state roles using unconditional fades instead of timeline-conditioned values; observer replacement requires JavaScript review. |
| Background-independent fade | Fade scroll content with a mask so the effect does not depend on matching the background color. | `mask-image: linear-gradient(…)` | Flag configured overflow-fade overlays using a hardcoded surface-color gradient as review candidates. |
| Edge-specific interpolation | Register start/end fade lengths and use different keyframe endpoints when only the edge with remaining content should fade. | `@property`, `<length>`, `initial-value: 0px`, start/end keyframes | Check configured directional-fade roles for typed properties and endpoint states; do not require this for the simpler both-edge overflow switch. |
| Timeline after shorthand | Declare the scroll timeline after the animation shorthand so the shorthand does not reset it. | `animation`, `animation-timeline` | Within a rule, flag a later animation shorthand following animation-timeline without a subsequent timeline restoration. |
| Nonoverflow default | Declare the normal custom-property value outside keyframes so the inactive timeline has a usable default. | Base `--fade: 0px`, keyframe custom properties | Resolve keyframe-assigned tokens and warn if no applicable base/default or registration initial-value exists. |
| Keywords also work | Use timeline-driven keyframes for discrete overflow-dependent values as well as interpolated numeric effects. | Custom-property keyframes, values such as `row-reverse` | Not statically checkable: choosing an overflow-dependent layout change is design intent. |
| Unfaded fallback | Keep ordinary scrolling usable without a replacement fade when scroll timelines are unsupported. | `overflow-x: auto`, `animation-timeline`, `mask-image` default | Flag a nonzero base fade that remains active without a timeline or fallback blocks removing scroll access; JS fallback policy requires review. |

### [Header-clearing anchors](https://good-css.com/#anchor-targets-that-clear-a-sticky-header) — `#anchor-targets-that-clear-a-sticky-header` · [specimen](https://good-css.com/specimen/anchor-targets-that-clear-a-sticky-header)

| Short rule | Rule in own words | CSS involved | Static violation detection |
| --- | --- | --- | --- |
| Native anchor offset | Offset document anchor scrolling with scroll padding rather than calculating target positions in script. | `html { scroll-padding-block-start: … }` | Warn on configured sticky-header documents with no root scroll-padding declaration; scripts and anchor presence are not statically checkable. |
| Offset for every preference | Keep the header offset outside the motion query and gate only smooth scrolling. | `scroll-padding-block-start`, `scroll-behavior`, motion media query | Flag an offset declared exclusively inside no-preference, or smooth behavior outside that gate. |
| Shared header dimension | Drive the header height and anchor offset from the same custom property. | Height/block-size, `scroll-padding-block-start`, `var()` | On configured header/root selectors, compare token references and warn on separate hardcoded dimensions. |

### [Desktop overscroll policy](https://good-css.com/#no-rubber-band-bounce-on-desktop) — `#no-rubber-band-bounce-on-desktop` · [specimen](https://good-css.com/specimen/no-rubber-band-bounce-on-desktop)

| Short rule | Rule in own words | CSS involved | Static violation detection |
| --- | --- | --- | --- |
| Root vertical suppression | Disable vertical overscroll on the root for desktop app-like pages with fixed UI. | `html { overscroll-behavior-y: none }` | Flag this policy applied only to body instead of html; determining whether a page needs it is not statically checkable. |
| Preserve horizontal history | Use the vertical longhand so horizontal swipe-to-navigate remains available. | `overscroll-behavior-y`, `overscroll-behavior-x`, shorthand | Flag root `overscroll-behavior: none` or `overscroll-behavior-x: none` under this policy. |
| Touch-inclusive restoration | Restore default vertical overscroll whenever any input is coarse so touch and hybrid devices retain pull-to-refresh. | `@media (any-pointer: coarse)`, `overscroll-behavior-y: auto` | Flag restoration using `pointer` instead of `any-pointer`, or root suppression lacking coarse-input restoration. |
| Contain inner scrollers | Give sheets, chat lists, and sidebars contained overscroll rather than canceling touchmove events. | Inner `overscroll-behavior: contain` | Warn on configured inner scrollers lacking containment; touchmove preventDefault use is not statically checkable. |

### [Safe-area content](https://good-css.com/#content-clear-of-the-notch) — `#content-clear-of-the-notch` · [specimen](https://good-css.com/specimen/content-clear-of-the-notch)

| Short rule | Rule in own words | CSS involved | Static violation detection |
| --- | --- | --- | --- |
| Edge-to-edge viewport | Add viewport-fit=cover before using safe-area padding for edge-to-edge mobile UI. | CSS `env(safe-area-inset-*)`; viewport meta outside CSS | Not statically checkable: requires document metadata. |
| Pad edge controls | Offset fixed headers, bottom bars, sheets, and similar edge UI with the corresponding safe-area inset. | `padding-block-start/end`, `env(safe-area-inset-top/bottom, 0px)` | For configured top/bottom edge roles, warn when padding lacks the corresponding inset; physical safe-area variables may need writing-mode mapping. |
| Add base spacing | Combine the safe-area inset with ordinary internal spacing when both are needed. | `calc(1rem + env(safe-area-inset-bottom, 0px))` | Warn only for configured additive-padding roles where env replaces rather than adds to the required base token. |
| Safe env fallback | Supply a zero-pixel fallback for a safe-area env call, especially inside arithmetic. | `env(…, 0px)`, `calc()` | Value AST: flag safe-area env functions inside calc without a second argument, and nonzero fallback values under this recipe. |
| No repeated normal padding | Do not add safe-area offsets to ordinary page content already protected by its padded header. | Safe-area env values, normal-flow content selectors | Flag env safe-area padding on configured ordinary-content roles; whether the header already protects them requires layout context. |

## Linked-page coverage

Read all 47 recipe specimens at `https://good-css.com/specimen/<recipe-anchor>` and their `.md` versions; `<recipe-anchor>` is the exact identifier listed in each recipe heading above. The `?panel=light` variants were included wherever linked, as were their canonical URLs. The two navigation fixtures for [cross-document transitions](https://good-css.com/specimen/cross-document-view-transitions?page=a) and [its destination](https://good-css.com/specimen/cross-document-view-transitions?page=b) were read. The specimens use the same recipe CSS as the main page and add no separate CSS recommendations.

The same-site source crawl attempted 145 distinct URLs: 141 returned HTTP 200, while fixture navigation targets `/docs`, `/overview`, `/pricing`, and `/reports/q3` returned HTTP 404. Those unavailable demo destinations contain no readable subpage to inventory. Query variants and alternate HTML/Markdown representations account for multiple URLs of the same content.

| Linked resource | Reading outcome |
| --- | --- |
| [About](https://good-css.com/about), [Markdown](https://good-css.com/about.md) | Describes the collection and recommends opening specimens independently to test another browser or phone; this is not statically checkable and involves the complete recipe CSS. |
| [Contact](https://good-css.com/contact), [Markdown](https://good-css.com/contact.md) | Recommends reporting incorrect techniques, specimen mismatches, missing credits, and proposed additions/removals with the entry and browser/version; this is not statically checkable and has no CSS mechanism. |
| [Privacy](https://good-css.com/privacy), [Markdown](https://good-css.com/privacy.md) | Describes the site's data handling and hosting; adds no CSS recommendations. |
| [Agent index](https://good-css.com/llms.txt) | Indexes every recipe, recommends using the existing authoring system rather than treating examples as a framework, and requests installation only on explicit user instruction. |
| [Complete Markdown](https://good-css.com/index.md), [llms-full](https://good-css.com/llms-full.txt) | Alternate representations of the complete recipe collection; all sections are covered above. |
| [Agent guidance](https://good-css.com/skills/good-css/SKILL.md) | Adds authoring/workflow/browser/motion guidance recorded in the relevant sections above. |
| [Foundations reference](https://good-css.com/skills/good-css/references/foundations.md) | Contains the six foundation recipes plus the additional reset exclusions recorded above. |
| [Layout reference](https://good-css.com/skills/good-css/references/layout.md) | Same eight layout recipes and conditions. |
| [Spacing reference](https://good-css.com/skills/good-css/references/spacing-and-shape.md) | Same four spacing/shape recipes and conditions. |
| [Text/media reference](https://good-css.com/skills/good-css/references/text-and-media.md) | Same five text/media recipes and conditions. |
| [Interaction reference](https://good-css.com/skills/good-css/references/interaction.md) | Same eight interaction recipes and conditions, including every recipe under `#interaction`. |
| [Motion reference](https://good-css.com/skills/good-css/references/motion.md) | Same six motion recipes and conditions. |
| [Show/hide reference](https://good-css.com/skills/good-css/references/show-and-hide.md) | Same four visibility recipes and conditions. |
| [Scroll/viewport reference](https://good-css.com/skills/good-css/references/scroll-and-viewport.md) | Same six scrolling/viewport recipes and conditions. |
| [Sitemap](https://good-css.com/sitemap.xml) | Confirms page inventory; adds no recommendations. |

### Agent-index usage recommendations

These process recommendations from the linked agent index do not belong to a CSS recipe, so they are kept here rather than presented as component-style lint rules.

| Short rule | Rule in own words | CSS involved | Static violation detection |
| --- | --- | --- | --- |
| Read appropriate representation | Read the skill and relevant references for application work, or the complete Markdown/individual entry for explanatory study. | Applicable recipe CSS; no process-specific property | Not statically checkable. |
| Examples are illustrative | Reuse the properties and values in the project's existing system without depending on the site's placeholder classes or treating the collection as a library. | Recipe declarations and selectors | Not statically checkable: class names alone cannot prove inappropriate reuse. |
| Explicit installation | Install the site's agent skill only when the user requests installation. | No CSS mechanism | Not statically checkable. |
| Inspect running specimen | Open a recipe specimen independently and inspect its source when assessing behavior across browsers or on a phone. | Complete recipe CSS | Not statically checkable: requires inspection/runtime evidence. |
| Useful correction report | Report a faulty technique or specimen with its identity, observed behavior, and browser/version, and identify incorrect credits or proposed list changes. | No CSS mechanism | Not statically checkable. |

The source repository identifies the material as [MIT licensed](https://github.com/vojtaholik/good-css/blob/main/LICENSE). All rule sentences here are paraphrases; CSS identifiers, anchor identifiers, formulas, and example values retain their technical spelling.
