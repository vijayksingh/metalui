# Morph: the language and the engine

How any Soft Hardware icon becomes any other. The language here is ours, born from what the icons are made of; the engine is `packages/metalui/src/icons/morph.ts`, the build that reads a glyph is `scripts/lib/morph-parts.mjs`, and the evidence for redrawing the set under construction rules is `docs/ICON-GRAMMAR.md`. Each rule is tagged with its origin, as `FOUNDATIONS.md` §9–10 does: *Ours*, or *Adapted* with credit.

## 1. Why our own morph

Benji Taylor's "Morphing icons with Claude" makes every glyph three line strokes, so any glyph can become any other by moving strokes. That constraint is his shape. Ours is different: a Soft Hardware icon is a small object with mass under one light, drawn in one material at one weight, and some of its parts sit in front of others. So the morph could not be copied; it had to be invented from that shape. What we keep from the article is the idea that icons *become* each other instead of being replaced, and that a shared construction is what makes it possible. *(Adapted: Benji Taylor, the idea; Ours: everything below.)*

## 2. What Soft Hardware is, in the icon

One material, three forms, one depth, on one grid:

- **Wire.** A centerline at the set's weight, 1.7 on the 24 grid, round caps and joins. Open, or closed into a ring. A closed (or chord-closed) wire may hold a duotone tint.
- **Bead.** A solid dot. A bead is a wire of zero length drawn at the dot's diameter (2.1–4.2 in the set), which is why it can draw out into a wire.
- **Plate.** A filled body with no wire: tinted (opacity .10–.20, scaled by the colorway's `--mu-duo-k`) or solid. It may have holes.
- **Clearance.** Depth. A part in front keeps a gap around itself on the part behind, 1.0–2.0 from its own line (measured from the set). A frame can also be a window that shows a part only inside it. A clearance belongs to the part that casts it and travels with it.
- **The grid.** 24 units; the glyph lives in the 20 between 2 and 22; corners come from the radius ladder (1.2, 1.6, 2.4, 3.2, 3.5); sharp corners only where the object is sharp (a check, a chevron, a folder's top edge).
- **Light stays put.** Tint is light through frosted glass; depth is mass. A body that loses its tint on the way is still a body.

Every icon also has an authored hover pose and a press gesture (`icons.mjs`, `mo`). Those are the object's own motion; the morph is what happens between objects, and it does not use them.

### Design constraints every icon and every morph obey

| | Constraint | Origin |
|---|---|---|
| C1 | One weight: 1.7 (a plate has none; the keeper's ring is .88 of it, the one exception in the set). | Ours |
| C2 | Round caps and joins everywhere, including where a ring opens: the two ends meet as caps, so opening and closing has no seam. | Ours |
| C3 | Beads are 2.1–4.2 across; nothing solid is smaller than a bead or larger than a plate. | Ours, from the set |
| C4 | Tint is .10–.20 and only inside a wire or on a plate; solid is 1. Tint follows the area that holds it. | Ours |
| C5 | Clearances are 1.0–2.0 from the caster's line and are the only masks. A mask that is not a part's clearance, a window, or a knockout inside a plate fails the build. | Ours |
| C6 | Corners come from the radius ladder; sharp corners are kept exactly through resampling, so a check keeps its point. | Ours, from the set |
| C7 | A glyph is 1–6 parts (the set: 1 for select and board, 6 for the old group). Fewer is easier; see the grammar. | Ours |
| C8 | The rest state is the authored icon, exactly: at rest the engine draws the authored path and the authored clearances, verified by raster parity against the static SVG. | Ours |
| C9 | Depth is a relation between two parts, read from the authored masks: *behind* (hidden within the caster's ink widened by r) or *inside* (visible within a frame narrowed by r). A body hides its area; a wire hides only along itself. | Ours |
| C10 | Nothing fades and nothing comes from nowhere. Material is moved, drawn out, gathered, hidden or revealed; opacity is never the transition. | Ours; the principle is shared with Animations on the Web |
| C11 | Solid glyphs are a different system. A character or mascot (a filled body with no wire: the keeper) is not in the morph family: the generator leaves any glyph with a solid plate out of `MORPH_NAMES`, `MorphIcon` will not take its name, and a control switching to or from it rides the drum (T1, `SwapIcon`). | Ours (the user's decision; `docs/ICON-GRAMMAR.md` K0) |

## 3. The engine

The core from which every morph is born: **parts, depth, carriages, moves, one spring, a strain**.

| | Rule | Origin |
|---|---|---|
| E1 | **A part becomes a part.** Parts pair by least energy: mass (material length) times squared travel, plus a small cost for changing weight, tint or solidity, plus one step of travel (4²) for changing kind. A part with no partner costs twice its travel to gather, capped, so a good pair is never traded away to spare a large part from leaving. | Ours |
| E2 | **Every pair rides a carriage.** The least-squares similarity (turn, uniform scale, travel) that explains where the part goes, with the shape change left over applied in the carriage's own frame. Rigid things stay rigid on the way; bends happen in place. A turn past 120° is not a turn, it deforms instead. | Ours; Procrustes fit is standard geometry |
| E3 | **A bead is a wire of zero length.** It draws out into a wire and thins to the wire's weight; a wire gathers into a bead. | Ours |
| E4 | **A ring opens where it is nearest the ends it becomes,** and closes the same way. Or, when it moves less, the wire is a loop pressed flat and the ring presses flat into it. Tint fills as a loop opens and drains as it flattens. A body never presses flat: it would lose its area on the way. | Ours |
| E5 | **Solid ink is conserved.** A solid spreading over more area thins in proportion; one gathering into less stays solid. | Ours |
| E6 | **Depth is live.** A clearance is drawn as a mask from the caster's current outline, so it travels with the caster; its gap lerps between the two glyphs' values. Parts keep their distance while they move and nothing tears. | Ours |
| E7 | **Lone parts hide or gather.** A part the next glyph lacks tucks behind a body that can hide it (a boxy or round body, never one the part is in front of), scaled down only as far as the body's clearance needs; otherwise it gathers into the nearest point of a wire that stays and ends at that wire's weight, inside it. A part the next glyph gains emerges from behind a body or buds from a staying wire. | Ours |
| E8 | **A mirror pair turns.** When the next glyph is this one's reflection, the whole glyph turns on its axis and is edge-on at the half turn, instead of every part deforming through itself. | Ours |
| E9 | **One object, one spring.** Every part moves on the settle spring (k380 c36, no visible overshoot) from the same frame. A lone part is light: leaving is done by two thirds of the way, arriving starts at one third. Interrupted, the next plan starts from the frame on screen. Reduced motion: the glyph changes in place. | Ours; timing from FOUNDATIONS §9 |
| E10 | **Every plan carries its strain** and its cost matrix, so a product can see which changes will not read as one object. | Ours |

Planning happens once per state change (a Hungarian assignment over at most a dozen parts, a few milliseconds); a frame is 72 points per part through its carriage, so a frame is cheap.

## 4. The transition language

The moves, each with its physical story. A track is one part becoming one part; `plan.tracks[i].move` names it.

| Move | Story | When |
|---|---|---|
| **carry** | The part rides its carriage: turns, scales and travels as one rigid thing, bending only what it must. | Any pair of the same kind. The default. |
| **draw out** | A bead draws out into a wire, thinning to the wire's weight. | Bead → wire. |
| **gather** | A wire gathers back into a bead (or a plate into a dot), ink conserved. | Wire or plate → bead. |
| **open** | A ring opens at the point nearest its new ends; the tint drains as the area goes. | Ring → open wire, and any body. |
| **close** | An open wire closes into a ring; the tint fills. | Open wire → ring. |
| **press flat** · **unfold** | A ring presses flat into a wire that is really a loop, or unfolds from one. | Ring ↔ wire when it travels less than opening, never for a body. |
| **tuck** · **emerge** | A part slides behind a body that hides it, or comes out from behind one. | A lone part that fits behind a body it is not in front of. |
| **absorb** · **bud** | A part gathers into the nearest point of a staying wire and ends inside it; or grows out of one. | A lone part with nowhere to hide. |
| **turn** | The whole glyph turns over on its axis, edge-on at the half turn. | Mirror pairs (undo ↔ redo). Glyph-level. |
| **clear** | A clearance travels with its caster and its gap lerps. | Whenever either glyph has depth. Not a track; a relation. |

All of them ride one spring, `settle`. None of them changes the light.

## 5. When A → B cannot be smooth

The strain of a plan is the measure. It is made of what the eye reads as "not one object":

- **travel**: mean distance each unit of material moves, in grid units (weight ¼: a step of 4 is one unit of strain);
- **lone**: share of material with no partner (weight 2; tucks and emerges count half);
- **topology**: share of tracks that open, close, press, unfold or turn a plate into a wire (weight ½);
- **traits**: weight, tint and solid change (weight ¼);
- **crossing**: share of track pairs whose paths cross (weight ½);
- **turn**: ½ when the glyph turns.

**Under 1 a pair reads as one object changing.** The set's product pairs are there: synced ↔ offline .27, zoom in ↔ out .20, capture ↔ fit .06, sync-error ↔ synced .48, undo ↔ redo .50, search ↔ zoom .34–.62. Between 1 and 2 the morph is honest but visibly a transformation (group → ungroup 1.87 today, 1.31 redrawn). At 2 and over the material has to go too far or too much of it has nowhere to go, and it should not be used as a state change.

The fallback ladder, in order:

1. **Fix the icons, not the morph.** If a product needs A ↔ B and the strain is over 1, the construction grammar (`docs/ICON-GRAMMAR.md`) says why and how to redraw. This is the only fix that makes the whole set better.
2. **Stage through a shared neighbour.** If the product's state machine allows it, A → C → B with both legs under 1 (offline → synced → sync-error rather than offline → sync-error direct at .71: not needed there, but the pattern).
3. **Turn.** A mirror pair turns (automatic).
4. **The drum (T1).** Above 2, or when one side is a character glyph (C11) or an authored illustration rather than a state glyph, the control's face turns one step (`SwapIcon`) instead of morphing. For a character glyph this is the rule, not an exception; for a wire pair it is a documented exception, recorded in the component's agent guide with the pair and its strain.

Breaking a rule is right when the object story demands it, and it is recorded: the rule, the pair, the strain, and the story, in the guide of the component that needs it. What is never right: fading, appearing from nothing, or letting a clearance snap on or off.

## 6. Testing state transitions

Only integration and e2e tests of a feature slice, never of the implementation (see `AGENTS.md`). The slices that matter:

- **Rest parity.** Rasterise `MorphIcon` at rest and the static SVG (`/icons/svg/<name>.svg`) at 96px and count alpha differences over 160. All 30 of the family are at 0–3 pixels (the dashed rings' anti-aliasing). Playwright can do this in the docs' parity section (`MorphParity`).
- **Strain budgets.** `node scripts/morph-strain.mjs` prints every pair; a product's declared pairs must be under 1. It is a check tool, run on demand or in CI.
- **Filmstrips.** The `/icons` Morph section draws each pair at 0, .2, .4, .6, .8 and 1 with the strain and moves; judge them with the eye, that is what they are for.
- **Interruption.** Change `name` mid-morph and assert the next frame starts from the frame on screen (no jump); reduced motion asserts the change is instant.

Do not test `align`, `assign` or `carriageOf` in isolation; test what a user sees.

## 7. Adding an icon

Follow `docs/ICON-GRAMMAR.md` §4, the build spec: draw the body, then the marks, at most one clearance, in the material band, on the keyline; lint it (`node scripts/icon-lint.mjs --proposals <module>`), score it (`node scripts/morph-strain.mjs --proposals <module>`: under 1 against every icon a product will switch it with), look at its filmstrips, then author it in `icons.mjs` with its hover and press, run `npm run generate`, confirm rest parity, and commit it as one chunk.

The tools plan frames outside the set through `planFrames(from, to)` and `partsFrom(rows)`, the same engine the app runs, so a proposal is scored exactly as it would morph.
