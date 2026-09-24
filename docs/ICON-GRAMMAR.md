# Icon grammar: the construction standard, from evidence

The morph engine (`docs/MORPH.md`) can move any part of any icon to any other. It cannot make a folder with five clearances and 145 units of wire read as one object while it becomes a check mark. Benji Taylor's set morphs well because every glyph is three strokes; that constraint is his. This document finds ours from measurement and writes it as the build spec every icon follows from now on: redesigns of the icons that are hard to morph, and every new icon.

Nothing here changes `icons.mjs`. Proposals live in `docs/proposals/icon-grammar/` and ship one at a time, after review, through the process in §6.

## 1. Method

1. Every ordered pair of the wire icons is planned by the engine and scored by its strain: travel, lone material, topology change, trait change, crossing paths, turn (`docs/MORPH.md` §5). The tool is `node scripts/morph-strain.mjs`; `--md docs/icon-grammar/STRAIN.md` writes the tables, `--matrix` prints every pair.
2. Every icon is described by its structure as the engine reads it: parts and their kinds (open wire, ring, bead, plate), clearances, tint, solid, material, largest part, its centre's distance from the grid centre, corners, holes, overlapping parts.
3. Each feature is correlated with strain at the icon level (an icon's mean strain against all others) and at the pair level (a feature of the pair against the pair's strain). The pair level is the honest one: a morph is between two icons.
4. The grammar is written from what predicts strain, each rule with its number. The two worst icons are redrawn under it, and a wire keeper is drawn new, as proposals scored before and after, with filmstrips. A lint (`node scripts/icon-lint.mjs`) checks any glyph against the grammar.

The keeper is a solid glyph and, by the user's decision, out of the morph family (K0). The numbers below are over the 30 wire icons (870 ordered pairs). Strain is the engine's own score at commit `dc34800` plus `planFrames`; the relative findings are stable across its tuning.

## 2. What the numbers say

Full tables: `docs/icon-grammar/STRAIN.md`.

**Distribution.** 870 pairs, mean 1.93, median 1.86. Under 1: 32 pairs. 1–2: 500. 2 and over: 338. Of the total strain, travel is 62%, lone material 28%, topology 6%, traits 2%, crossing 1%.

**Hardest icons** (mean strain against all others): image 2.65, more 2.47, check 2.32, ungroup 2.30, group 2.30, tidy 2.13, close 2.04, undo 2.03, link 2.02, paste 2.01, fit 2.00. **Easiest:** zoom-out 1.58, zoom-in 1.58, sync-error 1.60, draw 1.63, board 1.64, trash 1.65, search 1.66, synced 1.67.

**Hardest pairs:** image ↔ more 4.16, image ↔ check 3.98, note ↔ check 3.91, more ↔ note 3.88, paste → more 3.86, share → more 3.76, image ↔ text 3.64. **Easiest:** capture ↔ fit .06, zoom in ↔ out .20, synced ↔ offline .27, zoom-out ↔ search .34, sync-error ↔ synced .48, undo ↔ redo .50 (a turn).

**What predicts strain, pair level (n = 870):**

| pair feature | r | pairs with none | pairs with some |
|---|---|---|---|
| material mismatch, \|a − b\| in units | **0.64** | .50 (2) | 1.94 (868) |
| kind mismatch: rings, wires, beads, plates without a partner of their kind | **0.34** | **1.13** (30) | 1.96 (840) |
| plates of both | 0.31 | 1.88 (812) | 2.65 (58) |
| clearances of both | 0.29 | 1.85 (702) | 2.30 (168) |
| distance between the two bodies' centres | 0.28 | 1.86 (80) | 1.94 (790) |
| part-count mismatch | 0.22 | 1.70 (188) | 2.00 (682) |
| material of both | 0.19 | | |
| sharp corners of both | 0.17 | 1.88 (306) | 1.97 (564) |
| overlapping part boxes | 0.07 | | |
| parts of both | 0.03 | | |

**Icon level (n = 30):** plates r 0.49 (the one icon with a plate: 2.65 against 1.91), clearances 0.47 (with any: 2.27, without: 1.90), body centre off the grid centre 0.32, total material 0.30, sharp corners 0.27, tinted parts 0.21, beads 0.19, part count **0.05**, open wires −0.23, largest part −0.24.

Read together:

1. **How much material the two icons have, and how different the amounts are, is the first cause.** Not the count of parts: a 4-part icon is no harder than a 2-part one (r 0.05), but a 145-unit icon against a 9-unit one is the worst there is. `more` (9 units, three beads) and `check` (19 units, one wire) are among the three hardest icons for exactly the reason `image` (147) and `group` (145) are: everything else has to become almost nothing, or almost nothing has to become everything.
2. **Kind mismatch is the second.** The 30 pairs where every ring, wire, bead and plate has a partner of its kind average 1.13; the rest average 1.96. When kinds match, the engine carries; when they don't, something must open, close, or be absorbed.
3. **Depth and plates cost.** Icons with clearances average 2.27 against 1.90; the plate icon is the hardest of all. The engine keeps clearances live now, so they no longer tear; they still add parts that have no partner anywhere else in the set (a folder back, a landscape).
4. **Travel is 62% of all strain**, and the easiest pairs are the ones that share positions exactly: capture ↔ fit, the zoom family, the status trio. An off-centre body predicts strain on its own (r 0.32). Where parts sit matters more than what they are.
5. Corners, overlaps and part count barely matter. A rule about them is craft, not evidence.

## 3. The grammar

Born from our shape: wire, bead, tint and clearance on the 24 grid at 1.7. Each rule has its reason in the data and its origin. The numbers live once, in `scripts/icon-lint.mjs` (`GRAMMAR`), so the lint and this table cannot disagree.

| | Rule | Reason | Origin |
|---|---|---|---|
| K0 | **Solid glyphs are a different system.** A character or mascot (a filled body with no wire: the keeper) never morphs. A control switching to or from one changes by the drum (T1, `SwapIcon`), not by `MorphIcon`. The generator keeps such glyphs out of the family by structure: any solid plate. | Decided on the keeper → synced filmstrip: a solid body has no partner of its kind anywhere in a stroke set, so every morph from it is a gather. | Ours (the user's decision) |
| K1 | **The kit is wire, bead, tint and one relation, clearance.** No plates: a tinted area is a wire's fill. No dashes except a ring with one gap (the orbit). No masks except a clearance or a window. No transforms baked into the rest pose that the geometry does not already show. | The engine reads exactly these; anything else becomes a part no other icon has. Plates: r 0.49. | Ours |
| K2 | **One body and one to three marks; two to four parts.** The body is the largest part, 24–60 units of material; a mark is at most 30. | Kind and count mismatch (r 0.34, 0.22). A body pairs with a body, marks with marks, and the lone share (28% of strain) falls to what the marks alone can cost. | Ours; the count constraint is adapted from Benji Taylor's three strokes, re-derived for our parts |
| K3 | **The material band: 40–90 units in total, aiming at 60.** | Material mismatch is the strongest predictor (r 0.64). Today the set runs from 9 to 147. In band: 17 of 30. Under: more 9, check 19, close 27, text 33, link 36, undo and redo 38. Over: image 147, group 145, note 94, tidy 94, duplicate 94, layout 91. | Ours |
| K4 | **Kinds are fixed by role.** The body is a ring (a closed wire, tinted or not) or a chord-closed tinted wire. Marks are beads, open wires, or small rings. A body never has to open to become a mark, because every icon has a body. | Kind mismatch: pairs with none average 1.13. | Ours |
| K5 | **The keyline.** The body lies within the 3.5–20.5 square, spans at least 12 units, and its centre is within one step (4) of the grid centre. Everything stays inside the live area, 2–22. Marks sit on the body's line, at the centre, or at a detent: the four crossings of the 8 and 16 lines. | Travel is 62% of strain; the pairs that share positions are the easiest (.06–.50); an off-centre body predicts strain by itself (r 0.32). | Ours; the shared-skeleton idea is adapted from Benji Taylor |
| K6 | **Depth is one clearance, at most.** Cast by a mark onto the body (a satellite on its orbit, a sun behind a ridge, a ring across a face) or by the body onto a mark. Never body on body, never a part that exists only to be hidden. | Clearances r 0.47 at the icon level; the old group's five clearances and folder back are the case. | Ours |
| K7 | **Canonical start and run.** Every ring starts at its top-most point (top-left corner for a rectangle) and runs clockwise; every open wire starts at its left end, then its top end. | No measured effect on strain (the engine tries every start); it makes authored hover and press consistent between icons and gives filmstrips a stable seam. Hygiene: the lint warns, it does not fail. | Ours |
| K8 | **Corners from the ladder, sharp only where the object is sharp, at most four per glyph.** Radii 1.2, 1.6, 2.4, 3.2, 3.5. | Weak (r 0.27 / 0.17); kept for craft and for the resampler, which pins sharp corners. The lint warns. | Ours, from the set |
| K9 | **Transient parts never rest.** A ripple, caret, glint or drawn line that exists only in hover or press is dropped from the rest glyph (as `static-svg.mjs` already does) and never counted. | Keeps the rest glyph inside K2–K3 while motion stays rich. | Ours |
| K10 | **Every glyph authors its hover and press within the kit**, on its own parts, with transforms about a point on the body (or a mark's own foot), springs from the mass classes, and one-shot keyframes for press only. | A redesigned icon must keep its life; the morph is between objects, the object's own motion is its own. | Ours; FOUNDATIONS §9 |

What the grammar deliberately does not say: how many parts overlap, how long a wire is on its own, or how many corners a chevron has. The data does not support rules there.

### The lint

`node scripts/icon-lint.mjs` reads every icon exactly as the morph build does and reports, per icon, what breaks which rule (K0–K6 fail; K7–K8 warn). `--proposals <module>` lints a proposals module and exits 1 on any failure; `--strict` does the same for the set; `--only a,b` narrows it. Today 4 of 30 pass (draw, search, zoom-in, zoom-out): the set predates the grammar, and that is the redesign list in §5.

## K. The feelings construction

The life set's feelings (21 today) are one construction, so they read as one family at 14 px and extend without drawing freehand. Numbers live once, in `scripts/icon-lint.mjs` (`lintFeeling`), so this section and the lint cannot disagree.

| | Rule | Reason | Origin |
|---|---|---|---|
| K-a | **The vessel is the body.** Every feeling is the r 9.3 disc about (12, 12), tinted at .17 when untinted and empty when tinted (DS-42). It is the one plate the grammar allows (an amendment to K1 and K4 for this construction only). | The self as a soft round screen, echoing the keeper's; one body shared by every feeling makes the set a morph space by construction. | Kamui 05 §3 |
| K-b | **One to three marks, inside the vessel.** The trace and its beads or level. A level is a fill clipped to the vessel (a window, K1), so it is inside by construction. | A trace, not an illustration; faces collapse into emoji at 14 px. | Kamui 05 §3 |
| K-c | **Four variables choose the marks.** Position = valence (lifted, centred, sunk); shape = energy (flat, smooth wave, sharp zigzag); level = capacity (low, full, brimming and choppy); dots = attention (held in a ring, spread, a fading row, alone). A new feeling is authored by choosing values; the composer on `/icons/life` draws any combination. | The grammar composes: relieved, restless or afraid extend it instead of inventing a picture. | Kamui 05 §3 |
| K-d | **Exactly one tint, never across valence.** One family in `tokens.json foundations.tint` names the feeling. The tint names the kind of feeling (DS-42), so a neutral feeling may carry a pleasant kind (curious is wonder), but a pleasant feeling never carries an unpleasant family, or the reverse. | Colour says what kind, never how good; crossing valence would make the colour lie. | DS-42 |
| K-e | **Heavy states stay calm.** A sunk line is not a frown; only dull is dead flat. | Icons never judge. | Kamui 05 §3 |

`node scripts/icon-lint.mjs --feelings` checks K-a, K-b and K-d over the set and exits 1 on a failure; `--life` runs the full grammar (K0–K8) over the life set, with the vessel allowed as a body. Today 21 of 21 feelings follow the construction; `hopeful` was redrawn under K1 to get there (its dawn was a disc under a half-plane clip, now a chord-closed tinted wire).

## 4. Building an icon under the grammar

The step-by-step spec an author, human or agent, follows.

1. **Name the object and its story.** What it is (a folder, a lens, a tray), what its hover pose is (one gesture the object would make), what its press does once. One line each; they become `hover`, `press` and `shape` in `icons.mjs`.
2. **Draw the body first.** One ring or one tinted chord-closed wire, 24–60 units of wire, inside 3.5–20.5, spanning at least 12, centred within 4 of (12, 12). Corners from the ladder. Tint .10–.20 if the object is a frosted surface (a folder, a card, a clipboard); none if it is a line drawing (a lens, a frame).
3. **Add the marks.** One to three: beads (2.1–4.2 across), open wires, or small rings, each at most 30 units. Put them on the body's line, at the centre, or at a detent (8 or 16 on either axis). Keep a clear gap of at least .65 between any two wires' edges (centerlines 2.4 apart at 1.7).
4. **Depth, only if the story needs it.** One clearance: a mark in front of the body (`mask` with the mark's own path stroked at 1.7 + 2 × gap, gap .8–1.2) or the body in front of a mark, or a window (`clipPath` inset by .8). Never a mask that is not a part's own shape.
5. **Count the material.** 40–90 in total, aiming at 60. If it is under, the object is drawn too small or has too few marks; if over, it has two bodies.
6. **Start every wire where the grammar says.** Rings at their top (top-left corner), clockwise; open wires at their left end. Authoring tools draw circles from 3 o'clock; a path with `M` at the top is fine.
7. **Author the motion.** `base` sets `transform-origin` for each moving part; `mo` sets `@H` poses (a translate, a rotate, a `d:path()` for a wire that reaches) and `@P` one-shot keyframes on the object's spring. Transient parts (a ripple, a caret) live in `body` with a class listed in `static-svg.mjs`'s `DROP` so they never rest.
8. **Lint it, score it, look at it.** Put the icon in a proposals module; `node scripts/icon-lint.mjs --proposals <module>` must pass; `node scripts/morph-strain.mjs --proposals <module> --out <dir>` must show its mean strain against the family at or under the family's median (1.86 today, lower as the set is redrawn) and **under 1 against every icon a product will switch it with**; open the filmstrips and judge the in-betweens.
9. **Author it in `icons.mjs`** and `npm run generate`; the build refuses a mask that is not a clearance, a window or a knockout inside a plate, and keeps any solid glyph out of the family. `npm run check`, `npm run typecheck`, rest parity in the `/icons` parity section (0–3 pixels at 96px), hover and press in both colorways and with reduced motion.
10. **Commit** the icon, its motion and its generated files as one conventional commit; add its product pairs to `MorphFilmstrips` if a control switches to it.

## 5. Proposals and their numbers

In `docs/proposals/icon-grammar/icons.proposal.mjs`, scored by `node scripts/morph-strain.mjs --proposals …` and linted by `node scripts/icon-lint.mjs --proposals …` (all three pass). Filmstrips (before above, after below): `docs/proposals/icon-grammar/filmstrips.html`. Numbers: `docs/proposals/icon-grammar/STRAIN.md`.

| icon | mean strain before → after | parts | clearances | material |
|---|---|---|---|---|
| group | **2.31 → 1.63** | 4 → 3 | 5 → 0 | 145 → 71 |
| ungroup | 2.32 → 2.31 | 3 → 3 | 0 → 0 | 89 → 76 |
| keeper (wire, new) | out of family → 1.69 | 4 | 1 | 72 |

| pair | before | after |
|---|---|---|
| group ↔ ungroup | 1.87 | **1.31** |
| group → check | 3.50 | 2.26 |
| group → duplicate | 1.28 | 1.38 |
| ungroup → layout | 1.15 | 1.23 |
| ungroup → duplicate | 1.68 | 2.31 |
| keeper ↔ synced | out of family | **1.31** |
| keeper → offline | out of family | 1.52 |
| keeper → check | out of family | 3.19 |

- **group**: the flap is the body, raised to 11.6 so its centre sits one step below the grid centre; the two cards are card tops standing in it, open wires that end one clearance above the flap, staggered like the old fan. The pocket is geometry, so there are no masks. Its mean strain falls by a third and it reaches ungroup at 1.31. Its only regressions are against neighbours that are themselves over band (duplicate, 94 units).
- **ungroup**: the tray is the body, the flap opened, frosted like it was; the cards are two small rings lifted clear of it at ±8°. On the way from group the card tops close into cards as they lift, which is the true story (the hidden bottom of each card comes out of the pocket) but a topology change: that is why the set-wide mean barely moves while the pair it exists for improves. Redrawing group's card tops as rings peeking above the flap would remove the topology change at the price of one clearance (K6 allows one).
- **keeper (wire)**: a new glyph so the character can rejoin the family: a frosted ring face on the keyline, the eye capsules as two short wires at the set's weight, and the accretion ring as one 204° wire in front, casting one clearance. Four parts, one clearance, 72 units; it passes the lint and reaches synced at 1.31. Same blink, same tip. The solid keeper stays out of the family (K0); whether it leaves MetalUI is an open question for the user.

The proposals show the grammar's levers in the order the data ranks them: material and kind first (group), depth second (keeper), positions third (ungroup's cards now sit on the 8/16 detents and its body one step below centre).

## 6. Redesign list, by priority

Ranked by strain and by whether a product switches to or from the icon, with the lint's verdict.

1. **group** (2.30; five clearances, 145 units): proposal above.
2. **ungroup** (2.30): proposal above; decide the card-top question with group.
3. **image** (2.65; three relations, a plate, 147 units): the frame is the body; the sun is a bead mark casting one clearance onto a ridge that is a mark wire, not a plate to the bottom of the grid.
4. **more** (2.47; 9 units) and **check** (2.32; 19 units): under band, marks without a body. Either accept them as the light exception (they morph into each other and into close at 1.6, and a product mostly switches paste → check, more → close) or give them a body on the 16 line.
5. **tidy** (2.13; three rings plus a guide, 94 units): three bodies. One body (the guide as a tinted panel) and marks.
6. **duplicate** (1.88; 94 units, one clearance body on body): the front card is the body; the back card becomes a mark wire (two edges) peeking out, no clearance.
7. **note**, **layout** (94, 91 units; three rings in layout): over band; one body, marks.
8. **close**, **text**, **link**, **undo**, **redo** (27–38 units): under band, bodies are untinted wires. Undo and redo turn into each other perfectly and are fine as a pair.
9. Everything else fails K5 only on the keyline square or the body's centre (select, note, paste, trash, send-away, the status trio at 4.4–19.6 fit; their bodies are untinted open wires, K4). Small moves.

Already inside the grammar: draw, search, zoom-in, zoom-out.

## 7. Adding a new icon

Follow §4 step by step. The acceptance checks are the lint (`icon-lint.mjs --proposals`, must pass), the strain budget (`morph-strain.mjs --proposals`: mean at or under the family's median, under 1 against every declared neighbour), rest parity, and the filmstrips judged by eye. One icon per commit, after review.
