# CSS habits

Every component inherits the same habits, so no component has to remember them. Each habit says how it is enforced; a habit with no check is a promise, not a rule. The habits were drawn from [good-css](https://good-css.com/) (inventory in [research/good-css.md](research/good-css.md)) and kept only where they fit Soft Hardware and a library that lives inside someone else's page.

`npm run lint:habits` (part of `npm run check`) compiles the package CSS exactly as it ships, then checks the habits marked *Linted* below against it. Existing breaks are listed in `scripts/lint-css-habits.allow.json` and only ever shrink: fix one, then `node scripts/lint-css-habits.mjs --ratchet`. A new break fails the check.

Read [CSS_SYSTEM.md](CSS_SYSTEM.md) for tokens, layout and cascade, and [PERFORMANCE.md](PERFORMANCE.md) for what may animate.

## Interaction

1. **Hover only where a fine pointer can hover.** A hover look applies inside `@media (hover: hover) and (pointer: fine)`. On touch a tap leaves `:hover` stuck on until the next tap elsewhere, so a key that was pressed keeps looking hovered. Pressed feedback (`:active`, `[data-pressed]`) is never gated: it is the touch user's only feedback. The x-ray's `[data-preview=hover]` is not a hover and is not gated, and a hover inside `:not()` is the rest state, which is true on touch, so it stays ungated too.
   In a component's classes write `pointer-hover:` (and `group-pointer-hover/<name>:`), never `hover:`: Tailwind's `hover:` checks only `(hover: hover)`, and redefining it would change the host's own hovers. In a recipe in `tokens.json`, wrap the hover rule in `@media (hover: hover) and (pointer: fine) { … }`; when a selector list mixes hover with focus or preview, split it so only the hover branch is gated.
   *Linted:* `hover-gate`. *Slice:* `e2e/hover-pointer.spec.ts` rests a mouse and a finger on the same controls.
2. **Focus is an outline.** The ring is `focus-ring` / `focus-ring-flush` (an `outline`), never a `box-shadow`, so Windows forced-colors mode can repaint it. A recipe that sets `outline: none` sets an outline again on `:focus-visible` (or `:focus-within` for a field shell) in the same recipe.
   A key that shows focus as a fill (a row, a strip key) still carries a ring: compose its focus look with `focus-ring-forced`, a transparent outline inside the edge that only forced colors paints (`row-list-focus`, `row-panel-focus`, `row-option-focus`, `button-strip-focus`). A shadow on a `::before`/`::after` is that layer's own and is not checked.
   *Linted:* `focus-outline`. *Slice:* `e2e/focus-forced-colors.spec.ts`.
3. **Inner scrollers keep their scroll.** Anything that scrolls on its own (popups, lists, sheets, panes) sets `overscroll-behavior: contain`, so reaching its end does not scroll the page behind it. In Tailwind, an `overflow-*-auto` has an `overscroll-*` beside it in the same class string; the lint reads the class strings for that.
   *Linted:* `overscroll-contain`. *Slice:* `e2e/scroll-contain.spec.ts`.
4. **Text inputs never make iOS zoom.** A text entry is at least 16px on a coarse pointer. Safari zooms the page into any smaller input on focus and leaves it zoomed. Every entry carries `text-entry`, which lifts it to 16px on a coarse pointer only (a doubled class, so it outranks the entry's type role); desktop sizes stay as designed.
   *Slice:* `e2e/entry-zoom.spec.ts` sweeps the pages with entries on a touch phone for any focusable entry under 16px.
5. **Changing numbers hold their width.** Counters, readouts, timers, prices and table numbers use `tabular-nums` or a mono role (`type-readout`, `type-figure`, `type-stat` and the label readout already do); prose does not, so a numeric cue's inline number stays proportional while its scrub scale is tabular.
   *Review:* whether a number changes is meaning, not syntax.

## Motion

6. **Timing comes from the motion language.** Durations and curves are `--mu-spring-*`, `--mu-ease-*` or a recipe token from `tokens.json`, never a literal like `.16s ease` or `cubic-bezier(...)` in a recipe. Reduced motion, the low-power switch and Swift parity all hang off those tokens; a literal opts out of all three. A recipe's own fade or press time is a prop (`select.veil.fade` → `--mu-r-select-veil-fade`); an LED gesture's timing is `--mu-led-<gesture>-d` / `-ease`. A zero delay is not a timing and is not checked.
   *Linted:* `motion-tokens`.
7. **Name what transitions.** No `transition: all` and no `transition-property: all`.
   *Linted:* `transition-all`.
8. **Nothing starts slow.** No `ease-in`: a response to the person's hand begins at once.
   *Linted:* `ease-in`.
9. **Only transform and opacity animate.** See [PERFORMANCE.md](PERFORMANCE.md) rule 4.
   *Linted:* `npm run lint:transitions`.

## Layout

10. **Inline sides are logical.** Use `margin-inline-*`, `padding-inline-*`, `inset-inline-*` (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-` in Tailwind), never `left`/`right` sides, so a right-to-left page mirrors. A pair of equal sides is `inset-inline` / `inset-x-*`. A four-value `padding`, `margin` or `inset` whose right and left differ is physical too; write `*-block` and `*-inline`. Block sides (`top`, `bottom`) are not checked, and centring on the middle (`left: 50%`, `calc(50% …)`, `left-1/2`) reads the same either way. Geometry that is truly physical stays in the allowlist as reviewed: layers placed by pointer or SVG coordinates (brush cursor, snap guides, dial, connector, perfect preview, time scrubber), the compass edges of a selection frame, a vertical slider's column, and sweeps that travel in screen space (loading underline, indeterminate progress).
    *Linted:* `logical-inline`. *Slice:* `e2e/inline-direction.spec.ts` mirrors a field on a right-to-left page.
11. **Viewport height is dynamic or small.** `dvh` for something that follows the mobile toolbar, `svh` for a minimum, never `vh`.
    *Linted:* `viewport-units`.
12. **Safe-area insets have a fallback.** `env(safe-area-inset-*, 0px)`, added to the recipe's own padding, never replacing it.
    *Linted:* `safe-area-fallback`.
13. **Stacking comes from named layers.** A literal `z-index` above 1 is an accident waiting for a collision. Stacking within a recipe uses 0 and 1 or `isolation: isolate`; anything higher is a `z` prop on the recipe (`--mu-r-menu-self-z`, `--mu-r-folder-flap-z`), read through a `z-<recipe>-z` utility, so every layer in the system is named in `tokens.json` beside the others.
    *Linted:* `z-index`.
14. **Clip decoration, do not hide it.** `overflow: clip` for cutting off decoration; `hidden` creates a scroll container that breaks `position: sticky` inside it and can be scrolled by script. In Tailwind write `overflow-clip`. Keep `hidden` only where a box is measured or its height animates and needs its own formatting context (accordion panel, combobox fit, form-field error, navigation popup and viewport, scroll-area root: reviewed in the allowlist), or beside a scrolling axis, where it computes the same. Tailwind's `truncate` and `sr-only` stay as they are.
    *Linted:* `overflow-clip`.

## Text

15. **Short titles balance.** Dialog, sheet, empty-state and alert titles use `text-wrap: balance`. The package sets no global text rules (host safety), so this lives on the title's classes: a named title (`mu-*-title`) carries `text-balance` unless it is a single-line policy (truncate, nowrap, clamp).
    *Linted:* `title-balance`.
16. **Every piece of a person's text has an overflow policy.** Wrap, truncate on one line (`nowrap` + `overflow` + `text-overflow: ellipsis` on the element holding the text, with `min-width: 0` on every flex parent), or clamp. Truncate only when the full text is reachable elsewhere. An ellipsis states its whole policy in one class string: `text-ellipsis` beside `whitespace-nowrap` and `overflow-clip`.
    *Linted:* `ellipsis-complete` (the ellipsis). *Review:* that the full text is reachable.

## Adding a habit

Add it here first with its reason and how it is enforced, then teach `scripts/lint-css-habits.mjs` the check with a rule id matching the *Linted* tag, then `--ratchet` once to record what exists today. Fix existing breaks one habit at a time, each its own commit, verified in both colorways.
