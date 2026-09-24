# Show, don't tell: how MetalUI documents itself

A docs page earns trust by letting the reader see the detail and play with it, not by describing it. The model is two articles: Jakub Krehel's "Details that make interfaces feel better" and Gustavo Fior's "Tabular numbers". Each makes one point per demo, puts the wrong way next to the right way, and tells you exactly where to look.

## The pattern

Every idea on a page is one **beat**:

1. **One sentence of setup.** Name the problem in plain words. There is no preamble and no "In this section".
2. **The demo.** It's live and full-width, and it runs the real component, not a picture of it.
3. **A caption that directs the eye.** Start it with a verb: *Watch the edge*, *Drag the width*, *Click rapidly*, *Switch to Graphite*. It names the one thing to notice.
4. **The code**, collapsed by default, under the demo. It's the implementation, not the explanation.

Prose between beats stays at 60 words or fewer. If it takes more words to explain, the demo is wrong.

## Demo kinds

| Kind | Use it to show | Example in MetalUI |
|---|---|---|
| **Side by side** | a choice, with the wrong way labelled next to the right way | a flat fill vs the swatch recipe; `box-shadow` vs the raise stack; a proportional readout vs a tabular one |
| **Toggle** | one property switched on and off in place | the lip (text-shadow) on and off on an engraved label; the recipe layers turned on one at a time |
| **Scrub** | a continuous value | a width slider showing a label wrapping; the spring class slider showing overshoot; the radius nest calculator (outer = inner + padding) |
| **Replay** | motion, including how it behaves when interrupted | "Click rapidly": the Segmented thumb retargeting mid-flight vs a keyframe that restarts; hover lift on `settle` vs `object` |
| **Slow** | timing you can't see at full speed | a 0.25× toggle on every motion demo, and a frame strip of the spring curve |
| **Stress** | robustness | long labels, a 0 to 9999 count, 200 % text size, Reduce Motion, Increase Contrast, Graphite |
| **Anatomy** | how a recipe is built | explode the swatch or card into its layers (fill, sheen, top highlight, rim, glow, contact shadow, coloured shadow) and reassemble it |

### Inline: the sentence is the demo

Reference: shwn.design, where the words of a sentence are live objects. A styled phrase can be selected and restyled in place with a tiny toolbar. A word carries a small animated glyph. A name reveals itself on hover. MetalUI prose does the same with its own parts, so a reader meets the component inside the sentence that describes it:

- the word **engraved** is set as a real `Label` with its lip. Hover it and the lip toggles off, so you see what it adds;
- **settles** bounces once on hover, using the actual `settle` spring. **object** overshoots, using `object`;
- a **count** in a sentence ticks live in tabular figures. Toggle it to proportional and watch the words next to it shuffle;
- a colour name such as **ember** or **graphite** carries its swatch dot, and hovering it shows the value;
- a keyboard shortcut in a sentence, such as **⌘K**, is a real `Kbd`. Pressing the key on your keyboard presses the cap;
- a component name, such as **Chip**, renders the component inline at text size. Click it to jump to its page;
- a phrase set in a recipe can be selected, and a small `Toolbar` appears to switch its recipe or colorway in place.

Rules for inline demos:
- They are **metric-neutral:** nothing shifts the line's layout, the same rule MetalUI's cues follow.
- At most two or three per paragraph.
- Each one is keyboard-reachable, and shows what it does on focus as well as on hover.
- Each one is decorative-safe: turn motion off and the sentence still reads.

### Expressive on hover

Every inline part rewards the pointer, and the reward teaches something:
- **Label:** its layers peel apart (ink, lip, groove).
- **A spring word:** its curve draws under the word as it moves.
- **A swatch dot:** it opens into the full lit object.
- **A component name:** it renders the component, cycling through its states.

The hover shows the *why* in miniature, not a tooltip of text.

## Teach the craft: reading the docs is learning to build a design system

The docs don't just describe MetalUI. Every page also shows how the thinking went, so a reader leaves able to build their own system. Four devices do this:

**1. The decision beat.** Every non-obvious choice is shown as a decision, not a fact:
- *the naive version, live* (a flat grey fill; `transition: 200ms ease`; a one-off radius);
- *what goes wrong*, as a demo (it looks like a sticker, not an object; it snaps when interrupted; nested corners fight);
- *the decision* (a recipe with light, rim and contact shadow; a spring with mass; `outer = inner + padding`);
- *toggle between them*;
- *one line on the cost* of the decision (more layers to maintain; one more token to learn).

**2. The layer trail.** Every page shows which layer the thing belongs to (foundation, component, block) and walks down through it. A block page highlights its components. Each component page shows its recipe. Each recipe links to its tokens. The reader learns the architecture by moving through it.

**3. Rules with their reasons.** Each rule in MetalUI is stated once, with the failure it prevents shown live:
- one recipe per look: two slightly different greys drifting apart, side by side;
- no literals: the lint firing on a pasted hex, then the fix;
- neutral names: a product-named prop leaking into a reusable part;
- metric-neutral cues: text jumping when a tag pill appears.

**4. A learning path.** A short, ordered track on the home page, *Build a system with us*. Each step is a page with its own demo:
1. *Start from a material, not a palette.* One surface under one light; why every value follows from it.
2. *Name values once.* Tokens, colorways, and why Graphite is not an inverted Bone.
3. *Recipes.* Layers as data, and how one recipe feeds CSS and Swift.
4. *Motion has mass.* Spring classes from stiffness and damping, and interruption.
5. *Type as a system.* Roles, not sizes; tabular figures; the lip.
6. *Primitives and blocks.* Composition by slots; when custom is honest.
7. *Behaviour contracts.* Keys, focus and dismissal written once, implemented twice.
8. *Keeping it true.* Lints, recipe parity, pixel gates, neutral names. Why drift is a tooling problem, not a discipline problem.

The voice through all of this is a craftsperson showing their bench: this is what we tried, this is what broke, this is what we chose and what it cost.

## Every component and block page contains

1. **The hero:** the real component, interactive, in its most typical state. No prose above it except the name and one line.
2. **Its details,** each one a beat: the two to five things that make it feel right. Each is shown with a demo from the table above, and one of them is usually **Anatomy** for anything built from a recipe.
3. **States:** every state (rest, hover, focus, pressed, disabled, loading, error, empty, selected), live in a grid, plus a *Slow* toggle for the transitions between them.
4. **Colorways and access:** Bone and Graphite side by side. Reduce Motion, Increase Contrast and larger text are switchable in place.
5. **Composition:** for blocks, the parts are highlighted one at a time on hover ("this is a `Chip`"), with links to each component's page. For components, the blocks that use it.
6. **Platforms:** React and SwiftUI code tabs, and the Swift render shown next to the web render at the same size. They must look identical.
7. **Behaviour:** keys, focus and dismissal as a small keyboard you can press. The key lights and the component reacts.

## Voice

- Plain words, second person, present tense.
- Tell the reader what to do with their eyes and hands: *watch*, *drag*, *click*, *switch*.
- Name the detail, then show it. Never "delightful", "seamless", "beautiful". The demo decides whether it is.
- Numbers are real. "The thumb settles in 214 ms" is right; "quickly" is not.

## Enforcement (`npm run check:docs`)

- Every page under `apps/docs/src/pages/components/` and `blocks/` has a hero demo, at least two detail beats, a states grid, a colorway comparison and platform tabs. These are declared as data in the page (`beats: [{kind, caption}]`) so the check can read them.
- Every beat's `kind` is one of the demo kinds above. Every caption starts with a verb from the allowed list.
- No prose block between beats is longer than 60 words.
- Every motion demo has the *Slow* control. Every recipe-backed object has an **Anatomy** beat.
- Components with numbers (readouts, counts, scrubbers, timers) have a tabular-figures beat.
