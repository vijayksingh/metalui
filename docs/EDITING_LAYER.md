# The editing layer: x-rays you handle, not slide

Every x-ray has a bench (the tilted model and its callouts: how the component is built) and a card. The card holds a **specimen**: the real component, changed by handling it. The model on the bench reads the same values, so every change shows in both places. There are no sliders in an x-ray card.

The Button x-ray is the finished reference: `apps/docs/src/ui/xray/ButtonXray.tsx` with its cards in `apps/docs/src/ui/xray/ButtonSpecimens.tsx`, built on the shared layer in `apps/docs/src/ui/edit/` (`index.tsx`, `edit.css`). Its feature slice is `e2e/xray-editing.spec.ts`. Read all four before you start another x-ray.

This extends `docs/WORKBENCH_PATTERN.md` and wins where they differ.

## The rules

The owner settled these over many rounds. Each one replaced something that was tried and rejected; the rejected version is in brackets. Check every card against all eight before showing it.

1. **No sliders, no control panel.** A value changes by handling the specimen (its edges, a corner, its label, its thumb, press and pull) or the model. A readout may step or toggle a value. [A column of sliders and switchers beside the model.]
2. **What comes in steps snaps, never scales.** Sizes, states, kinds and weights: the component is only ever one of its real options. A drag builds a *lean* (the target's outline or ghost lights up, the tag reads "→ compact"), then snaps. The component itself never stretches on the way. [A "give" that stretched the button a few points before it clicked over; it read as free scaling.]
3. **What is tunable moves freely and catches on its tokens.** Padding, corners, spacing, depth. A value landing on a token gets a blip and a lit LED. A readout step is never caught, so it can step past a token.
4. **Show only what is pointed at.** On the component: its main handles, faint (top line, right end, corner arc). On a handle or its readout: that one handle only. The mirrors (bottom, left) still work but are not drawn. [The whole outline, the content box and a green hatch at once.]
5. **How-to lives outside the component.** A hint tag in the tooltip's look sits above the component, never on it: a gesture glyph, the property, a short "how" and modifier keycaps. While you drag it becomes the live value; a held modifier lights its keycap. [A tag that followed the pointer and covered the label.]
6. **Readouts:** a small sunk well, an engraved label, value and unit, an LED lit when the value sits on a token. No token names on screen (they go to the screen reader). Hover a readout to light its handle, click to hand that handle the keyboard, drag up or down (or ↑↓) to step the value; the digits roll. Toggles are not readouts: a set of on/off things is a list of `Row`s with `Switch`es. [Pale green pills saying "· default"; layer pills nobody could tell were toggles.]
7. **Never fake a variant.** Offer only what the component really has. Only the standard `Button` cap has a compact size, so a primary button gets no size handle. A switch is always a pill, so it gets no corner handle. If the model holds a value that is not a real option (the Button page's workbench can set 34), show it truthfully with the LED off. [A compact primary button made by overriding the height.]
8. **Motion and look.** Nothing moves under the finger. A snap rides the part spring and a let-go the release spring; reduced motion does both at once. Handles are hairlines in `--mu-presence-guide` (`--green-deep` on light graphite parts), heavier on top and right. The leader lines run under the model.

Words: plain sentences. Say what the part is, then what to drag. [Lines like "its outline is the handles, and the model above follows".] A control has one name everywhere: the card, the tag and the readout.

## The shared layer (`apps/docs/src/ui/edit`)

| Export | What it is |
|---|---|
| `HintLayer` | Wrap the x-ray in it; it renders the hint tag. |
| `useHandle(opts)` | Spread its result on a handle element. It covers drag (in the specimen's units: pass `zoom`), arrows (`step(d, e)`, `axis`), the tag (`hint`, `keyHint`), `over` (hover or focus) and `grab`. Give the element `role="slider"`, `tabIndex`, `aria-label` and value attributes. Put `data-hint-anchor` on the component's box so the tag rides above it. |
| `Outline`, `CornerArc` | The component's own edge and corner, drawn as hairline handles. Pass `on` (lit) and `only` (shown). |
| `Readout` | `label value unit snap peek pick scrub`. `scrub(dir)` steps the value; `peek` lights the handle; `pick` focuses it (`summon`) or steps a discrete value. |
| `useStepMotion`, `STEP_AT` | The lean-then-snap motion for a stepping value. |
| `snapTo`, `clamp`, `blip`, `useOnLand` | Catch on tokens; pulse a stroke when a value lands. |
| `useSpecimenZoom` | Returns `[wellRef, zoom]`: 2× in a wide card, 1.5× in a narrow one (a phone, or the x-ray's 320 px column). |

Class names start with `ed-`. The specimen sits in `.ed-specimen`; readouts in `.ed-readouts`; a switch list in `.ed-layers`.

## Converting one x-ray

Do one x-ray at a time. Finish, test and commit it before the next.

1. **List its real options** from the component's props, `tokens/tokens.json` and its `.agent.md`: which values step (sizes, kinds, states), which are tunable (and their tokens), which are on/off.
2. **Choose a handle for each** on the real component. Prefer its own geometry: an edge, a corner, the label, the thumb, a press. If a value has no place on the component, it becomes a stepping readout. On/off sets become `Row` + `Switch`.
3. **Write one specimen card per callout** in `<Name>Specimens.tsx`, like `ButtonSpecimens.tsx`. Each card has one plain sentence, the specimen in `.ed-specimen`, and readouts. The card reads and writes the x-ray's model, and the model already draws the bench.
4. **Replace the x-ray's old card body** with the specimen card, delete the old slider cards, and wrap the x-ray in `HintLayer`.
5. **Test the feature slice** (below), then commit only your own paths: `git commit -- <paths>`.

## What each x-ray could offer

A starting point, not a spec. Check each value against rule 7 first: if the component lacks the option, leave it out.

| X-ray | Stepping (snap) | Tunable (catch on tokens) | On/off |
|---|---|---|---|
| Switcher | the thumb dragged to an option; size | space around the thumb, beside each word; slide spring | no animation |
| Keycap | surface (default, strip, sunk); size | height, corners, space beside the glyph, letter spacing | – |
| Swatch | colour from the palette | size, corners, shine, lift | shadow in its own colour |
| Checkbox | state (off, on, mixed) by clicking the specimen | size, corners, well depth, tick angle | – |
| Slider | marks | knob shine, track depth, the spring (drag the knob and let go) | marks in the track, ticks and labels |
| Icon button | kind | size, corners, icon size | stay down (latch) |
| Field | – | depth, height, corners, space on the left | caret, raised key |
| Status | state | lamp size, bright spot, height, space on the ends | glow |
| Tooltip | side | gap, space on the sides, corners, lift | show the key, long note |
| Toolbar | the pressed tool | space around and between tools, outer corners, lift | groove, corners follow the caps |
| Menu | – | gap to the button, space around rows, row corners | heading, line, plate corners follow |
| Toast | – | space on the left, lift | detail, undo |
| Dialog | – | dim, distance from the top, height | open a real dialog |
| Link card | – | frame width, screen corners | glare, frame corners follow |
| Suggestion chip | – | how sure, frost, height, space on the left | point at the line, green line |
| Command palette | the chosen row (drag it to another row) | field height, corners, space on the left; row height, corners; space above a section, the underline; the keys' gap and room; padding, plate corners | pin with ⇧↩, where answers come from; a switch per plate layer |
| Lasso, Snap guides | – | width, height, where you drag, zoom | still dragging, hold ⌘ |
| Switch | state (drag the thumb across; a ghost thumb shows the lean); size | gap around the thumb, light | layers |

## The handover and the code

An x-ray opened from the floating table takes the object over as it is, and gives it back. Every x-ray also writes the code for what you tuned. The Switcher is the reference: `SwitcherXray.tsx`, `SwitcherCode.tsx`, and the slices `e2e/xray-switcher-handoff.spec.ts` and `e2e/xray-switcher-code.spec.ts`. Read them before you convert another x-ray.

1. **One config.** `<Name>Config` holds the real props first (value, size, label, checked), then what the x-ray lets you tune. Export `INITIAL` (the component as it ships) and add the kind to `XraySeeds` in `xray/index.tsx`. The view takes `XrayViewProps<Config>`, starts from `{ ...INITIAL, ...seed }` and calls `onSeed` on every change. A docs page opens it with no seed and gets `INITIAL`.
2. **One look.** A pure `<name>Look(config, colorway)` returns what the model's hand-built parts need, plus `style`: only the library variables (`--mu-r-<name>-*`, springs) that differ from `INITIAL`. At defaults it is `{}`. The table object, the model's face, the specimens and the code all read it.
3. **The face is the component.** The model's top face is the real component, laid out at the object's table zoom and scaled by transform (`.xr-segface`: `zoom: oz; transform: translateZ(z) scale(S / oz)`). Never re-typeset text at `S`. Lower planes are copies with parts hidden, or stay hand-built. Measure boxes from the real component. Fit the scene with `.xr-fit`, not zoom.
4. **Land flat, then open.** Give the scene `data-settle` and honour `pose`: `flat` puts every part on one plane (the object that landed); the model opens once the flyer has gone and closes up again before it flies home.
5. **The table object** is controlled by `seeds.<kind>`, calls `onSeed` on change, and declares `zoom` on its item instead of an inline wrapper.
6. **The code.** Pure `<name>React(config, colorway)` and `<name>Swift(config, colorway)` feed `SourceTabs` under the card. Real props are props. Tunables are wrapper variables, and only those that differ. Colour values (`-background`, `-shadow`, inks) go to a stylesheet tab with one block per colorway, scoped like `tokens.css` (`:root, [data-mu-colorway="bone"]`, then `[data-mu-colorway="graphite"]`). At defaults the snippet is the agent guide's example. SwiftUI carries only what its API really takes, and says so in one line when tunables do not reach it. Never emit code the library does not support.
7. **The slices.** Copy the switcher's two specs. Hold the flight at 0.88 and pixel-compare the flyer with the model's face (under 1 % of pixels). Pick a non-default state on the table and see the x-ray start there and hand it back. Tweak and see the code change. Copy and read the clipboard. Compile the snippet under strict TypeScript, render it through `snippet-lab.ts` beside the specimen in both colorways, and pixel-compare. Each slice must fail on the old code.

## Mistakes the review caught

Each of these shipped in a converted x-ray and had to be fixed. Check for them before you hand anything back.

- **Numbers typed in.** A size of 24 or 28 written into the file instead of read from `tokens/tokens.json`. Read every real option and token from the recipe.
- **Animation under the finger.** A spring left on a property while you drag a tunable, so the component chases the pointer. Only a snap animates; a tunable being dragged has no transition.
- **A handle that crosses text.** A hairline through the middle of a word reads as a strikethrough. Draw a handle where the value lives (a word's padding is at its sides, so frame the word).
- **Control names pasted into sentences.** "drag the top edge for Size, the right end for Space around the thumb". Write the sentence a person would say: "drag the top edge to change its size".
- **A circular import that blanks the page.** `<Name>Specimens.tsx` reading a constant from `<Name>Xray.tsx` at load time, while the x-ray imports the specimens: the constant does not exist yet and the whole docs page shows "Something broke". Read tokens from `tokens/tokens.json` in the specimens file; use values from the x-ray only inside functions.
- **A box drawn over text.** Type handles drawn as a frame around the glyph. The glyph itself is the handle (`ed-type-label` in an `ed-typebox`): sideways for spacing, up or down for size, a faint ring on hover.
- **Distances that change with zoom.** A step that needs more than `STEP_AT` units becomes a long drag when a small part is magnified. Use `STEP_AT` for every step.
- **Tests that pass nothing.** Dragging at coordinates below the fold (call `scrollIntoViewIfNeeded` first), or assuming a starting value the page does not have (read it first). Run every test yourself in a real browser; if your sandbox blocks the browser, say so plainly and do not claim you checked it.

## Tests and done

Tests are Playwright feature slices only (`e2e/`), through the real page. For each x-ray, prove:

- no `.mu-slider` or `.xr-dial` in its card, for every callout;
- each handle changes the specimen **and** the model on the bench;
- a stepping value snaps (it is one of its options before and after a drag, never between);
- a readout scrubs and ↑↓ step it;
- keyboard focus on a handle shows its tag;
- bone and graphite, and at 375 px wide (no sideways scroll).

Then run `npm run typecheck`, the x-ray specs, and `npm run build`. Check the running site in both colorways and with reduced motion before calling it done.
