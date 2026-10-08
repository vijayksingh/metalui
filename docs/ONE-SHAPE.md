# One shape, many states

When a thing changes what it shows, it is one shape that changes. A capsule opening into a panel, a trigger becoming its popover, a row becoming its detail, a bar winding into a dial, a chip becoming a card: the person must see the same object become the next thing, never a second object appear beside the first. This is a load-bearing principle for every MetalUI component and every product built on MetalUI.

Each rule is tagged with its origin, as `MORPH.md` does. The idea that a morphing shape is two nested boundaries (an outline that travels and contents that change inside it) was shown to us by Morph UI's Dynamic Island. *(Adapted: that idea; Ours: everything below. Never copy another library's code, classes or values; learn the idea and build it from our own language.)*

## 1. The rule

1. **The outline morphs.** The shape's size, position and corner radius travel from the old state to the new one on one spring. Corners stay true the whole way; nothing stretches, nothing is scaled to fake a size.
2. **The contents change inside it, the way a MetalUI surface arrives.** The arriving contents rise one nest (`--mu-motion-nest`) from the edge the body grows from, at the popover's enter scale, on the part spring, clipped by the moving outline. The leaving contents fade on the release spring and do not travel. *(Ours: the popover's arrival.)*
3. **One thing on screen.** The trigger does not stay behind while a panel hangs off it. The trigger *is* the panel's closed state.
4. **Interrupts start from now.** A new state change during a morph starts from the frame on screen.
5. **Closing is quicker than opening** (the release spring), and goes back into the exact shape it came from; focus returns to it.
6. **Reduced motion:** every travel scales by `--mu-travel-surface`, which is 0 under Reduce Motion, so only the fades remain. *(Ours: the travel multipliers.)*

## 2. The mechanism (web)

The platform's View Transitions API, used directly: every shape carries its `view-transition-name` and `view-transition-class` at all times, and `morphTo` starts the transition and commits the change inside it with `flushSync`, typed `open` or `close`. Nothing waits on another render, and no other render (a focus move, a tooltip, an effect) can cancel a morph. (React's own `<ViewTransition>` was tried first: it holds commits behind running transitions and skips a transition when anything else renders, which dropped quick keyboard input.) MetalUI wraps it so no component writes it by hand: `MorphShape`, `MorphPart` and `morphTo()` in `packages/metalui/src/motion/morph-shape.tsx`, and the `mu-morph-*` rules in the `morph-shape` recipe (`tokens/tokens.json`, `$rules`).

| | Boundary | What it does |
|---|---|---|
| M1 | **Body** (`mu-morph-body`, `mu-morph-<material>`) | Names the shape. Its `::view-transition-group` is painted in the shape's own material (background, shadow, radius: graphite-deep, the tool cap, pop) while the body's snapshots are hidden, so the platform moves a true outline and nothing is stretched. |
| M2 | **Contents** (`mu-morph-contents`, `mu-morph-from-top` / `-left`) | Inside the body, clipped by it. Arriving: one nest from the growing edge at the popover's enter scale, part spring. Leaving: a fade on the release spring. The contents keep their size, pinned to the edge the body grows from. |
| M3 | **Shared name** | When the closed and open states are different elements (a button and a dialog), both render under the same `name` with `share`, and only one exists at a time. React pairs them. |
| M3b | **Parts that stay** (`MorphPart`) | A part present in both states (the capsule's own row inside its panel) gets its own named group and travels on the body's spring instead of dissolving, so it never ghosts. |
| M3c | **Contents replaced** | The contents are one named group, so whatever replaces them (a panel's second page) leaves and arrives inside the body, even when the outline does not change. |
| M4 | **Start** | Every state change goes through `morphTo(update, kind?)`: it finishes a running morph (`skipTransition`), then `document.startViewTransition({ update: () => flushSync(update), types: [kind] })`; `close` takes the release spring through `:active-view-transition-type(close)`. |
| M4b | **After it lands** (`afterMorph`) | Focus moves, tooltips and anything else that follows a morph run once it has landed. A render scheduled while the morph is starting makes React skip it. |
| M4b′ | **Focus comes back only to nothing** (`returnFocusAfterMorph`) | When a morph lands, focus returns to its trigger only if nothing else has taken it since (a dialog it opened, a control the person moved to). |
| M4c | **Fold on the outside click, not the press** | Starting a morph holds the page for a frame; on a press, the click that follows is lost. Folding on the click lets what was clicked act first. |
| M5 | **Timing** | Our springs, never ad hoc: the body opens on the part spring (most of the way in a third of its time, a small give; the surface spring read as lag); `close` rides the release spring; durations scale by `--mu-travel-surface`. **One spring per morph:** the body, its contents and its parts always share the spring and duration, or the inside drifts against the outline (a shake). |
| M5b | **The page holds still** | `:root { view-transition-name: none }`: only the named shapes move; the page never cross-fades behind them. |
| M6 | **Fallback** | Without View Transitions the state simply changes. No polyfill, no JS-driven size animation to imitate it. |

**SwiftUI.** `MetalMorphShape` and `withMetalMorph(_:reduceMotion:)` in `swift/Sources/MetalUI/Foundation/MetalMorphShape.swift` are the same primitive. The body is one view in every state, never an if/else between a closed and an open view (two bodies swap: the shape flips instead of travelling). Its size follows its layout inside one transaction, its outline is one `RoundedRectangle` whose radius travels with it and paints the material (graphite-deep, tool), and it clips its contents. The part in both states (the capsule's row) is the same view and moves with the layout. Arriving contents take `.metalMorphContents(from:reduceMotion:)` (one nest from the growing edge at the popover's enter scale, fading in); leaving ones fade. `withMetalMorph(.open)` rides the part spring and `.close` the release spring, shared by the body, its contents and its parts. A page that replaces the contents gives each page its own `id` and the same transition.

**Springs are the tokens' physics on both platforms.** `MetalSpring.animation` is `.spring(response: 2π/√k, dampingFraction: c/2√k)` from the token's stiffness and damping, the same spring the web samples into `linear()`. Core Animation takes the same `response` and `dampingFraction`. Never substitute an Apple preset: the motion would differ from the web and lose the part spring's give.

For the bar ↔ dial, interpolate `MetalDial`'s curl through `Animatable` geometry on the surface spring (it is a slow wind, not an opening): the curve, marks, ticks, knob position and disc diameter come from the same fraction. A path is redrawn while winding, rather than stretching a snapshot or animating a CSS box. No clock runs at rest; Reduce Motion resolves the curl immediately. `MetalTimeScrubber` hands the bar to this curve at curl 0, then restores the bar's slider only after unwinding reaches 0, preserving its existing jump spring and the host's bound moment.

## 3. Never

- A clip-path, `scaleX`/`scaleY` or FLIP stretch to fake a size change on a rounded shape. (The first Island did this; it was wrong.)
- A popover, dropdown or menu that hangs off a trigger when the trigger can become the panel.
- Animating `width`, `height`, `top` or `left` with a CSS transition or JS frames.
- Mounting or unmounting content with no transition.
- A component's own bespoke morph code. Use `MorphShape` / `morphTo()`; if they can't do it, extend them.

## 4. Where it applies

Every component whose closed and open states are one object: Island, Popover-from-trigger, Fan trays, Select, the time scrubber (bar ↔ dial), cards that open to detail, toasts that grow into their action. A new component that changes shape is reviewed against this page before it ships.
