# Show, don't tell: how MetalUI documents itself

A docs page earns trust by letting the reader see the detail and play with it, not by describing it. The model is two articles: Jakub Krehel's "Details that make interfaces feel better" and Gustavo Fior's "Tabular numbers". Each makes one point per demo, puts the wrong way next to the right way, and tells you exactly where to look.

This file is the writing standard for one page. The site around it (sections, URLs, page templates, the placement map, the learning path, the data schema and the `check:docs` gate) is `docs/DOCS_ARCHITECTURE.md`; where the two overlap, that document wins. Showing never displaces reference: the API, slots, states, keyboard contract, tokens and both platforms' code are generated sections with fixed anchors on every page, and the beats below sit beside them, never instead of them.

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
| **Replay** | motion, including how it behaves when interrupted | "Click rapidly": the Switcher thumb retargeting mid-flight vs a keyframe that restarts; hover lift on `settle` vs `object` |
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

Rules for inline demos (the full set is in `DOCS_ARCHITECTURE.md` §4):
- It **reads as a word first.** With motion off, hover unavailable, or in the copied Markdown, the sentence is complete. The reveal adds; it never carries information alone.
- **Metric-neutral:** its box at rest equals a plain span's; reveals sit outside flow; nothing on the line moves.
- **Density:** at most three per paragraph and one per sentence.
- **Keyboard:** focusable, with a role and a name; Enter and Space do what hover does; Escape restores rest.
- **Motion off:** the reveal becomes a static comparison; nothing loops or autoplays.
- **One kind per word:** a live part or a link, never both.
- **Copyable:** a token or colour part copies its CSS name on click.
- **Never in reference:** ledes, beat setup sentences and chapter prose only; not in API, tokens, keyboard or states tables, captions, code, nav, search or the agent surfaces.

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

**4. A learning path.** An ordered track at `/learn`, *Build a system*, eight chapters, each built around one live demo and linked both ways into the reference pages it walks through: material · tokens · recipes · motion · type · composition · contracts · keeping-true. The chapter table, demos and links are in `DOCS_ARCHITECTURE.md` §5. A chapter never holds a value, rule or name the reference doesn't.

The voice through all of this is a craftsperson showing their bench: this is what we tried, this is what broke, this is what we chose and what it cost.

## Every component and block page contains

The fixed section order is `DOCS_ARCHITECTURE.md` §3. In short, and in this order:

1. **Head:** name, one line, status, the layer trail, and a spec strip of jump links (import line, props, states, keys, tokens).
2. **The hero:** the real component, interactive, in its most typical state, beside its usage snippet (React and SwiftUI, both in the DOM). Above the fold. A DialKit panel may tune it; the caption reads the dials.
3. **Its details,** each one a beat: the two to five things that make it feel right. At least one is a **decision beat**; anything built from a recipe has an **Anatomy** beat; motion has a **Replay** with Slow.
4. **States:** every state (rest, hover, focus, pressed, disabled, loading, error, empty, selected), live in a labelled grid, plus a *Slow* toggle for the transitions between them.
5. **Variants** (optional): sizes and caps outside the grid, with the Swift capture beside the web render at the same size.
6. **Colorways and access:** Bone and Graphite side by side. Reduce Motion, Increase Contrast and larger text are switchable in place.
7. **Composition:** for blocks, the parts are highlighted one at a time on hover ("this is a `Chip`"), with links to each component's page. For components, the blocks that use it. Generated from `meta.json` `uses`.
8. **Keyboard:** keys, focus and dismissal as a small keyboard you can press, beside the generated table. The key lights and the component reacts.
9. **API**, **Tokens**: generated from `meta.json` `contract`; never collapsed, never tabbed.
10. **Platforms:** React, CSS, SwiftUI and the agent guide as full source; the Swift render next to the web render at the same size. They must look identical.
11. **Rules** with their reasons, each linked to the beat that shows the failure; then **Related** (previous/next, patterns, the learning chapter).

## Voice

- Plain words, second person, present tense.
- Tell the reader what to do with their eyes and hands: *watch*, *drag*, *click*, *switch*.
- Name the detail, then show it. Never "delightful", "seamless", "beautiful". The demo decides whether it is.
- Numbers are real. "The thumb settles in 214 ms" is right; "quickly" is not.

## Enforcement (`npm run check:docs`)

The full gate is `DOCS_ARCHITECTURE.md` §6: a static half over the page data (`<name>.doc.ts`, `meta.json` `contract`, `agent.md`) and a rendered half in Playwright. The teaching rules it holds a page to:

- Every component and block page has a hero with its snippet, two to five beats (three to six on a chapter), at least one decision beat, a states grid, a colorway comparison, a keyboard section and platform source. Beats are declared as data (`beats: [{ id, kind, caption, slow?, refs }]`) so the check can read them.
- Every beat's `kind` is one of the demo kinds above. Every caption starts with a verb from the allowed list. Every `refs` entry resolves to a contract row or a rule.
- No prose block between beats is longer than 60 words (measured on the rendered page).
- Every motion demo has the *Slow* control and stops under the Motion switch. Every recipe-backed object has an **Anatomy** beat.
- Components with numbers (readouts, counts, scrubbers, timers) have a tabular-figures beat.
- Inline parts: at most three per paragraph and one per sentence; focusable and named; metric-neutral under hover (measured); the sentence text unchanged under reduced motion; none inside a reference section.
- Nothing is hover-only: every revealed value also exists as text in the DOM.

The reference half (props equal the exported type, slots equal the compound parts, keyboard and a11y present, tokens and recipes exist, both snippets compile, the Swift capture exists, generated tables fresh) fails the same command.
