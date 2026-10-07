# One shape, many states

When a thing changes what it shows, it is one shape that changes. A capsule opening into a panel, a trigger becoming its popover, a row becoming its detail, a bar winding into a dial, a chip becoming a card: the person must see the same object become the next thing, never a second object appear beside the first. This is a load-bearing principle for every MetalUI component and every product built on MetalUI.

Reference: Morph UI, "Dynamic Island" and "Morphing Popover" (morph-ui.anmol16.workers.dev). *(Adapted: the nested-boundary pattern; Ours: the tokens, the rules, the fallbacks.)*

## 1. The rule

1. **The outline morphs.** The shape's size, position and corner radius travel from the old state to the new one on one spring. Corners stay true the whole way; nothing stretches, nothing is scaled to fake a size.
2. **The content dissolves inside it.** The old content leaves and the new arrives inside the moving outline, clipped by it, with a small reveal (scale .92 → 1) anchored where the shape grows from (the top for anything that drops down).
3. **One thing on screen.** The trigger does not stay behind while a panel hangs off it. The trigger *is* the panel's closed state.
4. **Interrupts start from now.** A new state change during a morph starts from the frame on screen.
5. **Closing is quicker than opening** (the release spring), and goes back into the exact shape it came from; focus returns to it.
6. **Reduced motion:** no travel. The old and new cross-dissolve in 150 ms.

## 2. The mechanism (web)

The View Transitions API, through React's `<ViewTransition>` (React 19.2+), with two nested boundaries. MetalUI wraps it so no component writes it by hand: `MorphShape` and `morphTo()` in `packages/metalui/src/motion/morph-shape.tsx`, and the `mu-vt-*` rules in the `morph-shape` recipe (`tokens/tokens.json`, `$rules`).

| | Boundary | What it does |
|---|---|---|
| M1 | **Shell** (`mu-vt-shell`) | Names the shape. Its `::view-transition-group` paints the surface (the material's background and radius); the old and new snapshots of the shell are hidden. The browser animates the group's box, so the outline travels and the corners stay round. |
| M2 | **Content** (`mu-vt-reveal`, `mu-vt-top`) | Inside the shell, clipped (`overflow: clip` on the group and image pair, at the shell's radius). Old content dissolves out (150 ms), new dissolves in (210 ms) with the reveal scale, pinned to the top. |
| M3 | **Shared name** | When the closed and open states are different elements (a button and a dialog), both render under the same `name` with `share`, and only one exists at a time. React pairs them. |
| M3b | **Parts that stay** (`MorphPart`) | A part present in both states (the capsule's own row inside its panel) gets its own named group and travels on the shell's spring instead of dissolving, so it never ghosts. |
| M4 | **Start** | Every state change goes through `morphTo(update, type?)`: it skips a running transition (`document.activeViewTransition?.skipTransition()`), then `startTransition`, adding the transition type (`close` takes the release spring). |
| M5 | **Timing** | Our springs, never ad hoc: the shell rides the surface spring (`--mu-spring-surface`, `-d`); `close` rides the release spring. |
| M5b | **The page holds still** | `:root { view-transition-name: none }`: only the named shapes move; the page never cross-fades behind them. |
| M6 | **Fallback** | Without View Transitions the state simply changes. No polyfill, no JS-driven size animation to imitate it. |

SwiftUI: `matchedGeometryEffect` on the shell and a `.transition(.opacity.combined(with: .scale(0.92)))` on the content, inside one `withAnimation(.metalSurface)`.

## 3. Never

- A clip-path, `scaleX`/`scaleY` or FLIP stretch to fake a size change on a rounded shape. (The first Island did this; it was wrong.)
- A popover, dropdown or menu that hangs off a trigger when the trigger can become the panel.
- Animating `width`, `height`, `top` or `left` with a CSS transition or JS frames.
- Mounting or unmounting content with no transition.
- A component's own bespoke morph code. Use `MorphShape` / `morphTo()`; if they can't do it, extend them.

## 4. Where it applies

Every component whose closed and open states are one object: Island, Popover-from-trigger, Fan trays, Select, the time scrubber (bar ↔ dial), cards that open to detail, toasts that grow into their action. A new component that changes shape is reviewed against this page before it ships.
