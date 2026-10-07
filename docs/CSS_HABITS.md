# CSS habits

Every component inherits the same habits, so no component has to remember them. Each habit says how it is enforced; a habit with no check is a promise, not a rule. The habits were drawn from [good-css](https://good-css.com/) (inventory in [research/good-css.md](research/good-css.md)) and kept only where they fit Soft Hardware and a library that lives inside someone else's page.

`npm run lint:habits` (part of `npm run check`) compiles the package CSS exactly as it ships, then checks the habits marked *Linted* below against it. Existing breaks are listed in `scripts/lint-css-habits.allow.json` and only ever shrink: fix one, then `node scripts/lint-css-habits.mjs --ratchet`. A new break fails the check.

Read [CSS_SYSTEM.md](CSS_SYSTEM.md) for tokens, layout and cascade, and [PERFORMANCE.md](PERFORMANCE.md) for what may animate.

## Interaction

1. **Hover only where a fine pointer can hover.** A hover look applies inside `@media (hover: hover) and (pointer: fine)`. On touch a tap leaves `:hover` stuck on until the next tap elsewhere, so a key that was pressed keeps looking hovered. Pressed feedback (`:active`, `[data-pressed]`) is never gated: it is the touch user's only feedback. The x-ray's `[data-preview=hover]` is not a hover and is not gated.
   *Linted:* `hover-gate`.
2. **Focus is an outline.** The ring is `focus-ring` / `focus-ring-flush` (an `outline`), never a `box-shadow`, so Windows forced-colors mode can repaint it. A recipe that sets `outline: none` sets an outline again on `:focus-visible` (or `:focus-within` for a field shell) in the same recipe.
   *Linted:* `focus-outline`.
3. **Inner scrollers keep their scroll.** Anything that scrolls on its own (popups, lists, sheets, panes) sets `overscroll-behavior: contain`, so reaching its end does not scroll the page behind it.
   *Linted:* `overscroll-contain`.
4. **Text inputs never make iOS zoom.** A text entry is at least 16px on a coarse pointer. Safari zooms the page into any smaller input on focus and leaves it zoomed.
   *Promise:* no check yet.
5. **Changing numbers hold their width.** Counters, readouts, timers, prices and table numbers use `tabular-nums`; prose does not.
   *Review.*

## Motion

6. **Timing comes from the motion language.** Durations and curves are `--mu-spring-*`, `--mu-ease-*` or a recipe token from `tokens.json`, never a literal like `.16s ease` or `cubic-bezier(...)` in a recipe. Reduced motion, the low-power switch and Swift parity all hang off those tokens; a literal opts out of all three.
   *Linted:* `motion-tokens`.
7. **Name what transitions.** No `transition: all` and no `transition-property: all`.
   *Linted:* `transition-all`.
8. **Nothing starts slow.** No `ease-in`: a response to the person's hand begins at once.
   *Linted:* `ease-in`.
9. **Only transform and opacity animate.** See [PERFORMANCE.md](PERFORMANCE.md) rule 4.
   *Linted:* `npm run lint:transitions`.

## Layout

10. **Inline sides are logical.** Use `margin-inline-*`, `padding-inline-*`, `inset-inline-*` (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-` in Tailwind), never `left`/`right` sides, so a right-to-left page mirrors. Block sides (`top`, `bottom`) are not checked. A drawing whose geometry is truly physical (an LED in a key's corner that must not mirror) stays in the allowlist with that reason in review.
    *Linted:* `logical-inline`.
11. **Viewport height is dynamic or small.** `dvh` for something that follows the mobile toolbar, `svh` for a minimum, never `vh`.
    *Linted:* `viewport-units`.
12. **Safe-area insets have a fallback.** `env(safe-area-inset-*, 0px)`, added to the recipe's own padding, never replacing it.
    *Linted:* `safe-area-fallback`.
13. **Stacking comes from named layers.** A literal `z-index` above 1 is an accident waiting for a collision; overlays use the popup layer Base UI gives them, and stacking within a recipe uses 0 and 1 or `isolation: isolate`.
    *Linted:* `z-index`.
14. **Clip decoration, do not hide it.** `overflow: clip` for cutting off decoration; `hidden` creates a scroll container that breaks `position: sticky` inside it and can be scrolled by script. Keep `hidden` only where a scroll container is wanted.
    *Linted:* `overflow-clip`.

## Text

15. **Short titles balance.** Dialog, sheet, empty-state and alert titles use `text-wrap: balance`. The package sets no global text rules (host safety), so this lives on the title recipe.
    *Review.*
16. **Every piece of a person's text has an overflow policy.** Wrap, truncate on one line (`nowrap` + `overflow` + `text-overflow: ellipsis` on the element holding the text, with `min-width: 0` on every flex parent), or clamp. Truncate only when the full text is reachable elsewhere.
    *Review.*

## Adding a habit

Add it here first with its reason and how it is enforced, then teach `scripts/lint-css-habits.mjs` the check with a rule id matching the *Linted* tag, then `--ratchet` once to record what exists today. Fix existing breaks one habit at a time, each its own commit, verified in both colorways.
